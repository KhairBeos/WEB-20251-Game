import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // 1. CẤU HÌNH QUAN TRỌNG:
    // Báo cho passport-local dùng trường 'email' thay vì 'username' mặc định
    super({ usernameField: 'email' });
  }

  /**
   * 2. Hàm này sẽ tự động được gọi khi LocalAuthGuard được kích hoạt
   */
  async validate(email: string, password: string): Promise<any> {
    
    // 3. Gọi hàm validateUser từ AuthService 
    const user = await this.authService.validateUser(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Xác thực thất bại');
    }
    
    // 4. Nếu thành công, Passport sẽ gán user này vào req.user
    return user; 
  }
}