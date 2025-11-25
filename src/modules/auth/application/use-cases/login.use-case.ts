import { Injectable } from "@nestjs/common";
// biome-ignore lint/style/useImportType: JwtService is injected by NestJS DI
import { JwtService } from "@nestjs/jwt";
import type { User } from "../../../users/domain/entities/user.entity";

export interface LoginResponse {
	token: string;
}

@Injectable()
export class LoginUseCase {
	constructor(private readonly jwtService: JwtService) {}

	async execute(user: User): Promise<LoginResponse> {
		const payload = {
			authId: user.authId,
			userId: user.id,
			role: user.role,
		};

		return {
			token: this.jwtService.sign(payload),
		};
	}
}
