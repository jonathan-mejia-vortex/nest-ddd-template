# Arquitectura DDD + Hexagonal - Microservicio Auth

## 📋 Introducción

Este microservicio implementa una **arquitectura DDD (Domain-Driven Design) + Hexagonal**, siguiendo las mejores prácticas de desarrollo empresarial. La arquitectura está diseñada para ser escalable, mantenible y testeable.

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
│   │   │       └── prisma/
│   │   │           └── user.repository.impl.ts   # Adaptador Prisma (implementación)
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
│       │       └── prisma/
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
│   │       ├── prisma.service.ts          # Singleton de Prisma
│   │       └── transaction.service.ts     # Manejo de transacciones
│   └── shared.module.ts
│
├── common/                           # Utilidades comunes cross-cutting
│   ├── dto/
│   │   ├── pagination.dto.ts
│   │   └── response.interceptor.ts
│   └── types.ts                     # Tipos y enums globales (ROLE)
│
├── api/                              # Capa de API (controllers y guards)
│   ├── controllers/
│   │   ├── users.controller.ts      # Controller delgado (solo delega)
│   │   └── auth.controller.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts        # Guard custom JWT (sin Passport)
│   │   ├── roles.guard.ts
│   │   └── roles.decorator.ts
│   ├── decorators/
│   │   └── current-user.decorator.ts # @CurrentUser() decorator
│   └── api.module.ts
│
├── config/
│   └── envs.ts
├── prisma/
│   └── schema.prisma                # Schema de base de datos
└── app.module.ts
```

## 🎯 Principios Arquitectónicos

### 1. **Separación de Capas**

El proyecto está organizado en capas con responsabilidades bien definidas:

- **Dominio**: Lógica de negocio pura, sin dependencias de frameworks ni Prisma
- **Aplicación**: Casos de uso que orquestan la lógica de dominio
- **Infraestructura**: Implementaciones técnicas (Prisma, Redis, APIs externas)
- **API**: Punto de entrada HTTP (controllers delgados, guards custom)
- **Common**: Utilidades transversales (DTOs compartidos, tipos globales, interceptors)

### 2. **Patrón Hexagonal (Puertos y Adaptadores)**

La arquitectura hexagonal permite la independencia del dominio respecto a la infraestructura:

```typescript
// Puerto (en dominio) - Define QUÉ se necesita
export interface IUserRepository {
  create(user: User, transaction?: any): Promise<User>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
}

// Adaptador (en infraestructura) - Define CÓMO se implementa
@Injectable()
export class UserRepositoryImpl implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: User, transaction?: any): Promise<User> {
    const prismaClient = transaction || this.prisma;
    
    const created = await prismaClient.user.create({
      data: {
        id: user.id,
        name: user.name,
        authId: user.authId,
        role: user.role,
      },
    });
    
    return User.fromPersistence(created);
  }
}
```

### 3. **Entidades de Dominio Ricas**

Las entidades contienen comportamiento y reglas de negocio, no son simples contenedores de datos:

```typescript
export class User {
  constructor(
    private readonly _id: string,
    private _name: string,
    private readonly _authId: string,
    private _role: UserRole,
  ) {}

  // Comportamiento del dominio
  changeName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('El nombre no puede estar vacío');
    }
    this._name = newName;
  }

  changeRole(newRole: UserRole): void {
    this._role = newRole;
  }

  isAdmin(): boolean {
    return this._role === UserRole.ADMIN;
  }

  // Factory method
  static create(id: string, name: string, authId: string, role: UserRole): User {
    if (!id || !name || !authId) {
      throw new Error('Los campos id, name y authId son requeridos');
    }
    return new User(id, name, authId, role);
  }
}
```

### 4. **Casos de Uso**

Cada operación de negocio se encapsula en un caso de uso específico:

```typescript
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: CreateUserCommand, transaction?: any): Promise<User> {
    // Lógica de aplicación clara y específica
    const user = User.create(
      uuidv4(),
      command.name,
      command.authId,
      command.role || UserRole.USER,
    );
    
    return await this.userRepository.create(user, transaction);
  }
}
```

### 5. **Excepciones de Dominio**

Los errores de negocio se modelan como excepciones específicas del dominio:

```typescript
// Excepción base de dominio
export abstract class DomainException extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Excepción específica
export class UserNotFoundException extends DomainException {
  constructor(id?: string) {
    super(
      'USER_NOT_FOUND',
      id ? `Usuario con id ${id} no encontrado` : 'Usuario no encontrado',
    );
  }
}
```

### 6. **Servicios de Dominio**

Para lógica que no pertenece a una entidad específica:

```typescript
@Injectable()
export class PasswordService {
  private readonly SALT_ROUNDS = 10;

