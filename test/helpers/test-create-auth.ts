import { Sequelize } from 'sequelize-typescript';
import { INestApplication } from '@nestjs/common';
import { CreateAuthUseCase } from '../../src/modules/auth/application/use-cases/create-auth.use-case';
import { ValidateUserUseCase } from '../../src/modules/auth/application/use-cases/validate-user.use-case';
import { LoginUseCase } from '../../src/modules/auth/application/use-cases/login.use-case';
import { UserRole } from '../../src/modules/users/domain/entities/user.entity';

/**
 * @description Creates email with the role that come in the params.
 * For example, it will be admin@gmail.com or employee@gmail.com with the same password 123123123
 */
export async function createAuthAndGetToken(
  sequelize: Sequelize,
  app: INestApplication,
  role: string,
): Promise<string> {
  const createAuthUseCase = app.get(CreateAuthUseCase);
  const validateUserUseCase = app.get(ValidateUserUseCase);
  const loginUseCase = app.get(LoginUseCase);

  const transaction: any = await sequelize.transaction();
  const email = `${role}@gmail.com`;
  const password = '123123123';

  await createAuthUseCase.execute(
    {
      email,
      password,
      name: 'test',
      role: role.toUpperCase() as UserRole,
    },
    { transaction },
  );
  await transaction.commit();

  const user = await validateUserUseCase.execute({ email, password });
  const loginResponse = await loginUseCase.execute(user);

  return loginResponse.token;
}
