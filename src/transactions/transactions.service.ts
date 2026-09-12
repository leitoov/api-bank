import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TransferDto } from './dto/transfer.dto.js';
import { DepositDto } from './dto/deposit.dto.js';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) { }

  /**
   * Realizar una transferencia
   */
  async transfer(userId: string, transferDto: TransferDto) {
    const { recipientIdentifier, amount, description } = transferDto;
    const normalizedIdentifier = recipientIdentifier.trim().toLowerCase();

    // Obtiene la cuenta activa del remitente
    const senderAccount = await this.prisma.account.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { user: { select: { firstName: true, lastName: true, username: true } } },
    });

    if (!senderAccount) {
      throw new NotFoundException('No se encontró una cuenta activa para el remitente');
    }

    // Buscar la cuenta del destinatario por Alias, CBU/Número de Cuenta, Username, DNI o Email
    const recipientAccount = await this.prisma.account.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          { alias: normalizedIdentifier },
          { accountNumber: recipientIdentifier.trim() },
          { user: { username: normalizedIdentifier } },
          { user: { document: recipientIdentifier.trim() } },
          { user: { email: normalizedIdentifier } },
        ],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            document: true,
            email: true,
          },
        },
      },
    });

    if (!recipientAccount) {
      throw new NotFoundException(
        `No se encontró ninguna cuenta activa con el alias, DNI, username o email: "${recipientIdentifier}"`,
      );
    }

    // Valida que no se transfiera a sí mismo
    if (senderAccount.id === recipientAccount.id) {
      throw new BadRequestException('No puedes transferirte dinero a tu propia cuenta');
    }

    // Valida saldo suficiente
    const currentBalance = Number(senderAccount.balance);
    if (currentBalance < amount) {
      throw new BadRequestException(
        `Saldo insuficiente. Saldo disponible: $${currentBalance.toFixed(2)} - Monto a transferir: $${amount.toFixed(2)}`,
      );
    }

    // Ejecuta la transferencia en la base de datos
    return this.prisma.$transaction(async (tx) => {
      // Descuenta saldo al remitente
      const updatedSender = await tx.account.update({
        where: { id: senderAccount.id },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      // Acreditar saldo al destinatario
      const updatedRecipient = await tx.account.update({
        where: { id: recipientAccount.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      // Crea el registro de la transacción
      const transaction = await tx.transaction.create({
        data: {
          amount,
          type: 'TRANSFER',
          status: 'COMPLETED',
          description: description || `Transferencia a ${recipientAccount.user.firstName} ${recipientAccount.user.lastName}`,
          sourceAccountId: senderAccount.id,
          targetAccountId: recipientAccount.id,
        },
      });

      return {
        message: 'Transferencia realizada con éxito',
        transactionId: transaction.id,
        amountTransferred: amount,
        newBalance: Number(updatedSender.balance),
        recipient: {
          fullName: `${recipientAccount.user.firstName} ${recipientAccount.user.lastName}`,
          alias: recipientAccount.alias,
          accountNumber: recipientAccount.accountNumber,
          username: recipientAccount.user.username,
        },
        createdAt: transaction.createdAt,
      };
    });
  }

  /**
   * Depositar / Cargar saldo a la propia cuenta
   */
  async deposit(userId: string, depositDto: DepositDto) {
    const { amount, description } = depositDto;

    const account = await this.prisma.account.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    if (!account) {
      throw new NotFoundException('No se encontró una cuenta activa para este usuario');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          amount,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          description: description || 'Depósito en cuenta',
          targetAccountId: account.id,
        },
      });

      return {
        message: 'Depósito acreditado con éxito',
        transactionId: transaction.id,
        amountDeposited: amount,
        newBalance: Number(updatedAccount.balance),
        createdAt: transaction.createdAt,
      };
    });
  }

  /**
   * Obtener el historial de movimientos de la cuenta
   */
  async getHistory(userId: string) {
    const account = await this.prisma.account.findFirst({
      where: { userId },
    });

    if (!account) {
      throw new NotFoundException('No se encontró ninguna cuenta');
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        OR: [{ sourceAccountId: account.id }, { targetAccountId: account.id }],
      },
      include: {
        sourceAccount: {
          select: {
            alias: true,
            accountNumber: true,
            user: { select: { firstName: true, lastName: true, username: true } },
          },
        },
        targetAccount: {
          select: {
            alias: true,
            accountNumber: true,
            user: { select: { firstName: true, lastName: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      currentBalance: Number(account.balance),
      accountNumber: account.accountNumber,
      alias: account.alias,
      totalTransactions: transactions.length,
      transactions: transactions.map((t) => {
        const isSent = t.sourceAccountId === account.id;
        return {
          id: t.id,
          amount: Number(t.amount),
          movement: isSent ? 'EGRESO (-)' : 'INGRESO (+)',
          type: t.type,
          status: t.status,
          description: t.description,
          counterpart: isSent
            ? t.targetAccount
              ? `${t.targetAccount.user.firstName} ${t.targetAccount.user.lastName} (@${t.targetAccount.user.username})`
              : 'N/A'
            : t.sourceAccount
              ? `${t.sourceAccount.user.firstName} ${t.sourceAccount.user.lastName} (@${t.sourceAccount.user.username})`
              : 'Depósito / Cajero',
          createdAt: t.createdAt,
        };
      }),
    };
  }
}
