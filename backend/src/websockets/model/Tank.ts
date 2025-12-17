export interface Tank {
  id: string;
  x: number;
  y: number;
  degree: number;
  health: number;
  width: number;
  height: number;
  maxHealth: number;
  radius: number;
  lastShootTimestamp: number;
  inBush: string;
  // Buffs / modifiers
  speedMultiplier?: number; // default 1
  damageMultiplier?: number; // default 1
  speedBoostUntil?: number; // epoch ms
  damageBoostUntil?: number; // epoch ms
  shield?: number; // shield HP that absorbs bullet damage first
  shieldUntil?: number; // shield expiration timestamp (ms epoch)
  lastHealthPickupTime?: number; // timestamp when health pickup consumed (for UI indicator)
}

export interface TankInput {
  clientTimestamp: number;
  rotate: 'left' | 'right' | 'none';
  direction: 'forward' | 'backward' | 'none';
  isFire: boolean;
}
export interface TankState {
  serverTimestamp: number;
  tankStates: { [playerId: string]: Tank };
}

export interface TankInputBuffer {
  [playerId: string]: TankInput[];
}
