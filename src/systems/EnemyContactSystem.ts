import { Collider, Enemy, Player, Position, Velocity } from '../components';
import { overlaps } from '../engine/geometry';
import type { System } from '../engine/types';
import type { World } from '../engine/World';
import { shakeScreen, spawnBurst } from '../game/effects';
import { endGame, GameState } from '../game/GameState';

const STOMP_DEPTH = 16; // how far into an enemy's head still counts as a stomp
const STOMP_BOUNCE = 420;
const STOMP_SCORE = 50;
const INVULNERABLE_SECONDS = 1.5;

/**
 * Landing on an enemy from above defeats it. Touching it any other way costs a
 * life: the player respawns at the start, or the game ends on the last life.
 */
export class EnemyContactSystem implements System {
  readonly stage = 'update' as const;

  run(world: World): void {
    const state = world.getResource(GameState);
    const enemies = [...world.query(Enemy, Position, Collider)];

    for (const [, player, pos, vel, box] of world.query(Player, Position, Velocity, Collider)) {
      for (const [enemy, , enemyPos, enemyBox] of enemies) {
        if (!world.isAlive(enemy) || !overlaps(pos, box, enemyPos, enemyBox)) continue;

        const stomped = vel.y > 0 && pos.y + box.height - enemyPos.y <= STOMP_DEPTH;
        if (stomped) {
          spawnBurst(world, enemyPos.x + enemyBox.width / 2, enemyPos.y + enemyBox.height / 2, {
            count: 22,
            color: ['#ff5a5f', '#ff9aa2', '#ffffff'],
            speed: 260,
            life: 0.65,
            size: 3,
            gravity: 520,
          });
          shakeScreen(world, 0.3);
          world.destroyEntity(enemy);
          vel.y = -STOMP_BOUNCE;
          state.score += STOMP_SCORE;
        } else if (player.invulnerableFor <= 0) {
          state.lives -= 1;
          spawnBurst(world, pos.x + box.width / 2, pos.y + box.height / 2, {
            count: state.lives <= 0 ? 40 : 22,
            color: ['#5ee7c8', '#9ff7e0', '#ffffff'],
            speed: 280,
            life: 0.7,
            size: 3,
            gravity: 480,
          });
          shakeScreen(world, state.lives <= 0 ? 0.9 : 0.55);
          if (state.lives <= 0) {
            endGame(world, 'lost');
          } else {
            pos.x = player.spawnX;
            pos.y = player.spawnY;
            vel.x = 0;
            vel.y = 0;
            player.invulnerableFor = INVULNERABLE_SECONDS;
          }
          break; // the player has moved (or the game is over), stop checking enemies
        }
      }
    }
  }
}
