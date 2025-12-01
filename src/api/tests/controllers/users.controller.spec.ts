import { Test, type TestingModule } from "@nestjs/testing";
import { UserRole } from "../../../common/types";
import { GetAllUsersUseCase } from "../../../modules/users/application/use-cases/get-all-users.use-case";
import { UpdateUserUseCase } from "../../../modules/users/application/use-cases/update-user.use-case";
import { User } from "../../../modules/users/domain/entities/user.entity";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { RolesGuard } from "../../guards/roles.guard";
import { UsersController } from "../../controllers/users.controller";

describe("UsersController", () => {
	let controller: UsersController;
	let getAllUsersUseCase: jest.Mocked<GetAllUsersUseCase>;
	let updateUserUseCase: jest.Mocked<UpdateUserUseCase>;

	beforeEach(async () => {
		const mockGetAllUsersUseCase = {
			execute: jest.fn(),
		};

		const mockUpdateUserUseCase = {
			execute: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [UsersController],
			providers: [
				{
					provide: GetAllUsersUseCase,
					useValue: mockGetAllUsersUseCase,
				},
				{
					provide: UpdateUserUseCase,
					useValue: mockUpdateUserUseCase,
				},
			],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: () => true })
			.overrideGuard(RolesGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<UsersController>(UsersController);
		getAllUsersUseCase = module.get(GetAllUsersUseCase);
		updateUserUseCase = module.get(UpdateUserUseCase);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("findAll", () => {
		it("should return paginated users", async () => {
			const users = [
				User.create("user-1", "User One", "auth-1", UserRole.USER),
				User.create("user-2", "User Two", "auth-2", UserRole.ADMIN),
			];

			getAllUsersUseCase.execute.mockResolvedValue({
				data: users,
				total: 2,
				hasMore: false,
			});

			const result = await controller.findAll({ limit: 10, offset: 0 });

			expect(result.users).toHaveLength(2);
			expect(result.pagination.total).toBe(2);
			expect(result.pagination.hasMore).toBe(false);
			expect(result.pagination.limit).toBe(10);
			expect(result.pagination.offset).toBe(0);
			expect(getAllUsersUseCase.execute).toHaveBeenCalledWith({
				limit: 10,
				offset: 0,
			});
		});

		it("should use default pagination values", async () => {
			getAllUsersUseCase.execute.mockResolvedValue({
				data: [],
				total: 0,
				hasMore: false,
			});

			const result = await controller.findAll({});

			expect(result.pagination.limit).toBe(10);
			expect(result.pagination.offset).toBe(0);
			expect(getAllUsersUseCase.execute).toHaveBeenCalledWith({
				limit: 10,
				offset: 0,
			});
		});

		it("should map user entities to response format", async () => {
			const user = User.create("user-id", "John Doe", "auth-id", UserRole.USER);

			getAllUsersUseCase.execute.mockResolvedValue({
				data: [user],
				total: 1,
				hasMore: false,
			});

			const result = await controller.findAll({ limit: 10, offset: 0 });

			expect(result.users[0]).toEqual({
				id: user.id,
				name: user.name,
				role: user.role,
				authId: user.authId,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			});
		});

		it("should indicate hasMore when more results exist", async () => {
			getAllUsersUseCase.execute.mockResolvedValue({
				data: [User.create("user-1", "User One", "auth-1", UserRole.USER)],
				total: 100,
				hasMore: true,
			});

			const result = await controller.findAll({ limit: 1, offset: 0 });

			expect(result.pagination.hasMore).toBe(true);
			expect(result.pagination.total).toBe(100);
		});
	});

	describe("update", () => {
		it("should update user successfully", async () => {
			const request = { user: { id: "user-id" } };
			const updateUserDto = { name: "New Name" };

			updateUserUseCase.execute.mockResolvedValue();

			const result = await controller.update(request, updateUserDto);

			expect(result).toEqual({ message: "Usuario actualizado correctamente" });
			expect(updateUserUseCase.execute).toHaveBeenCalledWith({
				id: "user-id",
				name: "New Name",
			});
		});

		it("should pass user id from request", async () => {
			const request = { user: { id: "another-user-id" } };
			const updateUserDto = { name: "Updated Name" };

			updateUserUseCase.execute.mockResolvedValue();

			await controller.update(request, updateUserDto);

			expect(updateUserUseCase.execute).toHaveBeenCalledWith({
				id: "another-user-id",
				name: "Updated Name",
			});
		});

		it("should propagate errors from use case", async () => {
			const request = { user: { id: "user-id" } };
			const updateUserDto = { name: "" };

			const error = new Error("Name cannot be empty");
			updateUserUseCase.execute.mockRejectedValue(error);

			await expect(controller.update(request, updateUserDto)).rejects.toThrow(
				"Name cannot be empty"
			);
		});
	});
});

