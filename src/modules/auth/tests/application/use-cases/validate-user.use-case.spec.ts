import { Test, type TestingModule } from "@nestjs/testing";
import { UserRole } from "../../../../../common/types";
import { User } from "../../../../users/domain/entities/user.entity";
import {
	USER_REPOSITORY,
	type IUserRepository,
} from "../../../../users/domain/repositories/user.repository.interface";
import { ValidateUserUseCase } from "../../../application/use-cases/validate-user.use-case";
import { Auth } from "../../../domain/entities/auth.entity";
import { AuthNotFoundException } from "../../../domain/exceptions/auth-not-found.exception";
import { InvalidCredentialsException } from "../../../domain/exceptions/invalid-credentials.exception";
import {
	AUTH_REPOSITORY,
	type IAuthRepository,
} from "../../../domain/repositories/auth.repository.interface";
import { PASSWORD_SERVICE, type IPasswordService } from "../../../domain/services/password.service";

describe("ValidateUserUseCase", () => {
	let useCase: ValidateUserUseCase;
	let authRepository: jest.Mocked<IAuthRepository>;
	let userRepository: jest.Mocked<IUserRepository>;
	let passwordService: jest.Mocked<IPasswordService>;

	beforeEach(async () => {
		const mockAuthRepository: Partial<jest.Mocked<IAuthRepository>> = {
			findByEmail: jest.fn(),
		};

		const mockUserRepository: Partial<jest.Mocked<IUserRepository>> = {
			findByAuthId: jest.fn(),
		};

		const mockPasswordService: Partial<jest.Mocked<IPasswordService>> = {
			compare: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ValidateUserUseCase,
				{
					provide: AUTH_REPOSITORY,
					useValue: mockAuthRepository,
				},
				{
					provide: USER_REPOSITORY,
					useValue: mockUserRepository,
				},
				{
					provide: PASSWORD_SERVICE,
					useValue: mockPasswordService,
				},
			],
		}).compile();

		useCase = module.get<ValidateUserUseCase>(ValidateUserUseCase);
		authRepository = module.get(AUTH_REPOSITORY);
		userRepository = module.get(USER_REPOSITORY);
		passwordService = module.get(PASSWORD_SERVICE);
	});

	it("should be defined", () => {
		expect(useCase).toBeDefined();
	});

	describe("execute", () => {
		const command = {
			email: "test@example.com",
			password: "password123",
		};

		it("should return user when credentials are valid", async () => {
			const auth = Auth.create("auth-id", command.email, "hashed_password");
			const expectedUser = User.create("user-id", "John Doe", "auth-id", UserRole.USER);

			authRepository.findByEmail.mockResolvedValue(auth);
			passwordService.compare.mockResolvedValue(true);
			userRepository.findByAuthId.mockResolvedValue(expectedUser);

			const result = await useCase.execute(command);

			expect(result).toBeInstanceOf(User);
			expect(result.id).toBe(expectedUser.id);
			expect(authRepository.findByEmail).toHaveBeenCalledWith(command.email);
			expect(passwordService.compare).toHaveBeenCalledWith(command.password, auth.password);
			expect(userRepository.findByAuthId).toHaveBeenCalledWith(auth.id);
		});

		it("should throw AuthNotFoundException when email is not found", async () => {
			authRepository.findByEmail.mockResolvedValue(null);

			await expect(useCase.execute(command)).rejects.toThrow(AuthNotFoundException);
			expect(passwordService.compare).not.toHaveBeenCalled();
			expect(userRepository.findByAuthId).not.toHaveBeenCalled();
		});

		it("should throw InvalidCredentialsException when password is incorrect", async () => {
			const auth = Auth.create("auth-id", command.email, "hashed_password");

			authRepository.findByEmail.mockResolvedValue(auth);
			passwordService.compare.mockResolvedValue(false);

			await expect(useCase.execute(command)).rejects.toThrow(InvalidCredentialsException);
			expect(userRepository.findByAuthId).not.toHaveBeenCalled();
		});

		it("should throw error when user is not found for valid auth", async () => {
			const auth = Auth.create("auth-id", command.email, "hashed_password");

			authRepository.findByEmail.mockResolvedValue(auth);
			passwordService.compare.mockResolvedValue(true);
			userRepository.findByAuthId.mockResolvedValue(null);

			await expect(useCase.execute(command)).rejects.toThrow("Usuario no encontrado");
		});
	});
});
