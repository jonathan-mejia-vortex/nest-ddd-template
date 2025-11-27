import { Inject, Injectable } from "@nestjs/common";
import type { User } from "../../../users/domain/entities/user.entity";
import {
	USER_REPOSITORY,
	type IUserRepository,
} from "../../../users/domain/repositories/user.repository.interface";
import { AuthNotFoundException } from "../../domain/exceptions/auth-not-found.exception";
import { InvalidCredentialsException } from "../../domain/exceptions/invalid-credentials.exception";
import {
	AUTH_REPOSITORY,
	type IAuthRepository,
} from "../../domain/repositories/auth.repository.interface";
import { PASSWORD_SERVICE, type IPasswordService } from "../../domain/services/password.service";

export interface ValidateUserCommand {
	email: string;
	password: string;
}

@Injectable()
export class ValidateUserUseCase {
	constructor(
		@Inject(AUTH_REPOSITORY)
		private readonly authRepository: IAuthRepository,
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
		@Inject(PASSWORD_SERVICE)
		private readonly passwordService: IPasswordService
	) {}

	async execute(command: ValidateUserCommand): Promise<User> {
		// Buscar auth por email
		const auth = await this.authRepository.findByEmail(command.email);

		if (!auth) {
			throw new AuthNotFoundException(command.email);
		}

		// Validar password
		const isValid = await this.passwordService.compare(command.password, auth.password);

		if (!isValid) {
			throw new InvalidCredentialsException();
		}

		// Buscar usuario asociado
		const user = await this.userRepository.findByAuthId(auth.id);

		if (!user) {
			throw new Error("Usuario no encontrado");
		}

		return user;
	}
}
