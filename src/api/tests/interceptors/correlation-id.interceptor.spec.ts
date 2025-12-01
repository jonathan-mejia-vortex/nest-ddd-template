import { CallHandler, ExecutionContext } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { of } from "rxjs";
import { CorrelationIdInterceptor } from "../../interceptors/correlation-id.interceptor";

describe("CorrelationIdInterceptor", () => {
	let interceptor: CorrelationIdInterceptor;

	const mockRequest = (headers: Record<string, string> = {}) => ({
		headers,
	});

	const mockResponse = () => ({
		setHeader: jest.fn(),
	});

	const mockExecutionContext = (request: any, response: any) => ({
		switchToHttp: () => ({
			getRequest: () => request,
			getResponse: () => response,
		}),
	});

	const mockCallHandler = (): CallHandler => ({
		handle: () => of({}),
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [CorrelationIdInterceptor],
		}).compile();

		interceptor = module.get<CorrelationIdInterceptor>(CorrelationIdInterceptor);
	});

	it("should be defined", () => {
		expect(interceptor).toBeDefined();
	});

	describe("intercept", () => {
		it("should generate new correlation ID when none provided", (done) => {
			const request = mockRequest() as any;
			const response = mockResponse();
			const context = mockExecutionContext(request, response) as unknown as ExecutionContext;

			interceptor.intercept(context, mockCallHandler()).subscribe(() => {
				expect(request.correlationId).toBeDefined();
				expect(typeof request.correlationId).toBe("string");
				expect(request.correlationId.length).toBe(36); // UUID format
				expect(response.setHeader).toHaveBeenCalledWith(
					"X-Correlation-ID",
					request.correlationId
				);
				done();
			});
		});

		it("should use existing X-Correlation-ID header if valid UUID", (done) => {
			const validUuid = "550e8400-e29b-41d4-a716-446655440000";
			const request = mockRequest({ "x-correlation-id": validUuid }) as any;
			const response = mockResponse();
			const context = mockExecutionContext(request, response) as unknown as ExecutionContext;

			interceptor.intercept(context, mockCallHandler()).subscribe(() => {
				expect(request.correlationId).toBe(validUuid);
				expect(response.setHeader).toHaveBeenCalledWith("X-Correlation-ID", validUuid);
				done();
			});
		});

		it("should use X-Request-ID header if X-Correlation-ID not present", (done) => {
			const validUuid = "550e8400-e29b-41d4-a716-446655440001";
			const request = mockRequest({ "x-request-id": validUuid }) as any;
			const response = mockResponse();
			const context = mockExecutionContext(request, response) as unknown as ExecutionContext;

			interceptor.intercept(context, mockCallHandler()).subscribe(() => {
				expect(request.correlationId).toBe(validUuid);
				done();
			});
		});

		it("should use X-Trace-ID header if other headers not present", (done) => {
			const validUuid = "550e8400-e29b-41d4-a716-446655440002";
			const request = mockRequest({ "x-trace-id": validUuid }) as any;
			const response = mockResponse();
			const context = mockExecutionContext(request, response) as unknown as ExecutionContext;

			interceptor.intercept(context, mockCallHandler()).subscribe(() => {
				expect(request.correlationId).toBe(validUuid);
				done();
			});
		});

		it("should generate new ID when provided ID is invalid", (done) => {
			const invalidId = "not-a-valid-uuid";
			const request = mockRequest({ "x-correlation-id": invalidId }) as any;
			const response = mockResponse();
			const context = mockExecutionContext(request, response) as unknown as ExecutionContext;

			interceptor.intercept(context, mockCallHandler()).subscribe(() => {
				expect(request.correlationId).not.toBe(invalidId);
				expect(request.correlationId.length).toBe(36);
				done();
			});
		});

		it("should prioritize X-Correlation-ID over X-Request-ID", (done) => {
			const correlationId = "550e8400-e29b-41d4-a716-446655440000";
			const requestId = "550e8400-e29b-41d4-a716-446655440001";
			const request = mockRequest({
				"x-correlation-id": correlationId,
				"x-request-id": requestId,
			}) as any;
			const response = mockResponse();
			const context = mockExecutionContext(request, response) as unknown as ExecutionContext;

			interceptor.intercept(context, mockCallHandler()).subscribe(() => {
				expect(request.correlationId).toBe(correlationId);
				done();
			});
		});

		it("should handle array values in headers", (done) => {
			const validUuid = "550e8400-e29b-41d4-a716-446655440003";
			const request = { headers: { "x-correlation-id": [validUuid, "another-value"] } } as any;
			const response = mockResponse();
			const context = mockExecutionContext(request, response) as unknown as ExecutionContext;

			interceptor.intercept(context, mockCallHandler()).subscribe(() => {
				expect(request.correlationId).toBe(validUuid);
				done();
			});
		});
	});
});

