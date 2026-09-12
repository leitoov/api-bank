import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

// DepositDto es un DTO que se utiliza para validar los datos de un deposito
export class DepositDto {
  @ApiProperty({ example: 500.0, description: 'Monto a depositar en la cuenta (mayor a 0)' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser un número válido' })
  @IsPositive({ message: 'El monto a depositar debe ser positivo' })
  @Min(0.01, { message: 'El monto mínimo de depósito es 0.01' })
  amount: number;

  @ApiPropertyOptional({ example: 'Carga de saldo inicial', description: 'Descripción opcional' })
  @IsOptional()
  @IsString()
  description?: string;
}
