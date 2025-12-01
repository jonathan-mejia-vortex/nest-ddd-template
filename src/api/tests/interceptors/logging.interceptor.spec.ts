import { CallHandler, ExecutionContext } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";
import { CloudWatchLoggerService } from "../../../shared/infrastructure/logging/cloudwatch-logger.service";
import { PinoLoggerService } from "../../../shared/infrastructure/logging/pino-logger.service";
import { LoggingInterceptor } from "../../interceptors/logging.interceptor";

describe("LoggingInterceptor", () => {
	let interceptor: LoggingInterceptor;
	let pinoLogger: jest.Mocked<PinoLoggerService>;
	let cloudWatchLogger: jest.Mocked<CloudWatchLoggerService>;

	const mockRequest = (overrides = {}) => ({
		method: "GET",
		url: "/api/users",
		params: {},
		query: {},
		body: {},
		headers: {
			"user-agent": "test-agent",
		},
		correlationId: "test-correlation-id",
		user: { id: "user-id", role: "USER" },
		socket: { remoteAddress: "127.0.0.1" },
		...overrides,
	});

	const mockResponse = (overrides = {}) => ({
		statusCode: 200,
		get: jest.fn().mockReturnValue("100"),
		...overrides,
	});

	const mockExecutionContext = (request = mockRequest(), response = mockResponse()) => ({
		switchToHttp: () => ({
			getRequest: () => request,
			getResponse: () => response,
		}),
	});

	const mockCallHandler = (data: unknown): CallHandler => ({
		handle: () => of(data),
	});

	const mockErrorCallHandler = (error: Error): CallHandler => ({
		handle: () => throwError(() => error),
	});

	beforeEach(async () => {
		const mockPinoLogger = {
			setContext: jest.fn(),
			setCorrelationId: jest.fn(),
			setUserId: jest.fn(),
			log: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
		};

		const mockCloudWatchLogger = {
			log: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LoggingInterceptor,
				{
					provide: PinoLoggerService,
					useValue: mockPinoLogger,
				},
				{
					provide: CloudWatchLoggerService,
					useValue: mockCloudWatchLogger,
				},
			],
		}).compile();

		interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
		pinoLogger = module.get(PinoLoggerService);
		cloudWatchLogger = module.get(CloudWatchLoggerService);
	});

	it("should be defined", () => {
		expect(interceptor).toBeDefined();
	});

	describe("intercept", () => {
		it("should skip logging for health endpoint", (done) => {
			const request = mockRequest({ url: "/health" });
			const context = mockExecutionContext(request) as unknown as ExecutionContext;
			const callHandler = mockCallHandler({ status: "ok" });

			interceptor.intercept(context, callHandler).subscribe(() => {
				expect(pinoLogger.log).not.toHaveBeenCalled();
				done();
			});
		});

		it("should skip logging for metrics endpoint", (done) => {
			const request = mockRequest({ url: "/metrics" });
			const context = mockExecutionContext(request) as unknown as ExecutionContext;
			const callHandler = mockCallHandler({ metrics: [] });

			interceptor.intercept(context, callHandler).subscribe(() => {
				expect(pinoLogger.log).not.toHaveBeenCalled();
				done();
			});
		});

		it("should set correlation ID and user ID on logger", (done) => {
			const context = mockExecutionContext() as unknown as ExecutionContext;
			const callHandler = mockCallHandler({ data: "test" });

			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			interceptor.intercept(context, callHandler).subscribe(() => {
				expect(pinoLogger.setCorrelationId).toHaveBeenCalledWith("test-correlation-id");
				expect(pinoLogger.setUserId).toHaveBeenCalledWith("user-id");
				process.env.NODE_ENV = originalEnv;
				done();
			});
		});

		it("should filter sensitive fields from body keys", (done) => {
			const request = mockRequest({
				body: { username: "test", password: "secret123", email: "test@test.com" },
			});
			const context = mockExecutionContext(request) as unknown as ExecutionContext;
			const callHandler = mockCallHandler({ data: "test" });

			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			interceptor.intercept(context, callHandler).subscribe(() => {
				const logCall = pinoLogger.log.mock.calls[0][0] as any;
				expect(logCall.bodyKeys).toContain("username");
				expect(logCall.bodyKeys).toContain("email");
				expect(logCall.bodyKeys).not.toContain("password");
				process.env.NODE_ENV = originalEnv;
				done();
			});
		});

		it("should log errors with proper error details", (done) => {
			const context = mockExecutionContext() as unknown as ExecutionContext;
			const error = new Error("Test error");
			(error as any).status = 400;
			(error as any).code = "TEST_ERROR";
			const callHandler = mockErrorCallHandler(error);

			interceptor.intercept(context, callHandler).subscribe({
				error: () => {
					expect(pinoLogger.error).toHaveBeenCalled();
					expect(cloudWatchLogger.log).toHaveBeenCalledWith(
						expect.objectContaining({
							level: "ERROR",
							errorMessage: "Test error",
							statusCode: 400,
							errorCode: "TEST_ERROR",
						})
					);
					done();
				},
			});
		});

		it("should extract IP from x-forwarded-for header", (done) => {
			const request = mockRequest({
				headers: {
					"user-agent": "test-agent",
					"x-forwarded-for": "192.168.1.1, 10.0.0.1",
				},
			});
			const context = mockExecutionContext(request) as unknown as ExecutionContext;
			const callHandler = mockCallHandler({ data: "test" });

			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			interceptor.intercept(context, callHandler).subscribe(() => {
				const logCall = pinoLogger.log.mock.calls[0][0] as any;
				expect(logCall.ip).toBe("192.168.1.1");
				process.env.NODE_ENV = originalEnv;
				done();
			});
		});

		it("should extract IP from x-real-ip header", (done) => {
			const request = mockRequest({
				headers: {
					"user-agent": "test-agent",
					"x-real-ip": "10.0.0.5",
				},
			});
			const context = mockExecutionContext(request) as unknown as ExecutionContext;
			const callHandler = mockCallHandler({ data: "test" });

			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			interceptor.intercept(context, callHandler).subscribe(() => {
				const logCall = pinoLogger.log.mock.calls[0][0] as any;
				expect(logCall.ip).toBe("10.0.0.5");
				process.env.NODE_ENV = originalEnv;
				done();
			});
		});

		it("should not set userId if user is not authenticated", (done) => {
			const request = mockRequest({ user: undefined });
			const context = mockExecutionContext(request) as unknown as ExecutionContext;
			const callHandler = mockCallHandler({ data: "test" });

			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			interceptor.intercept(context, callHandler).subscribe(() => {
				expect(pinoLogger.setUserId).not.toHaveBeenCalled();
				process.env.NODE_ENV = originalEnv;
				done();
			});
		});

		it("should handle request without body", (done) => {
			const request = mockRequest({ body: undefined });
			const context = mockExecutionContext(request) as unknown as ExecutionContext;
			const callHandler = mockCallHandler({ data: "test" });

			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			interceptor.intercept(context, callHandler).subscribe(() => {
				const logCall = pinoLogger.log.mock.calls[0][0] as any;
				expect(logCall.bodyKeys).toEqual([]);
				process.env.NODE_ENV = originalEnv;
				done();
			});
		});

		it("should use default status 500 when error has no status", (done) => {
			const context = mockExecutionContext() as unknown as ExecutionContext;
			const error = new Error("Unexpected error");
			const callHandler = mockErrorCallHandler(error);

			interceptor.intercept(context, callHandler).subscribe({
				error: () => {
					expect(cloudWatchLogger.log).toHaveBeenCalledWith(
						expect.objectContaining({
							statusCode: 500,
						})
					);
					done();
				},
			});
		});

		it("should use error constructor name when code is not provided", (done) => {
			const context = mockExecutionContext() as unknown as ExecutionContext;
			const error = new TypeError("Type error");
			const callHandler = mockErrorCallHandler(error);

			interceptor.intercept(context, callHandler).subscribe({
				error: () => {
					expect(cloudWatchLogger.log).toHaveBeenCalledWith(
						expect.objectContaining({
							errorCode: "TypeError",
						})
					);
					done();
				},
			});
		});

		it("should sanitize query params with sensitive fields", (done) => {
			const request = mockRequest({
				query: { search: "test", password: "secret123" },
			});
			const context = mockExecutionContext(request) as unknown as ExecutionContext;
			const callHandler = mockCallHandler({ data: "test" });

			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			interceptor.intercept(context, callHandler).subscribe(() => {
				const logCall = pinoLogger.log.mock.calls[0][0] as any;
				expect(logCall.query.password).toBe("***REDACTED***");
				process.env.NODE_ENV = originalEnv;
				done();
			});
		});

		it("should log response with content length", (done) => {
			const response = mockResponse({ statusCode: 200 });
			response.get.mockReturnValue("1024");
			const context = mockExecutionContext(mockRequest(), response) as unknown as ExecutionContext;
			const callHandler = mockCallHandler({ data: "test" });

			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			interceptor.intercept(context, callHandler).subscribe(() => {
				process.env.NODE_ENV = originalEnv;
				done();
			});
		});

		it("should handle response without content length", (done) => {
			const response = mockResponse({ statusCode: 200 });
			response.get.mockReturnValue(undefined);
			const context = mockExecutionContext(mockRequest(), response) as unknown as ExecutionContext;
			const callHandler = mockCallHandler({ data: "test" });

			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			interceptor.intercept(context, callHandler).subscribe(() => {
				process.env.NODE_ENV = originalEnv;
				done();
			});
		});
	});
});

