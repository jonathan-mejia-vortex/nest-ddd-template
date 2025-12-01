import * as request from "supertest";
import { adminToken, app, employeeToken } from "./test-setup";

describe("UsersController (e2e)", () => {
	describe("/user (GET)", () => {
		it("should return 401 when no token is provided", () => {
			return request(app.getHttpServer())
				.get("/api/v1/user")
				.expect(401);
		});

		it("should return 403 when user is not admin", () => {
			return request(app.getHttpServer())
				.get("/api/v1/user")
				.set("Authorization", `Bearer ${employeeToken}`)
				.expect(403);
		});

		it("should return paginated users for admin", () => {
			return request(app.getHttpServer())
				.get("/api/v1/user")
				.set("Authorization", `Bearer ${adminToken}`)
				.expect(200)
				.expect((res) => {
					expect(res.body.success).toBe(true);
					expect(res.body.data).toHaveProperty("users");
					expect(res.body.data).toHaveProperty("pagination");
					expect(Array.isArray(res.body.data.users)).toBe(true);
					expect(res.body.data.pagination).toHaveProperty("total");
					expect(res.body.data.pagination).toHaveProperty("limit");
					expect(res.body.data.pagination).toHaveProperty("offset");
					expect(res.body.data.pagination).toHaveProperty("hasMore");
				});
		});

		it("should respect pagination parameters", () => {
			return request(app.getHttpServer())
				.get("/api/v1/user?limit=1&offset=0")
				.set("Authorization", `Bearer ${adminToken}`)
				.expect(200)
				.expect((res) => {
					expect(res.body.data.pagination.limit).toBe(1);
					expect(res.body.data.pagination.offset).toBe(0);
					expect(res.body.data.users.length).toBeLessThanOrEqual(1);
				});
		});

		it("should return users with correct structure", () => {
			return request(app.getHttpServer())
				.get("/api/v1/user")
				.set("Authorization", `Bearer ${adminToken}`)
				.expect(200)
				.expect((res) => {
					if (res.body.data.users.length > 0) {
						const user = res.body.data.users[0];
						expect(user).toHaveProperty("id");
						expect(user).toHaveProperty("name");
						expect(user).toHaveProperty("role");
						expect(user).toHaveProperty("authId");
						expect(user).toHaveProperty("createdAt");
						expect(user).toHaveProperty("updatedAt");
					}
				});
		});
	});

	describe("/user (PATCH)", () => {
		it("should return 401 when no token is provided", () => {
			return request(app.getHttpServer())
				.patch("/api/v1/user")
				.send({ name: "New Name" })
				.expect(401);
		});

		it("should update user name successfully", () => {
			return request(app.getHttpServer())
				.patch("/api/v1/user")
				.set("Authorization", `Bearer ${employeeToken}`)
				.send({ name: "Updated Employee Name" })
				.expect(200)
				.expect((res) => {
					expect(res.body.success).toBe(true);
					expect(res.body.data.message).toBe("Usuario actualizado correctamente");
				});
		});

		it("should work for admin user too", () => {
			return request(app.getHttpServer())
				.patch("/api/v1/user")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ name: "Updated Admin Name" })
				.expect(200)
				.expect((res) => {
					expect(res.body.success).toBe(true);
					expect(res.body.data.message).toBe("Usuario actualizado correctamente");
				});
		});

		it("should allow updating with empty body", () => {
			return request(app.getHttpServer())
				.patch("/api/v1/user")
				.set("Authorization", `Bearer ${employeeToken}`)
				.send({})
				.expect(200);
		});
	});
});
