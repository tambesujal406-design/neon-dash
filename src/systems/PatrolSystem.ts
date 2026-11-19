import { Collider, Patrol, Position, Velocity } from '../components';
import type { System } from '../engine/types';
import type { World } from '../engine/World';

/** Turns patrolling entities around when they reach either end of their route. */
export class PatrolSystem implements System {
  readonly stage = 'update' as const;

  run(world: World): void {
    for (const [, pos, vel, box, patrol] of world.query(Position, Velocity, Collider, Patrol)) {
      if (pos.x <= patrol.minX) vel.x = patrol.speed;
      else if (pos.x + box.width >= patrol.maxX) vel.x = -patrol.speed;
      else if (vel.x === 0) vel.x = patrol.speed;
    }
  }
}
