import { User } from '../entities/user.entity';

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

export interface IUserRepository {
  create(user: User, transaction?: any): Promise<User>;
  update(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByAuthId(authId: string): Promise<User | null>;
  findAll(options?: PaginationOptions): Promise<PaginatedResult<User>>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
