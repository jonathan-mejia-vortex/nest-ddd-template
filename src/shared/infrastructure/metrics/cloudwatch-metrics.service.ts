import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  CloudWatchClient,
  PutMetricDataCommand,
  MetricDatum,
  StandardUnit,
} from '@aws-sdk/client-cloudwatch';
import { envs } from '../../../config/envs';

export interface MetricData {
  metricName: string;
  value: number;
  unit?: string;
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

/**
 * Servicio para enviar métricas a AWS CloudWatch Metrics
 * Las métricas se acumulan en un buffer y se envían por batch para optimizar costos
 * 
 * Métricas implementadas:
 * - request_duration: Duración de requests HTTP
 * - request_count: Contador de requests por endpoint
 * - error_count: Contador de errores por endpoint
 * - database_query_duration: Duración de queries a DB
 * - cache_hit_rate: Tasa de aciertos de caché
 * 
 * Dimensiones comunes:
 * - Endpoint: Ruta del endpoint
 * - Method: Método HTTP
 * - StatusCode: Código de respuesta
 * - Environment: Entorno (dev/prod)
 */
@Injectable()
export class CloudWatchMetricsService implements OnModuleInit {
  private readonly logger = new Logger(CloudWatchMetricsService.name);
  private client: CloudWatchClient | null = null;
  private metricsBuffer: MetricDatum[] = [];
  private readonly NAMESPACE = 'MS-Auth';
  private readonly BATCH_SIZE = 20; // CloudWatch acepta max 20 métricas por request
  private readonly BATCH_INTERVAL = 60000; // 1 minuto
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  async onModuleInit() {
    try {
      if (envs.nodeEnv === 'production' || process.env.AWS_ACCESS_KEY_ID) {
        this.client = new CloudWatchClient({
          region: envs.awsRegion,
        });
        this.isInitialized = true;
        this.startFlushTimer();
        this.logger.log('CloudWatch Metrics initialized successfully');
      } else {
        this.logger.warn(
          'CloudWatch Metrics not initialized (development mode without AWS credentials)',
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize CloudWatch Metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Registra una métrica
   */
  async putMetric(data: MetricData): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    const metric: MetricDatum = {
      MetricName: data.metricName,
      Value: data.value,
      Unit: this.mapUnit(data.unit || 'None'),
      Timestamp: data.timestamp || new Date(),
      Dimensions: data.dimensions
        ? Object.entries(data.dimensions).map(([Name, Value]) => ({
            Name,
            Value,
          }))
        : [],
    };

    this.metricsBuffer.push(metric);

    if (this.metricsBuffer.length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  /**
   * Mapea unidades a formato CloudWatch
   */
  private mapUnit(unit: string): StandardUnit {
    const unitMap: Record<string, StandardUnit> = {
      milliseconds: StandardUnit.Milliseconds,
      seconds: StandardUnit.Seconds,
      count: StandardUnit.Count,
      percent: StandardUnit.Percent,
      bytes: StandardUnit.Bytes,
      None: StandardUnit.None,
    };
    return unitMap[unit] || StandardUnit.None;
  }

  /**
   * Envía las métricas acumuladas a CloudWatch
   */
  async flush(): Promise<void> {
    if (!this.client || this.metricsBuffer.length === 0) {
      return;
    }

    try {
      // CloudWatch acepta máximo 20 métricas por request
      const batches = this.chunkArray(this.metricsBuffer, this.BATCH_SIZE);

      for (const batch of batches) {
        const command = new PutMetricDataCommand({
          Namespace: this.NAMESPACE,
          MetricData: batch,
        });

        await this.client.send(command);
      }

      this.logger.debug(
        `Flushed ${this.metricsBuffer.length} metrics to CloudWatch`,
      );

      this.metricsBuffer = [];
    } catch (error) {
      this.logger.error(
        `Failed to flush metrics to CloudWatch: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Divide un array en chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
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
   * Métodos de conveniencia para métricas comunes
   */

  /**
   * Registra duración de una request HTTP
   */
  async recordRequestDuration(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
  ): Promise<void> {
    await this.putMetric({
      metricName: 'RequestDuration',
      value: duration,
      unit: 'milliseconds',
      dimensions: {
        Endpoint: endpoint,
        Method: method,
        StatusCode: statusCode.toString(),
        Environment: envs.nodeEnv,
      },
    });
  }

  /**
   * Incrementa contador de requests
   */
  async recordRequestCount(
    endpoint: string,
    method: string,
    statusCode: number,
  ): Promise<void> {
    await this.putMetric({
      metricName: 'RequestCount',
      value: 1,
      unit: 'count',
      dimensions: {
        Endpoint: endpoint,
        Method: method,
        StatusCode: statusCode.toString(),
        Environment: envs.nodeEnv,
      },
    });
  }

  /**
   * Incrementa contador de errores
   */
  async recordError(endpoint: string, method: string, errorType: string): Promise<void> {
    await this.putMetric({
      metricName: 'ErrorCount',
      value: 1,
      unit: 'count',
      dimensions: {
        Endpoint: endpoint,
        Method: method,
        ErrorType: errorType,
        Environment: envs.nodeEnv,
      },
    });
  }

  /**
   * Registra duración de query a DB
   */
  async recordDatabaseQueryDuration(
    operation: string,
    duration: number,
  ): Promise<void> {
    await this.putMetric({
      metricName: 'DatabaseQueryDuration',
      value: duration,
      unit: 'milliseconds',
      dimensions: {
        Operation: operation,
        Environment: envs.nodeEnv,
      },
    });
  }

  /**
   * Registra tasa de aciertos de caché
   */
  async recordCacheHitRate(hit: boolean): Promise<void> {
    await this.putMetric({
      metricName: 'CacheHitRate',
      value: hit ? 1 : 0,
      unit: 'count',
      dimensions: {
        Result: hit ? 'Hit' : 'Miss',
        Environment: envs.nodeEnv,
      },
    });
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

