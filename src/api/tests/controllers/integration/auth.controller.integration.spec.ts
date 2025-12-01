import * as request from "supertest";
import { app } from "./integration-setup";

describe("AuthController (Integration)", () => {
	describe("POST /api/v1/auth/signup", () => {
		it("should create a new user successfully", async () => {
			const response = await request(app.getHttpServer()).post("/api/v1/auth/signup").send({
				email: "newuser@integration.test",
				password: "password123",
				name: "New User",
			});

			expect(response.status).toBe(201);
			expect(response.body.result).toBeDefined();
			expect(response.body.result.message).toBe("Usuario registrado correctamente");
		});

		it("should return 409 when email already exists", async () => {
			const response = await request(app.getHttpServer()).post("/api/v1/auth/signup").send({
				email: "integration-admin@test.com",
				password: "password123",
				name: "Duplicate User",
			});

			expect(response.status).toBe(409);
		});

		it("should return 400 when name is missing", async () => {
			const response = await request(app.getHttpServer()).post("/api/v1/auth/signup").send({
				email: "missingname@integration.test",
				password: "password123",
			});

			expect(response.status).toBe(400);
		});

		it("should return 400 when email is invalid", async () => {
			const response = await request(app.getHttpServer()).post("/api/v1/auth/signup").send({
				email: "invalid-email",
				password: "password123",
				name: "Invalid Email User",
			});

			expect(response.status).toBe(400);
		});

		it("should return 400 when password is too short", async () => {
			const response = await request(app.getHttpServer()).post("/api/v1/auth/signup").send({
				email: "shortpass@integration.test",
				password: "123",
				name: "Short Password User",
			});

			expect(response.status).toBe(400);
		});

		it("should return 400 when password is missing", async () => {
			const response = await request(app.getHttpServer()).post("/api/v1/auth/signup").send({
				email: "nopass@integration.test",
				name: "No Password User",
			});

			expect(response.status).toBe(400);
		});
	});

	describe("POST /api/v1/auth/login", () => {
		it("should login successfully with valid credentials", async () => {
			const response = await request(app.getHttpServer()).post("/api/v1/auth/login").send({
				email: "integration-admin@test.com",
				password: "test123456",
			});

			expect(response.status).toBe(200);
			expect(response.body.result).toBeDefined();
			expect(response.body.result.token).toBeDefined();
			expect(typeof response.body.result.token).toBe("string");
		});

		it("should return 404 when email does not exist", async () => {
			const response = await request(app.getHttpServer()).post("/api/v1/auth/login").send({
				email: "nonexistent@integration.test",
				password: "password123",
			});

			expect(response.status).toBe(404);
		});

		it("should return 401 when password is incorrect", async () => {
			const response = await request(app.getHttpServer()).post("/api/v1/auth/login").send({
				email: "integration-admin@test.com",
				password: "wrongpassword",
			});

			expect(response.status).toBe(401);
		});

		it("should return 400 when password is empty", async () => {
			const response = await request(app.getHttpServer()).post("/api/v1/auth/login").send({
				email: "integration-admin@test.com",
				password: "",
			});

			expect(response.status).toBe(400);
		});

		it("should return 400 when email is missing", async () => {
			const response = await request(app.getHttpServer()).post("/api/v1/auth/login").send({
				password: "password123",
			});

			expect(response.status).toBe(400);
		});
	});
});
