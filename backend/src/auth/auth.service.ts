import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from '../users/user.service'; 
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/schemas/user.schema';

/**
 * TẠO INTERFACE MỚI
 * Đây là kiểu dữ liệu cho đối tượng `user` sau khi đã xác thực
 * (là một đối tượng JavaScript đơn giản, không phải Mongoose Document)
 */
interface ValidatedUser {
  _id: User['_id']; // Lấy kiểu _id từ User
  username: string;
  rank: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  /**
   * Hàm này "hứa" sẽ trả về một ValidatedUser
   */
  async validateUser(email: string, pass: string): Promise<ValidatedUser> {
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }
    if (!user.password) {
      throw new UnauthorizedException('Lỗi xác thực');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Sai mật khẩu');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Tài khoản chưa được xác thực email');
    }

    // `user.toObject()` trả về một đối tượng plain,
    // khớp với kiểu ValidatedUser
    const { password, ...result } = user.toObject();
    return result; // Trả về `result` (đã bỏ password)
  }

  /**
   * Hàm này nhận một ValidatedUser
   */
  async login(user: ValidatedUser): Promise<{ access_token: string }> {
    const payload = {
      username: user.username,
      sub: user._id, // ID người dùng
      rank: user.rank,
      email: user.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Hàm này trả về kết quả của hàm login()
   */
  async verifyOtp(email: string, otp: string): Promise<{ access_token: string }> {
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }
    if (user.verificationOtp !== otp) {
      throw new UnauthorizedException('Mã OTP không chính xác');
    }

    user.isVerified = true;
    user.verificationOtp = undefined;
    await user.save();

    // `user.toObject()` cũng khớp với ValidatedUser
    const { password, ...result } = user.toObject();
    return this.login(result);
  }
}