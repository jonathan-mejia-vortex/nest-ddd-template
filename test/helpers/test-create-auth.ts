import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/shared/infrastructure/persistence/prisma.service';
import { CreateAuthUseCase } from '../../src/modules/auth/application/use-cases/create-auth.use-case';
import { ValidateUserUseCase } from '../../src/modules/auth/application/use-cases/validate-user.use-case';
import { LoginUseCase } from '../../src/modules/auth/application/use-cases/login.use-case';
import { UserRole } from '../../src/modules/users/domain/entities/user.entity';

/**
 * @description Crea un auth y retorna el token JWT
 * @example createAuthAndGetToken(prisma, app, 'ADMIN')
 */
export async function createAuthAndGetToken(
  prisma: PrismaService,
  app: INestApplication,
  role: UserRole,
): Promise<string> {
  const createAuthUseCase = app.get(CreateAuthUseCase);
  const validateUserUseCase = app.get(ValidateUserUseCase);
  const loginUseCase = app.get(LoginUseCase);

  const email = `${role.toLowerCase()}@gmail.com`;
  const password = '123123123';

  // Usar transacción de Prisma
  await prisma.$transaction(async (tx) => {
    await createAuthUseCase.execute(
      {
        email,
        password,
        name: 'test',
        role,
      },
      tx,
    );
  });

  const user = await validateUserUseCase.execute({ email, password });
  const loginResponse = await loginUseCase.execute(user);

  return loginResponse.token;
}
