import { HttpException, HttpStatus } from "@nestjs/common";

export abstract class DomainException extends HttpException {
	constructor(
		public readonly details: string,
		public override readonly message: string
	) {
		super(message, HttpStatus.BAD_REQUEST, {
			cause: {
				details,
				message,
			},
		});
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}
