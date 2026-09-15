import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'sgv-secret-dev',
    });
  }

  async validate(payload: { sub: string; companyId: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        companyId: payload.companyId,
      },
      select: {
        id: true,
        companyId: true,
        name: true,
        email: true,
        status: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário inativo.');
    }

    return user;
  }
}
