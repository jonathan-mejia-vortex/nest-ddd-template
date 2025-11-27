import { Controller, Get } from "@nestjs/common";
import type { HealthCheckResult } from "@nestjs/terminus";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";
import { PrismaHealthIndicator } from "./indicators/prisma-health.indicator";
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
