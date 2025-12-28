export interface SessionData {
  username: string;
  createdAt: number;
  socketId?:string;

}

export const sessionStore = new Map<string, SessionData>();
