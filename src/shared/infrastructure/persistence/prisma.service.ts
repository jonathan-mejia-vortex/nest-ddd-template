import { Injectable, type OnModuleInit, type OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * PrismaService - Singleton de conexión a Prisma
 * Sigue la guía oficial de NestJS: https://docs.nestjs.com/recipes/prisma
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(PrismaService.name);

	constructor() {
		super({
			log: [
				{ level: "query", emit: "event" },
				{ level: "error", emit: "stdout" },
				{ level: "warn", emit: "stdout" },
			],
		});

		// Log de queries en desarrollo
		if (process.env.NODE_ENV === "development") {
			this.$on("query", (e: unknown) => {
				const event = e as { query?: string; duration?: number };
				if (event.query) {
					this.logger.debug(`Query: ${event.query}`);
				}
				if (typeof event.duration === "number") {
					this.logger.debug(`Duration: ${event.duration}ms`);
				}
			});
		}
	}

	async onModuleInit() {
		this.logger.log("Connecting to database...");
		await this.$connect();
		this.logger.log("✅ Database connected");
	}

	async onModuleDestroy() {
		this.logger.log("Disconnecting from database...");
		await this.$disconnect();
		this.logger.log("✅ Database disconnected");
	}

	/**
	 * Ejecuta una operación dentro de una transacción
	 * Uso: await prismaService.executeInTransaction(async (tx) => { ... })
	 */
	async executeInTransaction<T>(
		fn: (
			prisma: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">
		) => Promise<T>
	): Promise<T> {
		return this.$transaction(fn);
	}

	/**
	 * Limpia la base de datos (solo para testing)
	 */
	async cleanDatabase() {
		if (process.env.NODE_ENV !== "test") {
			throw new Error("cleanDatabase solo puede ejecutarse en entorno de test");
		}

		const tables = ["users", "auths"];

		for (const table of tables) {
			await this.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
		}
	}
}
