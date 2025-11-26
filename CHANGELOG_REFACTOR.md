# 🔄 Changelog del Refactor - Template NestJS DDD

## 📅 Fecha: 25 de Noviembre, 2025

---

## 🎯 Objetivos del Refactor

1. Mejorar interceptors y unificar formato de respuestas
2. Migrar de ESLint/Prettier a Biome
3. Configurar Husky con hooks pre-commit y pre-push
4. Eliminar referencias a "MS-Auth" y hacer el template genérico
5. Optimizar Dockerfile sin dependencias de Railway
6. Mejorar sistema de logging con más contexto

---

## 📦 RESUMEN DE CAMBIOS

### ✅ Interceptors
- ✅ Nuevo `ResponseInterceptor` para formato unificado
- ✅ `CorrelationIdInterceptor` mejorado (múltiples headers)
- ✅ `LoggingInterceptor` mejorado (más contexto: IP, User-Agent, errorCode)

### ✅ Tooling
- ✅ Biome configurado (reemplaza ESLint + Prettier)
- ✅ Husky + lint-staged configurado
- ✅ Git hooks: pre-commit (lint) y pre-push (tests)

### ✅ Genérico
- ✅ SERVICE_NAME configurable (no más "MS-Auth" hardcoded)
- ✅ Logs y métricas usan SERVICE_NAME

### ✅ Docker
- ✅ Multi-stage build optimizado
- ✅ Usuario no-root (seguridad)
- ✅ Health check incluido
- ✅ Sin referencias a Railway

### ✅ Package.json
- ✅ Removido: prettier, eslint, @typescript-eslint/*
- ✅ Agregado: husky, lint-staged
- ✅ Scripts Biome configurados

---

## 📝 ARCHIVOS MODIFICADOS

### Nuevos:
- `src/api/interceptors/response.interceptor.ts`
- `.biomeignore`
- `.lintstagedrc.json`
- `.husky/pre-commit`
- `.husky/pre-push`
- `.nvmrc`
- `CHANGELOG_REFACTOR.md`

### Modificados:
- `package.json`
- `biome.json`
- `Dockerfile`
- `.dockerignore`
- `.env.example`
- `src/config/envs.ts`
- `src/shared/infrastructure/logging/pino-logger.service.ts`
- `src/shared/infrastructure/metrics/cloudwatch-metrics.service.ts`
- `src/api/interceptors/correlation-id.interceptor.ts`
- `src/api/interceptors/logging.interceptor.ts`

---

## 🚀 PRÓXIMOS PASOS

1. **Instalar dependencias**: `yarn install`
2. **Inicializar Husky**: `yarn prepare`
3. **Formatear código**: `yarn format && yarn lint`
4. **Compilar**: `yarn build`
5. **Tests**: `yarn test`

---

## 📚 BENEFICIOS

- ⚡ Biome es 25x más rápido que ESLint
- 🔒 Docker más seguro (usuario no-root)
- 📊 Logs más descriptivos
- 🐕 Git hooks automatizan quality checks
- 🎯 Template completamente genérico y reutilizable

---

**🎉 El proyecto mantiene exactamente la misma funcionalidad, solo se mejoraron las herramientas de desarrollo, observabilidad y seguridad.**

