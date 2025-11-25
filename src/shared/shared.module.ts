import { Module, Global } from '@nestjs/common';
import { PrismaService } from './infrastructure/persistence/prisma.service';
import { TransactionService } from './infrastructure/persistence/transaction.service';
import { DomainExceptionFilter } from './application/filters/domain-exception.filter';
import { RedisModule } from './infrastructure/cache/redis.module';
import { IdempotencyService } from './infrastructure/idempotency/idempotency.service';
import { CircuitBreakerService } from './infrastructure/http/circuit-breaker.service';
import { ErpClientService } from './infrastructure/http/erp-client.service';
import { WmsClientService } from './infrastructure/http/wms-client.service';
import { SQS_CLIENT } from './infrastructure/messaging/sqs-client.interface';
import { SqsClientMockService } from './infrastructure/messaging/sqs-client-mock.service';
import { PinoLoggerService } from './infrastructure/logging/pino-logger.service';
import { CloudWatchLoggerService } from './infrastructure/logging/cloudwatch-logger.service';
import { CloudWatchMetricsService } from './infrastructure/metrics/cloudwatch-metrics.service';

/**
 * SharedModule - Módulo global con servicios compartidos de infraestructura
 * 
 * Incluye:
 * - Persistencia: PrismaService, TransactionService
 * - Mensajería: SQS Mock
 * - Idempotencia: IdempotencyService
 * - HTTP Clients: ErpClient, WmsClient con Circuit Breakers
 * - Logging: Pino + CloudWatch Logs
 * - Métricas: CloudWatch Metrics
 * - Cache: Redis
 */
@Global()
@Module({
  imports: [RedisModule],
  providers: [
    // Persistence
    PrismaService,
    TransactionService,
    // Filters
    DomainExceptionFilter,
    // Idempotency
    IdempotencyService,
    // HTTP Clients & Circuit Breakers
    CircuitBreakerService,
    ErpClientService,
    WmsClientService,
    // Messaging (Mock - reemplazar con SqsClientAwsService en producción)
    {
      provide: SQS_CLIENT,
      useClass: SqsClientMockService,
    },
    // Logging
    PinoLoggerService,
    CloudWatchLoggerService,
    // Metrics
    CloudWatchMetricsService,
  ],
  exports: [
    PrismaService,
    TransactionService,
    DomainExceptionFilter,
    RedisModule,
    IdempotencyService,
    CircuitBreakerService,
    ErpClientService,
    WmsClientService,
    SQS_CLIENT,
    PinoLoggerService,
    CloudWatchLoggerService,
    CloudWatchMetricsService,
  ],
})
export class SharedModule {}
