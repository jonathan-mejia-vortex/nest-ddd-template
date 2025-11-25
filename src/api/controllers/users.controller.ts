import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GetAllUsersUseCase } from '../../modules/users/application/use-cases/get-all-users.use-case';
import { UpdateUserUseCase } from '../../modules/users/application/use-cases/update-user.use-case';
import { UpdateUserDto } from '../../modules/users/application/dto/update-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { ROLE } from '../../common/types';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('user')
export class UsersController {
  constructor(
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([ROLE.ADMIN])
  @Get()
  @ApiOperation({ 
    summary: 'Obtener todos los usuarios (paginado)',
    description: 'Solo accesible para usuarios con rol ADMIN'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Cantidad de resultados (max 100)', example: 10 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset para paginación', example: 0 })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de usuarios paginada',
    schema: {
      example: {
        data: [
          {
            id: 'uuid',
            name: 'John Doe',
            role: 'USER',
            authId: 'auth-uuid',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        pagination: {
          total: 100,
          limit: 10,
          offset: 0,
          hasMore: true
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos (requiere rol ADMIN)' })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    const result = await this.getAllUsersUseCase.execute({
      limit: paginationQuery.limit || 10,
      offset: paginationQuery.offset || 0,
    });

    return {
      data: result.data.map((user) => ({
        id: user.id,
        name: user.name,
        role: user.role,
        authId: user.authId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      pagination: {
        total: result.total,
        limit: paginationQuery.limit || 10,
        offset: paginationQuery.offset || 0,
        hasMore: result.hasMore,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  @ApiOperation({ 
    summary: 'Actualizar usuario actual',
    description: 'Actualiza los datos del usuario autenticado'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuario actualizado',
    schema: {
      example: { message: 'Usuario actualizado correctamente' }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async update(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const id = req.user.id;
    await this.updateUserUseCase.execute({
      id,
      ...updateUserDto,
    });
    return { message: 'Usuario actualizado correctamente' };
  }
}

