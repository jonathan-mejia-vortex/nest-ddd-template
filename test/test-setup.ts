import type { INestApplication } from "@nestjs/common";
import { UserRole } from "../src/common/types";
import { PrismaService } from "../src/shared/infrastructure/persistence/prisma.service";
import { buildTestConfigApp } from "./helpers/test-config-app";
import { createAuthAndGetToken } from "./helpers/test-create-auth";

export let app: INestApplication;
export let prisma: PrismaService;
export let adminToken: string;
export let employeeToken: string;

beforeAll(async () => {
	app = await buildTestConfigApp();
	prisma = app.get<PrismaService>(PrismaService);

	// Limpiar base de datos antes de los tests
	await prisma.cleanDatabase();

	// Crear usuarios de prueba
	adminToken = await createAuthAndGetToken(prisma, app, UserRole.ADMIN);
	employeeToken = await createAuthAndGetToken(prisma, app, UserRole.USER);

	await app.init();
});

/**
 * La DB se limpia cuando todos los tests terminan
 */
afterAll(async () => {
	await prisma.cleanDatabase();
	if (app) await app.close();
	if (prisma) await prisma.$disconnect();
});
