import { Collider, Player, Position } from '../components';
import type { System } from '../engine/types';
import type { World } from '../engine/World';
import { Camera } from '../game/resources';

/** Follows the player (for background parallax) and turns shake into a small random offset. */
export class CameraSystem implements System {
  readonly stage = 'render' as const;

  run(world: World, dt: number): void {
    const camera = world.getResource(Camera);

    for (const [, , pos, box] of world.query(Player, Position, Collider)) {
      camera.focusX += (pos.x + box.width / 2 - camera.focusX) * Math.min(1, dt * 3);
    }

    camera.trauma = Math.max(0, camera.trauma - dt * 1.8);
    const strength = camera.trauma * camera.trauma * 12;
    camera.offsetX = (Math.random() * 2 - 1) * strength;
    camera.offsetY = (Math.random() * 2 - 1) * strength;
  }
}
