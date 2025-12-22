export interface SessionData {
  username: string;
  createdAt: number;
}

export const sessionStore = new Map<string, SessionData>();
