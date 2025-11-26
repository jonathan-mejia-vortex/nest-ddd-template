import type { Auth } from "../entities/auth.entity";

export interface IAuthRepository {
	create(auth: Auth, transaction?: unknown): Promise<Auth>;
	findById(id: string): Promise<Auth | null>;
	findByEmail(email: string): Promise<Auth | null>;
	findAll(): Promise<Auth[]>;
}

export const AUTH_REPOSITORY = Symbol("AUTH_REPOSITORY");
