import { Collider, Goal, Player, Position } from '../components';
import { overlaps } from '../engine/geometry';
import type { System } from '../engine/types';
import type { World } from '../engine/World';
import { spawnBurst } from '../game/effects';
import { endGame, GameState } from '../game/GameState';

const GOAL_BONUS = 100;

/** Touching the goal flag wins the level. */
export class GoalSystem implements System {
  readonly stage = 'update' as const;

  run(world: World): void {
    for (const [, , pos, box] of world.query(Player, Position, Collider)) {
      for (const [, , goalPos, goalBox] of world.query(Goal, Position, Collider)) {
        if (!overlaps(pos, box, goalPos, goalBox)) continue;
        spawnBurst(world, goalPos.x + 2, goalPos.y - 4, {
          count: 90,
          color: ['#5ee7c8', '#3de8ff', '#ff4d8d', '#ffc83d', '#ffffff'],
          speed: 460,
          life: 1.9,
          size: 3.4,
          gravity: 520,
          direction: 'up',
        });
        world.getResource(GameState).score += GOAL_BONUS;
        endGame(world, 'won');
        return;
      }
    }
  }
}
