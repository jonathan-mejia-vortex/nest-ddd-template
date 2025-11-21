# Guía de Migración - Archivos Antiguos a Nueva Estructura

## 📋 Resumen

Este documento describe qué archivos antiguos ya no se usan y pueden eliminarse de forma segura después de validar que la nueva arquitectura funciona correctamente.

## ⚠️ IMPORTANTE

**NO ELIMINAR** estos archivos hasta que:
1. Hayas ejecutado todos los tests
2. Hayas verificado que la aplicación funciona correctamente
3. Hayas hecho un backup o commit de seguridad

## 🗑️ Archivos que Pueden Eliminarse

### Archivos Antiguos de User

```bash
# Antiguo controller (reemplazado por api/controllers/users.controller.ts)
src/resources/user/user.controller.ts

# Antiguo service (reemplazado por casos de uso)
src/resources/user/user.service.ts

# Antiguo repository (reemplazado por infrastructure/persistence)
src/resources/user/user.repository.ts

# Antigua entidad (reemplazada por entidad de dominio y Sequelize entity)
src/resources/user/entities/user.entity.ts

# Antiguo DTO (movido a application/dto)
src/resources/user/dto/update-user.dto.ts

# Antiguo módulo (reemplazado por modules/users/user.module.ts)
src/resources/user/user.module.ts
```

### Archivos Antiguos de Auth

```bash
# Antiguo controller (reemplazado por api/controllers/auth.controller.ts)
src/resources/auth/auth.controller.ts

# Antiguo service (reemplazado por casos de uso)
src/resources/auth/auth.service.ts

# Antiguo service spec
src/resources/auth/auth.service.spec.ts

# Antiguo repository (reemplazado por infrastructure/persistence)
src/resources/auth/auth.repository.ts

# Antigua interfaz (reemplazada por domain/repositories)
src/resources/auth/auth.interface.ts

# Antigua entidad (reemplazada por entidad de dominio y Sequelize entity)
src/resources/auth/entities/auth.entity.ts

# Antiguos DTOs (movidos a application/dto)
src/resources/auth/dto/create-auth.dto.ts
src/resources/auth/dto/find-auth.dto.ts
src/resources/auth/dto/update-auth.dto.ts

# Antigua constante
src/resources/auth/constants.ts

# Antiguo módulo (reemplazado por modules/auth/auth.module.ts)
src/resources/auth/auth.module.ts

# Antiguos guards y strategies (movidos a api/)
src/resources/auth/security/jwt-auth.guard.ts
src/resources/auth/security/jwt.strategy.ts
src/resources/auth/security/local-auth.guard.ts
src/resources/auth/security/local.strategy.ts
src/resources/auth/security/roles.guard.ts
src/resources/auth/security/roles.decorator.ts
```

### Carpetas Completas que Pueden Eliminarse

```bash
# Toda la carpeta resources (ya no se usa)
src/resources/
```

## 🔄 Mapeo de Archivos: Antes → Después

### User

| Archivo Antiguo | Nuevo Archivo |
|----------------|---------------|
| `resources/user/entities/user.entity.ts` | `modules/users/domain/entities/user.entity.ts` (dominio)<br>`modules/users/infrastructure/persistence/sequelize/user.sequelize.entity.ts` (persistencia) |
| `resources/user/user.controller.ts` | `api/controllers/users.controller.ts` |
| `resources/user/user.service.ts` | `modules/users/application/use-cases/create-user.use-case.ts`<br>`modules/users/application/use-cases/update-user.use-case.ts`<br>`modules/users/application/use-cases/get-all-users.use-case.ts` |
| `resources/user/user.repository.ts` | `modules/users/infrastructure/persistence/sequelize/user.repository.impl.ts` |
| `resources/user/dto/update-user.dto.ts` | `modules/users/application/dto/update-user.dto.ts` |

### Auth

