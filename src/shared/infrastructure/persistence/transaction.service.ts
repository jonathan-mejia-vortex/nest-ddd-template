import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * TransactionService - Servicio para manejo centralizado de transacciones con Prisma
 * Implementa el patrón Unit of Work
 */
@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ejecuta una operación dentro de una transacción
   * Si alguna operación falla, se hace rollback automáticamente
   *
   * @example
   * await transactionService.runInTransaction(async (tx) => {
   *   const auth = await authRepository.create(authEntity, tx);
   *   const user = await userRepository.create(userEntity, tx);
   *   return { auth, user };
   * });
   */
  async runInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return fn(tx);
    });
  }
}
