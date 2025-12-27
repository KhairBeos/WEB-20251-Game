export interface SessionData {
  username: string;
  createdAt: number;
  using: boolean;
}

export const sessionStore = new Map<string, SessionData>();
