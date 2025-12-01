import { JwtService } from "@nestjs/jwt";
import { Test, type TestingModule } from "@nestjs/testing";
import { UserRole } from "../../../../../common/types";
import { User } from "../../../../users/domain/entities/user.entity";
import { LoginUseCase } from "../../../application/use-cases/login.use-case";

describe("LoginUseCase", () => {
	let useCase: LoginUseCase;
	let jwtService: jest.Mocked<JwtService>;

	beforeEach(async () => {
		const mockJwtService = {
			sign: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LoginUseCase,
				{
					provide: JwtService,
					useValue: mockJwtService,
				},
			],
		}).compile();

		useCase = module.get<LoginUseCase>(LoginUseCase);
		jwtService = module.get(JwtService);
	});

	it("should be defined", () => {
		expect(useCase).toBeDefined();
	});

	describe("execute", () => {
		it("should return a token for valid user", async () => {
			const user = User.create("user-id", "John Doe", "auth-id", UserRole.USER);
			const expectedToken = "jwt-token";

			jwtService.sign.mockReturnValue(expectedToken);

			const result = await useCase.execute(user);

			expect(result).toEqual({ token: expectedToken });
			expect(jwtService.sign).toHaveBeenCalledWith({
				authId: user.authId,
				userId: user.id,
				role: user.role,
			});
		});

		it("should include correct payload in token for admin user", async () => {
			const adminUser = User.create("admin-id", "Admin User", "admin-auth-id", UserRole.ADMIN);
			const expectedToken = "admin-jwt-token";

			jwtService.sign.mockReturnValue(expectedToken);

			const result = await useCase.execute(adminUser);

			expect(result).toEqual({ token: expectedToken });
			expect(jwtService.sign).toHaveBeenCalledWith({
				authId: adminUser.authId,
				userId: adminUser.id,
				role: UserRole.ADMIN,
			});
		});
	});
});
