// import { TILE_SIZE, MAP_ROWS, MAP_COLS, MapCell } from '../model/MapData';
// import { TankState } from '../model/Tank';
// import { BulletState } from '../model/Bullet';

// export class VisibilityService {
//   constructor(private readonly map: MapCell[][]) {}

//   buildVisibleTankStateFor(viewerId: string, ts: number, tankState: TankState) {
//     const viewer = tankState.tankStates[viewerId];
//     const result = { serverTimestamp: ts, tankStates: {} as typeof tankState.tankStates };
//     for (const pid in tankState.tankStates) {
//       const t = tankState.tankStates[pid];
//       if (pid === viewerId) { result.tankStates[pid] = t; continue; }
//       const targetInBush = !!t.inBush;
//       const viewerInBush = !!viewer?.inBush;
//       const sameBush = viewerInBush && targetInBush && viewer?.bushRootR === t.bushRootR && viewer?.bushRootC === t.bushRootC;
//       if (!targetInBush || sameBush) result.tankStates[pid] = t;
//     }
//     return result;
//   }

//   buildVisibleBulletStateFor(viewerId: string, ts: number, bulletState: BulletState, tankState: TankState) {
//     const viewer = tankState.tankStates[viewerId];
//     const result = { serverTimestamp: ts, bulletStates: {} as typeof bulletState.bulletStates };

//     const getBulletBushRoot = (x: number, y: number) => {
//       const c = Math.floor(x / TILE_SIZE);
//       const r = Math.floor(y / TILE_SIZE);
//       if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) return undefined;
//       const tile = this.map[r][c];
//       let rootR = tile.val === 99 ? tile.root_r : r;
//       let rootC = tile.val === 99 ? tile.root_c : c;
//       if (rootR < 0 || rootR >= MAP_ROWS || rootC < 0 || rootC >= MAP_COLS) return undefined;
//       const root = this.map[rootR][rootC];
//       if (root.val >= 11 && root.val <= 14) return { r: rootR, c: rootC };
//       return undefined;
//     };

//     for (const ownerId in bulletState.bulletStates) {
//       const bulletsOfOwner = bulletState.bulletStates[ownerId];
//       for (const bid in bulletsOfOwner) {
//         const b = bulletsOfOwner[bid];
//         const bRoot = getBulletBushRoot(b.x, b.y);
//         if (!bRoot) {
//           if (!result.bulletStates[ownerId]) result.bulletStates[ownerId] = {};
//           result.bulletStates[ownerId][bid] = b;
//           continue;
//         }
//         const sameBush = !!viewer?.inBush && viewer?.bushRootR === bRoot.r && viewer?.bushRootC === bRoot.c;
//         if (sameBush) {
//           if (!result.bulletStates[ownerId]) result.bulletStates[ownerId] = {};
//           result.bulletStates[ownerId][bid] = b;
//         }
//       }
//     }
//     return result;
//   }
// }
