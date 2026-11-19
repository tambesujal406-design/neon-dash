import { Collider, OnGround, Position, Solid, Velocity } from '../components';
import type { System } from '../engine/types';
import type { World } from '../engine/World';

/**
 * Pushes moving entities out of solid boxes. For each overlap it resolves along
 * the shorter axis (the way out that moves you least), stops the velocity on
 * that axis, and marks the entity OnGround when it lands on top of something.
 */
export class CollisionSystem implements System {
  readonly stage = 'update' as const;

  run(world: World): void {
    const solids = [...world.query(Position, Collider, Solid)];

    for (const [entity, pos, vel, box] of world.query(Position, Velocity, Collider)) {
      world.removeComponent(entity, OnGround);

      for (const [, solidPos, solidBox] of solids) {
        const overlapX =
          Math.min(pos.x + box.width, solidPos.x + solidBox.width) -
          Math.max(pos.x, solidPos.x);
        const overlapY =
          Math.min(pos.y + box.height, solidPos.y + solidBox.height) -
          Math.max(pos.y, solidPos.y);
        if (overlapX <= 0 || overlapY <= 0) continue;

        if (overlapX < overlapY) {
          const entityIsLeft = pos.x + box.width / 2 < solidPos.x + solidBox.width / 2;
          pos.x += entityIsLeft ? -overlapX : overlapX;
          vel.x = 0;
        } else if (pos.y + box.height / 2 < solidPos.y + solidBox.height / 2) {
          // Landed on top.
          pos.y -= overlapY;
          vel.y = 0;
          world.addComponent(entity, new OnGround());
        } else {
          // Bumped a ceiling.
          pos.y += overlapY;
          if (vel.y < 0) vel.y = 0;
        }
      }
    }
  }
}
