import { PlayerInput, Velocity } from '../components';
import type { System } from '../engine/types';
import type { World } from '../engine/World';

/** Turns the player's left/right intent into horizontal velocity. */
export class PlayerControlSystem implements System {
  readonly stage = 'update' as const;

  constructor(private readonly speed = 240) {}

  run(world: World): void {
    for (const [, input, vel] of world.query(PlayerInput, Velocity)) {
      vel.x = (Number(input.right) - Number(input.left)) * this.speed;
    }
  }
}
