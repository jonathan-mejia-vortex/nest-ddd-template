import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, type TestingModule } from "@nestjs/testing";
import { GetAuthByIdUseCase } from "../../../modules/auth/application/use-cases/get-auth-by-id.use-case";
import { Auth } from "../../../modules/auth/domain/entities/auth.entity";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";

describe("JwtAuthGuard", () => {
	let guard: JwtAuthGuard;
	let jwtService: jest.Mocked<JwtService>;
	let getAuthByIdUseCase: jest.Mocked<GetAuthByIdUseCase>;

	const mockExecutionContext = (authHeader?: string) => ({
		switchToHttp: () => ({
			getRequest: () => ({
				headers: {
					authorization: authHeader,
				},
			}),
		}),
	});

	beforeEach(async () => {
		const mockJwtService = {
			verifyAsync: jest.fn(),
		};

		const mockGetAuthByIdUseCase = {
			execute: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				JwtAuthGuard,
				{
					provide: JwtService,
					useValue: mockJwtService,
				},
				{
					provide: GetAuthByIdUseCase,
					useValue: mockGetAuthByIdUseCase,
				},
			],
		}).compile();

		guard = module.get<JwtAuthGuard>(JwtAuthGuard);
		jwtService = module.get(JwtService);
		getAuthByIdUseCase = module.get(GetAuthByIdUseCase);
	});

	it("should be defined", () => {
		expect(guard).toBeDefined();
	});

	describe("canActivate", () => {
		it("should throw UnauthorizedException when no token is provided", async () => {
			const context = mockExecutionContext() as any;

			await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
			await expect(guard.canActivate(context)).rejects.toThrow("Token no proporcionado");
		});

		it("should throw UnauthorizedException when authorization header is not Bearer", async () => {
			const context = mockExecutionContext("Basic token123") as any;

			await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
		});

		it("should throw UnauthorizedException when token is invalid", async () => {
			const context = mockExecutionContext("Bearer invalid-token") as any;

			jwtService.verifyAsync.mockRejectedValue(new Error("Invalid token"));

			await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
			await expect(guard.canActivate(context)).rejects.toThrow("Token inválido o expirado");
		});

		it("should throw UnauthorizedException when auth is not found", async () => {
			const context = mockExecutionContext("Bearer valid-token") as any;
			const payload = { authId: "auth-id", userId: "user-id", role: "USER" };

			jwtService.verifyAsync.mockResolvedValue(payload);
			getAuthByIdUseCase.execute.mockResolvedValue(null as any);

			await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
		});

		it("should return true and attach user to request when token is valid", async () => {
			const request = {
				headers: { authorization: "Bearer valid-token" },
			} as any;

			const context = {
				switchToHttp: () => ({
					getRequest: () => request,
				}),
			} as any;

			const payload = { authId: "auth-id", userId: "user-id", role: "USER" };
			const auth = Auth.create("auth-id", "test@example.com", "hashed_password");

			jwtService.verifyAsync.mockResolvedValue(payload);
			getAuthByIdUseCase.execute.mockResolvedValue(auth);

			const result = await guard.canActivate(context);

			expect(result).toBe(true);
			expect(request.user).toEqual({
				id: payload.userId,
				authId: payload.authId,
				role: payload.role,
			});
		});
	});
});

