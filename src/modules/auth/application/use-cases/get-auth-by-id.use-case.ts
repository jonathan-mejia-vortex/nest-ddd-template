import { Inject, Injectable } from "@nestjs/common";
import type { Auth } from "../../domain/entities/auth.entity";
import { AuthNotFoundException } from "../../domain/exceptions/auth-not-found.exception";
import {
	AUTH_REPOSITORY,
	type IAuthRepository,
} from "../../domain/repositories/auth.repository.interface";

@Injectable()
export class GetAuthByIdUseCase {
	constructor(
		@Inject(AUTH_REPOSITORY)
		private readonly authRepository: IAuthRepository
	) {}

	async execute(id: string): Promise<Auth> {
		const auth = await this.authRepository.findById(id);

		if (!auth) {
			throw new AuthNotFoundException(id);
		}

		return auth;
	}
}
