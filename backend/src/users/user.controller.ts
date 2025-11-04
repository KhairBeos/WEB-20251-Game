import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

// Bảo vệ TẤT CẢ các route trong controller này
@UseGuards(JwtAuthGuard) // Phải đăng nhập mới được dùng các API này
@Controller('users') // Đường dẫn gốc: /users
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Endpoint Lấy thông tin cá nhân (của chính mình)
   * GET /users/me
   */
  @Get('me')
  async getMyProfile(@Request() req) {
    // req.user được trả về từ JwtStrategy (chứa { userId, username, ... })
    const userId = req.user.userId;

    // Lấy thông tin mới nhất từ DB
    const user = await this.userService.findOneById(userId);
    return user;
  }

  /**
   * Endpoint Cập nhật thông tin cá nhân (username, avatar)
   * PATCH /users/me
   */
  @Patch('me')
  async updateMyProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = req.user.userId;
    // Gọi hàm update trong service
    return this.userService.update(userId, updateUserDto);
  }

  /**
   * Endpoint Lấy thông tin CÔNG KHAI của người chơi khác
   * GET /users/profile/TEN_NGUOI_CHOI
   */
  @Get('profile/:username')
  async getUserProfile(@Param('username') username: string) {
    // Lấy thông tin công khai (an toàn vì service không trả password/OTP)
    const user = await this.userService.findOneByUsername(username);

    if (!user) {
      throw new NotFoundException('Không tìm thấy người chơi này');
    }
    return user;
  }
}