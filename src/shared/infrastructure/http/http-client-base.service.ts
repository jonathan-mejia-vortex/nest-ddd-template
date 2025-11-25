import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';
import * as CircuitBreaker from 'opossum';

export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  circuitBreakerOptions?: {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
  };
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Cliente HTTP base con retry logic, circuit breaker y manejo de errores
 * Esta clase es abstracta y debe ser extendida por clientes específicos (ErpClient, WmsClient, etc)
 */
@Injectable()
export abstract class HttpClientBase {
  protected readonly logger: Logger;
  protected readonly circuitBreaker: CircuitBreaker;

  constructor(
    protected readonly config: HttpClientConfig,
    protected readonly circuitBreakerService: CircuitBreakerService,
    protected readonly clientName: string,
  ) {
    this.logger = new Logger(clientName);

    // Crear circuit breaker para este cliente
    this.circuitBreaker = this.circuitBreakerService.create(
      clientName,
      this.executeRequest.bind(this),
      this.config.circuitBreakerOptions,
    );
  }

  /**
   * Método interno para ejecutar una request con retry logic
   */
  private async executeRequest(
    method: string,
    path: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<any> {
    const url = `${this.config.baseUrl}${path}`;
    const maxRetries = this.config.retries || 3;
    const retryDelay = this.config.retryDelay || 1000;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log({
          message: `HTTP ${method} request`,
          url,
          attempt,
          maxRetries,
        });

        // Aquí iría la llamada HTTP real usando axios, node-fetch, etc
        // Por ahora es un mock para demostración
        const response = await this.performHttpCall(method, url, data, options);

        this.logger.log({
          message: `HTTP ${method} success`,
          url,
          attempt,
        });

        return response;
      } catch (error) {
        lastError = error as Error;

        this.logger.error({
          message: `HTTP ${method} failed`,
          url,
          attempt,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Si no es el último intento, esperar antes de reintentar
        if (attempt < maxRetries) {
          await this.delay(retryDelay * attempt);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Método abstracto que debe implementar cada cliente específico
   * para realizar la llamada HTTP real (con axios, fetch, etc)
   */
  protected abstract performHttpCall(
    method: string,
    url: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<any>;

  /**
   * GET request con circuit breaker y retry
   */
  protected async get<T = any>(
    path: string,
    options?: RequestOptions,
  ): Promise<T> {
    return this.circuitBreaker.fire('GET', path, undefined, options);
  }

  /**
   * POST request con circuit breaker y retry
   */
  protected async post<T = any>(
    path: string,
    data: any,
    options?: RequestOptions,
  ): Promise<T> {
    return this.circuitBreaker.fire('POST', path, data, options);
  }

  /**
   * PUT request con circuit breaker y retry
   */
  protected async put<T = any>(
    path: string,
    data: any,
    options?: RequestOptions,
  ): Promise<T> {
    return this.circuitBreaker.fire('PUT', path, data, options);
  }

  /**
   * DELETE request con circuit breaker y retry
   */
  protected async delete<T = any>(
    path: string,
    options?: RequestOptions,
  ): Promise<T> {
    return this.circuitBreaker.fire('DELETE', path, undefined, options);
  }

  /**
   * Utilidad para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Obtiene el estado del circuit breaker
   */
  getCircuitBreakerState(): string {
    return this.circuitBreaker.opened ? 'OPEN' : 'CLOSED';
  }

  /**
   * Obtiene estadísticas del circuit breaker
   */
  getStats(): any {
    return this.circuitBreaker.stats;
  }
}
