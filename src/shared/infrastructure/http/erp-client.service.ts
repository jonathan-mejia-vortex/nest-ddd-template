import { Injectable } from '@nestjs/common';
import { HttpClientBase, RequestOptions } from './http-client-base.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { envs } from '../../../config/envs';

/**
 * Cliente HTTP para comunicación con el sistema ERP
 * Implementa circuit breaker, retry logic y manejo de errores
 * 
 * Ejemplo de uso futuro:
 * - Crear/actualizar usuarios en ERP
 * - Sincronizar datos de clientes
 * - Obtener información de productos
 */
@Injectable()
export class ErpClientService extends HttpClientBase {
  constructor(circuitBreakerService: CircuitBreakerService) {
    super(
      {
        baseUrl: envs.erpApiUrl || 'http://localhost:3001/api',
        timeout: 5000,
        retries: 3,
        retryDelay: 1000,
        circuitBreakerOptions: {
          timeout: 5000,
          errorThresholdPercentage: 50,
          resetTimeout: 30000,
        },
      },
      circuitBreakerService,
      'ErpClientService',
    );
  }

  /**
   * Implementación de la llamada HTTP real
   * En producción, usar axios o node-fetch
   */
  protected async performHttpCall(
    method: string,
    url: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<any> {
    // Mock implementation para desarrollo
    this.logger.log({
      message: `ERP Mock Call: ${method} ${url}`,
      data,
      headers: options?.headers,
    });

    // Simular respuesta exitosa
    return {
      success: true,
      data: { message: 'ERP Mock Response' },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Ejemplo de método específico del ERP
   * Sincroniza un usuario con el sistema ERP
   */
  async syncUser(userId: string, userData: any): Promise<any> {
    return this.post(`/users/${userId}/sync`, userData);
  }

  /**
   * Ejemplo: Obtener información de cliente desde ERP
   */
  async getCustomerInfo(customerId: string): Promise<any> {
    return this.get(`/customers/${customerId}`);
  }
}

