import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AdminPayload {
  sub: string;
  email: string;
  name: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { admin?: AdminPayload }>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) {
      throw new UnauthorizedException('missing bearer token');
    }

    try {
      request.admin = await this.jwt.verifyAsync<AdminPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException('invalid or expired token');
    }
  }
}
