import { PlayerInput } from '../components';
import type { KeyState } from '../engine/Keyboard';
import type { System } from '../engine/types';
import type { World } from '../engine/World';

/**
 * Turns raw keys into intent. Other systems read `PlayerInput` and never
 * touch the keyboard, so adding gamepad or touch support later only changes this file.
 */
export class InputSystem implements System {
  readonly stage = 'update' as const;

  constructor(private readonly keys: KeyState) {}

  run(world: World): void {
    for (const [, input] of world.query(PlayerInput)) {
      input.left = this.keys.isDown('ArrowLeft', 'KeyA');
      input.right = this.keys.isDown('ArrowRight', 'KeyD');
      input.jump = this.keys.isDown('ArrowUp', 'KeyW', 'Space');
    }
  }
}
