import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { GetAllUsersUseCase } from '../../modules/users/application/use-cases/get-all-users.use-case';
import { UpdateUserUseCase } from '../../modules/users/application/use-cases/update-user.use-case';
import { UpdateUserDto } from '../../modules/users/application/dto/update-user.dto';
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
  async findAll() {
    const users = await this.getAllUsersUseCase.execute();
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      authId: user.authId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
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

