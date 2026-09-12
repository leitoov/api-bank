import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountsService } from './accounts.service.js';
import { UpdateAliasDto } from './dto/update-alias.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';


@ApiTags('Accounts (Cuentas y Saldos)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) { }

  //Endpoint para obtener info de la cuenta
  @Get('my-account')
  @ApiOperation({ summary: 'Obtener información de la cuenta propia (Saldo, Alias, CBU)' })
  @ApiResponse({ status: 200, description: 'Datos de la cuenta obtenidos exitosamente' })
  async getMyAccount(@CurrentUser() user: any) {
    return this.accountsService.getMyAccount(user.id);
  }

  //Endpoint para cambiar el alias
  @Patch('change-alias')
  @ApiOperation({ summary: 'Cambiar o personalizar el alias de la cuenta' })
  @ApiResponse({ status: 200, description: 'Alias actualizado exitosamente' })
  @ApiResponse({ status: 409, description: 'El alias ya se encuentra en uso' })
  async updateAlias(@CurrentUser() user: any, @Body() updateAliasDto: UpdateAliasDto) {
    return this.accountsService.updateAlias(user.id, updateAliasDto);
  }
}
