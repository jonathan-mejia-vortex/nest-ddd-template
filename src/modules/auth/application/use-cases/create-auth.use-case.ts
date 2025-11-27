import { Inject, Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import {
	CreateUserCommand,
	CreateUserUseCase,
} from "../../../users/application/use-cases/create-user.use-case";
import { UserRole } from "../../../users/domain/entities/user.entity";
import { Auth } from "../../domain/entities/auth.entity";
import {
	AUTH_REPOSITORY,
	type IAuthRepository,
} from "../../domain/repositories/auth.repository.interface";
import { PASSWORD_SERVICE, type IPasswordService } from "../../domain/services/password.service";

export interface CreateAuthCommand {
	email: string;
	password: string;
	name: string;
	role?: UserRole;
}

@Injectable()
export class CreateAuthUseCase {
	constructor(
		@Inject(AUTH_REPOSITORY)
		private readonly authRepository: IAuthRepository,
		@Inject(PASSWORD_SERVICE)
		private readonly passwordService: IPasswordService,
		private readonly createUserUseCase: CreateUserUseCase
	) {}

	async execute(command: CreateAuthCommand, transaction?: unknown): Promise<Auth> {
		// Validar password
		if (!this.passwordService.validate(command.password)) {
			throw new Error("La contraseña debe tener al menos 6 caracteres");
		}

		// Hash del password
		const hashedPassword = await this.passwordService.hash(command.password);

		// Crear auth
		const auth = Auth.create(uuidv4(), command.email, hashedPassword);

		const createdAuth = await this.authRepository.create(auth, transaction);

		// Crear usuario asociado
		const createUserCommand: CreateUserCommand = {
			name: command.name,
			authId: createdAuth.id,
			role: command.role || UserRole.USER,
		};

		await this.createUserUseCase.execute(createUserCommand, transaction);

		return createdAuth;
	}
}
