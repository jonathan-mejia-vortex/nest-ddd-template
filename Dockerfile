# Etapa 1: Build.
FROM node:22.16.0-alpine AS builder

WORKDIR /app

# Dependencias para build (python, make, g++)
RUN apk add --no-cache python3 make g++

# Copiar archivos de dependencias y Prisma schema
COPY package.json yarn.lock ./
COPY prisma ./prisma

# Instalar todas las dependencias (dev y prod)
RUN yarn install --frozen-lockfile

# Generar cliente Prisma
RUN yarn prisma generate

# Copiar todo el código fuente
COPY . .

# Compilar TypeScript
RUN yarn build

# Limpiar cache yarn (opcional)
RUN yarn cache clean

# Etapa 2: Imagen final minimalista
FROM node:22.16.0-alpine

WORKDIR /app

# Copiar solo lo necesario desde builder: código compilado y node_modules prod
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production

# Comando de inicio
CMD ["node", "dist/main.js"]
