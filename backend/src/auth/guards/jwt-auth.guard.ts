import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard này sẽ tự động kích hoạt 'jwt' strategy
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}