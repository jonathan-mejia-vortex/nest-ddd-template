import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { UserRole } from "../../../users/domain/entities/user.entity";

export class CreateAuthDto {
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(6, { message: "La contraseña debe tener al menos 6 caracteres" })
	password: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(1)
	name: string;

	@IsOptional()
	@IsEnum(UserRole)
	role?: UserRole;
}
