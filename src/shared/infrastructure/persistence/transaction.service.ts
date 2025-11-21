import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize, Transaction } from 'sequelize';

@Injectable()
export class TransactionService {
  constructor(@InjectConnection() private sequelize: Sequelize) {}

  async executeInTransaction<T>(
    fn: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    return this.sequelize.transaction(fn);
  }
}

