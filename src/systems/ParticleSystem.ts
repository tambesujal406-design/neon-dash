import { Particle, Position } from '../components';
import type { System } from '../engine/types';
import type { World } from '../engine/World';

/** Moves particles and removes them when their life runs out. Also runs while paused. */
export class ParticleSystem implements System {
  readonly stage = 'update' as const;
  readonly runWhenPaused = true;

  run(world: World, dt: number): void {
    for (const [entity, particle, pos] of world.query(Particle, Position)) {
      particle.life -= dt;
      if (particle.life <= 0) {
        world.destroyEntity(entity);
        continue;
      }
      particle.vy += particle.gravity * dt;
      pos.x += particle.vx * dt;
      pos.y += particle.vy * dt;
    }
  }
}
