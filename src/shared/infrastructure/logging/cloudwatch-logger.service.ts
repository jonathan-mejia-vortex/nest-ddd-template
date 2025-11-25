import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { envs } from '../../../config/envs';

export interface LogEvent {
  message: string;
  timestamp: number;
  level: string;
  context?: string;
  [key: string]: any;
}

/**
 * Servicio para enviar logs a AWS CloudWatch Logs
 * Los logs se acumulan en un buffer y se envían por batch para optimizar costos
 *
 * Configuración:
 * - AWS_REGION: Región de AWS
 * - AWS_CLOUDWATCH_LOG_GROUP: Nombre del grupo de logs
 * - AWS_CLOUDWATCH_LOG_STREAM: Nombre del stream de logs
 *
 * Nota: En desarrollo/testing, los logs solo se envían si las credenciales AWS están configuradas
 */
@Injectable()
export class CloudWatchLoggerService implements OnModuleInit {
  private readonly logger = new Logger(CloudWatchLoggerService.name);
  private client: CloudWatchLogsClient | null = null;
  private logBuffer: LogEvent[] = [];
  private sequenceToken: string | undefined;
  private readonly BATCH_SIZE = 50; // Número de logs antes de flush
  private readonly BATCH_INTERVAL = 5000; // ms - Flush cada 5 segundos
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  async onModuleInit() {
    try {
      // Solo inicializar CloudWatch en producción o si está explícitamente configurado
      if (envs.nodeEnv === 'production' || process.env.AWS_ACCESS_KEY_ID) {
        this.client = new CloudWatchLogsClient({
          region: envs.awsRegion,
        });

        await this.ensureLogStreamExists();
        this.isInitialized = true;
        this.startFlushTimer();

        this.logger.log('CloudWatch Logs initialized successfully');
      } else {
        this.logger.warn(
          'CloudWatch Logs not initialized (development mode without AWS credentials)',
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize CloudWatch Logs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Asegura que el log stream existe, si no lo crea
   */
  private async ensureLogStreamExists(): Promise<void> {
    if (!this.client) return;

    try {
      const command = new DescribeLogStreamsCommand({
        logGroupName: envs.awsCloudWatchLogGroup,
        logStreamNamePrefix: envs.awsCloudWatchLogStream,
      });

      const response = await this.client.send(command);

      if (response.logStreams && response.logStreams.length > 0) {
        this.sequenceToken = response.logStreams[0].uploadSequenceToken;
      } else {
        // Crear log stream si no existe
        const createCommand = new CreateLogStreamCommand({
          logGroupName: envs.awsCloudWatchLogGroup,
          logStreamName: envs.awsCloudWatchLogStream,
        });
        await this.client.send(createCommand);
      }
    } catch (error) {
      this.logger.error(
        `Error ensuring log stream exists: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Agrega un log al buffer
   */
  async log(event: LogEvent): Promise<void> {
    if (!this.isInitialized) {
      return; // No hacer nada si CloudWatch no está inicializado
    }

    this.logBuffer.push(event);

    // Flush automático si alcanzamos el tamaño del batch
    if (this.logBuffer.length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  /**
   * Envía los logs acumulados a CloudWatch
   */
  async flush(): Promise<void> {
    if (!this.client || this.logBuffer.length === 0) {
      return;
    }

    try {
      const logEvents = this.logBuffer.map((event) => ({
        message: JSON.stringify(event),
        timestamp: event.timestamp,
      }));

      const command = new PutLogEventsCommand({
        logGroupName: envs.awsCloudWatchLogGroup,
        logStreamName: envs.awsCloudWatchLogStream,
        logEvents,
        sequenceToken: this.sequenceToken,
      });

      const response = await this.client.send(command);
      this.sequenceToken = response.nextSequenceToken;

      this.logger.debug(`Flushed ${logEvents.length} logs to CloudWatch`);

      // Limpiar buffer
      this.logBuffer = [];
    } catch (error) {
      this.logger.error(
        `Failed to flush logs to CloudWatch: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Inicia el timer de flush automático
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(async () => {
      await this.flush();
    }, this.BATCH_INTERVAL);
  }

  /**
   * Detiene el timer y hace flush final
   */
  async onModuleDestroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }
}
