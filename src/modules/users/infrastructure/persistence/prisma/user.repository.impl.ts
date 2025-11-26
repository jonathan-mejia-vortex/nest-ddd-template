import { Injectable } from "@nestjs/common";
import { User } from "../../../domain/entities/user.entity";
import { UserCreationFailedException } from "../../../domain/exceptions/user-creation-failed.exception";
import type { IUserRepository } from "../../../domain/repositories/user.repository.interface";
// biome-ignore lint/style/useImportType: PrismaService is injected by NestJS DI
import { PrismaService } from "../../../../../shared/infrastructure/persistence/prisma.service";

@Injectable()
export class UserRepositoryImpl implements IUserRepository {
	constructor(private readonly prisma: PrismaService) {}

	async create(user: User, transaction?: unknown): Promise<User> {
		try {
			const prismaClient = (transaction ?? this.prisma) as PrismaService;

			const created = await prismaClient.user.create({
				data: {
					id: user.id,
					name: user.name,
					authId: user.authId,
					role: user.role,
				},
			});

			return User.fromPersistence({
				id: created.id,
				name: created.name,
				authId: created.authId,
				role: created.role,
				createdAt: created.createdAt,
				updatedAt: created.updatedAt,
			});
		} catch (error) {
			throw new UserCreationFailedException(error.message);
		}
	}

	async update(user: User): Promise<void> {
		try {
			await this.prisma.user.update({
				where: { id: user.id },
				data: {
					name: user.name,
					role: user.role,
				},
			});
		} catch (error) {
			throw new Error(`Error al actualizar usuario: ${error.message}`);
		}
	}

	async findById(id: string): Promise<User | null> {
		const found = await this.prisma.user.findUnique({
			where: { id },
		});

		if (!found) {
			return null;
		}

		return User.fromPersistence({
			id: found.id,
			name: found.name,
			authId: found.authId,
			role: found.role,
			createdAt: found.createdAt,
			updatedAt: found.updatedAt,
		});
	}

	async findByAuthId(authId: string): Promise<User | null> {
		const found = await this.prisma.user.findUnique({
			where: { authId },
		});

		if (!found) {
			return null;
		}

		return User.fromPersistence({
			id: found.id,
			name: found.name,
			authId: found.authId,
			role: found.role,
			createdAt: found.createdAt,
			updatedAt: found.updatedAt,
		});
	}

	async findAll(options?: { limit: number; offset: number }): Promise<{
		data: User[];
		total: number;
		hasMore: boolean;
	}> {
		const limit = options?.limit || 10;
		const offset = options?.offset || 0;

		// Obtener total count y datos en paralelo
		const [users, total] = await Promise.all([
			this.prisma.user.findMany({
				take: limit,
				skip: offset,
				orderBy: { createdAt: "desc" },
			}),
			this.prisma.user.count(),
		]);

		const data = users.map((user) =>
			User.fromPersistence({
				id: user.id,
				name: user.name,
				authId: user.authId,
				role: user.role,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			})
		);

		return {
			data,
			total,
			hasMore: offset + limit < total,
		};
	}
}
