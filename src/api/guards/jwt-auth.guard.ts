import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import type { GetAuthByIdUseCase } from "../../modules/auth/application/use-cases/get-auth-by-id.use-case";

/**
 * JwtAuthGuard custom - Sin Passport
 * Valida el token JWT y adjunta el usuario al request
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly getAuthByIdUseCase: GetAuthByIdUseCase
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();
		const token = this.extractTokenFromHeader(request);

		if (!token) {
			throw new UnauthorizedException("Token no proporcionado");
		}

		try {
			// Verificar y decodificar el token
			const payload = await this.jwtService.verifyAsync(token);

			// Opcional: Verificar que el auth existe en la base de datos
			const auth = await this.getAuthByIdUseCase.execute(payload.authId);

			if (!auth) {
				throw new UnauthorizedException("Usuario no encontrado");
			}

			// Adjuntar usuario al request para acceso en controllers
			request.user = {
				id: payload.userId,
				authId: payload.authId,
				role: payload.role,
			};

			return true;
		} catch (_error) {
			throw new UnauthorizedException("Token inválido o expirado");
		}
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		const authHeader = request.headers.authorization;
		if (!authHeader) {
			return undefined;
		}

		const [type, token] = authHeader.split(" ");
		return type === "Bearer" ? token : undefined;
	}
}
