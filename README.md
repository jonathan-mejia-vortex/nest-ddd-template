# Nest DDD Microservice Template - Arquitectura DDD + Hexagonal

Template de microservicio backend construido con **NestJS** siguiendo los principios de **Domain-Driven Design (DDD)** y **Arquitectura Hexagonal**.  
Está pensado como base para despliegues rápidos de futuros microservicios (no solo de autenticación).

## 🏗️ Arquitectura

Este proyecto implementa una arquitectura limpia con separación en capas:

- **Domain Layer**: Entidades de dominio, repositorios (puertos), excepciones de negocio
- **Application Layer**: Casos de uso, DTOs, lógica de orquestación
- **Infrastructure Layer**: Implementaciones de persistencia (Prisma), Redis, servicios externos
- **API Layer**: Controllers delgados, guards custom JWT

Para más detalles, consulta [ARQUITECTURA_DDD.md](./ARQUITECTURA_DDD.md).

## 🚀 Stack Tecnológico

- **Framework**: NestJS 11.x
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Caché**: Redis (ioredis + cache-manager)
- **Autenticación**: JWT Custom (sin Passport)
- **Validación**: class-validator + class-transformer
- **Testing**: Jest (unit + e2e)
- **Arquitectura**: DDD + Hexagonal

## 📁 Estructura del Proyecto

```
src/
├── api/                    # API Layer (Controllers, Guards custom)
├── modules/                # Bounded Contexts
│   ├── users/             # Gestión de usuarios
│   │   ├── domain/        # Entidades, interfaces, excepciones
│   │   ├── application/   # Use cases, DTOs
│   │   └── infrastructure/# Prisma repositories
│   └── auth/              # Autenticación y autorización
│       ├── domain/        # Entidades, interfaces, excepciones, PasswordService
│       ├── application/   # Use cases, DTOs
│       └── infrastructure/# Prisma repositories
├── shared/                 # Infraestructura compartida
│   ├── domain/            # Excepciones base
│   ├── application/       # Filters globales
│   └── infrastructure/    # PrismaService, TransactionService, Redis
├── common/                 # Utilidades comunes
│   ├── dto/               # DTOs compartidos (pagination, interceptors)
│   └── types.ts           # Tipos y enums globales (ROLE)
├── config/                 # Configuración (envs.ts)
├── prisma/                 # Prisma ORM
│   └── schema.prisma      # Schema de base de datos
└── app.module.ts          # Módulo raíz
```

## 🛠️ Instalación

### Prerrequisitos

- Node.js >= 18.x
- PostgreSQL >= 14
- Redis >= 6 (opcional)

### Pasos

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd nest-ddd-template
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

Variables requeridas:
```env
# Database (Prisma) - ajusta nombres a tu microservicio
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/my_service_db?schema=public"

# Database individual params (para referencia)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=my_service_db

# Test Database
DB_TEST_HOST=localhost
DB_TEST_PORT=5432
DB_TEST_DATABASE=auth_db_test

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3000
NODE_ENV=development
```

4. **Crear base de datos (ejemplo)**
```bash
createdb my_service_db
createdb my_service_db_test
```

5. **Generar cliente de Prisma**
```bash
yarn prisma:generate
```

6. **Aplicar migraciones (dev)**
```bash
yarn prisma:push
# O crear migración:
npx prisma migrate dev --name init
```

## 🎯 Comandos Disponibles

### Desarrollo
```bash
yarn start:dev          # Iniciar en modo desarrollo
yarn start:debug        # Iniciar con debugger
yarn build              # Compilar proyecto
yarn start:prod         # Iniciar en producción
```

### Base de Datos (Prisma)
```bash
yarn prisma:generate                # Generar cliente de Prisma
yarn prisma:push                    # Push schema sin migración (dev)
yarn prisma:migrate                 # Crear y aplicar migración
yarn prisma:migrate:deploy          # Aplicar migraciones (producción)
yarn prisma:studio                  # Abrir Prisma Studio (GUI)
```

### Testing
```bash
yarn test               # Tests unitarios
yarn test:watch         # Tests en modo watch
yarn test:cov           # Tests con coverage
yarn test:e2e           # Tests end-to-end
```

### Calidad de Código
```bash
yarn biome
```

## 🔐 Autenticación

### Registro de Usuario
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "USER"  # Opcional, default: USER
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Endpoints Protegidos
```bash
GET /api/user
Authorization: Bearer <token>
```

## 🏛️ Patrones y Principios

