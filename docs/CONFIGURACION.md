# Guía de Configuración

Esta guía detalla la configuración de todas las características avanzadas del microservicio.

---

## 📋 Tabla de Contenidos

1. [Variables de Entorno](#variables-de-entorno)
2. [Observabilidad](#observabilidad)
3. [Circuit Breakers](#circuit-breakers)
4. [Idempotencia](#idempotencia)
5. [Mensajería](#mensajería)

---

## Variables de Entorno

### Base de Datos

```env
# Prisma Connection String
DATABASE_URL="postgresql://postgres:password@localhost:5432/auth_db?schema=public"

# Individual params (para referencia)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=auth_db
```

### JWT

```env
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

### Redis

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### HTTP Clients Externos

```env
# ERP System
ERP_API_URL=http://localhost:3001/api

# WMS System
WMS_API_URL=http://localhost:3002/api
```

### AWS CloudWatch (Opcional en Desarrollo)

```env
# Región de AWS
AWS_REGION=us-east-1

# CloudWatch Logs
AWS_CLOUDWATCH_LOG_GROUP=/aws/nest-ddd-template
AWS_CLOUDWATCH_LOG_STREAM=application

# Credenciales (o usar IAM Roles en EC2/ECS)
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
```

### OpenTelemetry + AWS X-Ray (Opcional)

```env
# Habilitar tracing
OTEL_ENABLED=true

# Endpoint del ADOT Collector
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

### Aplicación

```env
PORT=3000
NODE_ENV=development
```

---

## Observabilidad

### Logging (Pino + CloudWatch)

El logging estructurado está habilitado por defecto:

```typescript
// Inyectar el logger
constructor(private readonly logger: PinoLoggerService) {
  this.logger.setContext('MyService');
}

// Usar en tu código
this.logger.log({ message: 'Operation started', userId });
this.logger.error({ message: 'Operation failed', error: err.message });
```

**CloudWatch**: Los logs se envían automáticamente a AWS CloudWatch Logs en producción (cuando `NODE_ENV=production` o existen credenciales AWS).

**Contexto Automático**: 
- `correlation_id`: ID único por request
- `user_id`: Usuario autenticado
- `timestamp`: ISO 8601
- `environment`: development/production

### Métricas (CloudWatch Metrics)

Las métricas HTTP se registran automáticamente:
- `RequestDuration`: Latencia en ms
- `RequestCount`: Total de requests
- `ErrorCount`: Total de errores

**Métricas Personalizadas**:
```typescript
await this.metricsService.recordDatabaseQueryDuration('findAll', 150);
await this.metricsService.recordCacheHitRate(true);
```

**Namespace**: `Nest-DDD-Microservice-Template`  
**Flush**: Cada 1 minuto o 20 métricas

### Tracing (OpenTelemetry + X-Ray)

**Configuración**:
1. Instalar y ejecutar AWS ADOT Collector
2. Configurar variables de entorno:
   ```env
   OTEL_ENABLED=true
   OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
   ```

**Auto-instrumentación** para:
- NestJS controllers y services
- HTTP requests/responses
- PostgreSQL (via Prisma)
- Redis (ioredis)

### Correlation ID

Se genera automáticamente un `X-Correlation-ID` para cada request.

**Cliente puede enviar**:
```bash
curl -H "X-Correlation-ID: my-custom-id" http://localhost:3000/api/user
```

**El ID estará disponible en**:
- Response header `X-Correlation-ID`
- Logs estructurados
- Métricas
- Trazas de X-Ray

---

## Circuit Breakers

### Configuración por Cliente

Los HTTP clients (ERP, WMS) tienen circuit breakers configurados:

```typescript
{
  timeout: 5000,              // Timeout de request (ms)
  errorThresholdPercentage: 50, // % de errores para abrir circuito
  resetTimeout: 30000,        // Tiempo antes de intentar cerrar (ms)
}
```

### Estados del Circuit Breaker

- **CLOSED**: Normal, requests pasan
- **OPEN**: Muchos errores, requests fallan inmediatamente
- **HALF_OPEN**: Probando recuperación, permite algunas requests

### Uso

```typescript
constructor(
  private readonly erpClient: ErpClientService,
  private readonly wmsClient: WmsClientService,
) {}

// Automáticamente protegido con circuit breaker y retry
const data = await this.erpClient.syncUser(userId, userData);
```

### Monitoreo

```typescript
// Obtener estado del circuit breaker
const state = this.erpClient.getCircuitBreakerState(); // 'OPEN' | 'CLOSED'

// Obtener estadísticas
const stats = this.erpClient.getStats();
```

---

## Idempotencia

Previene ejecuciones duplicadas de operaciones críticas usando Redis.

### Configuración en Controller

```typescript
@Post()
@Idempotent('create-user')        // Nombre único de la operación
@UseGuards(IdempotencyGuard)      // Guard que valida
async create(@Body() dto: CreateDto) {
  // Tu lógica aquí
}
```

### Uso desde el Cliente

El cliente debe enviar header único:

```bash
curl -X POST \
  -H "X-Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}' \
  http://localhost:3000/api/auth/signup
```

### Comportamiento

- **Primera ejecución**: Se procesa normalmente y se almacena resultado
- **Ejecuciones duplicadas**: Retorna 409 Conflict con resultado previo
- **TTL**: 24 horas por defecto (configurable)

### Limpieza Manual (para testing)

```typescript
await this.idempotencyService.remove(key);
```

---

## Mensajería

### SQS Client (Mock)

Implementación mock lista para desarrollo:

```typescript
constructor(
  @Inject(SQS_CLIENT) private readonly sqsClient: ISqsClient,
) {}

// Enviar mensaje
await this.sqsClient.sendMessage(
  'my-queue',
  { userId, action: 'created' },
  { priority: 'high' }
);

// Enviar batch
await this.sqsClient.sendBatch('my-queue', messages);
```

### Migración a AWS SQS (Producción)

1. Crear `SqsClientAwsService`:
   ```typescript
   import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
   
   @Injectable()
   export class SqsClientAwsService implements ISqsClient {
     private client: SQSClient;
     
     constructor() {
       this.client = new SQSClient({ region: envs.awsRegion });
     }
     
     async sendMessage(queueName: string, message: any) {
       // Implementación real con AWS SDK
     }
   }
   ```

2. Reemplazar en `SharedModule`:
   ```typescript
   {
     provide: SQS_CLIENT,
     useClass: SqsClientAwsService, // Cambiar de Mock a AWS
   }
   ```

---

## 🔧 Checklist de Configuración

### Desarrollo Local

- [x] PostgreSQL corriendo
- [x] Redis corriendo (opcional, para idempotencia)
- [x] Variables de entorno en `.env`
- [ ] ADOT Collector (solo si quieres tracing local)

### Staging/Producción

- [ ] Variables de entorno configuradas
- [ ] Credenciales AWS (IAM Roles recomendado)
- [ ] CloudWatch Log Group creado
- [ ] ADOT Collector desplegado
- [ ] Circuit breakers configurados con URLs reales
- [ ] SQS queues creadas (si migras de mock a AWS)
- [ ] Índices de DB aplicados (`npx prisma migrate deploy`)

---

## 🚨 Troubleshooting

### Los logs no aparecen en CloudWatch

- Verificar credenciales AWS
- Verificar `AWS_CLOUDWATCH_LOG_GROUP` existe
- En desarrollo, CloudWatch solo se activa con credenciales configuradas

### Circuit breaker siempre abierto

- Verificar URLs de servicios externos (`ERP_API_URL`, `WMS_API_URL`)
- Ajustar `errorThresholdPercentage` si es muy sensible
- Verificar logs del circuit breaker

### Idempotencia no funciona

- Verificar Redis está corriendo
- Verificar conexión a Redis con `REDIS_HOST` y `REDIS_PORT`
- Verificar cliente envía header `X-Idempotency-Key`

### OpenTelemetry no envía trazas

- Verificar `OTEL_ENABLED=true`
- Verificar ADOT Collector está corriendo
- Verificar `OTEL_EXPORTER_OTLP_ENDPOINT` apunta al collector

---

**Para más detalles técnicos, consultar `ARQUITECTURA_DDD.md`**

