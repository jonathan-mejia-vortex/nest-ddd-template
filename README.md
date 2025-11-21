# Microservicio Auth - Arquitectura DDD + Hexagonal

Microservicio de autenticación y autorización construido con **NestJS** siguiendo los principios de **Domain-Driven Design (DDD)** y **Arquitectura Hexagonal**.

## 🏗️ Arquitectura

Este proyecto implementa una arquitectura limpia con separación en capas:

- **Domain Layer**: Entidades de dominio, repositorios (puertos), excepciones de negocio
- **Application Layer**: Casos de uso, DTOs, lógica de orquestación
- **Infrastructure Layer**: Implementaciones de persistencia (Sequelize), Redis, servicios externos
- **API Layer**: Controllers delgados, guards, strategies

Para más detalles, consulta [ARQUITECTURA_DDD.md](./ARQUITECTURA_DDD.md).

## 🚀 Stack Tecnológico

- **Framework**: NestJS 11.x
- **Base de Datos**: PostgreSQL con Sequelize
- **Caché**: Redis (ioredis + cache-manager)
- **Autenticación**: JWT + Passport (local & jwt strategies)
- **Validación**: class-validator + class-transformer
- **Testing**: Jest (unit + e2e)
- **Arquitectura**: DDD + Hexagonal

## 📁 Estructura del Proyecto

```
src/
├── api/                    # API Layer (Controllers, Guards, Strategies)
├── modules/                # Bounded Contexts
│   ├── users/             # Gestión de usuarios
│   └── auth/              # Autenticación y autorización
├── shared/                 # Infraestructura compartida
│   ├── domain/            # Excepciones de dominio
│   ├── application/       # Filters globales
│   └── infrastructure/    # Redis, TransactionService
├── common/                 # Utilidades comunes
│   ├── dto/               # DTOs compartidos (pagination, interceptors)
│   └── types.ts           # Tipos y enums globales
├── config/                 # Configuración
├── db/                     # Módulo de base de datos
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
cd ms-auth
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
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=auth_db

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
```

4. **Crear base de datos**
```bash
createdb auth_db
createdb auth_db_test
```

5. **Ejecutar migraciones**
```bash
npm run migration:run
```

## 🎯 Comandos Disponibles

### Desarrollo
```bash
npm run start:dev          # Iniciar en modo desarrollo
npm run start:debug        # Iniciar con debugger
npm run build              # Compilar proyecto
npm run start:prod         # Iniciar en producción
```

### Base de Datos
```bash
npm run migration:generate -- nombre-migracion  # Crear nueva migración
npm run migration:run                           # Ejecutar migraciones pendientes
npm run migration:undo                          # Revertir última migración

# Solo para desarrollo (no usar en producción)
npm run sync:alter         # Sincronizar con alter
npm run sync:force         # Sincronizar con force (destruye datos)
```

### Testing
```bash
npm run test               # Tests unitarios
npm run test:watch         # Tests en modo watch
npm run test:cov           # Tests con coverage
npm run test:e2e           # Tests end-to-end
```

### Calidad de Código
```bash
npm run lint               # Linter
npm run format             # Format con Prettier
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
- **Adaptadores**: Implementaciones en infraestructura
- **Independencia de Framework**: Dominio sin dependencias externas

### SOLID Principles
- Single Responsibility
- Open/Closed
- Liskov Substitution
- Interface Segregation
- Dependency Inversion

## 🧪 Testing

### Tests Unitarios
```bash
npm run test

# Tests específicos
npm run test -- auth.service
npm run test -- user.entity
```

### Tests E2E
```bash
# Requiere base de datos de test
npm run sync:test  # Primera vez
npm run test:e2e
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

## 🔄 Migraciones

Las migraciones se manejan con Sequelize CLI:

```bash
# Crear migración
npm run migration:generate -- add-new-field

# Ejecutar migraciones
npm run migration:run

# Revertir última migración
npm run migration:undo
```

Ubicación: `migrations/`

## 🛡️ Seguridad

- Passwords hasheados con bcrypt
- JWT para autenticación stateless
- Guards para protección de rutas
- Validación de DTOs con class-validator
- Roles y permisos implementados

## 📊 Performance

- **Pool de conexiones DB**: max 20, min 5
- **Redis**: Caché configurado (TTL 1h)
- **Índices críticos**: authId, email, role
- **Transacciones**: Manejadas con TransactionService

## 🚧 Estado del Proyecto

✅ **Versión**: v1.0.0  
✅ **Estado**: Producción Ready  
✅ **Arquitectura**: DDD + Hexagonal  
✅ **Cobertura**: Tests e2e implementados  

## 📝 Próximas Mejoras (Roadmap)

- [ ] Implementar SQS para eventos de dominio
- [ ] Agregar idempotencia en endpoints críticos
- [ ] Mejorar logging con correlation ID
- [ ] Implementar circuit breakers para servicios externos
- [ ] Agregar métricas y observabilidad
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
