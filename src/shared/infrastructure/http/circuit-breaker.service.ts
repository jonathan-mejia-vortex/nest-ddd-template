import { Injectable, Logger } from '@nestjs/common';
import * as CircuitBreaker from 'opossum';

export interface CircuitBreakerOptions {
  timeout?: number; // Timeout en ms (default: 3000)
  errorThresholdPercentage?: number; // % de errores antes de abrir (default: 50)
  resetTimeout?: number; // Tiempo antes de intentar cerrar en ms (default: 30000)
  rollingCountTimeout?: number; // Ventana de tiempo para conteo (default: 10000)
  rollingCountBuckets?: number; // Número de buckets (default: 10)
  name?: string; // Nombre del circuit breaker
}

/**
 * Servicio para crear y gestionar Circuit Breakers
 * Utiliza la librería opossum para implementar el patrón Circuit Breaker
 * 
 * Estados:
 * - CLOSED: Funcionamiento normal, requests pasan
 * - OPEN: Circuito abierto por muchos errores, requests fallan inmediatamente
 * - HALF_OPEN: Intentando recuperación, permite algunas requests de prueba
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Crea un Circuit Breaker para una función específica
   * @param name Nombre único del circuit breaker
   * @param fn Función a proteger
   * @param options Opciones de configuración
   * @returns Circuit Breaker configurado
   */
  create<T extends (...args: any[]) => Promise<any>>(
    name: string,
    fn: T,
    options?: CircuitBreakerOptions,
  ): CircuitBreaker<Parameters<T>, ReturnType<T>> {
    if (this.breakers.has(name)) {
      return this.breakers.get(name)!;
    }

    const breakerOptions = {
      timeout: options?.timeout || 3000,
      errorThresholdPercentage: options?.errorThresholdPercentage || 50,
      resetTimeout: options?.resetTimeout || 30000,
      rollingCountTimeout: options?.rollingCountTimeout || 10000,
      rollingCountBuckets: options?.rollingCountBuckets || 10,
      name: options?.name || name,
    };

    const breaker = new CircuitBreaker(fn, breakerOptions);

    // Eventos para logging
    breaker.on('open', () => {
      this.logger.warn(`Circuit Breaker OPEN: ${name}`);
    });

    breaker.on('halfOpen', () => {
      this.logger.log(`Circuit Breaker HALF_OPEN: ${name}`);
    });

    breaker.on('close', () => {
      this.logger.log(`Circuit Breaker CLOSED: ${name}`);
    });

    breaker.on('timeout', () => {
      this.logger.error(`Circuit Breaker TIMEOUT: ${name}`);
    });

    breaker.on('failure', (error) => {
      this.logger.error(
        `Circuit Breaker FAILURE: ${name} - ${error.message}`,
      );
    });

    this.breakers.set(name, breaker);
    return breaker;
  }

  /**
   * Obtiene un Circuit Breaker existente
   * @param name Nombre del circuit breaker
   * @returns Circuit Breaker o undefined
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Obtiene estadísticas de todos los circuit breakers
   */
  getStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    this.breakers.forEach((breaker, name) => {
      stats[name] = {
        state: breaker.opened ? 'OPEN' : 'CLOSED',
        stats: breaker.stats,
      };
    });

    return stats;
  }

  /**
   * Cierra manualmente un circuit breaker
   * @param name Nombre del circuit breaker
   */
  close(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.close();
    }
  }

  /**
   * Abre manualmente un circuit breaker
   * @param name Nombre del circuit breaker
   */
  open(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.open();
    }
  }
}

