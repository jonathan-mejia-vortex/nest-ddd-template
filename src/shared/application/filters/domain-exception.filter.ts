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
				code: exception.details,
				message: exception.message,
				details: exception.details,
			},
		});
	}

	private mapDomainExceptionToHttpStatus(exception: DomainException): number {
		const errorMapping: Record<string, number> = {
			USER_NOT_FOUND: HttpStatus.NOT_FOUND,
			AUTH_NOT_FOUND: HttpStatus.NOT_FOUND,
			NOT_FOUND: HttpStatus.NOT_FOUND,
			INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
			EMAIL_ALREADY_EXISTS: HttpStatus.CONFLICT,
			USER_CREATION_FAILED: HttpStatus.BAD_REQUEST,
		};

		return errorMapping[exception.details] || HttpStatus.BAD_REQUEST;
	}
}
