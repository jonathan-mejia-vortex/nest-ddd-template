import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../../domain/entities/user.entity';
import { UserCreationFailedException } from '../../../domain/exceptions/user-creation-failed.exception';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserSequelizeEntity } from './user.sequelize.entity';

@Injectable()
export class UserRepositoryImpl implements IUserRepository {
  constructor(
    @InjectModel(UserSequelizeEntity)
    private readonly userModel: typeof UserSequelizeEntity,
  ) {}

  async create(user: User, transaction?: any): Promise<User> {
    try {
      const created = await this.userModel.create(
        {
          id: user.id,
          name: user.name,
          authId: user.authId,
          role: user.role,
        },
        transaction ? { transaction } : undefined,
      );

      return User.fromPersistence({
        id: created.id,
        name: created.name,
        authId: created.authId,
        role: created.role,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    } catch (error) {
      throw new UserCreationFailedException(error.message);
    }
  }

  async update(user: User): Promise<void> {
    try {
      await this.userModel.update(
        {
          name: user.name,
          role: user.role,
        },
        { where: { id: user.id } },
      );
    } catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  async findById(id: string): Promise<User | null> {
    const found = await this.userModel.findByPk(id);
    if (!found) {
      return null;
    }

    return User.fromPersistence({
      id: found.id,
      name: found.name,
      authId: found.authId,
      role: found.role,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    });
  }

  async findByAuthId(authId: string): Promise<User | null> {
    const found = await this.userModel.findOne({ where: { authId } });
    if (!found) {
      return null;
    }

    return User.fromPersistence({
      id: found.id,
      name: found.name,
      authId: found.authId,
      role: found.role,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    });
  }

  async findAll(): Promise<User[]> {
    const users = await this.userModel.findAll();

    return users.map((user) =>
      User.fromPersistence({
        id: user.id,
        name: user.name,
        authId: user.authId,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }),
    );
  }
}

