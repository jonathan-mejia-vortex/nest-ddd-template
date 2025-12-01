import * as request from "supertest";
import { adminToken, app, employeeToken } from "./integration-setup";

describe("UsersController (Integration)", () => {
	describe("GET /api/v1/user", () => {
		it("should return 401 when no token is provided", async () => {
			const response = await request(app.getHttpServer()).get("/api/v1/user");

			expect(response.status).toBe(401);
		});

		it("should return 403 when user is not admin", async () => {
			const response = await request(app.getHttpServer())
				.get("/api/v1/user")
				.set("Authorization", `Bearer ${employeeToken}`);

			expect(response.status).toBe(403);
		});

		it("should return paginated users for admin", async () => {
			const response = await request(app.getHttpServer())
				.get("/api/v1/user")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(200);
			expect(response.body.result).toBeDefined();
			expect(response.body.result.users).toBeDefined();
			expect(response.body.result.pagination).toBeDefined();
			expect(Array.isArray(response.body.result.users)).toBe(true);
			expect(response.body.result.pagination.total).toBeDefined();
			expect(response.body.result.pagination.limit).toBeDefined();
			expect(response.body.result.pagination.offset).toBeDefined();
			expect(response.body.result.pagination.hasMore).toBeDefined();
		});

		it("should respect pagination parameters", async () => {
			const response = await request(app.getHttpServer())
				.get("/api/v1/user?limit=5&offset=0")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(200);
			expect(response.body.result.pagination).toBeDefined();
			expect(response.body.result.pagination.limit).toBeDefined();
			expect(response.body.result.pagination.offset).toBeDefined();
		});

		it("should return users with correct structure", async () => {
			const response = await request(app.getHttpServer())
				.get("/api/v1/user")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(200);
			if (response.body.result.users.length > 0) {
				const user = response.body.result.users[0];
				expect(user.id).toBeDefined();
				expect(user.name).toBeDefined();
				expect(user.role).toBeDefined();
				expect(user.authId).toBeDefined();
				expect(user.createdAt).toBeDefined();
				expect(user.updatedAt).toBeDefined();
			}
		});

		it("should handle offset pagination correctly", async () => {
			const response = await request(app.getHttpServer())
				.get("/api/v1/user?limit=10&offset=1")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(200);
			expect(response.body.result.pagination).toBeDefined();
		});
	});

	describe("PATCH /api/v1/user", () => {
		it("should return 401 when no token is provided", async () => {
			const response = await request(app.getHttpServer())
				.patch("/api/v1/user")
				.send({ name: "New Name" });

			expect(response.status).toBe(401);
		});

		it("should update user name successfully for regular user", async () => {
			const response = await request(app.getHttpServer())
				.patch("/api/v1/user")
				.set("Authorization", `Bearer ${employeeToken}`)
				.send({ name: "Updated Employee Name" });

			expect(response.status).toBe(200);
			expect(response.body.result).toBeDefined();
			expect(response.body.result.message).toBe("Usuario actualizado correctamente");
		});

		it("should update user name successfully for admin", async () => {
			const response = await request(app.getHttpServer())
				.patch("/api/v1/user")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ name: "Updated Admin Name" });

			expect(response.status).toBe(200);
			expect(response.body.result).toBeDefined();
			expect(response.body.result.message).toBe("Usuario actualizado correctamente");
		});

		it("should allow updating with empty body", async () => {
			const response = await request(app.getHttpServer())
				.patch("/api/v1/user")
				.set("Authorization", `Bearer ${employeeToken}`)
				.send({});

			expect(response.status).toBe(200);
		});

		it("should reject invalid token", async () => {
			const response = await request(app.getHttpServer())
				.patch("/api/v1/user")
				.set("Authorization", "Bearer invalid-token")
				.send({ name: "New Name" });

			expect(response.status).toBe(401);
		});

		it("should reject malformed authorization header", async () => {
			const response = await request(app.getHttpServer())
				.patch("/api/v1/user")
				.set("Authorization", "InvalidFormat")
				.send({ name: "New Name" });

			expect(response.status).toBe(401);
		});
	});
});
