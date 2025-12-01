import { Test, type TestingModule } from "@nestjs/testing";
import { UserRole } from "../../../../../../common/types";
import { PrismaService } from "../../../../../../shared/infrastructure/persistence/prisma.service";
import { User } from "../../../../domain/entities/user.entity";
import { UserCreationFailedException } from "../../../../domain/exceptions/user-creation-failed.exception";
import { UserRepositoryImpl } from "../../../../infrastructure/persistence/prisma/user.repository.impl";

describe("UserRepositoryImpl", () => {
	let repository: UserRepositoryImpl;

	const mockPrismaService = {
		user: {
			create: jest.fn(),
			update: jest.fn(),
			findUnique: jest.fn(),
			findMany: jest.fn(),
			count: jest.fn(),
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserRepositoryImpl,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		repository = module.get<UserRepositoryImpl>(UserRepositoryImpl);

		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(repository).toBeDefined();
	});

	describe("create", () => {
		const user = User.create("user-id", "John Doe", "auth-id", UserRole.USER);

		it("should create user successfully", async () => {
			const createdData = {
				id: "user-id",
				name: "John Doe",
				authId: "auth-id",
				role: UserRole.USER,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockPrismaService.user.create.mockResolvedValue(createdData);

			const result = await repository.create(user);

			expect(result).toBeInstanceOf(User);
			expect(result.id).toBe(user.id);
			expect(result.name).toBe(user.name);
			expect(mockPrismaService.user.create).toHaveBeenCalledWith({
				data: {
					id: user.id,
					name: user.name,
					authId: user.authId,
					role: user.role,
				},
			});
		});

		it("should create user with transaction", async () => {
			const createdData = {
				id: "user-id",
				name: "John Doe",
				authId: "auth-id",
				role: UserRole.USER,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockTransaction = {
				user: {
					create: jest.fn().mockResolvedValue(createdData),
				},
			};

			const result = await repository.create(user, mockTransaction);

			expect(result).toBeInstanceOf(User);
			expect(mockTransaction.user.create).toHaveBeenCalledWith({
				data: {
					id: user.id,
					name: user.name,
					authId: user.authId,
					role: user.role,
				},
			});
		});

		it("should throw UserCreationFailedException on error", async () => {
			const error = new Error("Database error");
			mockPrismaService.user.create.mockRejectedValue(error);

			await expect(repository.create(user)).rejects.toThrow(UserCreationFailedException);
		});
	});

	describe("update", () => {
		it("should update user successfully", async () => {
			const user = User.create("user-id", "Updated Name", "auth-id", UserRole.ADMIN);

			mockPrismaService.user.update.mockResolvedValue({});

			await repository.update(user);

			expect(mockPrismaService.user.update).toHaveBeenCalledWith({
				where: { id: user.id },
				data: {
					name: user.name,
					role: user.role,
				},
			});
		});

		it("should throw error on update failure", async () => {
			const user = User.create("user-id", "John Doe", "auth-id", UserRole.USER);
			const error = new Error("Update failed");

			mockPrismaService.user.update.mockRejectedValue(error);

			await expect(repository.update(user)).rejects.toThrow("Error al actualizar usuario:");
		});
	});

	describe("findById", () => {
		it("should return user when found", async () => {
			const foundData = {
				id: "user-id",
				name: "John Doe",
				authId: "auth-id",
				role: UserRole.USER,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockPrismaService.user.findUnique.mockResolvedValue(foundData);

			const result = await repository.findById("user-id");

			expect(result).toBeInstanceOf(User);
			expect(result?.id).toBe("user-id");
			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { id: "user-id" },
			});
		});

		it("should return null when user is not found", async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(null);

			const result = await repository.findById("non-existent-id");

			expect(result).toBeNull();
		});
	});

	describe("findByAuthId", () => {
		it("should return user when found by authId", async () => {
			const foundData = {
				id: "user-id",
				name: "John Doe",
				authId: "auth-id",
				role: UserRole.USER,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockPrismaService.user.findUnique.mockResolvedValue(foundData);

			const result = await repository.findByAuthId("auth-id");

			expect(result).toBeInstanceOf(User);
			expect(result?.authId).toBe("auth-id");
			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { authId: "auth-id" },
			});
		});

		it("should return null when authId is not found", async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(null);

			const result = await repository.findByAuthId("non-existent-auth-id");

			expect(result).toBeNull();
		});
	});

	describe("findAll", () => {
		it("should return paginated users", async () => {
			const usersData = [
				{
					id: "user-1",
					name: "User One",
					authId: "auth-1",
					role: UserRole.USER,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "user-2",
					name: "User Two",
					authId: "auth-2",
					role: UserRole.ADMIN,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockPrismaService.user.findMany.mockResolvedValue(usersData);
			mockPrismaService.user.count.mockResolvedValue(2);

			const result = await repository.findAll({ limit: 10, offset: 0 });

			expect(result.data).toHaveLength(2);
			expect(result.total).toBe(2);
			expect(result.hasMore).toBe(false);
			expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
				take: 10,
				skip: 0,
				orderBy: { createdAt: "desc" },
			});
		});

		it("should indicate hasMore when more results exist", async () => {
			const usersData = [
				{
					id: "user-1",
					name: "User One",
					authId: "auth-1",
					role: UserRole.USER,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockPrismaService.user.findMany.mockResolvedValue(usersData);
			mockPrismaService.user.count.mockResolvedValue(100);

			const result = await repository.findAll({ limit: 1, offset: 0 });

			expect(result.hasMore).toBe(true);
			expect(result.total).toBe(100);
		});

		it("should use default pagination when options not provided", async () => {
			mockPrismaService.user.findMany.mockResolvedValue([]);
			mockPrismaService.user.count.mockResolvedValue(0);

			await repository.findAll();

			expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
				take: 10,
				skip: 0,
				orderBy: { createdAt: "desc" },
			});
		});

		it("should return empty array when no users exist", async () => {
			mockPrismaService.user.findMany.mockResolvedValue([]);
			mockPrismaService.user.count.mockResolvedValue(0);

			const result = await repository.findAll({ limit: 10, offset: 0 });

			expect(result.data).toHaveLength(0);
			expect(result.total).toBe(0);
			expect(result.hasMore).toBe(false);
		});
	});
});
