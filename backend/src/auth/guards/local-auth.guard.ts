import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard này sẽ tự động kích hoạt 'local' strategy
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}