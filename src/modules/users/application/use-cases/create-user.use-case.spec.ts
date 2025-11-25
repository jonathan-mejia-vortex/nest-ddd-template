import { Test, type TestingModule } from "@nestjs/testing";
import { UserRole } from "../../../../common/types";
import { User } from "../../domain/entities/user.entity";
import {
	type IUserRepository,
	USER_REPOSITORY,
} from "../../domain/repositories/user.repository.interface";
import { CreateUserUseCase } from "./create-user.use-case";

describe("CreateUserUseCase", () => {
	let useCase: CreateUserUseCase;
	let userRepository: jest.Mocked<IUserRepository>;

	beforeEach(async () => {
		const mockUserRepository: Partial<jest.Mocked<IUserRepository>> = {
			create: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CreateUserUseCase,
				{
					provide: USER_REPOSITORY,
					useValue: mockUserRepository,
				},
			],
		}).compile();

		useCase = module.get<CreateUserUseCase>(CreateUserUseCase);
		userRepository = module.get(USER_REPOSITORY);
	});

	it("should be defined", () => {
		expect(useCase).toBeDefined();
	});

	describe("execute", () => {
		it("should create a user successfully", async () => {
			const command = {
				name: "John Doe",
				authId: "auth-id",
				role: UserRole.USER,
			};

			const expectedUser = User.create(
				expect.any(String),
				command.name,
				command.authId,
				command.role
			);

			userRepository.create.mockResolvedValue(expectedUser);

			const result = await useCase.execute(command);

			expect(result).toBeInstanceOf(User);
			expect(result.name).toBe(command.name);
			expect(result.authId).toBe(command.authId);
			expect(result.role).toBe(command.role);
			expect(userRepository.create).toHaveBeenCalledTimes(1);
			expect(userRepository.create).toHaveBeenCalledWith(expect.any(User), undefined);
		});

		it("should create a user with default USER role when role is not provided", async () => {
			const command = {
				name: "John Doe",
				authId: "auth-id",
			};

			const expectedUser = User.create(
				expect.any(String),
				command.name,
				command.authId,
				UserRole.USER
			);

			userRepository.create.mockResolvedValue(expectedUser);

			const result = await useCase.execute(command);

			expect(result.role).toBe(UserRole.USER);
		});

		it("should propagate transaction to repository", async () => {
			const command = {
				name: "John Doe",
				authId: "auth-id",
				role: UserRole.USER,
			};

			const mockTransaction = { id: "transaction-id" };
			const expectedUser = User.create(
				expect.any(String),
				command.name,
				command.authId,
				command.role
			);

			userRepository.create.mockResolvedValue(expectedUser);

			await useCase.execute(command, mockTransaction);

			expect(userRepository.create).toHaveBeenCalledWith(expect.any(User), mockTransaction);
		});
	});
});
