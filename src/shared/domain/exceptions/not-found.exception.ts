import { HttpStatus } from "@nestjs/common";
import { DomainException } from "./domain.exception";

export class NotFoundException extends DomainException {
	constructor(entity: string, id?: string) {
		super(
			"NotFound",
			id ? `${entity} con id ${id} no encontrado` : `${entity} no encontrado`,
			HttpStatus.NOT_FOUND
		);
	}
}
