import { HttpStatus } from "@nestjs/common";
import { NotFoundException } from "../../../domain/exceptions/not-found.exception";

describe("NotFoundException", () => {
	it("should create exception with entity name and id", () => {
		const exception = new NotFoundException("User", "123");

		expect(exception.message).toBe("User con id 123 no encontrado");
		expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
		expect(exception.cause).toEqual({
			details: "NotFound",
			message: "User con id 123 no encontrado",
		});
	});

	it("should work with different entity names", () => {
		const exception = new NotFoundException("Order", "order-456");

		expect(exception.message).toBe("Order con id order-456 no encontrado");
	});

	it("should work without id", () => {
		const exception = new NotFoundException("Config");

		expect(exception.message).toBe("Config no encontrado");
	});
});

