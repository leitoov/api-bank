import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@banco.com', description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({ example: 'nombre_usuario', description: 'Nombre de usuario (alfanumerico, minusculas)' })
  @IsString({ message: 'El username debe ser texto' })
  @IsNotEmpty({ message: 'El nombre de usuario es requerido' })
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  @Matches(/^[a-z0-9_.]+$/, {
    message: 'El nombre de usuario solo puede contener letras minusculas, numeros, puntos y guiones bajos',
  })
  username: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña del usuario (minimo 6 caracteres)' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  lastName: string;

  @ApiProperty({ example: '12345678', description: 'Documento / DNI / Cédula única' })
  @IsString()
  @IsNotEmpty({ message: 'El documento es requerido' })
  document: string;

  @ApiPropertyOptional({
    example: 'usuario.banco.pesos',
    description: 'Alias personalizado para la cuenta',
  })
  @IsOptional()
  @IsString()
  @MinLength(4, { message: 'El alias debe tener al menos 4 caracteres' })
  @Matches(/^[a-z0-9_.]+$/, {
    message: 'El alias solo puede contener letras minusculas, numeros, puntos y guiones bajos',
  })
  alias?: string;
}
