# Arquitectura DDD + Hexagonal - Microservicio Auth

## 📋 Resumen del Refactor

Este proyecto ha sido refactorizado de un patrón CRUD anémico a una **arquitectura DDD (Domain-Driven Design) + Hexagonal**, siguiendo las mejores prácticas de desarrollo empresarial.

## 🏗️ Estructura del Proyecto

```
src/
├── modules/                          # Bounded Contexts
│   ├── users/
│   │   ├── domain/                  # Capa de Dominio (lógica de negocio pura)
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts  # Entidad de dominio (clase TypeScript pura)
│   │   │   ├── exceptions/
│   │   │   │   ├── user-not-found.exception.ts
│   │   │   │   └── user-creation-failed.exception.ts
│   │   │   └── repositories/
│   │   │       └── user.repository.interface.ts  # Puerto (interfaz)
│   │   ├── application/              # Capa de Aplicación (casos de uso)
│   │   │   ├── use-cases/
│   │   │   │   ├── create-user.use-case.ts
│   │   │   │   ├── update-user.use-case.ts
│   │   │   │   ├── get-all-users.use-case.ts
│   │   │   │   └── get-user-by-id.use-case.ts
│   │   │   └── dto/
│   │   │       └── update-user.dto.ts
│   │   ├── infrastructure/           # Capa de Infraestructura (detalles técnicos)
│   │   │   └── persistence/
│   │   │       └── sequelize/
│   │   │           ├── user.sequelize.entity.ts  # Entidad Sequelize
│   │   │           └── user.repository.impl.ts   # Adaptador (implementación)
│   │   └── user.module.ts           # Módulo de NestJS
│   │
│   └── auth/
│       ├── domain/
│       │   ├── entities/
│       │   │   └── auth.entity.ts
│       │   ├── services/
│       │   │   └── password.service.ts  # Servicio de dominio
│       │   ├── exceptions/
│       │   │   ├── auth-not-found.exception.ts
│       │   │   ├── invalid-credentials.exception.ts
│       │   │   └── email-already-exists.exception.ts
│       │   └── repositories/
│       │       └── auth.repository.interface.ts
│       ├── application/
│       │   ├── use-cases/
│       │   │   ├── create-auth.use-case.ts
│       │   │   ├── validate-user.use-case.ts
│       │   │   ├── login.use-case.ts
│       │   │   └── get-auth-by-id.use-case.ts
│       │   └── dto/
│       │       ├── create-auth.dto.ts
│       │       └── login.dto.ts
│       ├── infrastructure/
│       │   └── persistence/
│       │       └── sequelize/
│       │           ├── auth.sequelize.entity.ts
│       │           └── auth.repository.impl.ts
│       └── auth.module.ts
│
├── shared/                           # Infraestructura compartida
│   ├── domain/
│   │   └── exceptions/
│   │       ├── domain.exception.ts
│   │       └── not-found.exception.ts
│   ├── application/
│   │   └── filters/
│   │       └── domain-exception.filter.ts
│   ├── infrastructure/
│   │   ├── cache/
│   │   │   └── redis.module.ts
│   │   └── persistence/
│   │       └── transaction.service.ts
│   └── shared.module.ts
│
├── api/                              # Capa de API (controllers y guards)
│   ├── controllers/
│   │   ├── users.controller.ts      # Controller delgado (solo delega)
│   │   └── auth.controller.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── local-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── roles.decorator.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   └── api.module.ts
│
├── config/
│   └── envs.ts
├── db/
│   └── db.module.ts
└── app.module.ts
```

## 🎯 Principios Aplicados

### 1. **Separación de Capas**

- **Dominio**: Lógica de negocio pura, sin dependencias de frameworks
- **Aplicación**: Casos de uso que orquestan la lógica de dominio
- **Infraestructura**: Implementaciones técnicas (DB, caché, APIs externas)
- **API**: Punto de entrada HTTP (controllers delgados)

### 2. **Patrón Hexagonal (Puertos y Adaptadores)**

```typescript
// Puerto (en dominio)
export interface IUserRepository {
  create(user: User, transaction?: any): Promise<User>;
  findById(id: string): Promise<User | null>;
}

// Adaptador (en infraestructura)
@Injectable()
export class UserRepositoryImpl implements IUserRepository {
  // Implementación con Sequelize
}
```

### 3. **Entidades de Dominio Ricas**

Las entidades tienen comportamiento, no son solo DTOs:

```typescript
export class User {
  changeName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('El nombre no puede estar vacío');
    }
    this._name = newName;
  }

  isAdmin(): boolean {
    return this._role === UserRole.ADMIN;
  }
}
```

### 4. **Casos de Uso**

Cada operación de negocio es un caso de uso específico:

```typescript
@Injectable()
export class CreateUserUseCase {
  async execute(command: CreateUserCommand, transaction?: any): Promise<User> {
    const user = User.create(uuidv4(), command.name, command.authId, command.role);
    return await this.userRepository.create(user, transaction);
  }
}
```

### 5. **Excepciones de Dominio**

Errores específicos del dominio en lugar de HTTP exceptions:

```typescript
export class UserNotFoundException extends DomainException {
  constructor(id?: string) {
    super('USER_NOT_FOUND', `Usuario con id ${id} no encontrado`);
  }
}
```

## 🔧 Mejoras Implementadas (Prioridad P0)

### ✅ Arquitectura

