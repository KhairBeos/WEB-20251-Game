import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>, private readonly mailerService: MailerService,) {}

  /**
   * TÌM USER BẰNG EMAIL (dùng cho đăng nhập)
   */
  async findOneByEmail(email: string): Promise<User | undefined> {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password +verificationOtp') 
      .exec();
    
    return user || undefined;
  }
  
  /**
   * TÌM USER BẰNG USERNAME
   */
  async findOneByUsername(username: string): Promise<User | undefined> {
    const user = await this.userModel.findOne({ username: username }).exec();
    return user || undefined;
  }

  /**
   * HÀM TẠO USER (dùng cho /register)
   */
  async create(createUserDto: RegisterDto): Promise<User> {
    const existingUser = await this.userModel
      .findOne({ email: createUserDto.email.toLowerCase() })
      .exec();

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const createdUser = new this.userModel({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
      verificationOtp: otp,
      isVerified: false,
    });

    console.log(`Đang gửi email OTP: ${otp} tới ${createdUser.email}...`);
    try {
      await this.mailerService.sendMail({
        to: createdUser.email, // Email người nhận
        subject: 'Mã xác thực đăng ký tài khoản', // Tiêu đề email
        html: `
          <p>Chào mừng bạn đến với Game!</p>
          <p>Mã OTP của bạn là: <b>${otp}</b></p>
          <p>Mã này sẽ hết hạn sau 10 phút.</p>
        `, // Nội dung email (dạng HTML)
      });
      console.log('Gửi email thành công!');
    } catch (error) {
      console.error('Lỗi gửi email:', error);
      
    }
    return createdUser.save();
  }

  /**
   * TÌM USER BẰNG ID (dùng cho lấy profile)
   * (Hàm này an toàn vì schema đã ẩn password/OTP)
   */
  async findOneById(id: string): Promise<User | undefined> {
    const user = await this.userModel.findById(id).exec();
    return user || undefined;
  }

  /**
   * CẬP NHẬT USER (dùng cho cập nhật profile)
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Tìm và cập nhật user, { new: true } sẽ trả về user *sau khi* đã cập nhật
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      { new: true },
    ).exec();
    
    if (!updatedUser) {
      throw new Error('Không tìm thấy người dùng để cập nhật');
    }
    return updatedUser;
  }
}