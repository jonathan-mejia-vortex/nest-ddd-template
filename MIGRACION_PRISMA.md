# 🚀 Migración Completada: Sequelize → Prisma + Auth Custom

## 📋 Resumen del Refactor

Este documento detalla la migración completa del microservicio de autenticación desde **Sequelize + Passport** hacia **Prisma + Auth Custom**, manteniendo la arquitectura **DDD + Hexagonal**.

---

## ✅ Cambios Implementados

### 1. **Prisma ORM** (reemplazó Sequelize)

#### ✨ Nuevos Archivos

**Schema de Prisma:**
- `prisma/schema.prisma` - Definición de modelos (Auth, User)

**Servicio de Prisma:**
- `src/shared/infrastructure/persistence/prisma.service.ts` - Singleton con lifecycle hooks

**Repositorios con Prisma:**
- `src/modules/users/infrastructure/persistence/prisma/user.repository.impl.ts`
- `src/modules/auth/infrastructure/persistence/prisma/auth.repository.impl.ts`

**TransactionService actualizado:**
- `src/shared/infrastructure/persistence/transaction.service.ts` - Usa `prisma.$transaction()`

#### 🗑️ Archivos Eliminados

```bash
src/db/                                    # Módulo de Sequelize
src/modules/users/infrastructure/persistence/sequelize/
src/modules/auth/infrastructure/persistence/sequelize/
migrations/                                # Migraciones de Sequelize
.sequelizerc                              # Configuración de Sequelize CLI
```

---

### 2. **Autenticación Custom** (sin Passport)

#### ✨ Nuevos Archivos

**Guards Custom:**
- `src/api/guards/jwt-auth.guard.ts` - Valida JWT manualmente usando `@nestjs/jwt`

**Decorators:**
- `src/api/decorators/current-user.decorator.ts` - `@CurrentUser()` para obtener el usuario autenticado

**Login Manual:**
- `src/api/controllers/auth.controller.ts` - Login con `ValidateUserUseCase` + `LoginUseCase`

#### 🗑️ Archivos Eliminados

```bash
src/api/strategies/jwt.strategy.ts        # PassportStrategy JWT
src/api/strategies/local.strategy.ts      # PassportStrategy Local
src/api/guards/local-auth.guard.ts        # Guard de Passport
```

---

## 📦 Dependencias

### Instaladas

```json
{
  "prisma": "^5.22.0",
  "@prisma/client": "^5.22.0"
}
```

### Eliminadas

```json
{
  "sequelize": "^6.37.7",
  "sequelize-typescript": "^2.1.6",
  "sequelize-cli": "^6.6.2",
  "@nestjs/sequelize": "^11.0.0",
  "@nestjs/passport": "^11.0.5",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "passport-local": "^1.0.0",
  "@types/passport-jwt": "^4.0.1",
  "@types/passport-local": "^1.0.38",
  "@types/sequelize": "^4.28.20",
  "mysql2": "^3.14.0"
}
```

---

## 🏗️ Arquitectura Mantenida

### ✅ DDD + Hexagonal Intacto

```
src/modules/[contexto]/
├── domain/
│   ├── entities/          # ✅ Sin cambios (entidades puras)
│   ├── repositories/      # ✅ Sin cambios (interfaces)
│   └── exceptions/        # ✅ Sin cambios
├── application/
│   ├── use-cases/         # ✅ Sin cambios
│   └── dto/               # ✅ Sin cambios
└── infrastructure/
    └── persistence/
        └── prisma/        # ✅ NUEVO: Adaptadores con Prisma
            ├── *.repository.impl.ts
            └── (sin entidades ORM)
```

**Principios respetados:**
- ✅ Dominio sin dependencias de Prisma
- ✅ Lógica de negocio en Use Cases
- ✅ Controllers delgados
- ✅ Inyección de dependencias con interfaces

---

## 🚀 Comandos Nuevos

### Prisma

```bash
# Generar cliente de Prisma
npm run prisma:generate

# Crear migración
npm run prisma:migrate

# Aplicar migraciones (producción)
npm run prisma:migrate:deploy

# Push schema sin migración (dev)
npm run prisma:push

# Abrir Prisma Studio (GUI)
npm run prisma:studio
```

---

## 🔧 Configuración Requerida

### Variables de Entorno

