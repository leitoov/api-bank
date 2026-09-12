import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  //Registro de usuario nuevo, recibe dto RegisterDto
  async register(registerDto: RegisterDto) {
    const { email, username, password, firstName, lastName, document, alias } = registerDto;

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();
    const normalizedDocument = document.trim();

    //Verificar si email, username o documento ya existen
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: normalizedUsername },
          { document: normalizedDocument },
        ],
      },
    });

    // Si encontró algun usuario con ese email, username o DNI
    if (existingUser) {
      throw new ConflictException('Usted ya cuenta con un usuario registrado, inicie sesión o restablezca su contraseña');
    }

    //Alias por defecto (si no tiene uno, se genera uno por defecto)
    let finalAlias = alias ? alias.toLowerCase().trim() : `${normalizedUsername}.bank`;

    // Validar si el alias ya existe
    const existingAccountWithAlias = await this.prisma.account.findUnique({
      where: { alias: finalAlias },
    });

    if (existingAccountWithAlias) {
      if (alias) {
        throw new ConflictException('El alias ingresado ya está en uso por otra cuenta');
      }
      // Si fue autogenerado y chocó, agregar sufijo numérico
      finalAlias = `${normalizedUsername}.${Math.floor(100 + Math.random() * 900)}.bank`;
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // crea número de cuenta de 10 dígitos
    const randomAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    //Crear usuario y cuenta
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        document: normalizedDocument,
        accounts: {
          create: {
            accountNumber: randomAccountNumber,
            alias: finalAlias,
            balance: 0.0,
            type: 'SAVINGS', //Tipo de cuenta por defecto (Ahorro)
            status: 'ACTIVE',
            currency: 'USD', //Moneda por defecto
          },
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        document: true,
        role: true,
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            alias: true,
            balance: true,
            currency: true,
            status: true,
            type: true,
          },
        },
        createdAt: true,
      },
    });

    const token = this.generateToken(user.id, user.email);

    return {
      message: 'Usuario registrado exitosamente',
      user,
      accessToken: token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            alias: true,
            balance: true,
            currency: true,
            status: true,
            type: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.generateToken(user.id, user.email);

    // Omitir contraseña
    const { password: _, ...userData } = user;

    return {
      message: 'Inicio de sesión exitoso',
      user: userData,
      accessToken: token,
    };
  }

  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
