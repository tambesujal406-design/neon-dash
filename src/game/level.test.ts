import { describe, expect, it } from 'vitest';
import {
  Coin,
  Enemy,
  Goal,
  OnGround,
  Player,
  Position,
  Velocity,
} from '../components';
import type { KeyState } from '../engine/Keyboard';
import type { Entity } from '../engine/types';
import type { World } from '../engine/World';
import { GameState } from './GameState';
import { createWorld } from './level';

const DT = 1 / 60;
const fakeCtx = { canvas: { width: 960, height: 540 } } as unknown as CanvasRenderingContext2D;

function build(keys: KeyState = { isDown: () => false }, onRestart = () => {}) {
  return createWorld({ ctx: fakeCtx, keys, onRestart });
}

function playerOf(world: World): Entity {
  return [...world.query(Player)][0]![0];
}

describe('level', () => {
  it('contains the expected entities', () => {
    const world = build();
    expect([...world.query(Coin)]).toHaveLength(9);
    expect([...world.query(Enemy)]).toHaveLength(2);
    expect([...world.query(Goal)]).toHaveLength(1);
    expect([...world.query(Player)]).toHaveLength(1);
    expect(world.getResource(GameState).totalCoins).toBe(9);
  });

  it('leaves a player who does nothing safe and standing on the ground', () => {
    const world = build();
    const player = playerOf(world);
    for (let i = 0; i < 600; i++) world.runStage('update', DT);

    const state = world.getResource(GameState);
    expect(state.lives).toBe(3);
    expect(state.status).toBe('playing');
    expect(world.hasComponent(player, OnGround)).toBe(true);
  });

  it('can be completed: a scripted player reaches the flag across all three platforms', () => {
    const held = new Set<string>();
    const world = build({ isDown: (...codes) => codes.some((c) => held.has(c)) });
    for (const [enemy] of [...world.query(Enemy)]) world.destroyEntity(enemy); // test the route only
    const player = playerOf(world);

    for (let frame = 0; frame < 2400; frame++) {
      const pos = world.getComponent(player, Position)!;
      const vel = world.getComponent(player, Velocity)!;
      const grounded = world.hasComponent(player, OnGround);
      const feet = pos.y + 32;
      const rightEdge = pos.x + 24;

      const jumpNow =
        grounded &&
        (feet > 470 ||
          (Math.abs(feet - 380) < 1 && pos.x < 400 && rightEdge >= 300) ||
          (Math.abs(feet - 300) < 1 && rightEdge >= 600));

      held.clear();
      held.add('ArrowRight');
      if (jumpNow || (!grounded && vel.y < 0)) held.add('Space');

      world.runStage('update', DT);
      if (world.getResource(GameState).status !== 'playing') break;
    }

    const state = world.getResource(GameState);
    expect(state.status).toBe('won');
    expect(state.lives).toBe(3);
    expect(state.coins).toBeGreaterThan(0); // the script flies past a coin or two, a human can walk back
  });
});
