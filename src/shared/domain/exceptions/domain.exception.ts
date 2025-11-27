import { HttpException, HttpStatus } from "@nestjs/common";

export abstract class DomainException extends HttpException {
	constructor(details: string, message: string, status?: HttpStatus) {
		super(message, status || HttpStatus.BAD_REQUEST);
		this.cause = {
			details,
			message,
		};
		Error.captureStackTrace(this, this.constructor);
	}
}
