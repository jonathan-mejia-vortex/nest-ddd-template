import type { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";

/**
 * Interceptor global para generar y propagar Correlation ID
 * El Correlation ID permite rastrear una request a través de múltiples servicios
 *
 * - Lee el header 'X-Correlation-ID' si existe
 * - Si no existe, genera uno nuevo con UUID v4
 * - Lo agrega al request object para uso en logging
 * - Lo devuelve en el response header
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();

		// Obtener o generar correlation ID
		const correlationId = request.headers["x-correlation-id"] || uuidv4();

		// Agregar al request para uso posterior (logging, etc)
		request.correlationId = correlationId;

		// Agregar al response header
		response.setHeader("X-Correlation-ID", correlationId);

		return next.handle().pipe(
			tap(() => {
				// Aquí podríamos agregar logging adicional si es necesario
			})
		);
	}
}
