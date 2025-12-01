import { CallHandler, ExecutionContext } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { of } from "rxjs";
import { ResponseInterceptor } from "../../interceptors/response.interceptor";

describe("ResponseInterceptor", () => {
	let interceptor: ResponseInterceptor<unknown>;

	const mockExecutionContext = (path: string, method = "GET") => ({
		switchToHttp: () => ({
			getRequest: () => ({
				method,
				path,
				correlationId: "test-correlation-id",
			}),
		}),
	});

	const mockCallHandler = (data: unknown): CallHandler => ({
		handle: () => of(data),
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ResponseInterceptor],
		}).compile();

		interceptor = module.get<ResponseInterceptor<unknown>>(ResponseInterceptor);
	});

	it("should be defined", () => {
		expect(interceptor).toBeDefined();
	});

	describe("intercept", () => {
		it("should wrap response with standard format", (done) => {
			const context = mockExecutionContext("/api/users") as unknown as ExecutionContext;
			const data = { id: 1, name: "John" };
			const callHandler = mockCallHandler(data);

			interceptor.intercept(context, callHandler).subscribe((result: any) => {
				expect(result.success).toBe(true);
				expect(result.data).toEqual(data);
				expect(result.meta).toBeDefined();
				expect(result.meta.path).toBe("/api/users");
				expect(result.meta.method).toBe("GET");
				expect(result.meta.correlationId).toBe("test-correlation-id");
				expect(result.meta.timestamp).toBeDefined();
				done();
			});
		});

		it("should not wrap response for health endpoint", (done) => {
			const context = mockExecutionContext("/health") as unknown as ExecutionContext;
			const data = { status: "ok" };
			const callHandler = mockCallHandler(data);

			interceptor.intercept(context, callHandler).subscribe((result) => {
				expect(result).toEqual(data);
				done();
			});
		});

		it("should not wrap response for metrics endpoint", (done) => {
			const context = mockExecutionContext("/metrics") as unknown as ExecutionContext;
			const data = { metrics: [] };
			const callHandler = mockCallHandler(data);

			interceptor.intercept(context, callHandler).subscribe((result) => {
				expect(result).toEqual(data);
				done();
			});
		});

		it("should not wrap response for docs endpoint", (done) => {
			const context = mockExecutionContext("/docs/swagger") as unknown as ExecutionContext;
			const data = { swagger: "3.0" };
			const callHandler = mockCallHandler(data);

			interceptor.intercept(context, callHandler).subscribe((result) => {
				expect(result).toEqual(data);
				done();
			});
		});

		it("should not wrap response if already wrapped", (done) => {
			const context = mockExecutionContext("/api/users") as unknown as ExecutionContext;
			const alreadyWrappedData = {
				success: true,
				data: { id: 1 },
				meta: { timestamp: "2024-01-01" },
			};
			const callHandler = mockCallHandler(alreadyWrappedData);

			interceptor.intercept(context, callHandler).subscribe((result) => {
				expect(result).toEqual(alreadyWrappedData);
				done();
			});
		});

		it("should not wrap Buffer data", (done) => {
			const context = mockExecutionContext("/api/files") as unknown as ExecutionContext;
			const bufferData = Buffer.from("test");
			const callHandler = mockCallHandler(bufferData);

			interceptor.intercept(context, callHandler).subscribe((result) => {
				expect(result).toEqual(bufferData);
				done();
			});
		});

		it("should extract version from path", (done) => {
			const context = mockExecutionContext("/v1/api/users") as unknown as ExecutionContext;
			const data = { id: 1 };
			const callHandler = mockCallHandler(data);

			interceptor.intercept(context, callHandler).subscribe((result: any) => {
				expect(result.meta.version).toBe("v1");
				done();
			});
		});

		it("should not include version when path has no version", (done) => {
			const context = mockExecutionContext("/api/users") as unknown as ExecutionContext;
			const data = { id: 1 };
			const callHandler = mockCallHandler(data);

			interceptor.intercept(context, callHandler).subscribe((result: any) => {
				expect(result.meta.version).toBeUndefined();
				done();
			});
		});
	});
});

