import type { KeyState } from '../engine/Keyboard';
import type { System } from '../engine/types';
import type { World } from '../engine/World';
import { GameState } from '../game/GameState';

/** After the game ends, R or Enter asks for a fresh game. Keeps running while paused. */
export class RestartSystem implements System {
  readonly stage = 'update' as const;
  readonly runWhenPaused = true;
  private requested = false;

  constructor(
    private readonly keys: KeyState,
    private readonly onRestart: () => void,
  ) {}

  run(world: World): void {
    if (this.requested) return;
    if (world.getResource(GameState).status === 'playing') return;
    if (this.keys.isDown('KeyR', 'Enter')) {
      this.requested = true; // several fixed steps can run in one frame, restart only once
      this.onRestart();
    }
  }
}
