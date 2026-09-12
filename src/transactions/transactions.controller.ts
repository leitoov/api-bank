import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service.js';
import { TransferDto } from './dto/transfer.dto.js';
import { DepositDto } from './dto/deposit.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Transactions (Transferencias y Movimientos)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  // Transferencia entre usuarios (valida datos, saldos y ejecuta la transferencia)
  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transferir dinero a otro usuario mediante Alias, DNI, Username o Email',
    description: 'Valida que el remitente tenga saldo suficiente, busca al destinatario por Alias, DNI, Username o Email y ejecuta la transferencia.',
  })
  @ApiResponse({ status: 200, description: 'Transferencia realizada con éxito' })
  @ApiResponse({ status: 400, description: 'Saldo insuficiente o datos inválidos' })
  @ApiResponse({ status: 404, description: 'Destinatario no encontrado' })
  async transfer(@CurrentUser() user: any, @Body() transferDto: TransferDto) {
    return this.transactionsService.transfer(user.id, transferDto);
  }

  // Deposito en la cuenta propia (valida datos y ejecuta el deposito)
  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Depositar saldo en la cuenta propia' })
  @ApiResponse({ status: 200, description: 'Depósito acreditado con éxito' })
  @ApiResponse({ status: 400, description: 'Monto inválido' })
  async deposit(@CurrentUser() user: any, @Body() depositDto: DepositDto) {
    return this.transactionsService.deposit(user.id, depositDto);
  }

  // Historial de transacciones (valida datos y muestra el historial)
  @Get('history')
  @ApiOperation({ summary: 'Consultar saldo actual e historial de transacciones (ingresos y egresos)' })
  @ApiResponse({ status: 200, description: 'Historial obtenido correctamente' })
  async getHistory(@CurrentUser() user: any) {
    return this.transactionsService.getHistory(user.id);
  }
}
