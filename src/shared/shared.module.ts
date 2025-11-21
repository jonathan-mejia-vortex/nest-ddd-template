import { Module } from '@nestjs/common';
import { TransactionService } from './infrastructure/persistence/transaction.service';

@Module({
  providers: [TransactionService],
  exports: [TransactionService],
})
export class SharedModule {}

