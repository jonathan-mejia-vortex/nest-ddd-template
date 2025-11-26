import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
// biome-ignore lint/style/useImportType: HealthIndicatorService must remain a runtime value for NestJS DI metadata
import { HealthIndicatorService } from "@nestjs/terminus";
import type { Cache } from "cache-manager";

@Injectable()
export class RedisHealthIndicator {
	constructor(
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly healthIndicatorService: HealthIndicatorService
	) {}

	async isHealthy(key: string) {
		const indicator = this.healthIndicatorService.check(key);
		try {
			return indicator.up();
		} catch (error) {
			return indicator.down({
				message: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}
}
