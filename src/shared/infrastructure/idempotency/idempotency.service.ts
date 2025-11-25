import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Servicio de idempotencia para evitar ejecuciones duplicadas
 * Utiliza Redis (via cache-manager) para almacenar las claves de idempotencia
 */
@Injectable()
export class IdempotencyService {
  private readonly DEFAULT_TTL = 86400; // 24 horas en segundos

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Verifica si una operación ya fue ejecutada
   * @param key Clave de idempotencia única (ej: userId:operation:timestamp)
   * @returns true si ya fue ejecutada, false si es nueva
   */
  async isProcessed(key: string): Promise<boolean> {
    const value = await this.cacheManager.get(key);
    return value !== null && value !== undefined;
  }

  /**
   * Marca una operación como procesada
   * @param key Clave de idempotencia
   * @param result Resultado opcional a almacenar
   * @param ttl TTL en segundos (por defecto 24h)
   */
  async markAsProcessed(
    key: string,
    result?: any,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    await this.cacheManager.set(
      key,
      result || { processed: true, timestamp: new Date().toISOString() },
      ttl * 1000, // cache-manager usa milisegundos
    );
  }

  /**
   * Obtiene el resultado de una operación previamente procesada
   * @param key Clave de idempotencia
   * @returns Resultado almacenado o null si no existe
   */
  async getProcessedResult<T = any>(key: string): Promise<T | null> {
    return (await this.cacheManager.get<T>(key)) || null;
  }

  /**
   * Elimina una clave de idempotencia (útil para testing o rollback)
   * @param key Clave de idempotencia
   */
  async remove(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Genera una clave de idempotencia estándar
   * @param userId ID del usuario
   * @param operation Nombre de la operación
   * @param uniqueId ID único de la operación (ej: requestId)
   * @returns Clave de idempotencia formateada
   */
  generateKey(userId: string, operation: string, uniqueId: string): string {
    return `idempotency:${userId}:${operation}:${uniqueId}`;
  }
}

