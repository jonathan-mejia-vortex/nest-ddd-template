import { Test, type TestingModule } from "@nestjs/testing";
import { UserRole } from "../../../../../common/types";
import { GetAllUsersUseCase } from "../../../application/use-cases/get-all-users.use-case";
import { User } from "../../../domain/entities/user.entity";
import {
	type IUserRepository,
	type PaginatedResult,
	USER_REPOSITORY,
} from "../../../domain/repositories/user.repository.interface";

describe("GetAllUsersUseCase", () => {
	let useCase: GetAllUsersUseCase;
	let userRepository: jest.Mocked<IUserRepository>;

	beforeEach(async () => {
		const mockUserRepository: Partial<jest.Mocked<IUserRepository>> = {
			findAll: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				GetAllUsersUseCase,
				{
					provide: USER_REPOSITORY,
					useValue: mockUserRepository,
				},
			],
		}).compile();

		useCase = module.get<GetAllUsersUseCase>(GetAllUsersUseCase);
		userRepository = module.get(USER_REPOSITORY);
	});

	it("should be defined", () => {
		expect(useCase).toBeDefined();
	});

	describe("execute", () => {
		it("should return paginated users", async () => {
			const users = [
				User.create("user-1", "User One", "auth-1", UserRole.USER),
				User.create("user-2", "User Two", "auth-2", UserRole.ADMIN),
			];

			const paginatedResult: PaginatedResult<User> = {
				data: users,
				total: 2,
				hasMore: false,
			};

			userRepository.findAll.mockResolvedValue(paginatedResult);

			const result = await useCase.execute({ limit: 10, offset: 0 });

			expect(result.data).toHaveLength(2);
			expect(result.total).toBe(2);
			expect(result.hasMore).toBe(false);
			expect(userRepository.findAll).toHaveBeenCalledWith({ limit: 10, offset: 0 });
		});

		it("should return empty list when no users exist", async () => {
			const paginatedResult: PaginatedResult<User> = {
				data: [],
				total: 0,
				hasMore: false,
			};

			userRepository.findAll.mockResolvedValue(paginatedResult);

			const result = await useCase.execute({ limit: 10, offset: 0 });

			expect(result.data).toHaveLength(0);
			expect(result.total).toBe(0);
		});

		it("should indicate hasMore when more results exist", async () => {
			const users = [User.create("user-1", "User One", "auth-1", UserRole.USER)];

			const paginatedResult: PaginatedResult<User> = {
				data: users,
				total: 100,
				hasMore: true,
			};

			userRepository.findAll.mockResolvedValue(paginatedResult);

			const result = await useCase.execute({ limit: 1, offset: 0 });

			expect(result.hasMore).toBe(true);
			expect(result.total).toBe(100);
		});

		it("should work without pagination options", async () => {
			const paginatedResult: PaginatedResult<User> = {
				data: [],
				total: 0,
				hasMore: false,
			};

			userRepository.findAll.mockResolvedValue(paginatedResult);

			await useCase.execute();

			expect(userRepository.findAll).toHaveBeenCalledWith(undefined);
		});
	});
});
