/**
 * Tipos y enums globales compartidos
 */

export enum ROLE {
	ADMIN = "ADMIN",
	USER = "USER",
}

export enum UserRole {
	USER = "USER",
	ADMIN = "ADMIN",
}

/**
 * Extensión del tipo Request de Express para incluir propiedades personalizadas
 */
declare global {
	namespace Express {
		interface Request {
			user?: {
				id: string;
				authId: string;
				role: string;
			};
			correlationId?: string;
		}
	}
}