- [x] Separación en capas (domain/application/infrastructure)
- [x] Entidades de dominio puras (sin decoradores Sequelize)
- [x] Interfaces de repositorio (puertos)
- [x] Implementaciones de repositorio (adaptadores)
- [x] Casos de uso para lógica de aplicación
- [x] Controllers delgados (solo delegación)

### ✅ Infraestructura

- [x] Pool de conexiones de DB optimizado
- [x] Migraciones versionadas con Sequelize CLI
- [x] Índices críticos para performance
- [x] Redis configurado para caché
- [x] TransactionService para manejo de transacciones
- [x] DomainExceptionFilter para mapeo de errores

### ✅ Dependencias

- [x] `@nestjs/cache-manager`: Gestión de caché
- [x] `cache-manager-redis-yet`: Store de Redis
- [x] `ioredis`: Cliente de Redis
- [x] `uuid`: Generación de IDs
- [x] Scripts de migración en package.json

## 🚀 Cómo Usar

### Comandos Disponibles

```bash
# Desarrollo
npm run start:dev

# Migraciones
npm run migration:generate -- nombre-migracion
npm run migration:run
npm run migration:undo

# Sync de base de datos (solo desarrollo)
npm run sync:alter
npm run sync:force

# Tests
npm run test
npm run test:e2e
```

### Variables de Entorno

Agregar al `.env`:

```env
# Base de datos existentes
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=user
DB_PASSWORD=password
DB_DATABASE=auth_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Redis (nuevas)
REDIS_HOST=localhost
REDIS_PORT=6379

# Servidor
PORT=3000
```

### Ejemplo de Uso de Casos de Uso

```typescript
// En un controller
@Post('/signup')
async create(@Body() createAuthDto: CreateAuthDto) {
  return await this.transactionService.executeInTransaction(async (t) => {
    await this.createAuthUseCase.execute(
      {
        email: createAuthDto.email,
        password: createAuthDto.password,
        name: createAuthDto.name,
        role: createAuthDto.role,
      },
      { transaction: t },
    );
    return { message: 'Usuario registrado correctamente' };
  });
}
```

## 📊 Comparación: Antes vs Después

### Antes (Patrón CRUD Anémico)

```typescript
// Controller gordo
@Post('/signup')
async create(@Body() createAuthDto: CreateAuthDto) {
  await this.sequelize.transaction(async (t) => {
    const transactionHost = { transaction: t };
    return await this.authService.create(createAuthDto, transactionHost);
  });
}

// Service con lógica mezclada
async create(createAuthDto: CreateAuthDto, transactionHost: TransactionHost) {
  const password = await this.hashPassword(createAuthDto.password);
  const auth = await this.repository.create(createAuthDto.email, password, transactionHost);
  await this.userService.create(createAuthDto.name, auth.id, transactionHost);
}

// Repository que lanza HTTP exceptions
async create(email: string, password: string, transactionHost: TransactionHost) {
  try {
    return await this.authRepository.create({ email, password }, transactionHost);
  } catch (error) {
    throw new HttpException('EMAIL_MUST_BE_UNIQUE', 400);
  }
}
```

### Después (DDD + Hexagonal)

```typescript
// Controller delgado
@Post('/signup')
async create(@Body() createAuthDto: CreateAuthDto) {
  return await this.transactionService.executeInTransaction(async (t) => {
    await this.createAuthUseCase.execute(
      {
        email: createAuthDto.email,
        password: createAuthDto.password,
        name: createAuthDto.name,
        role: createAuthDto.role,
      },
      { transaction: t },
    );
    return { message: 'Usuario registrado correctamente' };
  });
}

// Caso de uso con lógica clara
async execute(command: CreateAuthCommand, transaction?: any): Promise<Auth> {
  if (!this.passwordService.validate(command.password)) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }
  const hashedPassword = await this.passwordService.hash(command.password);
  const auth = Auth.create(uuidv4(), command.email, hashedPassword);
  const createdAuth = await this.authRepository.create(auth, transaction);
  await this.createUserUseCase.execute(createUserCommand, transaction);
  return createdAuth;
}

// Repository que lanza excepciones de dominio
async create(auth: Auth, transaction?: any): Promise<Auth> {
  try {
    const created = await this.authModel.create({ ... }, transaction);
    return Auth.fromPersistence(created);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new EmailAlreadyExistsException(auth.email);
    }
    throw new Error(`Error al crear auth: ${error.message}`);
  }
}
```

## 🎓 Beneficios de la Nueva Arquitectura

1. **Testabilidad**: Lógica de dominio pura, fácil de testear sin frameworks
2. **Mantenibilidad**: Código organizado por responsabilidades claras
3. **Escalabilidad**: Fácil agregar nuevos bounded contexts
4. **Flexibilidad**: Cambiar infraestructura (DB, caché) sin afectar dominio
5. **Expresividad**: El código refleja el lenguaje del negocio
6. **Performance**: Pool de conexiones, índices y caché optimizados

## 🔮 Próximos Pasos (Prioridad P1)

- [ ] Implementar módulo SQS para eventos de dominio
- [ ] Agregar idempotencia en endpoints críticos
- [ ] Mejorar logging con correlation_id
- [ ] Migrar a Fastify para mejor performance
- [ ] Implementar paginación en listados
- [ ] Crear módulos de bounded contexts (accounts, balance, etc.)

## 📚 Referencias

- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

**Nota**: Este refactor establece las bases para un microservicio escalable y mantenible. La arquitectura está preparada para crecer con nuevos bounded contexts y funcionalidades sin comprometer la calidad del código.

