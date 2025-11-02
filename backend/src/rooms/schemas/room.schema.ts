import mongoose, { Schema, Document } from "mongoose";

export interface Room extends Document {
  roomName: string;          // tên phòng
  hostId: string;            // ID người tạo phòng
  players: string[];         // danh sách id người chơi trong phòng
  maxPlayers: number;        // số lượng người chơi tối đa
  isStarted: boolean;        // trạng thái phòng (đã bắt đầu hay chưa)
  createdAt: Date;
}

const RoomSchema: Schema<Room> = new Schema({
  roomName: { type: String, required: true },
  hostId: { type: String, required: true },
  players: { type: [String], default: [] },
  maxPlayers: { type: Number, default: 4 },
  isStarted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const RoomModel = mongoose.model<Room>("Room", RoomSchema);
