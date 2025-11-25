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
          socket: {
            host: envs.redisHost,
            port: envs.redisPort,
          },
          ttl: 3600000, // TTL en milisegundos: 1 hora
        }),
      }),
    }),
  ],
  exports: [CacheModule],
})
export class RedisModule {}
