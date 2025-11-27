import { Injectable } from "@nestjs/common";
// biome-ignore lint/style/useImportType: HealthIndicatorService must remain a runtime value for NestJS DI metadata
import { HealthIndicatorService } from "@nestjs/terminus";
// biome-ignore lint/style/useImportType: PrismaService must remain a runtime value for NestJS DI metadata
import { PrismaService } from "../../../shared/infrastructure/persistence/prisma.service";

@Injectable()
export class PrismaHealthIndicator {
	constructor(
		private readonly prisma: PrismaService,
		private readonly healthIndicatorService: HealthIndicatorService
	) {}

	async isHealthy(key: string) {
		const indicator = this.healthIndicatorService.check(key);

		try {
			// Consulta mínima para verificar conexión
			await this.prisma.$queryRaw`SELECT 1`;

			return indicator.up();
		} catch (error) {
			return indicator.down({
				message: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}
}
