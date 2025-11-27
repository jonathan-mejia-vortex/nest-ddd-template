import { DomainException } from "../../../../shared/domain/exceptions/domain.exception";

export class EmailAlreadyExistsException extends DomainException {
	constructor(email: string) {
		super("EmailAlreadyExists", `El email ${email} ya está registrado`);
	}
}
