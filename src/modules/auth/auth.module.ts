import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import { envs } from '../../config/envs';
import { AuthSequelizeEntity } from './infrastructure/persistence/sequelize/auth.sequelize.entity';
import { AuthRepositoryImpl } from './infrastructure/persistence/sequelize/auth.repository.impl';
import { AUTH_REPOSITORY } from './domain/repositories/auth.repository.interface';
import { PasswordService } from './domain/services/password.service';
import { CreateAuthUseCase } from './application/use-cases/create-auth.use-case';
import { ValidateUserUseCase } from './application/use-cases/validate-user.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { GetAuthByIdUseCase } from './application/use-cases/get-auth-by-id.use-case';
import { UserModule } from '../users/user.module';
import { JwtStrategy } from '../../api/strategies/jwt.strategy';
import { LocalStrategy } from '../../api/strategies/local.strategy';

@Module({
  imports: [
    SequelizeModule.forFeature([AuthSequelizeEntity]),
    UserModule,
    PassportModule,
    JwtModule.register({
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
    JwtStrategy,
    LocalStrategy,
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

