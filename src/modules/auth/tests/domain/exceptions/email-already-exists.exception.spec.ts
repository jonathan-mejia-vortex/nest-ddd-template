import { HttpStatus } from "@nestjs/common";
import { EmailAlreadyExistsException } from "../../../domain/exceptions/email-already-exists.exception";

describe("EmailAlreadyExistsException", () => {
	it("should create exception with correct message and status", () => {
		const email = "test@example.com";
		const exception = new EmailAlreadyExistsException(email);

		expect(exception.message).toBe(`El email ${email} ya está registrado`);
		expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
		expect(exception.cause).toEqual({
			details: "EmailAlreadyExists",
			message: `El email ${email} ya está registrado`,
		});
	});
});
