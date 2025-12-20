export type SoundState = {
    [playerId: string]: {
        fireSound: boolean,
        itemSound: boolean,
    };
}