| Archivo Antiguo | Nuevo Archivo |
|----------------|---------------|
| `resources/auth/entities/auth.entity.ts` | `modules/auth/domain/entities/auth.entity.ts` (dominio)<br>`modules/auth/infrastructure/persistence/sequelize/auth.sequelize.entity.ts` (persistencia) |
| `resources/auth/auth.controller.ts` | `api/controllers/auth.controller.ts` |
| `resources/auth/auth.service.ts` | `modules/auth/application/use-cases/create-auth.use-case.ts`<br>`modules/auth/application/use-cases/validate-user.use-case.ts`<br>`modules/auth/application/use-cases/login.use-case.ts` |
| `resources/auth/auth.repository.ts` | `modules/auth/infrastructure/persistence/sequelize/auth.repository.impl.ts` |
| `resources/auth/dto/create-auth.dto.ts` | `modules/auth/application/dto/create-auth.dto.ts` |
| `resources/auth/security/jwt-auth.guard.ts` | `api/guards/jwt-auth.guard.ts` |
| `resources/auth/security/jwt.strategy.ts` | `api/strategies/jwt.strategy.ts` |
| `resources/auth/security/local-auth.guard.ts` | `api/guards/local-auth.guard.ts` |
| `resources/auth/security/local.strategy.ts` | `api/strategies/local.strategy.ts` |
| `resources/auth/security/roles.guard.ts` | `api/guards/roles.guard.ts` |
| `resources/auth/security/roles.decorator.ts` | `api/guards/roles.decorator.ts` |

## 📝 Pasos para Eliminar Archivos Antiguos

### 1. Verificar que Todo Funciona

```bash
# Ejecutar tests
npm run test
npm run test:e2e

# Iniciar aplicación
npm run start:dev

# Verificar endpoints
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 2. Hacer Backup

```bash
# Commit de seguridad
git add .
git commit -m "chore: refactor completo a DDD + Hexagonal - backup antes de limpieza"
git tag -a "backup-pre-cleanup" -m "Backup antes de eliminar archivos antiguos"
```

### 3. Eliminar Archivos Antiguos

```bash
# Eliminar carpeta resources completa
rm -rf src/resources/

# Opcional: Eliminar archivo de sincronización antiguo si existe
rm -f src/sequelize/sync.ts
```

### 4. Verificar de Nuevo

```bash
# Ejecutar tests nuevamente
npm run test
npm run test:e2e

# Asegurarse de que no hay imports rotos
npm run build
```

### 5. Commit Final

```bash
git add .
git commit -m "chore: eliminar archivos antiguos después de migración a DDD"
```

## 🔍 Cómo Verificar si hay Referencias a Archivos Antiguos

```bash
# Buscar imports de la carpeta resources
grep -r "from.*resources" src/

# Buscar imports específicos
grep -r "resources/user" src/
grep -r "resources/auth" src/
```

Si estos comandos retornan resultados, hay archivos que aún referencian la estructura antigua y deben actualizarse.

## ⚙️ Archivos de Configuración Actualizados

Estos archivos YA fueron actualizados y NO deben eliminarse:

- `src/app.module.ts` → Actualizado para usar nuevos módulos
- `src/db/db.module.ts` → Actualizado para usar nuevas entidades Sequelize
- `package.json` → Actualizado con nuevas dependencias y scripts
- `src/config/envs.ts` → Actualizado con configuración de Redis

## 🎯 Checklist de Migración

- [x] Nueva estructura de carpetas creada
- [x] Entidades de dominio implementadas
- [x] Casos de uso implementados
- [x] Repositorios implementados
- [x] Controllers refactorizados
- [x] Módulos actualizados
- [x] Dependencias instaladas
- [x] Migraciones creadas
- [ ] Tests ejecutados exitosamente
- [ ] Aplicación verificada en desarrollo
- [ ] Archivos antiguos eliminados
- [ ] Documentación actualizada

## 📞 Soporte

Si encuentras algún problema durante la migración:

1. Revisa los logs de la aplicación
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que Redis esté corriendo si se necesita caché
4. Verifica que la base de datos tenga las migraciones aplicadas

## ⚡ Comandos Útiles de Rollback

Si algo sale mal y necesitas volver atrás:

```bash
# Volver al commit antes de la eliminación
git reset --hard backup-pre-cleanup

# O deshacer el último commit
git reset --soft HEAD~1
```

---

**Importante**: La carpeta `src/resources/` completa puede eliminarse de forma segura una vez verificado que todo funciona correctamente con la nueva estructura.

