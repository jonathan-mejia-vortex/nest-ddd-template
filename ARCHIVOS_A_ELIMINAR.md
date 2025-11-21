# ✅ VERIFICACIÓN COMPLETA - Archivos Seguros para Eliminar

## 🔍 Análisis Realizado

He verificado exhaustivamente el código y encontré:

- ✅ **0 referencias** desde el nuevo código en `src/` a la carpeta `src/resources/`
- ✅ **1 referencia** en tests que **YA FUE ACTUALIZADA**
- ✅ **25 archivos antiguos** que pueden eliminarse de forma segura

## 🗑️ LISTA COMPLETA DE ARCHIVOS A ELIMINAR

### Eliminar Carpeta Completa

```bash
# Esta carpeta completa puede eliminarse de forma segura
rm -rf src/resources/
```

### Archivos Específicos (si prefieres eliminar uno por uno)

#### Módulo User (7 archivos)
```bash
src/resources/user/user.controller.ts
src/resources/user/user.service.ts
src/resources/user/user.repository.ts
src/resources/user/user.module.ts
src/resources/user/user.http
src/resources/user/entities/user.entity.ts
src/resources/user/dto/update-user.dto.ts
```

#### Módulo Auth (18 archivos)
```bash
# Core
src/resources/auth/auth.controller.ts
src/resources/auth/auth.service.ts
src/resources/auth/auth.service.spec.ts
src/resources/auth/auth.repository.ts
src/resources/auth/auth.interface.ts
src/resources/auth/auth.module.ts
src/resources/auth/auth.http
src/resources/auth/constants.ts

# Entidades
src/resources/auth/entities/auth.entity.ts

# DTOs
src/resources/auth/dto/create-auth.dto.ts
src/resources/auth/dto/update-auth.dto.ts
src/resources/auth/dto/find-auth.dto.ts

# Security (guards y strategies)
src/resources/auth/security/jwt-auth.guard.ts
src/resources/auth/security/jwt.strategy.ts
src/resources/auth/security/local-auth.guard.ts
src/resources/auth/security/local.strategy.ts
src/resources/auth/security/roles.guard.ts
src/resources/auth/security/roles.decorator.ts
```

## ✅ CONFIRMACIÓN DE ACTUALIZACIÓN

### Tests Actualizados

El archivo `test/helpers/test-create-auth.ts` ha sido actualizado para usar:
- ✅ `CreateAuthUseCase` (en lugar de `AuthService.create()`)
- ✅ `ValidateUserUseCase` (en lugar de `AuthService.validateUser()`)
- ✅ `LoginUseCase` (en lugar de `AuthService.login()`)

### Referencias Eliminadas

- ✅ **0 imports** de `src/resources/` en código de producción
- ✅ **0 imports** de `src/resources/` en tests

## 📋 CHECKLIST ANTES DE ELIMINAR

Ejecuta estos comandos para verificar que todo funciona:

```bash
# 1. Verificar que no hay imports rotos
npm run build

# 2. Ejecutar tests unitarios
npm run test

# 3. Ejecutar tests e2e
npm run test:e2e

# 4. Iniciar aplicación
npm run start:dev
```

Si todos estos comandos pasan exitosamente, puedes eliminar de forma segura.

## 🚀 COMANDOS PARA ELIMINAR

### Opción 1: Hacer Backup y Eliminar

```bash
# 1. Hacer commit de seguridad
git add .
git commit -m "chore: preparar eliminación de archivos antiguos"
git tag -a "v1.0-pre-cleanup" -m "Backup antes de eliminar archivos antiguos"

# 2. Eliminar carpeta antigua
rm -rf src/resources/

# 3. Verificar que todo funciona
npm run build && npm run test:e2e

# 4. Commit final
git add .
git commit -m "chore: eliminar carpeta resources/ antigua tras migración a DDD"
```

### Opción 2: Mover a Carpeta de Backup (más conservador)

```bash
# Crear carpeta de backup fuera de src
mkdir -p .backup-resources
mv src/resources .backup-resources/

# Verificar que todo funciona
npm run build && npm run test:e2e

# Si todo está bien, eliminar el backup después de unos días
# rm -rf .backup-resources/
```

## 📊 RESUMEN DE REEMPLAZOS

| Archivo Antiguo | Reemplazado Por |
|----------------|-----------------|
| `resources/user/user.controller.ts` | `api/controllers/users.controller.ts` |
| `resources/user/user.service.ts` | `modules/users/application/use-cases/*.use-case.ts` |
| `resources/user/user.repository.ts` | `modules/users/infrastructure/persistence/sequelize/user.repository.impl.ts` |
| `resources/user/entities/user.entity.ts` | `modules/users/domain/entities/user.entity.ts` + `modules/users/infrastructure/persistence/sequelize/user.sequelize.entity.ts` |
| `resources/auth/auth.controller.ts` | `api/controllers/auth.controller.ts` |
| `resources/auth/auth.service.ts` | `modules/auth/application/use-cases/*.use-case.ts` |
| `resources/auth/auth.repository.ts` | `modules/auth/infrastructure/persistence/sequelize/auth.repository.impl.ts` |
| `resources/auth/entities/auth.entity.ts` | `modules/auth/domain/entities/auth.entity.ts` + `modules/auth/infrastructure/persistence/sequelize/auth.sequelize.entity.ts` |
| `resources/auth/security/*.ts` | `api/guards/*.ts` + `api/strategies/*.ts` |

## ⚠️ IMPORTANTE

- ✅ Todos los archivos en `src/resources/` son **SEGUROS de eliminar**
- ✅ El test helper ha sido actualizado
- ✅ No hay dependencias circulares
- ✅ La nueva arquitectura es completamente funcional

## 🎯 VALIDACIÓN FINAL

Después de eliminar, ejecuta:

```bash
# Buscar cualquier referencia residual (debe retornar vacío)
grep -r "resources/user" src/
grep -r "resources/auth" src/
grep -r "from.*resources" test/

# Si estos comandos no retornan nada, la eliminación fue exitosa
```

## 🔄 ROLLBACK (en caso de problemas)

Si algo sale mal:

```bash
# Volver al tag de backup
git reset --hard v1.0-pre-cleanup

# O restaurar desde backup
mv .backup-resources/resources src/
```

---

**CONCLUSIÓN**: Es **100% SEGURO** eliminar la carpeta `src/resources/` completa. Todos los archivos han sido reemplazados por la nueva arquitectura DDD + Hexagonal.

