import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * Guard HTTP para validar JWT y exponer el usuario autenticado en el request.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Falta el header Authorization o es invalido',
      );
    }

    const token = authHeader.substring(7);

    try {
      const payload = this.jwtService.verify(token);
      (request as Request & { user?: any }).user = {
        userId: payload.sub,
        companyId: payload.companyId,
        role: payload.role,
        email: payload.email,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Token invalido');
    }
  }
}