### Domain-Driven Design
- **Bounded Contexts**: Módulos independientes (users, auth)
- **Entidades de Dominio**: Clases puras con comportamiento
- **Value Objects**: Enums y tipos específicos
- **Servicios de Dominio**: Lógica compleja (PasswordService)
- **Excepciones de Dominio**: Errores específicos del negocio

### Arquitectura Hexagonal
- **Puertos**: Interfaces en capa de dominio
- **Adaptadores**: Implementaciones en infraestructura (Prisma)
- **Independencia de Framework**: Dominio sin dependencias de Prisma

### SOLID Principles
- Single Responsibility
- Open/Closed
- Liskov Substitution
- Interface Segregation
- Dependency Inversion

## 🧪 Testing

### Tests Unitarios
```bash
yarn test

# Tests específicos
yarn test -- auth.service
yarn test -- user.entity
```

### Tests E2E
```bash
# Requiere base de datos de test configurada
yarn test:e2e
```

## 🐳 Docker

### Desarrollo con Docker Compose
```bash
docker compose up -d
```

El `docker-compose.yml` incluye:
- PostgreSQL
- Redis
- pgAdmin (http://localhost:8080)

### Conectar a la base de datos Docker
En pgAdmin:
- Host: `db` (nombre del servicio)
- Port: `5432` (puerto interno)
- User/Password: según `docker-compose.yml`

## 📚 Documentación Adicional

- [ARQUITECTURA_DDD.md](./ARQUITECTURA_DDD.md) - Guía completa de arquitectura

## 🔄 Migraciones con Prisma

Las migraciones se manejan con Prisma CLI:

```bash
# Crear migración
npx prisma migrate dev --name add-new-field

# Aplicar migraciones (producción)
yarn prisma:migrate:deploy

# Push schema sin migración (desarrollo)
yarn prisma:push

# Visualizar base de datos
yarn prisma:studio
```

Schema: `prisma/schema.prisma`  
Migraciones: `prisma/migrations/`

## 🛡️ Seguridad

- Passwords hasheados con bcrypt
- JWT para autenticación stateless (sin Passport)
- Custom JwtAuthGuard para protección de rutas
- Validación de DTOs con class-validator
- Roles y permisos implementados
- @CurrentUser() decorator para acceso al usuario

## 📊 Performance

- **Prisma**: Connection pooling automático
- **Redis**: Caché configurado (TTL 1h)
- **Índices críticos**: authId, email, role
- **Transacciones**: Manejadas con TransactionService + Prisma
- **Type-safety**: TypeScript end-to-end con Prisma Client

## 🚧 Estado del Proyecto

✅ **Versión**: v1.0.0  
✅ **Estado**: Producción Ready  
✅ **Arquitectura**: DDD + Hexagonal  
✅ **Cobertura**: Tests e2e implementados  

## 🎯 Características Avanzadas

### Observabilidad
- **Logging Estructurado**: Pino + AWS CloudWatch Logs (batch)
- **Métricas**: AWS CloudWatch Metrics automáticas (latencia, requests, errores)
- **Tracing**: OpenTelemetry + AWS X-Ray (distributed tracing)
- **Correlation ID**: Rastreo automático de requests end-to-end

### Resiliencia
- **Circuit Breakers**: Protección con opossum para llamadas HTTP externas
- **Retry Logic**: Reintentos automáticos con backoff exponencial
- **Idempotencia**: Guard + Service para prevenir ejecuciones duplicadas
- **HTTP Clients**: ErpClient y WmsClient con circuit breaker integrado

### Mensajería
- **SQS Client**: Interface con implementación mock (listo para AWS SQS)
- **Event-Driven**: Preparado para arquitectura basada en eventos

### Performance
- **Paginación**: Limit/offset en queries con count paralelo
- **Índices Optimizados**: email, authId, role, timestamps
- **Connection Pooling**: Prisma con pool automático
- **Batch Processing**: CloudWatch Logs/Metrics usan buffers

## 📝 Próximas Mejoras (Roadmap)

- [ ] Refresh tokens
- [ ] Multi-factor authentication (MFA)
- [ ] Reemplazar SQS Mock con AWS SQS real
- [ ] Implementar Rate Limiting
- [ ] Migrar a Fastify para mejor performance

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

[Especificar licencia]

## 👥 Autores

[Equipo de desarrollo]

---

**Nota**: Este proyecto sigue las convenciones de [Conventional Commits](https://www.conventionalcommits.org/) y los principios de [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html).