```env
# Prisma requiere DATABASE_URL
DATABASE_URL="postgresql://postgres:password@localhost:5432/auth_db?schema=public"

# Variables individuales (para referencia)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=auth_db

# JWT (sin cambios)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Redis (sin cambios)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 🧪 Testing

### Cambios en Tests

**Archivos actualizados:**
- `test/test-setup.ts` - Usa `PrismaService` en lugar de `Sequelize`
- `test/helpers/test-create-auth.ts` - Transacciones con `prisma.$transaction()`

**PrismaService.cleanDatabase():**
```typescript
// Solo en tests
await prisma.cleanDatabase(); // Limpia todas las tablas
```

**Ejecutar tests:**
```bash
npm run test:e2e
```

---

## 📊 Comparación Antes/Después

| Aspecto | Antes (Sequelize + Passport) | Después (Prisma + Custom Auth) |
|---------|------------------------------|--------------------------------|
| **ORM** | Sequelize | Prisma |
| **Auth** | Passport (jwt + local) | Custom JWT Guard |
| **Decorators** | @AuthGuard('jwt') | @UseGuards(JwtAuthGuard) |
| **Transacciones** | sequelize.transaction() | prisma.$transaction() |
| **Migraciones** | sequelize-cli | prisma migrate |
| **Type Safety** | Parcial | Total |
| **Queries** | Model.findAll() | prisma.user.findMany() |
| **Relations** | @BelongsTo(), @HasOne() | Prisma relations |

---

## 🎯 Ventajas del Nuevo Stack

### Prisma

✅ **Type-safety completo** - TypeScript end-to-end  
✅ **Mejor DX** - Autocomplete mejorado  
✅ **Migraciones** más simples y claras  
✅ **Query builder** más intuitivo  
✅ **Sin decoradores** en modelos de dominio  
✅ **Prisma Studio** para visualización de datos

### Auth Custom (sin Passport)

✅ **Menos dependencias** - Solo `@nestjs/jwt`  
✅ **Control total** sobre validación  
✅ **Más explícito** - Sin "magia" de estrategias  
✅ **Mejor testability** - Sin mocks complejos  
✅ **Más flexible** - Fácil agregar refresh tokens, MFA, etc.

---

## 🔄 Flujo de Autenticación Actual

### 1. **Signup**

```
POST /api/auth/signup
↓
AuthController.create()
↓
TransactionService.runInTransaction()
↓
CreateAuthUseCase.execute()
↓
AuthRepository.create() [Prisma]
UserRepository.create() [Prisma]
```

### 2. **Login**

```
POST /api/auth/login
↓
AuthController.login()
↓
ValidateUserUseCase.execute() (valida email/password)
↓
LoginUseCase.execute() (genera JWT)
↓
return { token: "..." }
```

### 3. **Endpoints Protegidos**

```
GET /api/user
Headers: Authorization: Bearer <token>
↓
@UseGuards(JwtAuthGuard)
↓
JwtAuthGuard.canActivate()
  - Extrae token del header
  - Valida con JwtService.verifyAsync()
  - Verifica usuario en DB
  - Adjunta req.user = { id, authId, role }
↓
@CurrentUser() user (en controller)
```

---

## 🚦 Próximos Pasos Sugeridos

### Mejoras Opcionales

1. **Refresh Tokens**
   - Agregar tabla `refresh_tokens` en Prisma
   - Endpoint `/auth/refresh`

2. **Migraciones desde Sequelize**
   - Si tienes data en producción, usar `prisma db pull`
   - Ajustar schema y generar migraciones

3. **Prisma Studio en Desarrollo**
   ```bash
   npm run prisma:studio
   ```

4. **Optimizaciones**
   - Connection pooling (ya configurado)
   - Query optimization con Prisma insights

---

## 📚 Referencias

- [Prisma con NestJS](https://docs.nestjs.com/recipes/prisma)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [JWT en NestJS](https://docs.nestjs.com/security/authentication#jwt-functionality)

---

## ✅ Checklist de Migración

- [x] Instalar Prisma y @prisma/client
- [x] Crear schema.prisma con modelos
- [x] Implementar PrismaService
- [x] Crear repositorios con Prisma
- [x] Actualizar TransactionService
- [x] Eliminar Passport y crear JwtAuthGuard custom
- [x] Actualizar controllers (login sin Passport)
- [x] Actualizar módulos (sin Sequelize/Passport)
- [x] Actualizar tests
- [x] Eliminar archivos obsoletos
- [x] Compilación exitosa
- [x] Documentación actualizada

---

**🎉 Migración Completada Exitosamente**

Tu microservicio ahora está modernizado con Prisma + Auth Custom, manteniendo 100% la arquitectura DDD + Hexagonal.

