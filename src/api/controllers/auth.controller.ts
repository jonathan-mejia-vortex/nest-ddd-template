import {
  Body,
  Controller,
  HttpCode,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CreateAuthUseCase } from '../../modules/auth/application/use-cases/create-auth.use-case';
import { LoginUseCase } from '../../modules/auth/application/use-cases/login.use-case';
import { CreateAuthDto } from '../../modules/auth/application/dto/create-auth.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { TransactionService } from '../../shared/infrastructure/persistence/transaction.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly createAuthUseCase: CreateAuthUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly transactionService: TransactionService,
  ) {}

  @Post('/signup')
  async create(@Body() createAuthDto: CreateAuthDto) {
    return await this.transactionService.executeInTransaction(async (t) => {
      await this.createAuthUseCase.execute(
        {
          email: createAuthDto.email,
          password: createAuthDto.password,
          name: createAuthDto.name,
          role: createAuthDto.role,
        },
        { transaction: t },
      );
      return { message: 'Usuario registrado correctamente' };
    });
  }

  /**
   * @description Primero pasa por local strategy (validate function).
   * Luego el usuario validado se inyecta en req.user y se genera el token JWT.
   */
  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req) {
    return await this.loginUseCase.execute(req.user);
  }
}

