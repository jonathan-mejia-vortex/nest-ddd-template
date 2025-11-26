import type { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Injectable, Logger } from "@nestjs/common";
import type { Observable } from "rxjs";
import { throwError } from "rxjs";
import { catchError, finalize, tap } from "rxjs/operators";
// biome-ignore lint/style/useImportType: CloudWatchMetricsService is injected by NestJS DI
import { CloudWatchMetricsService } from "../../shared/infrastructure/metrics/cloudwatch-metrics.service";

/**
 * Interceptor global para métricas de performance
 *
 * Métricas registradas:
 * - Duración de cada request (con percentiles)
 * - Contador de requests por endpoint/método/status
 * - Contador de errores por endpoint/método/tipo
 * - Tamaño de request/response
 * - Requests concurrentes activas
 *
 * Las métricas se envían a CloudWatch Metrics en batch
 *
 * Nota: Solo procesa contextos HTTP, ignora WebSocket/gRPC/GraphQL
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
	private readonly logger = new Logger(MetricsInterceptor.name);

	// Paths excluidos de métricas (health checks, etc.)
	private readonly EXCLUDED_PATHS = ["/health", "/metrics", "/docs"];

	// Contador de requests activas (para métricas de concurrencia)
	private activeRequests = 0;

	constructor(private readonly metricsService: CloudWatchMetricsService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		// Solo procesar contextos HTTP
		if (context.getType() !== "http") {
			return next.handle();
		}

		const httpContext = context.switchToHttp();
		const request = httpContext.getRequest();
		const response = httpContext.getResponse();

		const { method, url } = request;

		// No registrar métricas para paths excluidos
		if (this.shouldExclude(url)) {
			return next.handle();
		}

		// Normalizar URL para métricas (remover IDs dinámicos)
		const normalizedUrl = this.normalizeUrl(url);

		const startTime = Date.now();

		// Incrementar contador de requests activas
		this.activeRequests++;

		return next.handle().pipe(
			tap(() => {
				const durationMs = Date.now() - startTime;
				const statusCode = response.statusCode;

				try {
					// Registrar duración de request
					this.metricsService.recordRequestDuration(normalizedUrl, method, durationMs, statusCode);

					// Registrar contador de requests
					this.metricsService.recordRequestCount(normalizedUrl, method, statusCode);

					// Registrar tamaño de respuesta si está disponible
					const contentLength = response.get("content-length");
					if (contentLength) {
						this.recordResponseSize(normalizedUrl, method, Number.parseInt(contentLength, 10));
					}
				} catch (error) {
					this.logger.error(
						`Error recording metrics for ${method} ${normalizedUrl}:`,
						error instanceof Error ? error.message : "Unknown error"
					);
				}
			}),
			catchError((error: Error & { status?: number; code?: string }) => {
				const durationMs = Date.now() - startTime;
				const statusCode = error.status || 500;
				const errorType = this.getErrorType(error);

				try {
					// Registrar duración incluso en caso de error
					this.metricsService.recordRequestDuration(normalizedUrl, method, durationMs, statusCode);

					// Registrar contador de requests con error
					this.metricsService.recordRequestCount(normalizedUrl, method, statusCode);

					// Registrar error específico
					this.metricsService.recordError(normalizedUrl, method, errorType);
				} catch (metricsError) {
					this.logger.error(
						`Error recording error metrics for ${method} ${normalizedUrl}:`,
						metricsError instanceof Error ? metricsError.message : "Unknown error"
					);
				}

				return throwError(() => error);
			}),
			finalize(() => {
				// Decrementar contador de requests activas
				this.activeRequests--;

				// Registrar métricas de concurrencia periódicamente
				if (this.activeRequests % 10 === 0) {
					this.metricsService.recordActiveRequests(this.activeRequests);
				}
			})
		);
	}

	/**
	 * Verifica si el path debe ser excluido de métricas
	 */
	private shouldExclude(path: string): boolean {
		return this.EXCLUDED_PATHS.some((excludedPath) => path.startsWith(excludedPath));
	}

	/**
	 * Normaliza URLs para métricas (reemplaza IDs dinámicos por placeholders)
	 * Ejemplos:
	 * - /api/users/123 -> /api/users/:id
	 * - /api/users/550e8400-e29b-41d4-a716-446655440000 -> /api/users/:id
	 * - /api/v1/orders/ORD-12345 -> /api/v1/orders/:id
	 */
	private normalizeUrl(url: string): string {
		// Remover query string
		const [path] = url.split("?");

		return (
			path
				// UUIDs (8-4-4-4-12 format)
				.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:id")
				// Números puros (IDs numéricos)
				.replace(/\/\d+/g, "/:id")
				// Códigos alfanuméricos (ej: ORD-12345, USR-ABC123)
				.replace(/\/[A-Z]+-[A-Z0-9]+/gi, "/:code")
				// Emails en path (raro pero posible)
				.replace(/\/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, "/:email")
		);
	}

	/**
	 * Extrae el tipo de error de forma segura
	 */
	private getErrorType(error: Error & { code?: string }): string {
		// Priorizar código de error si existe (ej: ERR_VALIDATION, ERR_NOT_FOUND)
		if (error.code) {
			return error.code;
		}

		// Usar nombre del constructor como fallback
		return error.constructor.name || "UnknownError";
	}

	/**
	 * Registra el tamaño de la respuesta
	 * (método privado para futuras expansiones de métricas)
	 */
	private recordResponseSize(url: string, method: string, sizeBytes: number): void {
		// Por ahora solo loggear en desarrollo
		if (process.env.NODE_ENV === "development" && sizeBytes > 1024 * 1024) {
			// > 1MB
			this.logger.warn(
				`Large response size for ${method} ${url}: ${(sizeBytes / 1024 / 1024).toFixed(2)}MB`
			);
		}

		// TODO: Agregar métrica de tamaño a CloudWatch si se necesita
		// this.metricsService.recordResponseSize(url, method, sizeBytes);
	}
}
