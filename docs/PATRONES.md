# Patrones Implementados

Guía de los patrones de diseño y arquitectónicos implementados en el microservicio.

---

## 📋 Índice

1. [Idempotencia](#idempotencia)
2. [Circuit Breaker](#circuit-breaker)
3. [Correlation ID](#correlation-id)
4. [Repository Pattern (Puertos y Adaptadores)](#repository-pattern)
5. [Use Cases](#use-cases)
6. [Domain Events (Preparado)](#domain-events)

---

## Idempotencia

### ¿Qué es?

Garantiza que una operación ejecutada múltiples veces con los mismos parámetros produce el mismo resultado que una única ejecución.

### Implementación

**Guard + Decorator**:
```typescript
@Post()
@Idempotent('create-order')
@UseGuards(IdempotencyGuard)
async create(@Body() dto: CreateOrderDto) {
  // Si se envía el mismo X-Idempotency-Key dos veces,
  // la segunda request devuelve el resultado de la primera
  return await this.createOrderUseCase.execute(dto);
}
```

**Service (Redis-backed)**:
```typescript
@Injectable()
export class IdempotencyService {
  async isProcessed(key: string): Promise<boolean>;
  async markAsProcessed(key: string, result?: any, ttl?: number): Promise<void>;
  async getProcessedResult<T>(key: string): Promise<T | null>;
}
```

### Casos de Uso

- ✅ Creación de usuarios/órdenes
- ✅ Pagos
- ✅ Operaciones críticas que no deben duplicarse
- ✅ Webhooks que pueden reintentar

### Ejemplo Completo

```typescript
// Controller
@Post('/payment')
@Idempotent('process-payment')
@UseGuards(IdempotencyGuard)
async processPayment(
  @Body() dto: PaymentDto,
  @Request() req,
) {
  const result = await this.paymentService.process(dto);
  
  // Marcar como procesado con resultado
  await this.idempotencyService.markAsProcessed(
    req.idempotencyKey,
    result,
  );
  
  return result;
}
```

---

## Circuit Breaker

### ¿Qué es?

Previene cascadas de fallos deteniendo llamadas a servicios que están fallando, permitiendo recuperación.

### Estados

```
CLOSED (normal)
    ↓ (muchos errores)
OPEN (todas las requests fallan inmediato)
    ↓ (después de timeout)
HALF_OPEN (permite requests de prueba)
    ↓ (si funcionan)
CLOSED
```

### Implementación

**Cliente HTTP Base**:
```typescript
export abstract class HttpClientBase {
  protected readonly circuitBreaker: CircuitBreaker;
  
  constructor(
    protected readonly config: HttpClientConfig,
    protected readonly circuitBreakerService: CircuitBreakerService,
  ) {
    this.circuitBreaker = this.circuitBreakerService.create(
      'client-name',
      this.executeRequest.bind(this),
    );
  }
}
```

**Uso**:
```typescript
@Injectable()
export class ErpClientService extends HttpClientBase {
  async syncUser(userId: string, data: any): Promise<any> {
    // Automáticamente protegido con circuit breaker
    return this.post(`/users/${userId}/sync`, data);
  }
}
```

### Configuración

```typescript
{
  timeout: 5000,                  // Request timeout
  errorThresholdPercentage: 50,   // % errores para abrir
  resetTimeout: 30000,            // Tiempo antes de half-open
}
```

### Beneficios

- ✅ Previene cascadas de fallos
- ✅ Fail-fast cuando servicio está caído
- ✅ Recuperación automática
- ✅ Métricas de salud del circuito

---

## Correlation ID

### ¿Qué es?

ID único que se propaga a través de todos los servicios y logs para rastrear una request end-to-end.

### Implementación

**Interceptor Global** (automático):
```typescript
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const correlationId = request.headers['x-correlation-id'] || uuidv4();
    
    request.correlationId = correlationId;
    response.setHeader('X-Correlation-ID', correlationId);
    
    return next.handle();
  }
}
```

### Uso en Logging

```typescript
// El logger automáticamente incluye correlation_id
this.logger.log({
  message: 'Processing order',
  orderId,
  // correlation_id se agrega automáticamente
});
```

### Propagación a Servicios Externos

```typescript
async callExternalService(data: any, req: Request) {
  return this.httpClient.post('/endpoint', data, {
    headers: {
      'X-Correlation-ID': req.correlationId,
    },
  });
}
```

### Beneficios

- ✅ Rastreo de requests en logs
- ✅ Debugging de issues en producción
- ✅ Correlación entre múltiples servicios
- ✅ Análisis de latencia end-to-end

---

## Repository Pattern

### Arquitectura Hexagonal (Puertos y Adaptadores)

**Puerto** (en dominio):
```typescript
// domain/repositories/user.repository.interface.ts
export interface IUserRepository {
  create(user: User, transaction?: any): Promise<User>;
  findById(id: string): Promise<User | null>;
  findAll(options?: PaginationOptions): Promise<PaginatedResult<User>>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
```

**Adaptador** (en infraestructura):
```typescript
// infrastructure/persistence/prisma/user.repository.impl.ts
@Injectable()
export class UserRepositoryImpl implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}
  
  async create(user: User, transaction?: any): Promise<User> {
    const prismaClient = transaction || this.prisma;
    
    const created = await prismaClient.user.create({
      data: {
        id: user.id,
        name: user.name,
        // ...
      },
    });
    
    // Convertir de persistencia a dominio
    return User.fromPersistence(created);
  }
}
```

**Registro en Módulo**:
```typescript
@Module({
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepositoryImpl,
    },
  ],
})
export class UserModule {}
```

### Beneficios

- ✅ Dominio independiente de Prisma
- ✅ Fácil cambiar de ORM sin tocar dominio
- ✅ Testeable (mock del repositorio)
- ✅ Inversión de dependencias

---

## Use Cases

### Patrón de Casos de Uso

Cada operación de negocio = un caso de uso específico.

**Estructura**:
```typescript
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}
  
  async execute(command: CreateUserCommand, transaction?: any): Promise<User> {
    // 1. Validaciones de negocio
    // 2. Crear entidad de dominio
    const user = User.create(uuidv4(), command.name, command.authId, command.role);
    
    // 3. Persistir
    return await this.userRepository.create(user, transaction);
  }
}
```

**Comando**:
```typescript
interface CreateUserCommand {
  name: string;
  authId: string;
  role?: UserRole;
}
```

### Beneficios

- ✅ Lógica de negocio centralizada
- ✅ Fácil de testear (sin framework)
- ✅ Reutilizable desde controllers, eventos, cron jobs
- ✅ Transacciones manejadas consistentemente

---

## Domain Events (Preparado)

### Infraestructura Lista

El proyecto está preparado para implementar eventos de dominio con el `SQS_CLIENT`:

```typescript
// Entidad emite evento
class User {
  private domainEvents: DomainEvent[] = [];
  
  create(...) {
    // ...
    this.domainEvents.push(new UserCreatedEvent(this.id, this.email));
  }
  
  getDomainEvents(): DomainEvent[] {
    return this.domainEvents;
  }
  
  clearEvents(): void {
    this.domainEvents = [];
  }
}

// Use case publica eventos
async execute(command: CreateUserCommand) {
  const user = User.create(...);
  const created = await this.userRepository.create(user);
  
  // Publicar eventos
  for (const event of created.getDomainEvents()) {
    await this.sqsClient.sendMessage('domain-events', event);
  }
  
  created.clearEvents();
  return created;
}
```

### Patrón Event Sourcing (Futuro)

La arquitectura actual facilita migrar a Event Sourcing si es necesario:
1. Eventos ya desacoplados
2. Use cases como command handlers
3. SQS como event bus

---

## 🎯 Resumen de Patrones

| Patrón | Ubicación | Beneficio Principal |
|--------|-----------|---------------------|
| **Idempotencia** | API Layer | Prevenir duplicados |
| **Circuit Breaker** | Infrastructure | Resiliencia |
| **Correlation ID** | API Layer | Observabilidad |
| **Repository** | Domain + Infra | Inversión de dependencias |
| **Use Cases** | Application | Lógica de negocio clara |
| **Domain Events** | Domain (preparado) | Desacoplamiento |

---

## 📚 Lecturas Recomendadas

- [Circuit Breaker Pattern - Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Idempotency Keys](https://brandur.org/idempotency-keys)
- [Correlation IDs](https://hilton.org.uk/blog/microservices-correlation-id)
- [DDD Aggregates](https://martinfowler.com/bliki/DDD_Aggregate.html)

---

**Estos patrones forman la base de una arquitectura empresarial robusta y escalable.**

