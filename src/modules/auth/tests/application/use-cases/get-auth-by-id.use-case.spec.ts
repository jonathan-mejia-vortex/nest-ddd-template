import { Test, type TestingModule } from "@nestjs/testing";
import { GetAuthByIdUseCase } from "../../../application/use-cases/get-auth-by-id.use-case";
import { Auth } from "../../../domain/entities/auth.entity";
import { AuthNotFoundException } from "../../../domain/exceptions/auth-not-found.exception";
import {
	AUTH_REPOSITORY,
	type IAuthRepository,
} from "../../../domain/repositories/auth.repository.interface";

describe("GetAuthByIdUseCase", () => {
	let useCase: GetAuthByIdUseCase;
	let authRepository: jest.Mocked<IAuthRepository>;

	beforeEach(async () => {
		const mockAuthRepository: Partial<jest.Mocked<IAuthRepository>> = {
			findById: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				GetAuthByIdUseCase,
				{
					provide: AUTH_REPOSITORY,
					useValue: mockAuthRepository,
				},
			],
		}).compile();

		useCase = module.get<GetAuthByIdUseCase>(GetAuthByIdUseCase);
		authRepository = module.get(AUTH_REPOSITORY);
	});

	it("should be defined", () => {
		expect(useCase).toBeDefined();
	});

	describe("execute", () => {
		it("should return auth when found", async () => {
			const authId = "auth-id";
			const expectedAuth = Auth.create(authId, "test@example.com", "hashed_password");

			authRepository.findById.mockResolvedValue(expectedAuth);

			const result = await useCase.execute(authId);

			expect(result).toBeInstanceOf(Auth);
			expect(result.id).toBe(authId);
			expect(authRepository.findById).toHaveBeenCalledWith(authId);
		});

		it("should throw AuthNotFoundException when auth is not found", async () => {
			const authId = "non-existent-id";

			authRepository.findById.mockResolvedValue(null);

			await expect(useCase.execute(authId)).rejects.toThrow(AuthNotFoundException);
			expect(authRepository.findById).toHaveBeenCalledWith(authId);
		});
	});
});
