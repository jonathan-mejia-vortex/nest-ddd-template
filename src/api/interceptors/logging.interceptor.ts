import type { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { Request, Response } from "express";
import type { Observable } from "rxjs";
import { tap } from "rxjs/operators";
// biome-ignore lint/style/useImportType: PinoLoggerService is injected by NestJS DI
import { PinoLoggerService } from "../../shared/infrastructure/logging/pino-logger.service";
// biome-ignore lint/style/useImportType: CloudWatchLoggerService is injected by NestJS DI
import { CloudWatchLoggerService } from "../../shared/infrastructure/logging/cloudwatch-logger.service";

/**
 * Interceptor global para logging de requests/responses
 *
 * Funcionalidades:
 * - Log de request entrante (method, url, params, query, IP, User-Agent)
 * - Log de response (status, duration, contentLength)
 * - Filtra campos sensibles del body (password, token, secret, etc.)
 * - Propaga correlation_id, user_id y account_id al logger
 * - Envía logs a CloudWatch (batch)
 * - Solo loggea requests lentas en producción (>1000ms)
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	// Campos sensibles que no deben loggearse
	private readonly SENSITIVE_FIELDS = [
		"password",
		"token",
		"secret",
		"apiKey",
		"accessToken",
		"refreshToken",
		"authorization",
		"cookie",
	];

	// Threshold para loggear solo requests lentas en producción (ms)
	private readonly SLOW_REQUEST_THRESHOLD = 1000;

	// Paths que no deben loggearse (health checks, métricas)
	private readonly EXCLUDED_PATHS = ["/health", "/metrics"];

	constructor(
		private readonly pinoLogger: PinoLoggerService,
		private readonly cloudWatchLogger: CloudWatchLoggerService
	) {
		this.pinoLogger.setContext("HTTP");
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const request = context.switchToHttp().getRequest<Request>();
		const response = context.switchToHttp().getResponse<Response>();

		// No loggear paths excluidos
		if (this.shouldExclude(request.url)) {
			return next.handle();
		}

		const { method, url, params, query, body } = request;
		const correlationId = request.correlationId;
		const userId = request.user?.id;
		const userRole = request.user?.role;

		// Extraer información adicional
		const ip = this.extractIp(request);
		const userAgent = request.headers["user-agent"];

		const startTime = Date.now();

		// Configurar logger con contexto
		this.pinoLogger.setCorrelationId(correlationId);
		if (userId) {
			this.pinoLogger.setUserId(userId);
		}

		// Log de request entrante (solo en desarrollo o debug)
		if (process.env.NODE_ENV !== "production") {
			const requestLog = {
				message: "Incoming request",
				method,
				url,
				params,
				query: this.sanitizeObject(query),
				bodyKeys: body ? this.getSafeBodyKeys(body) : [],
				ip,
				userAgent,
				correlation_id: correlationId,
				user_id: userId,
				user_role: userRole,
			};

			this.pinoLogger.log(requestLog);
			this.cloudWatchLogger.log({
				...requestLog,
				level: "INFO",
				timestamp: Date.now(),
			});
		}

		return next.handle().pipe(
			tap({
				next: () => {
					const durationMs = Date.now() - startTime;
					const statusCode = response.statusCode;

					// En producción, solo loggear requests lentas o errores
					const shouldLog =
						process.env.NODE_ENV !== "production" ||
						durationMs >= this.SLOW_REQUEST_THRESHOLD ||
						statusCode >= 400;

					if (!shouldLog) {
						return;
					}

					const contentLength = response.get("content-length");

					const responseLog = {
						message:
							durationMs >= this.SLOW_REQUEST_THRESHOLD ? "Slow request" : "Request completed",
						method,
						url,
						statusCode,
						durationMs,
						contentLength: contentLength ? Number.parseInt(contentLength, 10) : undefined,
						correlation_id: correlationId,
						user_id: userId,
					};

					// Usar warn para requests lentas
					if (durationMs >= this.SLOW_REQUEST_THRESHOLD) {
						this.pinoLogger.warn(responseLog);
					} else {
						this.pinoLogger.log(responseLog);
					}

					this.cloudWatchLogger.log({
						...responseLog,
						level: durationMs >= this.SLOW_REQUEST_THRESHOLD ? "WARN" : "INFO",
						timestamp: Date.now(),
					});
				},
				error: (error: Error & { status?: number; code?: string }) => {
					const durationMs = Date.now() - startTime;
					const statusCode = error.status || 500;
					const errorCode = error.code || error.constructor.name;

					const errorLog = {
						message: "Request failed",
						method,
						url,
						statusCode,
						errorCode,
						errorMessage: error.message,
						stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
						durationMs,
						ip,
						correlation_id: correlationId,
						user_id: userId,
					};

					this.pinoLogger.error(errorLog);
					this.cloudWatchLogger.log({
						...errorLog,
						level: "ERROR",
						timestamp: Date.now(),
					});
				},
			})
		);
	}

	/**
	 * Verifica si el path debe ser excluido del logging
	 */
	private shouldExclude(path: string): boolean {
		return this.EXCLUDED_PATHS.some((excludedPath) => path.startsWith(excludedPath));
	}

	/**
	 * Extrae la IP real del cliente (considerando proxies)
	 */
	private extractIp(request: Request): string {
		return (
			(request.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
			(request.headers["x-real-ip"] as string) ||
			request.socket.remoteAddress ||
			"unknown"
		);
	}

	/**
	 * Obtiene las keys del body filtrando campos sensibles
	 */
	private getSafeBodyKeys(body: Record<string, unknown>): string[] {
		return Object.keys(body).filter((key) => !this.SENSITIVE_FIELDS.includes(key.toLowerCase()));
	}

	/**
	 * Sanitiza un objeto removiendo campos sensibles
	 */
	private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
		if (!obj || typeof obj !== "object") {
			return obj;
		}

		const sanitized: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(obj)) {
			if (this.SENSITIVE_FIELDS.includes(key.toLowerCase())) {
				sanitized[key] = "***REDACTED***";
			} else {
				sanitized[key] = value;
			}
		}

		return sanitized;
	}
}
