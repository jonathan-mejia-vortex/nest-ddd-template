import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../../../shared/domain/exceptions/domain.exception";

export class UserCreationFailedException extends DomainException {
	constructor(reason?: string) {
		super(
			"UserCreationFailed",
			reason ? `Error al crear usuario: ${reason}` : "Error al crear usuario",
			HttpStatus.CONFLICT
		);
	}
}
