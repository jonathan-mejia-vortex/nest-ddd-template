import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { GetAllUsersUseCase } from '../../modules/users/application/use-cases/get-all-users.use-case';
import { UpdateUserUseCase } from '../../modules/users/application/use-cases/update-user.use-case';
import { UpdateUserDto } from '../../modules/users/application/dto/update-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { ROLE } from '../../common/types';

@Controller('user')
export class UsersController {
  constructor(
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([ROLE.ADMIN])
  @Get()
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
  async update(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const id = req.user.id;
    await this.updateUserUseCase.execute({
      id,
      ...updateUserDto,
    });
    return { message: 'Usuario actualizado correctamente' };
  }
}

