import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class TransferDto {
  @ApiProperty({
    example: 'usuario.perez.bank',
    description: 'Destinatario: puede ser su Alias, DNI/Documento, Username o Email',
  })
  @IsString({ message: 'El identificador debe ser texto' })
  @IsNotEmpty({ message: 'El destinatario (alias, DNI, username o email) es requerido' })
  recipientIdentifier: string;

  @ApiProperty({ example: 150.5, description: 'Monto a transferir (mayor a 0)' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser un número válido (máximo 2 decimales)' })
  @IsPositive({ message: 'El monto a transferir debe ser positivo' })
  @Min(0.01, { message: 'El monto mínimo de transferencia es 0.01' })
  amount: number;

  @ApiPropertyOptional({ example: 'Pago de alquiler', description: 'Concepto o descripción de la transferencia' })
  @IsOptional()
  @IsString()
  description?: string;
}
