import { HttpStatus } from "@nestjs/common";
import { UserCreationFailedException } from "../../../domain/exceptions/user-creation-failed.exception";

describe("UserCreationFailedException", () => {
	it("should create exception with default message when no reason provided", () => {
		const exception = new UserCreationFailedException();

		expect(exception.message).toBe("Error al crear usuario");
		expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
		expect(exception.cause).toEqual({
			details: "UserCreationFailed",
			message: "Error al crear usuario",
		});
	});

	it("should create exception with custom reason", () => {
		const reason = "Database connection failed";
		const exception = new UserCreationFailedException(reason);

		expect(exception.message).toBe(`Error al crear usuario: ${reason}`);
		expect(exception.cause).toEqual({
			details: "UserCreationFailed",
			message: `Error al crear usuario: ${reason}`,
		});
	});
});
