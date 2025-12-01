import { Test, type TestingModule } from "@nestjs/testing";
import { UserRole } from "../../../../../common/types";
import { CreateUserUseCase } from "../../../../users/application/use-cases/create-user.use-case";
import { User } from "../../../../users/domain/entities/user.entity";
import { CreateAuthUseCase } from "../../../application/use-cases/create-auth.use-case";
import { Auth } from "../../../domain/entities/auth.entity";
import {
	AUTH_REPOSITORY,
	type IAuthRepository,
} from "../../../domain/repositories/auth.repository.interface";
import { PASSWORD_SERVICE, type IPasswordService } from "../../../domain/services/password.service";

describe("CreateAuthUseCase", () => {
	let useCase: CreateAuthUseCase;
	let authRepository: jest.Mocked<IAuthRepository>;
	let passwordService: jest.Mocked<IPasswordService>;
	let createUserUseCase: jest.Mocked<CreateUserUseCase>;

	beforeEach(async () => {
		const mockAuthRepository: Partial<jest.Mocked<IAuthRepository>> = {
			create: jest.fn(),
		};

		const mockPasswordService: Partial<jest.Mocked<IPasswordService>> = {
			validate: jest.fn(),
			hash: jest.fn(),
		};

		const mockCreateUserUseCase = {
			execute: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CreateAuthUseCase,
				{
					provide: AUTH_REPOSITORY,
					useValue: mockAuthRepository,
				},
				{
					provide: PASSWORD_SERVICE,
					useValue: mockPasswordService,
				},
				{
					provide: CreateUserUseCase,
					useValue: mockCreateUserUseCase,
				},
			],
		}).compile();

		useCase = module.get<CreateAuthUseCase>(CreateAuthUseCase);
		authRepository = module.get(AUTH_REPOSITORY);
		passwordService = module.get(PASSWORD_SERVICE);
		createUserUseCase = module.get(CreateUserUseCase);
	});

	it("should be defined", () => {
		expect(useCase).toBeDefined();
	});

	describe("execute", () => {
		const command = {
			email: "test@example.com",
			password: "password123",
			name: "John Doe",
			role: UserRole.USER,
		};

		it("should create auth and user successfully", async () => {
			const hashedPassword = "hashed_password";
			const createdAuth = Auth.create("auth-id", command.email, hashedPassword);
			const createdUser = User.create("user-id", command.name, "auth-id", UserRole.USER);

			passwordService.validate.mockReturnValue(true);
			passwordService.hash.mockResolvedValue(hashedPassword);
			authRepository.create.mockResolvedValue(createdAuth);
			createUserUseCase.execute.mockResolvedValue(createdUser);

			const result = await useCase.execute(command);

			expect(result).toBeInstanceOf(Auth);
			expect(result.email).toBe(command.email);
			expect(passwordService.validate).toHaveBeenCalledWith(command.password);
			expect(passwordService.hash).toHaveBeenCalledWith(command.password);
			expect(authRepository.create).toHaveBeenCalledWith(expect.any(Auth), undefined);
			expect(createUserUseCase.execute).toHaveBeenCalledWith(
				expect.objectContaining({
					name: command.name,
					authId: createdAuth.id,
					role: command.role,
				}),
				undefined
			);
		});

		it("should throw error when password is invalid", async () => {
			passwordService.validate.mockReturnValue(false);

			await expect(useCase.execute(command)).rejects.toThrow(
				"La contraseña debe tener al menos 6 caracteres"
			);

			expect(authRepository.create).not.toHaveBeenCalled();
			expect(createUserUseCase.execute).not.toHaveBeenCalled();
		});

		it("should use default USER role when role is not provided", async () => {
			const commandWithoutRole = {
				email: "test@example.com",
				password: "password123",
				name: "John Doe",
			};

			const hashedPassword = "hashed_password";
			const createdAuth = Auth.create("auth-id", commandWithoutRole.email, hashedPassword);
			const createdUser = User.create("user-id", commandWithoutRole.name, "auth-id", UserRole.USER);

			passwordService.validate.mockReturnValue(true);
			passwordService.hash.mockResolvedValue(hashedPassword);
			authRepository.create.mockResolvedValue(createdAuth);
			createUserUseCase.execute.mockResolvedValue(createdUser);

			await useCase.execute(commandWithoutRole);

			expect(createUserUseCase.execute).toHaveBeenCalledWith(
				expect.objectContaining({
					role: UserRole.USER,
				}),
				undefined
			);
		});

		it("should propagate transaction to repository and createUserUseCase", async () => {
			const mockTransaction = { id: "transaction-id" };
			const hashedPassword = "hashed_password";
			const createdAuth = Auth.create("auth-id", command.email, hashedPassword);
			const createdUser = User.create("user-id", command.name, "auth-id", UserRole.USER);

			passwordService.validate.mockReturnValue(true);
			passwordService.hash.mockResolvedValue(hashedPassword);
			authRepository.create.mockResolvedValue(createdAuth);
			createUserUseCase.execute.mockResolvedValue(createdUser);

			await useCase.execute(command, mockTransaction);

			expect(authRepository.create).toHaveBeenCalledWith(expect.any(Auth), mockTransaction);
			expect(createUserUseCase.execute).toHaveBeenCalledWith(expect.any(Object), mockTransaction);
		});
	});
});
