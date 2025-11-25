import { Inject, Injectable } from '@nestjs/common';
import { User, UserRole } from '../../domain/entities/user.entity';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { v4 as uuidv4 } from 'uuid';

export interface CreateUserCommand {
  name: string;
  authId: string;
  role?: UserRole;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: CreateUserCommand, transaction?: any): Promise<User> {
    const user = User.create(
      uuidv4(),
      command.name,
      command.authId,
      command.role || UserRole.USER,
    );

    return await this.userRepository.create(user, transaction);
  }
}
