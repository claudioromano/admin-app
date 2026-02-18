import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
