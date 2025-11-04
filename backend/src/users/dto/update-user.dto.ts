import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateUserDto {
  // Người dùng có thể cập nhật tên trong game (username)
  @IsString()
  @IsOptional() // nghĩa là không bắt buộc, nếu không gửi thì thôi
  username?: string;

  // Người dùng có thể cập nhật avatar
  @IsString() // Nếu nó là một đường dẫn
  @IsOptional()
  avatar?: string;
}