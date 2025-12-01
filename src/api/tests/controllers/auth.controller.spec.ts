import { Test, type TestingModule } from "@nestjs/testing";
import { UserRole } from "../../../common/types";
import { CreateAuthUseCase } from "../../../modules/auth/application/use-cases/create-auth.use-case";
import { LoginUseCase } from "../../../modules/auth/application/use-cases/login.use-case";
import { ValidateUserUseCase } from "../../../modules/auth/application/use-cases/validate-user.use-case";
import { Auth } from "../../../modules/auth/domain/entities/auth.entity";
import { User } from "../../../modules/users/domain/entities/user.entity";
import { TransactionService } from "../../../shared/infrastructure/persistence/transaction.service";
import { AuthController } from "../../controllers/auth.controller";

describe("AuthController", () => {
	let controller: AuthController;
	let createAuthUseCase: jest.Mocked<CreateAuthUseCase>;
	let validateUserUseCase: jest.Mocked<ValidateUserUseCase>;
	let loginUseCase: jest.Mocked<LoginUseCase>;
	let transactionService: jest.Mocked<TransactionService>;

	beforeEach(async () => {
		const mockCreateAuthUseCase = {
			execute: jest.fn(),
		};

		const mockValidateUserUseCase = {
			execute: jest.fn(),
		};

		const mockLoginUseCase = {
			execute: jest.fn(),
		};

		const mockTransactionService = {
			runInTransaction: jest.fn((fn) => fn({})),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: CreateAuthUseCase,
					useValue: mockCreateAuthUseCase,
				},
				{
					provide: ValidateUserUseCase,
					useValue: mockValidateUserUseCase,
				},
				{
					provide: LoginUseCase,
					useValue: mockLoginUseCase,
				},
				{
					provide: TransactionService,
					useValue: mockTransactionService,
				},
			],
		}).compile();

		controller = module.get<AuthController>(AuthController);
		createAuthUseCase = module.get(CreateAuthUseCase);
		validateUserUseCase = module.get(ValidateUserUseCase);
		loginUseCase = module.get(LoginUseCase);
		transactionService = module.get(TransactionService);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("create (signup)", () => {
		it("should create a new user successfully", async () => {
			const createAuthDto = {
				email: "test@example.com",
				password: "password123",
				name: "John Doe",
			};

			const createdAuth = Auth.create("auth-id", createAuthDto.email, "hashed_password");
			createAuthUseCase.execute.mockResolvedValue(createdAuth);

			const result = await controller.create(createAuthDto);

			expect(result).toEqual({ message: "Usuario registrado correctamente" });
			expect(transactionService.runInTransaction).toHaveBeenCalled();
			expect(createAuthUseCase.execute).toHaveBeenCalledWith(
				expect.objectContaining({
					email: createAuthDto.email,
					password: createAuthDto.password,
					name: createAuthDto.name,
				}),
				expect.anything()
			);
		});

		it("should create user with specified role", async () => {
			const createAuthDto = {
				email: "admin@example.com",
				password: "password123",
				name: "Admin User",
				role: UserRole.ADMIN,
			};

			const createdAuth = Auth.create("auth-id", createAuthDto.email, "hashed_password");
			createAuthUseCase.execute.mockResolvedValue(createdAuth);

			await controller.create(createAuthDto);

			expect(createAuthUseCase.execute).toHaveBeenCalledWith(
				expect.objectContaining({
					role: UserRole.ADMIN,
				}),
				expect.anything()
			);
		});
	});

	describe("login", () => {
		it("should return token for valid credentials", async () => {
			const loginDto = {
				email: "test@example.com",
				password: "password123",
			};

			const user = User.create("user-id", "John Doe", "auth-id", UserRole.USER);
			const loginResponse = { token: "jwt-token" };

			validateUserUseCase.execute.mockResolvedValue(user);
			loginUseCase.execute.mockResolvedValue(loginResponse);

			const result = await controller.login(loginDto);

			expect(result).toEqual(loginResponse);
			expect(validateUserUseCase.execute).toHaveBeenCalledWith({
				email: loginDto.email,
				password: loginDto.password,
			});
			expect(loginUseCase.execute).toHaveBeenCalledWith(user);
		});

		it("should propagate validation errors", async () => {
			const loginDto = {
				email: "test@example.com",
				password: "wrong-password",
			};

			const error = new Error("Invalid credentials");
			validateUserUseCase.execute.mockRejectedValue(error);

			await expect(controller.login(loginDto)).rejects.toThrow("Invalid credentials");
			expect(loginUseCase.execute).not.toHaveBeenCalled();
		});
	});
});
