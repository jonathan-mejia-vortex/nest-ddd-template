import { User } from '../entities/user.entity';

export interface IUserRepository {
  create(user: User, transaction?: any): Promise<User>;
  update(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByAuthId(authId: string): Promise<User | null>;
  findAll(): Promise<User[]>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

