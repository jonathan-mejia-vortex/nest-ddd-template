import type { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";

/**
 * Formato unificado de respuesta exitosa
 */
export interface ApiResponse<T> {
	success: boolean;
	data: T;
	meta: {
		timestamp: string;
		path: string;
		method: string;
		correlationId?: string;
	};
}

/**
 * Interceptor global para unificar el formato de respuestas exitosas
 *
 * Transforma todas las respuestas exitosas al formato:
 * {
 *   success: true,
 *   data: <payload>,
 *   meta: {
 *     timestamp: ISO8601,
 *     path: "/api/...",
 *     method: "GET|POST|...",
 *     correlationId: "uuid"
 *   }
 * }
 *
 * Las respuestas de error son manejadas por el ExceptionFilter global
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
	intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
		const request = context.switchToHttp().getRequest();
		const { method, path, correlationId } = request;

		return next.handle().pipe(
			map((data) => ({
				success: true,
				data,
				meta: {
					timestamp: new Date().toISOString(),
					path,
					method,
					correlationId,
				},
			}))
		);
	}
}
