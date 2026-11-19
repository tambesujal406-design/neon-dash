import { Player, Position, Sprite } from '../components';
import type { System } from '../engine/types';
import type { World } from '../engine/World';

/** Keeps the player inside the left and right edges of the screen. */
export class BoundsSystem implements System {
  readonly stage = 'update' as const;

  constructor(private readonly width: number) {}

  run(world: World): void {
    for (const [, , pos, sprite] of world.query(Player, Position, Sprite)) {
      pos.x = Math.min(Math.max(pos.x, 0), this.width - sprite.width);
    }
  }
}
