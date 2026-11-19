import { OnGround, PlayerInput, Velocity } from '../components';
import type { System } from '../engine/types';
import type { World } from '../engine/World';

/**
 * Jump only while standing on something (the OnGround marker). Letting go of
 * the key early cuts the jump short, so a tap gives a small hop.
 */
export class JumpSystem implements System {
  readonly stage = 'update' as const;

  constructor(
    private readonly jumpSpeed = 650,
    private readonly releaseSpeed = 260,
  ) {}

  run(world: World): void {
    for (const [entity, input, vel] of world.query(PlayerInput, Velocity)) {
      if (input.jump && world.hasComponent(entity, OnGround)) {
        vel.y = -this.jumpSpeed;
        world.removeComponent(entity, OnGround);
      } else if (!input.jump && vel.y < -this.releaseSpeed) {
        vel.y = -this.releaseSpeed;
      }
    }
  }
}
