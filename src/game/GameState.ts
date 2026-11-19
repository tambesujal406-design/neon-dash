import type { World } from '../engine/World';

export type GameStatus = 'playing' | 'won' | 'lost';

/** A world resource: the score, lives and whether the game is still going. */
export class GameState {
  score = 0;
  coins = 0;
  lives = 3;
  status: GameStatus = 'playing';

  constructor(public readonly totalCoins = 0) {}
}

/** Ends the game and freezes the world. Only restart and rendering keep running. */
export function endGame(world: World, status: Exclude<GameStatus, 'playing'>): void {
  world.getResource(GameState).status = status;
  world.paused = true;
}
