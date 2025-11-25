import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PinoLoggerService } from '../../shared/infrastructure/logging/pino-logger.service';
import { CloudWatchLoggerService } from '../../shared/infrastructure/logging/cloudwatch-logger.service';

/**
 * Interceptor global para logging de requests/responses
 * 
 * Funcionalidades:
 * - Log de request entrante (method, url, params, query)
 * - Log de response (status, duration)
 * - Propaga correlation_id y user_id al logger
 * - Envía logs a CloudWatch (batch)
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly pinoLogger: PinoLoggerService,
    private readonly cloudWatchLogger: CloudWatchLoggerService,
  ) {
    this.pinoLogger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, params, query, body } = request;
    const correlationId = request.correlationId;
    const userId = request.user?.id;

    const startTime = Date.now();

    // Configurar logger con contexto
    this.pinoLogger.setCorrelationId(correlationId);
    if (userId) {
      this.pinoLogger.setUserId(userId);
    }

    // Log de request entrante
    const requestLog = {
      message: 'Incoming request',
      method,
      url,
      params,
      query,
      // No loggear body completo en producción por seguridad
      bodyKeys: body ? Object.keys(body) : [],
      correlation_id: correlationId,
      user_id: userId,
    };

    this.pinoLogger.log(requestLog);
    this.cloudWatchLogger.log({
      ...requestLog,
      level: 'INFO',
      timestamp: Date.now(),
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;

          const responseLog = {
            message: 'Request completed',
            method,
            url,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            correlation_id: correlationId,
            user_id: userId,
          };

          this.pinoLogger.log(responseLog);
          this.cloudWatchLogger.log({
            ...responseLog,
            level: 'INFO',
            timestamp: Date.now(),
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          const errorLog = {
            message: 'Request failed',
            method,
            url,
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
            correlation_id: correlationId,
            user_id: userId,
          };

          this.pinoLogger.error(errorLog);
          this.cloudWatchLogger.log({
            ...errorLog,
            level: 'ERROR',
            timestamp: Date.now(),
          });
        },
      }),
    );
  }
}

