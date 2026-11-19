import { Coin, Collider, Player, Position } from '../components';
import { overlaps } from '../engine/geometry';
import type { System } from '../engine/types';
import type { World } from '../engine/World';
import { spawnBurst } from '../game/effects';
import { GameState } from '../game/GameState';

/** The player collects any coin they touch. */
export class PickupSystem implements System {
  readonly stage = 'update' as const;

  run(world: World): void {
    const state = world.getResource(GameState);
    const coins = [...world.query(Coin, Position, Collider)];

    for (const [, , pos, box] of world.query(Player, Position, Collider)) {
      for (const [coinEntity, coin, coinPos, coinBox] of coins) {
        if (!world.isAlive(coinEntity) || !overlaps(pos, box, coinPos, coinBox)) continue;
        spawnBurst(world, coinPos.x + coinBox.width / 2, coinPos.y + coinBox.height / 2, {
          count: 12,
          color: ['#ffc83d', '#fff3b0', '#ffffff'],
          speed: 170,
          life: 0.55,
          size: 2.6,
          gravity: 320,
        });
        world.destroyEntity(coinEntity);
        state.score += coin.value;
        state.coins += 1;
      }
    }
  }
}
