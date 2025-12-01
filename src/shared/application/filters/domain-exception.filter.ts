import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import { Catch, HttpStatus } from "@nestjs/common";
import type { Request, Response } from "express";
import { DomainException } from "../../domain/exceptions/domain.exception";

interface RequestWithCorrelationId extends Request {
	correlationId?: string;
}

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
	catch(exception: DomainException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<RequestWithCorrelationId>();

		const status = this.mapDomainExceptionToHttpStatus(exception);

		response.status(status).json({
			status: false,
			statusCode: status,
			correlationId: request.correlationId,
			timestamp: new Date().toISOString(),
			path: request.url,
			error: {
				code: (exception.cause as { code: string }).code,
				message: (exception.cause as unknown as { message: string }).message,
			},
		});
	}

	private mapDomainExceptionToHttpStatus(exception: DomainException): number {
		const cause = exception.cause as unknown as { code: string; message: string };
		const errorMapping: Record<keyof typeof cause, number> = {
			code: HttpStatus.BAD_REQUEST,
			message: HttpStatus.BAD_REQUEST,
		};

		return (
			errorMapping[cause.code as unknown as keyof typeof errorMapping] || HttpStatus.BAD_REQUEST
		);
	}
}
