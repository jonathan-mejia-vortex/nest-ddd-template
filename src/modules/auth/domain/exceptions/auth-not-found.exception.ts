import { DomainException } from "../../../../shared/domain/exceptions/domain.exception";

export class AuthNotFoundException extends DomainException {
	constructor(identifier?: string) {
		super(
			"AuthNotFound",
			identifier
				? `Credencial con identificador ${identifier} no encontrada`
				: "Credencial no encontrada"
		);
	}
}
