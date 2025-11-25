export abstract class DomainException extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
