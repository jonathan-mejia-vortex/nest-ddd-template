import { ConflictException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test, type TestingModule } from "@nestjs/testing";
import { IdempotencyService } from "../../../shared/infrastructure/idempotency/idempotency.service";
import { IdempotencyGuard } from "../../guards/idempotency.guard";

describe("IdempotencyGuard", () => {
	let guard: IdempotencyGuard;
	let reflector: jest.Mocked<Reflector>;
	let idempotencyService: jest.Mocked<IdempotencyService>;

	const mockExecutionContext = (headers: Record<string, string> = {}, user?: { id: string }) => ({
		getHandler: () => jest.fn(),
		switchToHttp: () => ({
			getRequest: () => ({
				headers,
				user,
			}),
		}),
	});

	beforeEach(async () => {
		const mockReflector = {
			get: jest.fn(),
		};

		const mockIdempotencyService = {
			generateKey: jest.fn(),
			isProcessed: jest.fn(),
			getProcessedResult: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				IdempotencyGuard,
				{
					provide: Reflector,
					useValue: mockReflector,
				},
				{
					provide: IdempotencyService,
					useValue: mockIdempotencyService,
				},
			],
		}).compile();

		guard = module.get<IdempotencyGuard>(IdempotencyGuard);
		reflector = module.get(Reflector);
		idempotencyService = module.get(IdempotencyService);
	});

	it("should be defined", () => {
		expect(guard).toBeDefined();
	});

	describe("canActivate", () => {
		it("should return true when endpoint is not marked as idempotent", async () => {
			const context = mockExecutionContext() as any;

			reflector.get.mockReturnValue(undefined);

			const result = await guard.canActivate(context);

			expect(result).toBe(true);
			expect(idempotencyService.isProcessed).not.toHaveBeenCalled();
		});

		it("should throw ConflictException when idempotency key header is missing", async () => {
			const context = mockExecutionContext({}) as any;

			reflector.get.mockReturnValue("create-order");

			await expect(guard.canActivate(context)).rejects.toThrow(ConflictException);
			await expect(guard.canActivate(context)).rejects.toThrow(
				"Header X-Idempotency-Key es requerido para esta operación"
			);
		});

		it("should throw ConflictException when operation was already processed", async () => {
			const context = mockExecutionContext(
				{ "x-idempotency-key": "unique-key-123" },
				{ id: "user-id" }
			) as any;

			const previousResult = { orderId: "order-123" };

			reflector.get.mockReturnValue("create-order");
			idempotencyService.generateKey.mockReturnValue(
				"idempotency:user-id:create-order:unique-key-123"
			);
			idempotencyService.isProcessed.mockResolvedValue(true);
			idempotencyService.getProcessedResult.mockResolvedValue(previousResult);

			await expect(guard.canActivate(context)).rejects.toThrow(ConflictException);
		});

		it("should return true and attach idempotency key to request when operation is new", async () => {
			const request = {
				headers: { "x-idempotency-key": "unique-key-123" },
				user: { id: "user-id" },
			} as any;

			const context = {
				getHandler: () => jest.fn(),
				switchToHttp: () => ({
					getRequest: () => request,
				}),
			} as any;

			const generatedKey = "idempotency:user-id:create-order:unique-key-123";

			reflector.get.mockReturnValue("create-order");
			idempotencyService.generateKey.mockReturnValue(generatedKey);
			idempotencyService.isProcessed.mockResolvedValue(false);

			const result = await guard.canActivate(context);

			expect(result).toBe(true);
			expect(request.idempotencyKey).toBe(generatedKey);
			expect(idempotencyService.generateKey).toHaveBeenCalledWith(
				"user-id",
				"create-order",
				"unique-key-123"
			);
		});

		it("should use 'anonymous' as userId when user is not authenticated", async () => {
			const request = {
				headers: { "x-idempotency-key": "unique-key-123" },
			} as any;

			const context = {
				getHandler: () => jest.fn(),
				switchToHttp: () => ({
					getRequest: () => request,
				}),
			} as any;

			reflector.get.mockReturnValue("create-order");
			idempotencyService.generateKey.mockReturnValue(
				"idempotency:anonymous:create-order:unique-key-123"
			);
			idempotencyService.isProcessed.mockResolvedValue(false);

			await guard.canActivate(context);

			expect(idempotencyService.generateKey).toHaveBeenCalledWith(
				"anonymous",
				"create-order",
				"unique-key-123"
			);
		});
	});
});

