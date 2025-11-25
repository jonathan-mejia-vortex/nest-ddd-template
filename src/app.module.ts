import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ApiModule } from './api/api.module';
import { SharedModule } from './shared/shared.module';
import { DomainExceptionFilter } from './shared/application/filters/domain-exception.filter';

/**
 * AppModule - Módulo raíz de la aplicación
 * Usa Prisma (a través de SharedModule) en lugar de Sequelize
 */
@Module({
  imports: [
    SharedModule, // Incluye PrismaService y TransactionService
    ApiModule,    // Controllers y guards
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}
