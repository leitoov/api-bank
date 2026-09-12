import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

//Validaciones del dto de actualizacion de alias
export class UpdateAliasDto {
  @ApiProperty({ example: 'mi.nuevo.alias', description: 'Nuevo alias único para la cuenta' })
  @IsString({ message: 'El alias debe ser texto' })
  @IsNotEmpty({ message: 'El alias no puede estar vacío' })
  @MinLength(4, { message: 'El alias debe tener al menos 4 caracteres' })
  @Matches(/^[a-z0-9_.]+$/, {
    message: 'El alias solo puede contener letras minúsculas, números, puntos y guiones bajos',
  })
  newAlias: string;
}
