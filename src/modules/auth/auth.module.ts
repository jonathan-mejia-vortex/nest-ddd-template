import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { envs } from "../../config/envs";
import { UserModule } from "../users/user.module";
import { CreateAuthUseCase } from "./application/use-cases/create-auth.use-case";
import { GetAuthByIdUseCase } from "./application/use-cases/get-auth-by-id.use-case";
import { LoginUseCase } from "./application/use-cases/login.use-case";
import { ValidateUserUseCase } from "./application/use-cases/validate-user.use-case";
import { AUTH_REPOSITORY } from "./domain/repositories/auth.repository.interface";
import { PASSWORD_SERVICE, PasswordService } from "./domain/services/password.service";
import { AuthRepositoryImpl } from "./infrastructure/persistence/prisma/auth.repository.impl";

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
			signOptions: { expiresIn: Number(envs.jwtExpiresIn) },
		}),
	],
	providers: [
		{
			provide: AUTH_REPOSITORY,
			useClass: AuthRepositoryImpl,
		},
		{
			provide: PASSWORD_SERVICE,
			useClass: PasswordService,
		},
		CreateAuthUseCase,
		ValidateUserUseCase,
		LoginUseCase,
		GetAuthByIdUseCase,
	],
	exports: [
		AUTH_REPOSITORY,
		PASSWORD_SERVICE,
		CreateAuthUseCase,
		ValidateUserUseCase,
		LoginUseCase,
		GetAuthByIdUseCase,
	],
})
export class AuthModule {}
