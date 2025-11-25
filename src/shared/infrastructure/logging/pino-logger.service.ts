import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as pino from 'pino';
import { envs } from '../../../config/envs';

/**
 * Servicio de logging estructurado con Pino
 * Proporciona logging con contexto automático y formato JSON
 * 
 * Contexto automático incluye:
 * - correlation_id: ID de correlación de la request
 * - user_id: ID del usuario autenticado
 * - timestamp: Timestamp ISO 8601
 * - environment: Entorno de ejecución
 * - service: Nombre del servicio
 */
@Injectable({ scope: Scope.TRANSIENT })
export class PinoLoggerService implements LoggerService {
  private logger: pino.Logger;
  private context?: string;
  private userId?: string;
  private correlationId?: string;

  constructor() {
    this.logger = pino({
      level: envs.nodeEnv === 'production' ? 'info' : 'debug',
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        service: 'ms-auth',
        environment: envs.nodeEnv,
      },
    });
  }

  /**
   * Establece el contexto del logger (ej: nombre de la clase)
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Establece el userId para logging automático
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Establece el correlationId para logging automático
   */
  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  /**
   * Crea un objeto con el contexto completo
   */
  private buildContext(meta?: Record<string, any>): Record<string, any> {
    return {
      ...meta,
      context: this.context,
      user_id: this.userId,
      correlation_id: this.correlationId,
    };
  }

  /**
   * Log nivel INFO
   */
  log(message: any, context?: string): void {
    const logContext = context || this.context;
    if (typeof message === 'string') {
      this.logger.info(this.buildContext({ context: logContext }), message);
    } else {
      this.logger.info(this.buildContext({ ...message, context: logContext }));
    }
  }

  /**
   * Log nivel ERROR
   */
  error(message: any, trace?: string, context?: string): void {
    const logContext = context || this.context;
    if (typeof message === 'string') {
      this.logger.error(
        this.buildContext({ context: logContext, trace }),
        message,
      );
    } else {
      this.logger.error(
        this.buildContext({ ...message, context: logContext, trace }),
      );
    }
  }

  /**
   * Log nivel WARN
   */
  warn(message: any, context?: string): void {
    const logContext = context || this.context;
    if (typeof message === 'string') {
      this.logger.warn(this.buildContext({ context: logContext }), message);
    } else {
      this.logger.warn(this.buildContext({ ...message, context: logContext }));
    }
  }

  /**
   * Log nivel DEBUG
   */
  debug(message: any, context?: string): void {
    const logContext = context || this.context;
    if (typeof message === 'string') {
      this.logger.debug(this.buildContext({ context: logContext }), message);
    } else {
      this.logger.debug(this.buildContext({ ...message, context: logContext }));
    }
  }

  /**
   * Log nivel VERBOSE (mapeado a TRACE en Pino)
   */
  verbose(message: any, context?: string): void {
    const logContext = context || this.context;
    if (typeof message === 'string') {
      this.logger.trace(this.buildContext({ context: logContext }), message);
    } else {
      this.logger.trace(this.buildContext({ ...message, context: logContext }));
    }
  }

  /**
   * Log nivel FATAL
   */
  fatal(message: any, context?: string): void {
    const logContext = context || this.context;
    if (typeof message === 'string') {
      this.logger.fatal(this.buildContext({ context: logContext }), message);
    } else {
      this.logger.fatal(this.buildContext({ ...message, context: logContext }));
    }
  }

  /**
   * Crea un child logger con contexto adicional
   */
  child(bindings: Record<string, any>): PinoLoggerService {
    const childLogger = new PinoLoggerService();
    childLogger.logger = this.logger.child(bindings);
    childLogger.context = this.context;
    childLogger.userId = this.userId;
    childLogger.correlationId = this.correlationId;
    return childLogger;
  }
}

