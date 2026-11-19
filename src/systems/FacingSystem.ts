import { Facing, Velocity } from '../components';
import type { System } from '../engine/types';
import type { World } from '../engine/World';

/** Turns entities to face the way they are moving. They keep their last direction when they stop. */
export class FacingSystem implements System {
  readonly stage = 'update' as const;

  run(world: World): void {
    for (const [, facing, vel] of world.query(Facing, Velocity)) {
      if (vel.x > 1) facing.dir = 1;
      else if (vel.x < -1) facing.dir = -1;
    }
  }
}
