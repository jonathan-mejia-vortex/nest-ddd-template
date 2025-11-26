import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AuthModule } from "../modules/auth/auth.module";
import { UserModule } from "../modules/users/user.module";
import { SharedModule } from "../shared/shared.module";
import { HealthModule } from "./health/health.module";
import { AuthController } from "./controllers/auth.controller";
import { UsersController } from "./controllers/users.controller";
import { IdempotencyGuard } from "./guards/idempotency.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { CorrelationIdInterceptor } from "./interceptors/correlation-id.interceptor";
import { LoggingInterceptor } from "./interceptors/logging.interceptor";
import { MetricsInterceptor } from "./interceptors/metrics.interceptor";
import { ResponseInterceptor } from "./interceptors/response.interceptor";

/**
 * ApiModule - Módulo de la capa de API
 *
 * Incluye:
 * - Controllers delgados (auth, users)
 * - Guards custom (JWT, Roles, Idempotency)
 * - Interceptors globales (CorrelationId, Response, Logging, Metrics)
 */
@Module({
	imports: [AuthModule, UserModule, SharedModule, HealthModule],
	controllers: [AuthController, UsersController],
	providers: [
		// Guards
		JwtAuthGuard,
		RolesGuard,
		IdempotencyGuard,
		// Interceptors globales (orden: CorrelationId → Response → Logging → Metrics)
		{
			provide: APP_INTERCEPTOR,
			useClass: CorrelationIdInterceptor,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: ResponseInterceptor,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: LoggingInterceptor,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: MetricsInterceptor,
		},
	],
	exports: [JwtAuthGuard, RolesGuard],
})
export class ApiModule {}
