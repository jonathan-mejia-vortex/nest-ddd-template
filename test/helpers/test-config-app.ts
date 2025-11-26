import { ValidationPipe } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { ResponseInterceptor } from "../../src/common/dto/response.interceptor";

export async function buildTestConfigApp() {
	const moduleFixture: TestingModule = await Test.createTestingModule({
		imports: [AppModule],
	}).compile();
	const app = moduleFixture.createNestApplication();
	app.setGlobalPrefix("api"); // ADD GLOBAL PREFIX TO ALL TESTS APP
	app.useGlobalInterceptors(new ResponseInterceptor());

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidUnknownValues: true,
			transform: true,
			forbidNonWhitelisted: true,
		})
	);
	return app;
}
