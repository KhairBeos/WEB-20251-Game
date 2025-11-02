import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyDto } from './dto/verify.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth') // Đường dẫn gốc: /auth
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService, // Inject UserService để dùng cho /register
  ) {}

  /**
   * Endpoint ĐĂNG KÝ
   * POST /auth/register
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    // Gọi UserService.create
    // Hàm này đã bao gồm logic tạo OTP và "gửi email"
    const user = await this.userService.create(registerDto);
    
    // Không trả về password hay OTP
    return {
      message: 'Đăng ký thành công, vui lòng kiểm tra email để lấy mã OTP',
      userId: user._id,
      email: user.email,
    };
  }

  /**
   * Endpoint XÁC THỰC OTP
   * POST /auth/verify
   */
  @Post('verify')
  async verify(@Body() verifyDto: VerifyDto) {
    // Gọi hàm trong AuthService
    return this.authService.verifyOtp(verifyDto.email, verifyDto.otp);
  }

  /**
   * Endpoint ĐĂNG NHẬP
   * POST /auth/login
   */
  @HttpCode(HttpStatus.OK) // Đảm bảo trả về 200 OK
  @UseGuards(LocalAuthGuard) // Áp dụng LocalAuthGuard
  @Post('login')
  async login(@Request() req, @Body() loginDto: LoginDto) {
    // Hàm này chỉ chạy NẾU LocalAuthGuard (và LocalStrategy) xác thực thành công.
    // Passport đã gán 'user' vào 'req.user'
    return this.authService.login(req.user);
  }

  /**
   * Endpoint KIỂM TRA (Ví dụ)
   * GET /auth/profile
   */
  @UseGuards(JwtAuthGuard) // Áp dụng JwtAuthGuard
  @Get('profile')
  getProfile(@Request() req) {
    // Nhờ JwtAuthGuard (và JwtStrategy), có thể truy cập thông tin user từ token
    return req.user;
  }
}