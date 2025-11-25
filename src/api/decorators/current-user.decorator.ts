import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

/**
 * Decorator para obtener el usuario actual del request
 * Uso: @CurrentUser() user: { id: string; authId: string; role: string }
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return request.user;
});
