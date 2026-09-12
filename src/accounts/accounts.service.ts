import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateAliasDto } from './dto/update-alias.dto.js';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) { }

  //Obtengo info de la cuenta del usuario (id,mail,username,firstname,lastname,document)
  async getMyAccount(userId: string) {
    const account = await this.prisma.account.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            document: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('No se encontró una cuenta bancaria activa');
    }

    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      alias: account.alias,
      balance: Number(account.balance),
      currency: account.currency,
      type: account.type,
      status: account.status,
      holder: account.user,
    };
  }

  //actualiza alias a partir del id del usuario
  async updateAlias(userId: string, updateAliasDto: UpdateAliasDto) {
    const normalizedAlias = updateAliasDto.newAlias.trim().toLowerCase();

    // Verificar si el alias ya existe en alguna cuenta
    const existing = await this.prisma.account.findUnique({
      where: { alias: normalizedAlias },
    });

    if (existing) {
      throw new ConflictException('El alias ingresado no puede ser utilizado, pruebe con otro');
    }

    //Obtengo la cuenta del usuario
    const account = await this.prisma.account.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    if (!account) {
      throw new NotFoundException('Su cuenta no esta activda, contactarse con soporte');
    }

    //Actualizo el alias
    const updated = await this.prisma.account.update({
      where: { id: account.id },
      data: { alias: normalizedAlias },
    });

    return {
      message: 'Alias actualizado exitosamente',
      accountNumber: updated.accountNumber,
      newAlias: updated.alias,
    };
  }
}
