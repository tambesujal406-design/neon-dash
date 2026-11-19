import { Collider, OnGround, Position, Squash, Velocity } from '../components';
import type { System } from '../engine/types';
import type { World } from '../engine/World';
import { spawnBurst } from '../game/effects';

const DUST = ['#c9bdff', '#8b6cff', '#ffffff'];

/**
 * Squash and stretch plus dust: a puff and a stretch when jumping, a squash and a
 * bigger puff when landing (harder landings squash more), and small dust while running.
 */
export class SquashSystem implements System {
  readonly stage = 'update' as const;

  run(world: World, dt: number): void {
    for (const [entity, squash, pos, vel, box] of world.query(Squash, Position, Velocity, Collider)) {
      const grounded = world.hasComponent(entity, OnGround);
      const footX = pos.x + box.width / 2;
      const footY = pos.y + box.height;

      if (!grounded) squash.fallSpeed = vel.y;

      if (grounded && !squash.wasGrounded) {
        const impact = Math.min(1, Math.max(0, squash.fallSpeed) / 700);
        if (impact > 0.15) {
          squash.scaleX = 1 + 0.4 * impact;
          squash.scaleY = 1 - 0.4 * impact;
          spawnBurst(world, footX, footY, {
            count: Math.round(4 + 8 * impact),
            color: DUST,
            speed: 90 + 120 * impact,
            life: 0.4,
            size: 2.4,
            gravity: 260,
            direction: 'up',
          });
        }
      } else if (!grounded && squash.wasGrounded && vel.y < 0) {
        squash.scaleX = 0.72;
        squash.scaleY = 1.28;
        spawnBurst(world, footX, footY, {
          count: 5,
          color: DUST,
          speed: 110,
          life: 0.35,
          size: 2.2,
          gravity: 260,
          direction: 'up',
        });
      }
      squash.wasGrounded = grounded;

      if (grounded && Math.abs(vel.x) > 60) {
        squash.dustTimer -= dt;
        if (squash.dustTimer <= 0) {
          squash.dustTimer = 0.08;
          spawnBurst(world, footX - Math.sign(vel.x) * 6, footY - 1, {
            count: 1,
            color: DUST,
            speed: 35,
            life: 0.3,
            size: 2,
            gravity: -40,
            direction: 'up',
          });
        }
      }

      // Ease back to normal shape.
      const ease = Math.min(1, dt * 14);
      squash.scaleX += (1 - squash.scaleX) * ease;
      squash.scaleY += (1 - squash.scaleY) * ease;
    }
  }
}
