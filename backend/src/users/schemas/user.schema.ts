import mongoose, { Schema, Document } from 'mongoose';

// 1. Định nghĩa Interface cho TypeScript (và extends Document)
export interface User extends Document {
  username: string; // Tên trong game, có thể trùng
  password?: string; 
  email: string; // Dùng để đăng nhập, duy nhất
  avatar?: string;
  rank?: string;
  highestScore?: number;
  lastLogin?: Date;
  createdAt?: Date;
  isVerified: boolean; 
  verificationOtp?: string;
}

// 2. Định nghĩa Schema cho Mongoose (và liên kết với Interface)
export const UserSchema: Schema<User> = new Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false, 
  },
  email: {
    type: String,
    unique: true,
    required: true, 
    trim: true,
  },
  avatar: {
    type: String,
    default: 'default_tank.png',
  },
  rank: {
    type: String,
    enum: ['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond', 'master', 'grandmaster', 'challenge'],
    default: 'iron',
  },
  highestScore: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false, 
  },
  verificationOtp: {
    type: String,
    select: false, 
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});