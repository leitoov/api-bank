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
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, document } = registerDto;

    // Verificar si el email o documento ya existen
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { document }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      throw new ConflictException('El documento ya está registrado');
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario y su primera cuenta bancaria de ahorro por defecto
    const randomAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        document,
        accounts: {
          create: {
            accountNumber: randomAccountNumber,
            balance: 0.0,
            type: 'SAVINGS',
            status: 'ACTIVE',
            currency: 'USD',
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        document: true,
        role: true,
        accounts: true,
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

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
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

    // Omitir contraseña en la respuesta
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
