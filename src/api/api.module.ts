import { Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module';
import { UserModule } from '../modules/users/user.module';
import { SharedModule } from '../shared/shared.module';
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';

@Module({
  imports: [AuthModule, UserModule, SharedModule],
  controllers: [AuthController, UsersController],
})
export class ApiModule {}

