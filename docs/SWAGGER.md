# Swagger API Documentation

Documentación automática de la API con OpenAPI 3.0 (Swagger).

---

## Acceso

Una vez iniciada la aplicación, la documentación está disponible en:

```
http://localhost:3000/docs
```

---

## Configuración

La configuración de Swagger está en `src/main.ts`:

```typescript
const config = new DocumentBuilder()
  .setTitle('Nest DDD Microservice Template API')
  .setDescription('Template de microservicio con NestJS utilizando DDD + Arquitectura Hexagonal')
  .setVersion('1.0.0')
  .addTag('Auth')
  .addTag('Users')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document);
```

---

## Tags

### Auth
Endpoints de autenticación:
- `POST /auth/signup` - Registro de nuevo usuario
- `POST /auth/login` - Login y obtención de JWT token

### Users
Endpoints de gestión de usuarios (requieren autenticación):
- `GET /user` - Listar usuarios (paginado, solo ADMIN)
- `PATCH /user` - Actualizar usuario actual

---

## Autenticación en Swagger

Para probar endpoints protegidos:

1. Hacer login en `POST /auth/login`
2. Copiar el `token` de la respuesta
3. Clic en el botón "Authorize" (🔒) arriba a la derecha
4. Pegar el token en el formato: `Bearer <token>`
5. Clic en "Authorize"

Ahora puedes probar endpoints protegidos como `GET /user`.

---

## Decoradores Usados

### A Nivel de Controller

```typescript
@ApiTags('Auth')              // Agrupa endpoints bajo un tag
@ApiBearerAuth()              // Indica que requiere JWT
@Controller('auth')
export class AuthController { ... }
```

### A Nivel de Endpoint

```typescript
@ApiOperation({ 
  summary: 'Breve descripción',
  description: 'Descripción detallada'
})
@ApiResponse({ 
  status: 200, 
  description: 'Descripción de respuesta exitosa',
  schema: { example: { ... } }
})
@ApiUnauthorizedResponse({ description: 'Error 401' })
@ApiBadRequestResponse({ description: 'Error 400' })
```

### Query Parameters

```typescript
@ApiQuery({ 
  name: 'limit', 
  required: false, 
  type: Number, 
  description: 'Límite de resultados',
  example: 10 
})
```

---

## DTOs

Los DTOs automáticamente aparecen en Swagger gracias a `@nestjs/swagger`.

Para mejor documentación, agregar decoradores en los DTOs:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuthDto {
  @ApiProperty({ 
    description: 'Email del usuario',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Contraseña (mínimo 6 caracteres)',
    example: 'password123',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  password: string;
}
```

---

## Ejemplos de Respuesta

### POST /auth/signup

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "USER"
}
```

**Response (201):**
```json
{
  "message": "Usuario registrado correctamente"
}
```

### POST /auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "role": "USER"
  }
}
```

### GET /user?limit=10&offset=0

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "role": "USER",
      "authId": "auth-uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200    | OK - Request exitoso |
| 201    | Created - Recurso creado |
| 400    | Bad Request - Datos inválidos |
| 401    | Unauthorized - No autenticado |
| 403    | Forbidden - Sin permisos |
| 404    | Not Found - Recurso no encontrado |
| 409    | Conflict - Conflicto (ej: email duplicado) |
| 500    | Internal Server Error |

---

## Testing con Swagger UI

Swagger UI permite probar la API directamente desde el navegador:

1. Expandir endpoint
2. Clic en "Try it out"
3. Completar parámetros/body
4. Clic en "Execute"
5. Ver respuesta

---

## Exportar Especificación OpenAPI

Para obtener el JSON de OpenAPI:

```bash
curl http://localhost:3000/docs-json > openapi.json
```

Este JSON puede usarse con:
- Generadores de clientes (openapi-generator, swagger-codegen)
- Testing automatizado (Postman, Insomnia)
- Documentación externa

---

## Mejores Prácticas

✅ **Usar decoradores en todos los endpoints**
- `@ApiOperation()` - Descripción clara
- `@ApiResponse()` - Todas las respuestas posibles
- `@ApiQuery/ApiParam()` - Documentar parámetros

✅ **Ejemplos realistas**
- Usar datos de ejemplo significativos
- Mostrar estructura completa de respuesta

✅ **Documentar errores**
- Incluir todos los códigos de error posibles
- Describir cuándo ocurre cada error

✅ **Agrupar con tags**
- Organizar endpoints por funcionalidad
- Usar nombres descriptivos

---

**Para más información sobre Swagger en NestJS:**
- [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

