export interface SessionData {
  username: string;
  createdAt: number;
  socketId?:string;
  skin: string;
}

export const sessionStore = new Map<string, SessionData>();