  async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  validate(password: string): boolean {
    return password && password.length >= 6;
  }
}
```

## 🔄 Flujo de una Petición

```
1. HTTP Request
   ↓
2. Controller (API Layer)
   ├─ Validación de DTO
   ├─ Delegación a Caso de Uso
   ↓
3. Use Case (Application Layer)
   ├─ Orquestación de lógica
   ├─ Llamadas a repositorios
   ├─ Llamadas a entidades de dominio
   ↓
4. Repository (Infrastructure Layer)
   ├─ Implementación con Prisma
   ├─ Conversión entre entidades de dominio y persistencia
   ↓
5. Database
   ↓
6. Response (entidad de dominio → DTO → JSON)
```

## 💡 Ejemplo Completo: Registro de Usuario

### 1. Controller (API Layer)

```typescript
@Controller('auth')
export class AuthController {
  constructor(
    private readonly createAuthUseCase: CreateAuthUseCase,
    private readonly transactionService: TransactionService,
  ) {}

  @Post('/signup')
  async create(@Body() createAuthDto: CreateAuthDto) {
    return await this.transactionService.runInTransaction(async (tx) => {
      await this.createAuthUseCase.execute(
        {
          email: createAuthDto.email,
          password: createAuthDto.password,
          name: createAuthDto.name,
          role: createAuthDto.role,
        },
        tx,
      );
      return { message: 'Usuario registrado correctamente' };
    });
  }
}
```

### 2. Use Case (Application Layer)

```typescript
@Injectable()
export class CreateAuthUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly passwordService: PasswordService,
    private readonly createUserUseCase: CreateUserUseCase,
  ) {}

  async execute(command: CreateAuthCommand, transaction?: any): Promise<Auth> {
    // Validación
    if (!this.passwordService.validate(command.password)) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // Hash del password (servicio de dominio)
    const hashedPassword = await this.passwordService.hash(command.password);

    // Creación de entidad de dominio
    const auth = Auth.create(uuidv4(), command.email, hashedPassword);

    // Persistencia
    const createdAuth = await this.authRepository.create(auth, transaction);

    // Creación del usuario asociado
    await this.createUserUseCase.execute(
      {
        name: command.name,
        authId: createdAuth.id,
        role: command.role || UserRole.USER,
      },
      transaction,
    );

    return createdAuth;
  }
}
```

### 3. Repository (Infrastructure Layer)

```typescript
@Injectable()
export class AuthRepositoryImpl implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(auth: Auth, transaction?: any): Promise<Auth> {
    try {
      const prismaClient = transaction || this.prisma;

      // Conversión de dominio a persistencia
      const created = await prismaClient.auth.create({
        data: {
          id: auth.id,
          email: auth.email,
          password: auth.password,
        },
      });

      // Conversión de persistencia a dominio
      return Auth.fromPersistence({
        id: created.id,
        email: created.email,
        password: created.password,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    } catch (error) {
      // Prisma unique constraint error
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new EmailAlreadyExistsException(auth.email);
      }
      throw new Error(`Error al crear auth: ${error.message}`);
    }
  }
}
```

## 🏛️ Características Implementadas

### Infraestructura

- ✅ **Prisma Client**: Type-safe database access
- ✅ **PrismaService**: Singleton con lifecycle hooks
- ✅ **Connection Pooling**: Automático con Prisma
- ✅ **Migraciones con Prisma**: Control de cambios de base de datos
- ✅ **Índices Críticos**: Optimización de queries (authId, email, role)
- ✅ **Redis Cache**: Sistema de caché configurado
- ✅ **TransactionService**: Manejo centralizado con prisma.$transaction()
- ✅ **DomainExceptionFilter**: Mapeo de excepciones de dominio a HTTP
- ✅ **ResponseInterceptor**: Formateo consistente de respuestas HTTP
- ✅ **PaginationDTO**: DTO compartido para paginación

### Cross-Cutting Concerns

- ✅ **Types & Enums**: Tipos compartidos (ROLE)
- ✅ **Interceptors**: Response interceptor para formato unificado
- ✅ **DTOs Comunes**: Pagination y otros DTOs reutilizables

### Seguridad

- ✅ **JWT Authentication**: Autenticación basada en tokens con @nestjs/jwt
- ✅ **Password Hashing**: bcrypt con salt rounds configurables
- ✅ **Custom Guards**: JwtAuthGuard (sin Passport), RolesGuard
- ✅ **@CurrentUser() Decorator**: Acceso al usuario autenticado
- ✅ **Validation**: class-validator en todos los DTOs

### Bounded Contexts

- ✅ **Users**: Gestión de usuarios del sistema
- ✅ **Auth**: Autenticación y autorización

## 🚀 Uso de la Arquitectura

### Variables de Entorno

```env
# Base de datos (Prisma)
DATABASE_URL="postgresql://postgres:password@localhost:5432/auth_db?schema=public"

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Servidor
PORT=3000
NODE_ENV=development
```

### Comandos

```bash
# Desarrollo
npm run start:dev

