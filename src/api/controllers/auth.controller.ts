import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateAuthUseCase } from '../../modules/auth/application/use-cases/create-auth.use-case';
import { ValidateUserUseCase } from '../../modules/auth/application/use-cases/validate-user.use-case';
import { LoginUseCase } from '../../modules/auth/application/use-cases/login.use-case';
import { CreateAuthDto } from '../../modules/auth/application/dto/create-auth.dto';
import { LoginDto } from '../../modules/auth/application/dto/login.dto';
import { TransactionService } from '../../shared/infrastructure/persistence/transaction.service';

/**
 * AuthController - Controlador delgado sin Passport
 * Login y signup manuales con casos de uso
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly createAuthUseCase: CreateAuthUseCase,
    private readonly validateUserUseCase: ValidateUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly transactionService: TransactionService,
  ) {}

  @Post('/signup')
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea un nuevo usuario con credenciales de autenticación',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado correctamente',
    schema: {
      example: { message: 'Usuario registrado correctamente' },
    },
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email ya existe' })
  async create(@Body() createAuthDto: CreateAuthDto) {
    return await this.transactionService.runInTransaction(async (tx) => {
      await this.createAuthUseCase.execute(
        {
          email: createAuthDto.email,
          password: createAuthDto.password,
          name: createAuthDto.name,
          role: createAuthDto.role,
        },
        tx,
      );
      return { message: 'Usuario registrado correctamente' };
    });
  }

  /**
   * Login sin Passport - Validación manual con casos de uso
   */
  @HttpCode(200)
  @Post('/login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autenticación con email y contraseña. Retorna token JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid',
          name: 'John Doe',
          role: 'USER',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    // Validar credenciales
    const user = await this.validateUserUseCase.execute({
      email: loginDto.email,
      password: loginDto.password,
    });

    // Generar token JWT
    return await this.loginUseCase.execute(user);
  }
}
