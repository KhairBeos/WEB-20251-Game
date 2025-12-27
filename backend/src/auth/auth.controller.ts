import { Body, Controller, Post } from "@nestjs/common";
import { GameService } from "src/websockets/game.service";
import { LoginDto } from "./auth.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {

  constructor(private readonly gameService: GameService, private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body.username, body.password);
  }

  

  @Post("logout")
  logout(@Body("sessionId") sessionId: string) {
    this.authService.logout(sessionId);
    return { success: true };
  }
}
