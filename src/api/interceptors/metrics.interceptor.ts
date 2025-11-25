import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CloudWatchMetricsService } from '../../shared/infrastructure/metrics/cloudwatch-metrics.service';

/**
 * Interceptor global para métricas de performance
 * 
 * Métricas registradas:
 * - Duración de cada request
 * - Contador de requests por endpoint/método/status
 * - Contador de errores por endpoint/método/tipo
 * 
 * Las métricas se envían a CloudWatch Metrics en batch
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly metricsService: CloudWatchMetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    
    // Normalizar URL para métricas (remover IDs dinámicos)
    const normalizedUrl = this.normalizeUrl(url);
    
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Registrar métricas de éxito
        this.metricsService.recordRequestDuration(
          normalizedUrl,
          method,
          duration,
          statusCode,
        );

        this.metricsService.recordRequestCount(
          normalizedUrl,
          method,
          statusCode,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;
        const errorType = error.constructor.name;

        // Registrar métricas de error
        this.metricsService.recordRequestDuration(
          normalizedUrl,
          method,
          duration,
          statusCode,
        );

        this.metricsService.recordRequestCount(
          normalizedUrl,
          method,
          statusCode,
        );

        this.metricsService.recordError(
          normalizedUrl,
          method,
          errorType,
        );

        return throwError(() => error);
      }),
    );
  }

  /**
   * Normaliza URLs para métricas (reemplaza IDs por placeholders)
   * Ej: /api/user/123 -> /api/user/:id
   */
  private normalizeUrl(url: string): string {
    return url
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id') // UUIDs
      .replace(/\/\d+/g, '/:id'); // Números
  }
}

