import { Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { sessionStore } from "./session.store";


@Injectable()
export class AuthService {
  login(username: string, password: string, skin: string) {
    // DEMO: password cố định
    if (password !== "Tankgame20251") {
      throw new UnauthorizedException("Sai mật khẩu");
    }

    // Giới hạn số người chơi 5 người chơi đồng thời
    if (sessionStore.size >= 10) {
      console.log("Server is full. Login attempt rejected.");
      throw new UnauthorizedException("Server đã đầy");
    }

    const sessionId = randomUUID();

    sessionStore.set(sessionId, {
      username,
      createdAt: Date.now(),
      socketId: undefined,
      skin,
    });

    return {
      sessionId,
      username,
      skin,
    };
  }

  validateSession(sessionId: string) {
    return sessionStore.get(sessionId);
  }

  logout(sessionId: string) {
    sessionStore.delete(sessionId);
  }
}
