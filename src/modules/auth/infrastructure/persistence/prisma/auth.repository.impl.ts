import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Auth } from "../../../domain/entities/auth.entity";
import { EmailAlreadyExistsException } from "../../../domain/exceptions/email-already-exists.exception";
import type { IAuthRepository } from "../../../domain/repositories/auth.repository.interface";
// biome-ignore lint/style/useImportType: PrismaService is injected by NestJS DI
import { PrismaService } from "../../../../../shared/infrastructure/persistence/prisma.service";

@Injectable()
export class AuthRepositoryImpl implements IAuthRepository {
	constructor(private readonly prisma: PrismaService) {}

	async create(auth: Auth, transaction?: unknown): Promise<Auth> {
		try {
			const prismaClient = (transaction ?? this.prisma) as Prisma.TransactionClient | PrismaService;

			const created = await prismaClient.auth.create({
				data: {
					id: auth.id,
					email: auth.email,
					password: auth.password,
				},
			});

			return Auth.fromPersistence({
				id: created.id,
				email: created.email,
				password: created.password,
				createdAt: created.createdAt,
				updatedAt: created.updatedAt,
			});
		} catch (error) {
			// Prisma unique constraint error
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
				throw new EmailAlreadyExistsException(auth.email);
			}
			throw new Error(`Error al crear auth: ${error.message}`);
		}
	}

	async findById(id: string): Promise<Auth | null> {
		const found = await this.prisma.auth.findUnique({
			where: { id },
			include: { user: true },
		});

		if (!found) {
			return null;
		}

		return Auth.fromPersistence({
			id: found.id,
			email: found.email,
			password: found.password,
			createdAt: found.createdAt,
			updatedAt: found.updatedAt,
		});
	}

	async findByEmail(email: string): Promise<Auth | null> {
		const found = await this.prisma.auth.findUnique({
			where: { email },
			include: { user: true },
		});

		if (!found) {
			return null;
		}

		return Auth.fromPersistence({
			id: found.id,
			email: found.email,
			password: found.password,
			createdAt: found.createdAt,
			updatedAt: found.updatedAt,
		});
	}

	async findAll(): Promise<Auth[]> {
		const auths = await this.prisma.auth.findMany();

		return auths.map((auth) =>
			Auth.fromPersistence({
				id: auth.id,
				email: auth.email,
				password: auth.password,
				createdAt: auth.createdAt,
				updatedAt: auth.updatedAt,
			})
		);
	}
}
