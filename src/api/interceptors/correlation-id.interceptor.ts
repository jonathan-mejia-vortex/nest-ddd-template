import type { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Injectable, Logger } from "@nestjs/common";
import type { Observable } from "rxjs";
import { v4 as uuidv4, validate as isValidUuid } from "uuid";

/**
 * Interceptor global para generar y propagar Correlation ID
 * El Correlation ID permite rastrear una request a través de múltiples servicios
 *
 * Soporta múltiples headers estándar (en orden de prioridad):
 * - X-Correlation-ID
 * - X-Request-ID
 * - X-Trace-ID
 *
 * - Si existe y es válido, lo reutiliza
 * - Si no existe o es inválido, genera uno nuevo con UUID v4
 * - Lo agrega al request object para uso en logging
 * - Lo devuelve en el response header 'X-Correlation-ID'
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
	private readonly logger = new Logger(CorrelationIdInterceptor.name);

	// Headers soportados en orden de prioridad
	private readonly CORRELATION_HEADERS = [
		"x-correlation-id",
		"x-request-id",
		"x-trace-id",
	] as const;

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();

		// Intentar obtener correlation ID de headers conocidos
		let correlationId = this.extractCorrelationId(request.headers);
		let wasGenerated = false;

		// Validar y generar si es necesario
		if (!correlationId || !isValidUuid(correlationId)) {
			if (correlationId) {
				this.logger.warn(`Invalid correlation ID format: ${correlationId}, generating new one`);
			}
			correlationId = uuidv4();
			wasGenerated = true;
		}

		// Agregar al request para uso posterior (logging, metrics, etc)
		request.correlationId = correlationId;

		// Agregar al response header (siempre usar el estándar X-Correlation-ID)
		response.setHeader("X-Correlation-ID", correlationId);

		// Log solo en desarrollo o cuando se genera uno nuevo
		if (wasGenerated && process.env.NODE_ENV === "development") {
			this.logger.debug(`Generated new correlation ID: ${correlationId}`);
		}

		return next.handle();
	}

	/**
	 * Extrae el correlation ID del primer header que exista
	 */
	private extractCorrelationId(headers: Record<string, string | string[]>): string | null {
		for (const headerName of this.CORRELATION_HEADERS) {
			const value = headers[headerName];
			if (value) {
				return Array.isArray(value) ? value[0] : value;
			}
		}
		return null;
	}
}
