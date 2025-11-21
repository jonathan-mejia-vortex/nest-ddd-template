import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserSequelizeEntity } from '../modules/users/infrastructure/persistence/sequelize/user.sequelize.entity';
import { AuthSequelizeEntity } from '../modules/auth/infrastructure/persistence/sequelize/auth.sequelize.entity';
import { envs } from './../config/envs';

const isTestEnv = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';
@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: envs.dbHost,
      port: Number(envs.dbPort),
      username: envs.dbUsername,
      password: envs.dbPassword,
      database: envs.dbDatabase,
      logging: !isTestEnv || !isProduction,
      models: [UserSequelizeEntity, AuthSequelizeEntity],
      pool: {
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000,
      },
      retry: {
        max: 3,
      },
    }),
  ],
})
export class DbModule {}
