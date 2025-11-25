import { Global, Module } from '@nestjs/common';
import { TransactionService } from './infrastructure/persistence/transaction.service';
import { PrismaService } from './infrastructure/persistence/prisma.service';

/**
 * SharedModule - Módulo global con servicios compartidos
 * Incluye PrismaService y TransactionService
 */
@Global()
@Module({
  providers: [PrismaService, TransactionService],
  exports: [PrismaService, TransactionService],
})
export class SharedModule {}
