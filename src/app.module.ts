import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DbModule } from './db/db.module';
import { ApiModule } from './api/api.module';
import { SharedModule } from './shared/shared.module';
import { DomainExceptionFilter } from './shared/application/filters/domain-exception.filter';

@Module({
  imports: [DbModule, ApiModule, SharedModule],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}
