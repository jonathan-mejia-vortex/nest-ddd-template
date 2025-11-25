import { Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module';
import { UserModule } from '../modules/users/user.module';
import { SharedModule } from '../shared/shared.module';
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * ApiModule - Módulo de la capa de API
 * Incluye controllers y guards custom (sin Passport)
 */
@Module({
  imports: [AuthModule, UserModule, SharedModule],
  controllers: [AuthController, UsersController],
  providers: [JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard],
})
export class ApiModule {}
