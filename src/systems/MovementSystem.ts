import { Position, Velocity } from '../components';
import type { System } from '../engine/types';
import type { World } from '../engine/World';

/** Moves every entity that has both a Position and a Velocity. */
export class MovementSystem implements System {
  readonly stage = 'update' as const;

  run(world: World, dt: number): void {
    for (const [, pos, vel] of world.query(Position, Velocity)) {
      pos.x += vel.x * dt;
      pos.y += vel.y * dt;
    }
  }
}
