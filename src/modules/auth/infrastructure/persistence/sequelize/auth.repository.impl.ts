import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Auth } from '../../../domain/entities/auth.entity';
import { AuthNotFoundException } from '../../../domain/exceptions/auth-not-found.exception';
import { EmailAlreadyExistsException } from '../../../domain/exceptions/email-already-exists.exception';
import { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { UserSequelizeEntity } from '../../../../users/infrastructure/persistence/sequelize/user.sequelize.entity';
import { AuthSequelizeEntity } from './auth.sequelize.entity';

@Injectable()
export class AuthRepositoryImpl implements IAuthRepository {
  constructor(
    @InjectModel(AuthSequelizeEntity)
    private readonly authModel: typeof AuthSequelizeEntity,
  ) {}

  async create(auth: Auth, transaction?: any): Promise<Auth> {
    try {
      const created = await this.authModel.create(
        {
          id: auth.id,
          email: auth.email,
          password: auth.password,
        },
        transaction ? { transaction } : undefined,
      );

      return Auth.fromPersistence({
        id: created.id,
        email: created.email,
        password: created.password,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new EmailAlreadyExistsException(auth.email);
      }
      throw new Error(`Error al crear auth: ${error.message}`);
    }
  }

  async findById(id: string): Promise<Auth | null> {
    const found = await this.authModel.findByPk(id, {
      include: [{ model: UserSequelizeEntity, as: 'user' }],
    });

    if (!found) {
      return null;
    }

    return Auth.fromPersistence({
      id: found.id,
      email: found.email,
      password: found.password,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    });
  }

  async findByEmail(email: string): Promise<Auth | null> {
    const found = await this.authModel.findOne({
      where: { email },
      include: [{ model: UserSequelizeEntity, as: 'user' }],
    });

    if (!found) {
      return null;
    }

    return Auth.fromPersistence({
      id: found.id,
      email: found.email,
      password: found.password,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    });
  }

  async findAll(): Promise<Auth[]> {
    const auths = await this.authModel.findAll();

    return auths.map((auth) =>
      Auth.fromPersistence({
        id: auth.id,
        email: auth.email,
        password: auth.password,
        createdAt: auth.createdAt,
        updatedAt: auth.updatedAt,
      }),
    );
  }
}

