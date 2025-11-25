import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { envs } from '../../config/envs';
import { AuthRepositoryImpl } from './infrastructure/persistence/prisma/auth.repository.impl';
import { AUTH_REPOSITORY } from './domain/repositories/auth.repository.interface';
import { PasswordService } from './domain/services/password.service';
import { CreateAuthUseCase } from './application/use-cases/create-auth.use-case';
import { ValidateUserUseCase } from './application/use-cases/validate-user.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { GetAuthByIdUseCase } from './application/use-cases/get-auth-by-id.use-case';
import { UserModule } from '../users/user.module';

/**
 * AuthModule - Módulo de autenticación con Prisma (sin Passport)
 * Usa JWT para autenticación y autorización
 */
@Module({
  imports: [
    UserModule,
    JwtModule.register({
      global: true, // JWT disponible globalmente
      secret: envs.jwtSecret,
      signOptions: { expiresIn: envs.jwtExpiresIn },
    }),
  ],
  providers: [
    {
      provide: AUTH_REPOSITORY,
      useClass: AuthRepositoryImpl,
    },
    PasswordService,
    CreateAuthUseCase,
    ValidateUserUseCase,
    LoginUseCase,
    GetAuthByIdUseCase,
  ],
  exports: [
    AUTH_REPOSITORY,
    CreateAuthUseCase,
    ValidateUserUseCase,
    LoginUseCase,
    GetAuthByIdUseCase,
    PasswordService,
  ],
})
export class AuthModule {}
