import { Inject, Injectable } from '@nestjs/common';
import { UserRole } from '../../domain/entities/user.entity';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

export interface UpdateUserCommand {
  id: string;
  name?: string;
  role?: UserRole;
}

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: UpdateUserCommand): Promise<void> {
    const user = await this.userRepository.findById(command.id);

    if (!user) {
      throw new UserNotFoundException(command.id);
    }

    if (command.name) {
      user.changeName(command.name);
    }

    if (command.role) {
      user.changeRole(command.role);
    }

    await this.userRepository.update(user);
  }
}
