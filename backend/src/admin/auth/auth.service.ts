import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const token = await this.jwt.signAsync({ sub: admin.id, email: admin.email, name: admin.name });
    return { token, admin: { id: admin.id, email: admin.email, name: admin.name } };
  }
}
