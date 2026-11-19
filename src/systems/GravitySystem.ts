import { Gravity, Velocity } from '../components';
import type { System } from '../engine/types';
import type { World } from '../engine/World';

/** Speeds up every falling entity, up to its maximum fall speed. */
export class GravitySystem implements System {
  readonly stage = 'update' as const;

  run(world: World, dt: number): void {
    for (const [, vel, gravity] of world.query(Velocity, Gravity)) {
      vel.y = Math.min(vel.y + gravity.strength * dt, gravity.maxFallSpeed);
    }
  }
}
