import { Module } from "@nestjs/common";
import { UserRepositoryImpl } from "./infrastructure/persistence/prisma/user.repository.impl";
import { USER_REPOSITORY } from "./domain/repositories/user.repository.interface";
import { CreateUserUseCase } from "./application/use-cases/create-user.use-case";
import { UpdateUserUseCase } from "./application/use-cases/update-user.use-case";
import { GetAllUsersUseCase } from "./application/use-cases/get-all-users.use-case";
import { GetUserByIdUseCase } from "./application/use-cases/get-user-by-id.use-case";

@Module({
	providers: [
		{
			provide: USER_REPOSITORY,
			useClass: UserRepositoryImpl,
		},
		CreateUserUseCase,
		UpdateUserUseCase,
		GetAllUsersUseCase,
		GetUserByIdUseCase,
	],
	exports: [
		USER_REPOSITORY,
		CreateUserUseCase,
		UpdateUserUseCase,
		GetAllUsersUseCase,
		GetUserByIdUseCase,
	],
})
export class UserModule {}
