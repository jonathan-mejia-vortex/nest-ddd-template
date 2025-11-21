import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-yet';
import { envs } from '../../../config/envs';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          host: envs.redisHost,
          port: envs.redisPort,
          ttl: 3600, // TTL por defecto: 1 hora
        }),
      }),
    }),
  ],
  exports: [CacheModule],
})
export class RedisModule {}