# Prisma
npm run prisma:generate              # Generar cliente Prisma
npm run prisma:push                  # Push schema (dev)
npx prisma migrate dev --name init   # Crear migración
npm run prisma:migrate:deploy        # Aplicar migraciones (prod)
npm run prisma:studio                # Abrir GUI

# Tests
npm run test
npm run test:e2e

# Build
npm run build
```

## 🎓 Beneficios de esta Arquitectura

### 1. **Testabilidad**
- Lógica de dominio pura, sin dependencias de frameworks
- Fácil crear mocks de repositorios
- Tests unitarios rápidos y confiables

### 2. **Mantenibilidad**
- Código organizado por responsabilidades
- Fácil localizar y modificar funcionalidad
- Cambios aislados en capas específicas

### 3. **Escalabilidad**
- Fácil agregar nuevos bounded contexts
- Infraestructura preparada para crecer
- Separación clara de concerns

### 4. **Flexibilidad**
- Cambiar de ORM sin afectar el dominio
- Cambiar de framework sin afectar la lógica
- Agregar nuevos adaptadores fácilmente

### 5. **Expresividad**
- El código refleja el lenguaje del negocio
- Entidades con comportamiento significativo
- Casos de uso claros y específicos

### 6. **Performance**
- Pool de conexiones optimizado
- Índices de base de datos bien diseñados
- Sistema de caché implementado

## 🔮 Extensibilidad

La arquitectura está preparada para crecer con nuevos bounded contexts:

```
src/modules/
├── users/        ✅ Implementado
├── auth/         ✅ Implementado
├── accounts/     🔜 Futuro
├── balance/      🔜 Futuro
├── discounts/    🔜 Futuro
├── pickup/       🔜 Futuro
└── billings/     🔜 Futuro
```

Cada nuevo contexto seguirá la misma estructura de capas (domain/application/infrastructure).

## 📚 Principios SOLID

### Single Responsibility
Cada clase tiene una única razón para cambiar.

### Open/Closed
Abierto para extensión (nuevos casos de uso), cerrado para modificación.

### Liskov Substitution
Las interfaces de repositorio son intercambiables.

### Interface Segregation
Interfaces específicas por dominio.

### Dependency Inversion
Las capas superiores dependen de abstracciones, no de implementaciones.

## 📚 Documentación Adicional

- **`docs/CONFIGURACION.md`**: Guía completa de configuración de todas las características
- **`docs/PATRONES.md`**: Patrones de diseño implementados con ejemplos
- **`README.md`**: Guía rápida de inicio y características principales

## 🔗 Referencias

- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [NestJS Documentation](https://docs.nestjs.com/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Idempotency Keys](https://brandur.org/idempotency-keys)

---

**Esta arquitectura proporciona una base sólida y profesional para un microservicio escalable, mantenible y de alta calidad.**
