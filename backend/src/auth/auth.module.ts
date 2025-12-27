import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GameService } from "src/websockets/game.service";
import { GameModule } from "src/websockets/game.module";

@Module({
  imports: [GameModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService], // để socket dùng
})
export class AuthModule {}
