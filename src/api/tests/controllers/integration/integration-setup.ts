import type { INestApplication } from "@nestjs/common";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { AppModule } from "../../../../app.module";
import { UserRole } from "../../../../common/types";
import { CreateAuthUseCase } from "../../../../modules/auth/application/use-cases/create-auth.use-case";
import { LoginUseCase } from "../../../../modules/auth/application/use-cases/login.use-case";
import { ValidateUserUseCase } from "../../../../modules/auth/application/use-cases/validate-user.use-case";
import { PrismaService } from "../../../../shared/infrastructure/persistence/prisma.service";

export let app: INestApplication;
export let prisma: PrismaService;
export let adminToken: string;
export let employeeToken: string;

/**
 * Construye la app de test con la configuración necesaria
 * Nota: ResponseInterceptor ya está registrado en ApiModule, no agregarlo aquí
 */
async function buildTestConfigApp(): Promise<INestApplication> {
	const moduleFixture: TestingModule = await Test.createTestingModule({
		imports: [AppModule],
	}).compile();

	const application = moduleFixture.createNestApplication();
	application.setGlobalPrefix("api");
	application.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
		})
	);
	application.enableVersioning({
		type: VersioningType.URI,
	});

	return application;
}

/**
 * Crea un auth y retorna el token JWT
 * Si el usuario ya existe, solo hace login
 */
async function createAuthAndGetToken(
	prismaService: PrismaService,
	application: INestApplication,
	role: UserRole
): Promise<string> {
	const createAuthUseCase = application.get(CreateAuthUseCase);
	const validateUserUseCase = application.get(ValidateUserUseCase);
	const loginUseCase = application.get(LoginUseCase);

	const email = `integration-${role.toLowerCase()}@test.com`;
	const password = "test123456";

	// Verificar si el usuario ya existe
	const existingAuth = await prismaService.auth.findUnique({
		where: { email },
	});

	if (!existingAuth) {
		await prismaService.$transaction(async (tx) => {
			await createAuthUseCase.execute(
				{
					email,
					password,
					name: `Test ${role}`,
					role,
				},
				tx
			);
		});
	}

	const user = await validateUserUseCase.execute({ email, password });
	const loginResponse = await loginUseCase.execute(user);

	return loginResponse.token;
}

beforeAll(async () => {
	app = await buildTestConfigApp();
	prisma = app.get<PrismaService>(PrismaService);

	// Inicializar la aplicación PRIMERO
	await app.init();

	// Limpiar base de datos antes de los tests
	await prisma.cleanDatabase();

	// Crear usuarios de prueba
	adminToken = await createAuthAndGetToken(prisma, app, UserRole.ADMIN);
	employeeToken = await createAuthAndGetToken(prisma, app, UserRole.USER);
});

afterAll(async () => {
	// Limpiar base de datos después de los tests
	if (prisma) {
		await prisma.cleanDatabase();
		await prisma.$disconnect();
	}
	if (app) {
		await app.close();
	}
});
