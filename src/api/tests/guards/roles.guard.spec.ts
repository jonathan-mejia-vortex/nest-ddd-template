import { Reflector } from "@nestjs/core";
import { Test, type TestingModule } from "@nestjs/testing";
import { ROLE } from "../../../common/types";
import { RolesGuard } from "../../guards/roles.guard";

describe("RolesGuard", () => {
	let guard: RolesGuard;
	let reflector: jest.Mocked<Reflector>;

	const mockExecutionContext = (userRole: string) => ({
		getHandler: () => jest.fn(),
		switchToHttp: () => ({
			getRequest: () => ({
				user: { role: userRole },
			}),
		}),
	});

	beforeEach(async () => {
		const mockReflector = {
			get: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RolesGuard,
				{
					provide: Reflector,
					useValue: mockReflector,
				},
			],
		}).compile();

		guard = module.get<RolesGuard>(RolesGuard);
		reflector = module.get(Reflector);
	});

	it("should be defined", () => {
		expect(guard).toBeDefined();
	});

	describe("canActivate", () => {
		it("should return true when no roles are required", () => {
			const context = mockExecutionContext(ROLE.USER) as any;

			reflector.get.mockReturnValue(undefined);

			const result = guard.canActivate(context);

			expect(result).toBe(true);
		});

		it("should return true when user has required role", () => {
			const context = mockExecutionContext(ROLE.ADMIN) as any;

			reflector.get.mockReturnValue([ROLE.ADMIN]);

			const result = guard.canActivate(context);

			expect(result).toBe(true);
		});

		it("should return false when user does not have required role", () => {
			const context = mockExecutionContext(ROLE.USER) as any;

			reflector.get.mockReturnValue([ROLE.ADMIN]);

			const result = guard.canActivate(context);

			expect(result).toBe(false);
		});

		it("should return true when user has one of the required roles", () => {
			const context = mockExecutionContext(ROLE.ADMIN) as any;

			reflector.get.mockReturnValue([ROLE.USER, ROLE.ADMIN]);

			const result = guard.canActivate(context);

			expect(result).toBe(true);
		});

		it("should return false when user role is not in the required roles list", () => {
			const context = mockExecutionContext(ROLE.USER) as any;

			reflector.get.mockReturnValue([ROLE.ADMIN]);

			const result = guard.canActivate(context);

			expect(result).toBe(false);
		});
	});
});

