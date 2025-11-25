import { Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
  PaginatedResult,
  PaginationOptions,
} from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class GetAllUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(options?: PaginationOptions): Promise<PaginatedResult<User>> {
    return await this.userRepository.findAll(options);
  }
}
