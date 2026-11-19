import type { System } from '../engine/types';
import type { World } from '../engine/World';
import { Time } from '../game/resources';

/** Advances the animation clock once per drawn frame. */
export class TimeSystem implements System {
  readonly stage = 'render' as const;

  run(world: World, dt: number): void {
    world.getResource(Time).elapsed += dt;
  }
}
