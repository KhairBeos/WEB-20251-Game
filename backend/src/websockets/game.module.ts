// src/game/game.module.ts
import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';

@Module({
  // GameService sẽ chạy logic, GameGateway sẽ xử lý kết nối
  providers: [GameGateway, GameService],
  // Cần export GameService để các module khác có thể sử dụng (nếu cần)
  exports: [GameService],
})
export class GameModule {}
