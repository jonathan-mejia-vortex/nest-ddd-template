import { Test, type TestingModule } from "@nestjs/testing";
import { UserRole } from "../../../../../common/types";
import { UpdateUserUseCase } from "../../../application/use-cases/update-user.use-case";
import { User } from "../../../domain/entities/user.entity";
import { UserNotFoundException } from "../../../domain/exceptions/user-not-found.exception";
import {
	type IUserRepository,
	USER_REPOSITORY,
} from "../../../domain/repositories/user.repository.interface";

describe("UpdateUserUseCase", () => {
	let useCase: UpdateUserUseCase;
	let userRepository: jest.Mocked<IUserRepository>;

	beforeEach(async () => {
		const mockUserRepository: Partial<jest.Mocked<IUserRepository>> = {
			findById: jest.fn(),
			update: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UpdateUserUseCase,
				{
					provide: USER_REPOSITORY,
					useValue: mockUserRepository,
				},
			],
		}).compile();

		useCase = module.get<UpdateUserUseCase>(UpdateUserUseCase);
		userRepository = module.get(USER_REPOSITORY);
	});

	it("should be defined", () => {
		expect(useCase).toBeDefined();
	});

	describe("execute", () => {
		it("should update user name successfully", async () => {
			const userId = "user-id";
			const user = User.create(userId, "Old Name", "auth-id", UserRole.USER);

			userRepository.findById.mockResolvedValue(user);
			userRepository.update.mockResolvedValue();

			await useCase.execute({ id: userId, name: "New Name" });

			expect(user.name).toBe("New Name");
			expect(userRepository.findById).toHaveBeenCalledWith(userId);
			expect(userRepository.update).toHaveBeenCalledWith(user);
		});

		it("should update user role successfully", async () => {
			const userId = "user-id";
			const user = User.create(userId, "John Doe", "auth-id", UserRole.USER);

			userRepository.findById.mockResolvedValue(user);
			userRepository.update.mockResolvedValue();

			await useCase.execute({ id: userId, role: UserRole.ADMIN });

			expect(user.role).toBe(UserRole.ADMIN);
			expect(userRepository.update).toHaveBeenCalledWith(user);
		});

		it("should update both name and role", async () => {
			const userId = "user-id";
			const user = User.create(userId, "Old Name", "auth-id", UserRole.USER);

			userRepository.findById.mockResolvedValue(user);
			userRepository.update.mockResolvedValue();

			await useCase.execute({
				id: userId,
				name: "New Name",
				role: UserRole.ADMIN,
			});

			expect(user.name).toBe("New Name");
			expect(user.role).toBe(UserRole.ADMIN);
			expect(userRepository.update).toHaveBeenCalledWith(user);
		});

		it("should throw UserNotFoundException when user is not found", async () => {
			const userId = "non-existent-id";

			userRepository.findById.mockResolvedValue(null);

			await expect(useCase.execute({ id: userId, name: "New Name" })).rejects.toThrow(
				UserNotFoundException
			);
			expect(userRepository.update).not.toHaveBeenCalled();
		});

		it("should not update if no fields are provided", async () => {
			const userId = "user-id";
			const user = User.create(userId, "John Doe", "auth-id", UserRole.USER);

			userRepository.findById.mockResolvedValue(user);
			userRepository.update.mockResolvedValue();

			await useCase.execute({ id: userId });

			expect(user.name).toBe("John Doe");
			expect(user.role).toBe(UserRole.USER);
			expect(userRepository.update).toHaveBeenCalledWith(user);
		});
	});
});
