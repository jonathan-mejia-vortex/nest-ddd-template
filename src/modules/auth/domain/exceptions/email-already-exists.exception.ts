import { DomainException } from "../../../../shared/domain/exceptions/domain.exception";

export class EmailAlreadyExistsException extends DomainException {
	constructor(email: string) {
		super("EMAIL_ALREADY_EXISTS", `El email ${email} ya está registrado`);
	}
}
