import { Inject, Injectable } from "@nestjs/common";
import type { User } from "../../domain/entities/user.entity";
import {
	USER_REPOSITORY,
	type IUserRepository,
	type PaginatedResult,
	type PaginationOptions,
} from "../../domain/repositories/user.repository.interface";

@Injectable()
export class GetAllUsersUseCase {
	private readonly userRepository: IUserRepository;

	constructor(
		@Inject(USER_REPOSITORY)
		userRepository: IUserRepository
	) {
		this.userRepository = userRepository;
	}

	async execute(options?: PaginationOptions): Promise<PaginatedResult<User>> {
		return await this.userRepository.findAll(options);
	}
}
