import { Test, type TestingModule } from "@nestjs/testing";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../../../shared/infrastructure/persistence/prisma.service";
import { Auth } from "../../../../domain/entities/auth.entity";
import { EmailAlreadyExistsException } from "../../../../domain/exceptions/email-already-exists.exception";
import { AuthRepositoryImpl } from "../../../../infrastructure/persistence/prisma/auth.repository.impl";

describe("AuthRepositoryImpl", () => {
	let repository: AuthRepositoryImpl;

	const mockPrismaService = {
		auth: {
			create: jest.fn(),
			findUnique: jest.fn(),
			findMany: jest.fn(),
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthRepositoryImpl,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		repository = module.get<AuthRepositoryImpl>(AuthRepositoryImpl);

		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(repository).toBeDefined();
	});

	describe("create", () => {
		const auth = Auth.create("auth-id", "test@example.com", "hashed_password");

		it("should create auth successfully", async () => {
			const createdData = {
				id: "auth-id",
				email: "test@example.com",
				password: "hashed_password",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockPrismaService.auth.create.mockResolvedValue(createdData);

			const result = await repository.create(auth);

			expect(result).toBeInstanceOf(Auth);
			expect(result.id).toBe(auth.id);
			expect(result.email).toBe(auth.email);
			expect(mockPrismaService.auth.create).toHaveBeenCalledWith({
				data: {
					id: auth.id,
					email: auth.email,
					password: auth.password,
				},
			});
		});

		it("should create auth with transaction", async () => {
			const createdData = {
				id: "auth-id",
				email: "test@example.com",
				password: "hashed_password",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockTransaction = {
				auth: {
					create: jest.fn().mockResolvedValue(createdData),
				},
			};

			const result = await repository.create(auth, mockTransaction);

			expect(result).toBeInstanceOf(Auth);
			expect(mockTransaction.auth.create).toHaveBeenCalledWith({
				data: {
					id: auth.id,
					email: auth.email,
					password: auth.password,
				},
			});
		});

		it("should throw EmailAlreadyExistsException when email is duplicated", async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
				code: "P2002",
				clientVersion: "5.0.0",
			});

			mockPrismaService.auth.create.mockRejectedValue(prismaError);

			await expect(repository.create(auth)).rejects.toThrow(EmailAlreadyExistsException);
		});

		it("should throw generic error for other failures", async () => {
			const genericError = new Error("Database connection failed");

			mockPrismaService.auth.create.mockRejectedValue(genericError);

			await expect(repository.create(auth)).rejects.toThrow("Error al crear auth:");
		});
	});

	describe("findById", () => {
		it("should return auth when found", async () => {
			const foundData = {
				id: "auth-id",
				email: "test@example.com",
				password: "hashed_password",
				createdAt: new Date(),
				updatedAt: new Date(),
				user: null,
			};

			mockPrismaService.auth.findUnique.mockResolvedValue(foundData);

			const result = await repository.findById("auth-id");

			expect(result).toBeInstanceOf(Auth);
			expect(result?.id).toBe("auth-id");
			expect(mockPrismaService.auth.findUnique).toHaveBeenCalledWith({
				where: { id: "auth-id" },
				include: { user: true },
			});
		});

		it("should return null when auth is not found", async () => {
			mockPrismaService.auth.findUnique.mockResolvedValue(null);

			const result = await repository.findById("non-existent-id");

			expect(result).toBeNull();
		});
	});

	describe("findByEmail", () => {
		it("should return auth when found by email", async () => {
			const foundData = {
				id: "auth-id",
				email: "test@example.com",
				password: "hashed_password",
				createdAt: new Date(),
				updatedAt: new Date(),
				user: null,
			};

			mockPrismaService.auth.findUnique.mockResolvedValue(foundData);

			const result = await repository.findByEmail("test@example.com");

			expect(result).toBeInstanceOf(Auth);
			expect(result?.email).toBe("test@example.com");
			expect(mockPrismaService.auth.findUnique).toHaveBeenCalledWith({
				where: { email: "test@example.com" },
				include: { user: true },
			});
		});

		it("should return null when email is not found", async () => {
			mockPrismaService.auth.findUnique.mockResolvedValue(null);

			const result = await repository.findByEmail("notfound@example.com");

			expect(result).toBeNull();
		});
	});

	describe("findAll", () => {
		it("should return all auths", async () => {
			const authsData = [
				{
					id: "auth-1",
					email: "user1@example.com",
					password: "hash1",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "auth-2",
					email: "user2@example.com",
					password: "hash2",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockPrismaService.auth.findMany.mockResolvedValue(authsData);

			const result = await repository.findAll();

			expect(result).toHaveLength(2);
			expect(result[0]).toBeInstanceOf(Auth);
			expect(result[1]).toBeInstanceOf(Auth);
			expect(mockPrismaService.auth.findMany).toHaveBeenCalled();
		});

		it("should return empty array when no auths exist", async () => {
			mockPrismaService.auth.findMany.mockResolvedValue([]);

			const result = await repository.findAll();

			expect(result).toHaveLength(0);
		});
	});
});
