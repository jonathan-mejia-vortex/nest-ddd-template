import type { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		return next.handle().pipe(
			map((res: unknown) => this.responseHandler(res, context)),
			catchError((err: HttpException) => {
				this.errorHandler(err, context);
				return new Observable<never>();
			})
		);
	}

	errorHandler(exception: HttpException, context: ExecutionContext) {
		const ctx = context.switchToHttp();
		const response = ctx.getResponse();
		const request = ctx.getRequest();
		const logger = new Logger("ERROR_INTERCEPTOR_LOGGER");
		const status =
			exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
		const isBadRequest = exception instanceof BadRequestException;
		let message = "SERVER_UNEXPECTED_ERROR";

		const cause = exception.cause as { details: string; message: string };

		if (exception instanceof HttpException) {
			const errorResponse = exception.getResponse();
			const errorIsObject = typeof errorResponse === "object";
			const errorIsNull = errorResponse === null;
			const isHttpException = typeof errorResponse === "string";
			if (errorIsObject && !errorIsNull) {
				// Validation error
				const hasMessage = "message" in errorResponse;
				if (hasMessage) {
					message = (errorResponse as { message: string }).message;
				} else {
					message = JSON.stringify(errorResponse);
				}
			} else if (isHttpException) {
				message = errorResponse;
			}
		}
		logger.error(
			`ENDPOINT_PATH: ${request.url} \n CAUSE: ${cause?.message || message} \n STACK_ERROR: ${exception.stack}`
		);
		const version = this.extractVersion(request.url);
		response.status(status).json({
			path: request.url,
			error: cause?.details || "ServerUnexpectedError",
			details: isBadRequest ? "BadRequestError" : message,
			meta: {
				correlationId: request.correlationId,
				timestamp: new Date().toISOString(),
				...(version && { version }),
			},
		});
	}

	responseHandler(res: unknown, context: ExecutionContext) {
		const ctx = context.switchToHttp();
		const request = ctx.getRequest();
		const version = this.extractVersion(request.url);

		return {
			path: request.url,
			result: res,
			meta: {
				correlationId: request.correlationId,
				timestamp: new Date().toISOString(),
				...(version && { version }),
			},
		};
	}

	private extractVersion(path: string): string | null {
		const versionMatch = path.match(/\/(v\d+)\//);
		return versionMatch ? versionMatch[1] : null;
	}
}
