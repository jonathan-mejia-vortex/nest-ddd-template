import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '../modules/auth/auth.module';
import { UserModule } from '../modules/users/user.module';
import { SharedModule } from '../shared/shared.module';
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { IdempotencyGuard } from './guards/idempotency.guard';
import { CorrelationIdInterceptor } from './interceptors/correlation-id.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';

/**
 * ApiModule - Módulo de la capa de API
 * 
 * Incluye:
 * - Controllers delgados (auth, users)
 * - Guards custom (JWT, Roles, Idempotency)
 * - Interceptors globales (CorrelationId, Logging, Metrics)
 */
@Module({
  imports: [AuthModule, UserModule, SharedModule],
  controllers: [AuthController, UsersController],
  providers: [
    // Guards
    JwtAuthGuard,
    RolesGuard,
    IdempotencyGuard,
    // Interceptors globales (registrados automáticamente)
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationIdInterceptor,
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
