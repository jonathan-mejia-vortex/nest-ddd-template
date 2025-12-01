import { Test, type TestingModule } from "@nestjs/testing";
import { PasswordService } from "../../../domain/services/password.service";

describe("PasswordService", () => {
	let service: PasswordService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [PasswordService],
		}).compile();

		service = module.get<PasswordService>(PasswordService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("hash", () => {
		it("should hash a password", async () => {
			const password = "myPassword123";
			const hashed = await service.hash(password);

			expect(hashed).toBeDefined();
			expect(hashed).not.toBe(password);
			expect(hashed.length).toBeGreaterThan(0);
		});

		it("should generate different hashes for same password", async () => {
			const password = "myPassword123";
			const hashed1 = await service.hash(password);
			const hashed2 = await service.hash(password);

			expect(hashed1).not.toBe(hashed2);
		});
	});

	describe("compare", () => {
		it("should return true for matching password", async () => {
			const password = "myPassword123";
			const hashed = await service.hash(password);

			const result = await service.compare(password, hashed);

			expect(result).toBe(true);
		});

		it("should return false for non-matching password", async () => {
			const password = "myPassword123";
			const wrongPassword = "wrongPassword";
			const hashed = await service.hash(password);

			const result = await service.compare(wrongPassword, hashed);

			expect(result).toBe(false);
		});
	});

	describe("validate", () => {
		it("should return true for valid password (6+ characters)", () => {
			expect(service.validate("password123")).toBe(true);
			expect(service.validate("123456")).toBe(true);
		});

		it("should return false for invalid password (< 6 characters)", () => {
			expect(service.validate("12345")).toBe(false);
			expect(service.validate("pass")).toBe(false);
		});

		it("should return false for empty password", () => {
			expect(service.validate("")).toBe(false);
		});

		it("should return false for null/undefined password", () => {
			expect(service.validate(null as unknown as string)).toBe(false);
			expect(service.validate(undefined as unknown as string)).toBe(false);
		});
	});
});
