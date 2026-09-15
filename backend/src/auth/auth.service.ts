import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: data.email,
      },
      include: {
        company: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário inativo.');
    }

    if (user.company.status !== 'ACTIVE') {
      throw new UnauthorizedException('Empresa inativa.');
    }

    const passwordValid = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const payload = {
      sub: user.id,
      companyId: user.companyId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: '8h',
      user: {
        id: user.id,
        companyId: user.companyId,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    };
  }
}
