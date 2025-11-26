import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { ConflictException, Injectable } from "@nestjs/common";
// biome-ignore lint/style/useImportType: Required for NestJS DI metadata
import { Reflector } from "@nestjs/core";
// biome-ignore lint/style/useImportType: Required for NestJS DI metadata
import { IdempotencyService } from "../../shared/infrastructure/idempotency/idempotency.service";

export const IDEMPOTENCY_KEY = "idempotency";

/**
 * Decorator para marcar endpoints como idempotentes
 * @param operation Nombre de la operación (ej: 'create-order', 'process-payment')
 */
export const Idempotent = (operation: string) =>
	Reflect.defineMetadata.bind(Reflect, IDEMPOTENCY_KEY, operation);

/**
 * Guard para garantizar idempotencia en endpoints críticos
 * Requiere que el cliente envíe un header 'X-Idempotency-Key'
 *
 * Uso:
 * @Post()
 * @Idempotent('create-user')
 * @UseGuards(IdempotencyGuard)
 * async create(@Body() dto: CreateDto) { ... }
 */
@Injectable()
export class IdempotencyGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private idempotencyService: IdempotencyService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const operation = this.reflector.get<string>(IDEMPOTENCY_KEY, context.getHandler());

		// Si el endpoint no está marcado como idempotente, continuar
		if (!operation) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const idempotencyKey = request.headers["x-idempotency-key"];

		// Si no se proporciona clave de idempotencia, lanzar error
		if (!idempotencyKey) {
			throw new ConflictException("Header X-Idempotency-Key es requerido para esta operación");
		}

		// Extraer userId del usuario autenticado (si existe)
		const userId = request.user?.id || "anonymous";

		// Generar clave completa
		const key = this.idempotencyService.generateKey(userId, operation, idempotencyKey);

		// Verificar si ya fue procesada
		const isProcessed = await this.idempotencyService.isProcessed(key);

		if (isProcessed) {
			// Obtener resultado previo y devolverlo
			const previousResult = await this.idempotencyService.getProcessedResult(key);

			throw new ConflictException({
				message: "Esta operación ya fue procesada previamente",
				previousResult,
			});
		}

		// Almacenar la clave en el request para que el controller la use
		request.idempotencyKey = key;

		return true;
	}
}
