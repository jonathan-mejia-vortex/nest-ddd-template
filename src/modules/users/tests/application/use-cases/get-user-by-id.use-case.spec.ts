import { Test, type TestingModule } from "@nestjs/testing";
import { UserRole } from "../../../../../common/types";
import { GetUserByIdUseCase } from "../../../application/use-cases/get-user-by-id.use-case";
import { User } from "../../../domain/entities/user.entity";
import { UserNotFoundException } from "../../../domain/exceptions/user-not-found.exception";
import {
	type IUserRepository,
	USER_REPOSITORY,
} from "../../../domain/repositories/user.repository.interface";

describe("GetUserByIdUseCase", () => {
	let useCase: GetUserByIdUseCase;
	let userRepository: jest.Mocked<IUserRepository>;

	beforeEach(async () => {
		const mockUserRepository: Partial<jest.Mocked<IUserRepository>> = {
			findById: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				GetUserByIdUseCase,
				{
					provide: USER_REPOSITORY,
					useValue: mockUserRepository,
				},
			],
		}).compile();

		useCase = module.get<GetUserByIdUseCase>(GetUserByIdUseCase);
		userRepository = module.get(USER_REPOSITORY);
	});

	it("should be defined", () => {
		expect(useCase).toBeDefined();
	});

	describe("execute", () => {
		it("should return user when found", async () => {
			const userId = "user-id";
			const expectedUser = User.create(userId, "John Doe", "auth-id", UserRole.USER);

			userRepository.findById.mockResolvedValue(expectedUser);

			const result = await useCase.execute(userId);

			expect(result).toBeInstanceOf(User);
			expect(result.id).toBe(userId);
			expect(userRepository.findById).toHaveBeenCalledWith(userId);
		});

		it("should throw UserNotFoundException when user is not found", async () => {
			const userId = "non-existent-id";

			userRepository.findById.mockResolvedValue(null);

			await expect(useCase.execute(userId)).rejects.toThrow(UserNotFoundException);
			expect(userRepository.findById).toHaveBeenCalledWith(userId);
		});
	});
});
