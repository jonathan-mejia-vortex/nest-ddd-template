import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { SharedModule } from "../../shared/shared.module";
import { HealthController } from "./health.controller";
import { PrismaHealthIndicator } from "./indicators/prisma-health.indicator";
import { RedisHealthIndicator } from "./indicators/redis-health.indicator";

@Module({
	imports: [
		// Terminus para health checks
		TerminusModule,
		// SharedModule expone PrismaService y la configuración de Redis (cache)
		SharedModule,
	],
	controllers: [HealthController],
	providers: [PrismaHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
