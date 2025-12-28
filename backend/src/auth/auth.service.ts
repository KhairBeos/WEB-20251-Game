import { Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { sessionStore } from "./session.store";


@Injectable()
export class AuthService {
  login(username: string, password: string, skin: string) {
    // DEMO: password cố định
    if (password !== "Tankgame20251") {
      throw new UnauthorizedException("Invalid credentials");
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
