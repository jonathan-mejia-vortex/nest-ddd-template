# Infraestructura y Mejoras Agregadas al Proyecto

Este documento detalla toda la infraestructura crítica y buenas prácticas agregadas al microservicio `ms-auth`, manteniendo estrictamente la arquitectura DDD + Hexagonal.

---

## 📋 Índice

1. [Mensajería (SQS Mock)](#1-mensajería-sqs-mock)
2. [Idempotencia](#2-idempotencia)
3. [Correlation ID](#3-correlation-id)
4. [Circuit Breakers y HTTP Clients](#4-circuit-breakers-y-http-clients)
5. [Logging Estructurado (Pino + CloudWatch)](#5-logging-estructurado)
6. [Métricas de Performance (CloudWatch Metrics)](#6-métricas-de-performance)
7. [Observabilidad (OpenTelemetry + AWS X-Ray)](#7-observabilidad-opentelemetry--aws-x-ray)
8. [Paginación](#8-paginación)
9. [Tests Unitarios](#9-tests-unitarios)
10. [Variables de Entorno](#10-variables-de-entorno)

---

## 1. Mensajería (SQS Mock)

### Archivos Creados
- `src/shared/infrastructure/messaging/sqs-client.interface.ts` - Puerto (interfaz)
- `src/shared/infrastructure/messaging/sqs-client-mock.service.ts` - Implementación mock

### Funcionalidades
- ✅ Interfaz `ISqsClient` desacoplada del dominio
- ✅ Implementación mock para desarrollo/testing
- ✅ Métodos: `sendMessage()`, `sendBatch()`
- ✅ Logging de mensajes enviados
- ✅ Almacenamiento en memoria para debugging

### Uso
```typescript
constructor(
  @Inject(SQS_CLIENT) private readonly sqsClient: ISqsClient,
) {}

await this.sqsClient.sendMessage('queue-name', { data: 'value' });
```

### Nota
En producción, reemplazar `SqsClientMockService` con `SqsClientAwsService` que use `@aws-sdk/client-sqs`.

---

## 2. Idempotencia

### Archivos Creados
- `src/shared/infrastructure/idempotency/idempotency.service.ts` - Servicio
- `src/api/guards/idempotency.guard.ts` - Guard + Decorator

### Funcionalidades
- ✅ `IdempotencyService` con Redis para almacenar claves
- ✅ `@Idempotent('operation-name')` decorator
- ✅ `IdempotencyGuard` para proteger endpoints
- ✅ Header `X-Idempotency-Key` requerido
- ✅ TTL configurable (default: 24h)
- ✅ Respuesta con resultado previo si ya fue procesada

### Uso
```typescript
@Post()
@Idempotent('create-user')
@UseGuards(IdempotencyGuard)
async create(@Body() dto: CreateDto) {
  // ...
}
```

Cliente debe enviar:
```
X-Idempotency-Key: <uuid-unico>
```

---

## 3. Correlation ID

### Archivos Creados
- `src/api/interceptors/correlation-id.interceptor.ts` - Interceptor global

### Funcionalidades
- ✅ Genera `X-Correlation-ID` automáticamente (UUID v4)
- ✅ Lee header si el cliente lo envía
- ✅ Propaga en requests internas
- ✅ Devuelve en response header
- ✅ Disponible en `request.correlationId` para logging

### Uso Automático
Registrado globalmente en `ApiModule`. Todos los requests tienen correlation ID.

---

## 4. Circuit Breakers y HTTP Clients

### Archivos Creados
- `src/shared/infrastructure/http/circuit-breaker.service.ts` - Servicio de circuit breakers
- `src/shared/infrastructure/http/http-client-base.service.ts` - Cliente HTTP base
- `src/shared/infrastructure/http/erp-client.service.ts` - Cliente ERP
- `src/shared/infrastructure/http/wms-client.service.ts` - Cliente WMS

### Funcionalidades
- ✅ Circuit breakers con `opossum` library
- ✅ Estados: CLOSED, OPEN, HALF_OPEN
- ✅ Retry logic (max 3 intentos con backoff)
- ✅ Timeouts configurables
- ✅ Logging de eventos (open/close/failure)
- ✅ Clientes HTTP con circuit breaker integrado

### Configuración
```typescript
{
  timeout: 5000,              // 5s timeout
  errorThresholdPercentage: 50, // 50% de errores abre circuito
  resetTimeout: 30000,        // 30s antes de intentar cerrar
}
```

### Uso
```typescript
constructor(
  private readonly erpClient: ErpClientService,
) {}

const data = await this.erpClient.syncUser(userId, userData);
```

---

## 5. Logging Estructurado

### Archivos Creados
- `src/shared/infrastructure/logging/pino-logger.service.ts` - Logger con Pino
- `src/shared/infrastructure/logging/cloudwatch-logger.service.ts` - CloudWatch integration
- `src/api/interceptors/logging.interceptor.ts` - Interceptor global

### Funcionalidades
- ✅ Logging estructurado JSON con Pino
- ✅ Contexto automático: `correlation_id`, `user_id`, `timestamp`, `environment`
- ✅ Niveles: DEBUG, INFO, WARN, ERROR, FATAL
- ✅ Envío a AWS CloudWatch Logs (batch)
- ✅ Log de requests/responses automático
- ✅ Buffer con flush automático (cada 5s o 50 logs)

### Uso
```typescript
constructor(
  private readonly logger: PinoLoggerService,
) {
  this.logger.setContext('MyService');
}

this.logger.log({ message: 'User created', userId: '123' });
this.logger.error({ message: 'Error occurred', error: err.message });
```

### CloudWatch
Logs se envían a:
- Log Group: `/aws/ms-auth` (configurable)
- Log Stream: `application` (configurable)

---

## 6. Métricas de Performance

### Archivos Creados
- `src/shared/infrastructure/metrics/cloudwatch-metrics.service.ts` - Servicio de métricas
- `src/api/interceptors/metrics.interceptor.ts` - Interceptor global

### Funcionalidades
- ✅ Envío a AWS CloudWatch Metrics (batch)
- ✅ Métricas automáticas de HTTP:
  - `RequestDuration` (latencia en ms)
  - `RequestCount` (contador por endpoint/método/status)
  - `ErrorCount` (errores por endpoint/método/tipo)
- ✅ Métricas adicionales:
  - `DatabaseQueryDuration`
  - `CacheHitRate`
- ✅ Dimensiones: Endpoint, Method, StatusCode, Environment
- ✅ Flush automático cada 1 minuto o 20 métricas

### Uso
```typescript
await this.metricsService.recordDatabaseQueryDuration('findAll', 150);
await this.metricsService.recordCacheHitRate(true);
```

### CloudWatch
Métricas en namespace: `MS-Auth`

---

## 7. Observabilidad (OpenTelemetry + AWS X-Ray)

### Archivos Creados
- `src/tracing.ts` - Configuración de OpenTelemetry

### Funcionalidades
- ✅ Auto-instrumentación para:
  - NestJS
  - HTTP (requests/responses)
  - PostgreSQL (via Prisma)
  - Redis (ioredis)
- ✅ AWS X-Ray ID Generator
- ✅ AWS X-Ray Propagator
- ✅ Exportación a X-Ray via ADOT Collector
- ✅ Ignorar health checks en trazas

### Configuración
Agregar al inicio de `main.ts`:
```typescript
import './tracing';
```

Variables de entorno:
```env
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

### Nota
Requiere ADOT Collector corriendo para enviar trazas a AWS X-Ray.

---

## 8. Paginación

### Archivos Modificados/Creados
- `src/common/dto/pagination-query.dto.ts` - DTO de paginación
- `src/modules/users/domain/repositories/user.repository.interface.ts` - Interface actualizada
- `src/modules/users/infrastructure/persistence/prisma/user.repository.impl.ts` - Implementación
- `src/modules/users/application/use-cases/get-all-users.use-case.ts` - Use case actualizado
- `src/api/controllers/users.controller.ts` - Controller actualizado

### Funcionalidades
- ✅ Paginación con `limit` y `offset`
- ✅ Validación: limit max 100
- ✅ Respuesta incluye: `data`, `total`, `hasMore`
- ✅ Count total en paralelo con query de datos

### Uso
```bash
GET /api/user?limit=10&offset=0
```

Respuesta:
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### Migración de Base de Datos
- `prisma/migrations/20250125000001_add_performance_indexes/migration.sql`

Índices agregados:
- `idx_auths_email` - Login
- `idx_users_auth_id` - Foreign key
- `idx_users_role` - Authorization
- `idx_users_created_at` - Ordenamiento
- `idx_auths_created_at` - Ordenamiento

---

## 9. Tests Unitarios

### Archivos Creados
- `src/modules/users/domain/entities/user.entity.spec.ts` - Tests de entidad User
- `src/modules/auth/domain/entities/auth.entity.spec.ts` - Tests de entidad Auth
- `src/modules/users/application/use-cases/create-user.use-case.spec.ts` - Tests de use case
- `src/modules/auth/domain/services/password.service.spec.ts` - Tests de servicio de dominio

### Cobertura
- ✅ Entidades de dominio:
  - `User.create()`, `changeName()`, `changeRole()`, `isAdmin()`
  - `Auth.create()`, `changePassword()`
- ✅ Use cases:
  - `CreateUserUseCase.execute()`
  - Validación de comandos
  - Propagación de transacciones
- ✅ Servicios de dominio:
  - `PasswordService.hash()`, `compare()`, `validate()`

### Ejecutar Tests
```bash
npm run test                  # Todos los tests unitarios
npm run test:watch            # Watch mode
npm run test:cov              # Con coverage
npm run test -- user.entity   # Tests específicos
```

---

## 10. Variables de Entorno

### Nuevas Variables (`.env`)

```env
# HTTP Clients
ERP_API_URL=http://localhost:3001/api
WMS_API_URL=http://localhost:3002/api

# AWS CloudWatch
AWS_REGION=us-east-1
AWS_CLOUDWATCH_LOG_GROUP=/aws/ms-auth
AWS_CLOUDWATCH_LOG_STREAM=application

# OpenTelemetry (opcional en desarrollo)
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces

# Node Environment
NODE_ENV=development
```

---

## 📊 Resumen de Archivos

### Nuevos Archivos Creados: **34**

**Mensajería (2):**
- `sqs-client.interface.ts`
- `sqs-client-mock.service.ts`

**Idempotencia (2):**
- `idempotency.service.ts`
- `idempotency.guard.ts`

**Interceptors (3):**
- `correlation-id.interceptor.ts`
- `logging.interceptor.ts`
- `metrics.interceptor.ts`

**HTTP Clients (4):**
- `circuit-breaker.service.ts`
- `http-client-base.service.ts`
- `erp-client.service.ts`
- `wms-client.service.ts`

**Logging (2):**
- `pino-logger.service.ts`
- `cloudwatch-logger.service.ts`

**Métricas (1):**
- `cloudwatch-metrics.service.ts`

**Tracing (1):**
- `tracing.ts`

**Paginación (1):**
- `pagination-query.dto.ts`

**Migración DB (1):**
- `20250125000001_add_performance_indexes/migration.sql`

**Tests Unitarios (4):**
- `user.entity.spec.ts`
- `auth.entity.spec.ts`
- `create-user.use-case.spec.ts`
- `password.service.spec.ts`

**Documentación (1):**
- `INFRAESTRUCTURA_AGREGADA.md`

**Archivos Modificados: 12**
- `config/envs.ts`
- `shared/shared.module.ts`
- `api/api.module.ts`
- `main.ts`
- `user.repository.interface.ts`
- `user.repository.impl.ts`
- `get-all-users.use-case.ts`
- `users.controller.ts`
- `package.json`

---

## 🎯 Arquitectura DDD + Hexagonal Mantenida

### ✅ Separación de Capas Respetada

- **Domain**: Sin dependencias de infraestructura
  - Interfaces de repositorio (puertos)
  - Entidades puras
  - Excepciones de dominio
  - Servicios de dominio

- **Application**: Lógica de orquestación
  - Casos de uso
  - DTOs
  - Sin referencias a Prisma, Redis, AWS

- **Infrastructure**: Detalles técnicos
  - Implementaciones de repositorios (adaptadores)
  - Servicios de logging, metrics, messaging
  - HTTP clients
  - Circuit breakers
  - Prisma, Redis, AWS SDK

- **API**: Capa de presentación
  - Controllers delgados
  - Guards
  - Interceptors
  - Decorators

### ✅ Principios Mantenidos

- **Inversión de Dependencias**: Dominio no depende de infraestructura
- **Single Responsibility**: Cada servicio tiene una única responsabilidad
- **Open/Closed**: Fácil agregar nuevas implementaciones
- **Interface Segregation**: Interfaces específicas y acotadas

---

## 🚀 Próximos Pasos

### Para Producción

1. **SQS Real**:
   - Crear `SqsClientAwsService` usando `@aws-sdk/client-sqs`
   - Reemplazar el mock en `SharedModule`

2. **Credenciales AWS**:
   - Configurar `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`
   - O usar IAM Roles (recomendado en EC2/ECS)

3. **ADOT Collector**:
   - Desplegar AWS Distro for OpenTelemetry Collector
   - Configurar para exportar a X-Ray

4. **Aplicar Migraciones**:
   ```bash
   npx prisma migrate deploy
   ```

5. **Ejecutar Tests**:
   ```bash
   npm run test
   npm run test:e2e
   ```

6. **Monitoreo**:
   - Verificar logs en CloudWatch Logs
   - Verificar métricas en CloudWatch Metrics
   - Verificar trazas en AWS X-Ray

---

## 📝 Notas Importantes

1. **Sin Dependencias de Dominio**: Todo el código de infraestructura está en la capa correspondiente. El dominio permanece puro.

2. **Performance**: Los servicios de CloudWatch usan buffers y batch para minimizar llamadas a AWS y reducir costos.

3. **Graceful Shutdown**: OpenTelemetry y CloudWatch services hacen flush antes de terminar.

4. **Desarrollo vs Producción**: CloudWatch y OpenTelemetry solo se activan en producción o con variables de entorno específicas.

5. **Tests Actualizados**: Los tests no dependen de servicios de AWS y funcionan con mocks.

---

**Proyecto completamente modernizado manteniendo arquitectura DDD + Hexagonal** ✅

