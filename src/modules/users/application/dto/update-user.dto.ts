import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../domain/entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

