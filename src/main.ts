// IMPORTANTE: Importar tracing ANTES que cualquier otro código
// para que la auto-instrumentación funcione correctamente
import "./tracing";

import { Logger, RequestMethod, ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
// ResponseInterceptor se registra globalmente en ApiModule
import { envs } from "./config/envs";

async function bootstrap() {
	const logger = new Logger(envs.serviceName || "NestDDDTemplate");
	const app = await NestFactory.create(AppModule);

	app.setGlobalPrefix("api", {
		exclude: [
			{ path: "", method: RequestMethod.GET }, // raíz simple (si la usás como health básico)
			{ path: "health", method: RequestMethod.GET }, // Terminus health check
		],
	});

	// ResponseInterceptor se registra globalmente en ApiModule (usando APP_INTERCEPTOR)

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidUnknownValues: true,
		})
	);

	app.enableVersioning({
		type: VersioningType.URI,
	});

	const config = new DocumentBuilder()
		.setTitle(`${envs.serviceName} API`)
		.setDescription("Microservicio con arquitectura DDD + Hexagonal, Prisma, JWT y Observabilidad")
		.setVersion("1.0.0")
		.addTag("Auth")
		.addTag("Users")
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("docs", app, document);

	app.enableCors();

	await app.listen(process.env.PORT ?? 3000);
	logger.log(`Microservice running on port: ${envs.port}`);
	logger.log(`Environment: ${envs.nodeEnv}`);
	logger.log(`Documentation available at http://localhost:${envs.port}/docs`);
}

bootstrap();
