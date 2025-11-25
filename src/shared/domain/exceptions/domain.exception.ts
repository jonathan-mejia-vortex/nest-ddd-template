export abstract class DomainException extends Error {
	constructor(
		public readonly code: string,
		public override readonly message: string,
		public readonly details?: unknown
	) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}
