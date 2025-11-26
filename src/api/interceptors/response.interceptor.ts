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
		version?: string;
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
 *     correlationId: "uuid",
 *     version: "v1"
 *   }
 * }
 *
 * Excepciones (no wrappea):
 * - Health checks (/health, /metrics)
 * - Responses que ya tienen estructura { success, data, meta }
 * - Streams y archivos (responses no-JSON)
 *
 * Las respuestas de error son manejadas por el ExceptionFilter global
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
	// Paths que no deben ser wrappeados
	private readonly EXCLUDED_PATHS = ["/health", "/metrics", "/docs"];

	intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T> | T> {
		const request = context.switchToHttp().getRequest();
		const { method, path, correlationId } = request;

		// No wrappear paths excluidos (health checks, métricas, swagger)
		if (this.shouldExcludePath(path)) {
			return next.handle();
		}

		return next.handle().pipe(
			map((data) => {
				// Si la respuesta ya está en el formato esperado, no wrappear
				if (this.isAlreadyWrapped(data)) {
					return data;
				}

				// Si es un Stream o Buffer, no wrappear
				if (this.isStreamOrBuffer(data)) {
					return data;
				}

				// Extraer versión del path si existe (ej: /v1/users)
				const version = this.extractVersion(path);

				// Wrappear la respuesta en el formato estándar
				return {
					success: true,
					data,
					meta: {
						timestamp: new Date().toISOString(),
						path,
						method,
						correlationId,
						...(version && { version }),
					},
				};
			})
		);
	}

	/**
	 * Verifica si el path debe ser excluido del wrapping
	 */
	private shouldExcludePath(path: string): boolean {
		return this.EXCLUDED_PATHS.some((excludedPath) => path.startsWith(excludedPath));
	}

	/**
	 * Verifica si la respuesta ya está en el formato { success, data, meta }
	 */
	private isAlreadyWrapped(data: unknown): boolean {
		return (
			typeof data === "object" &&
			data !== null &&
			"success" in data &&
			"data" in data &&
			"meta" in data
		);
	}

	/**
	 * Verifica si la respuesta es un Stream o Buffer (no debe ser wrappeada)
	 */
	private isStreamOrBuffer(data: unknown): boolean {
		if (!data) return false;

		// Buffer
		if (Buffer.isBuffer(data)) return true;

		// Stream (tiene método pipe)
		if (typeof data === "object" && "pipe" in data && typeof data.pipe === "function") {
			return true;
		}

		return false;
	}

	/**
	 * Extrae la versión del path si existe (ej: /v1/users -> "v1")
	 */
	private extractVersion(path: string): string | null {
		const versionMatch = path.match(/\/(v\d+)\//);
		return versionMatch ? versionMatch[1] : null;
	}
}
