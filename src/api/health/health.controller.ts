import { Controller, Get } from "@nestjs/common";
import type { HealthCheckResult } from "@nestjs/terminus";
// biome-ignore lint/style/useImportType: Required for NestJS DI metadata
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";
// biome-ignore lint/style/useImportType: Required for NestJS DI metadata
import { PrismaHealthIndicator } from "./indicators/prisma-health.indicator";
// biome-ignore lint/style/useImportType: Required for NestJS DI metadata
import { RedisHealthIndicator } from "./indicators/redis-health.indicator";

@Controller("health")
export class HealthController {
	constructor(
		private readonly health: HealthCheckService,
		private readonly prismaIndicator: PrismaHealthIndicator,
		private readonly redisIndicator: RedisHealthIndicator
	) {}

	@Get()
	@HealthCheck()
	async check(): Promise<HealthCheckResult> {
		return this.health.check([
			() => this.prismaIndicator.isHealthy("database"),
			() => this.redisIndicator.isHealthy("redis"),
		]);
	}
}
