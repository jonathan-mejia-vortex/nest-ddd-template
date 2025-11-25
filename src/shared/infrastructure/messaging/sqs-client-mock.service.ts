import { Injectable, Logger } from '@nestjs/common';
import { ISqsClient } from './sqs-client.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Implementación mock del cliente SQS para desarrollo/testing
 * En producción, se reemplazará por SqsClientAwsService que use @aws-sdk/client-sqs
 */
@Injectable()
export class SqsClientMockService implements ISqsClient {
  private readonly logger = new Logger(SqsClientMockService.name);
  private readonly messages: Map<string, any[]> = new Map();

  async sendMessage(
    queueName: string,
    message: any,
    attributes?: Record<string, string>,
  ): Promise<string> {
    const messageId = uuidv4();

    this.logger.log({
      message: 'SQS Mock: Mensaje enviado',
      queueName,
      messageId,
      payload: message,
      attributes,
    });

    // Almacenar en memoria para debugging
    if (!this.messages.has(queueName)) {
      this.messages.set(queueName, []);
    }
    this.messages.get(queueName)?.push({
      messageId,
      payload: message,
      attributes,
      timestamp: new Date(),
    });

    return messageId;
  }

  async sendBatch(queueName: string, messages: any[]): Promise<string[]> {
    const messageIds: string[] = [];

    for (const message of messages) {
      const messageId = await this.sendMessage(queueName, message);
      messageIds.push(messageId);
    }

    this.logger.log({
      message: 'SQS Mock: Batch enviado',
      queueName,
      count: messages.length,
      messageIds,
    });

    return messageIds;
  }

  /**
   * Método auxiliar para obtener mensajes almacenados (solo para testing)
   */
  getMessages(queueName: string): any[] {
    return this.messages.get(queueName) || [];
  }

  /**
   * Método auxiliar para limpiar mensajes (solo para testing)
   */
  clearMessages(queueName?: string): void {
    if (queueName) {
      this.messages.delete(queueName);
    } else {
      this.messages.clear();
    }
  }
}

