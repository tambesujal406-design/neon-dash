import { describe, expect, it } from 'vitest';
import {
  Coin,
  Collider,
  Enemy,
  Goal,
  Patrol,
  Player,
  Position,
  Sprite,
  Velocity,
} from '../components';
import type { KeyState } from '../engine/Keyboard';
import { World } from '../engine/World';
import { GameState } from '../game/GameState';
import { EnemyContactSystem } from './EnemyContactSystem';
import { GoalSystem } from './GoalSystem';
import { InvulnerabilitySystem } from './InvulnerabilitySystem';
import { MovementSystem } from './MovementSystem';
import { PatrolSystem } from './PatrolSystem';
import { PickupSystem } from './PickupSystem';
import { RestartSystem } from './RestartSystem';

const DT = 1 / 60;

function newWorld(): { world: World; state: GameState } {
  const state = new GameState(1);
  return { world: new World().addResource(state), state };
}

function spawnPlayer(world: World, x: number, y: number, vy = 0, invulnerableFor = 0) {
  return world.spawn(
    new Player(40, 448, invulnerableFor),
    new Position(x, y),
    new Velocity(0, vy),
    new Collider(24, 32),
    new Sprite(24, 32, '#fff'),
  );
}

function spawnEnemy(world: World, x: number, y: number) {
  return world.spawn(new Enemy(), new Position(x, y), new Collider(24, 24));
}

describe('PickupSystem', () => {
  it('collects only the coins the player touches', () => {
    const { world, state } = newWorld();
    world.addSystem(new PickupSystem());
    spawnPlayer(world, 0, 0);
    const near = world.spawn(new Coin(10), new Position(10, 10), new Collider(16, 16));
    const far = world.spawn(new Coin(10), new Position(300, 0), new Collider(16, 16));

    world.runStage('update', DT);

    expect(world.isAlive(near)).toBe(false);
    expect(world.isAlive(far)).toBe(true);
    expect(state.score).toBe(10);
    expect(state.coins).toBe(1);
  });
});

describe('EnemyContactSystem', () => {
  it('defeats an enemy the player lands on and bounces the player', () => {
    const { world, state } = newWorld();
    world.addSystem(new EnemyContactSystem());
    const player = spawnPlayer(world, 0, 0, 300);
    const enemy = spawnEnemy(world, 0, 24);

    world.runStage('update', DT);

    expect(world.isAlive(enemy)).toBe(false);
    expect(world.getComponent(player, Velocity)!.y).toBeLessThan(0);
    expect(state.score).toBe(50);
    expect(state.lives).toBe(3);
  });

  it('costs a life and respawns the player on a side hit', () => {
    const { world, state } = newWorld();
    world.addSystem(new EnemyContactSystem());
    const player = spawnPlayer(world, 0, 0);
    spawnEnemy(world, 10, 8);

    world.runStage('update', DT);

    const pos = world.getComponent(player, Position)!;
    expect(state.lives).toBe(2);
    expect(state.status).toBe('playing');
    expect([pos.x, pos.y]).toEqual([40, 448]);
    expect(world.getComponent(player, Player)!.invulnerableFor).toBeGreaterThan(0);
  });

  it('does not hurt a player who is still protected', () => {
    const { world, state } = newWorld();
    world.addSystem(new EnemyContactSystem());
    spawnPlayer(world, 0, 0, 0, 1);
    spawnEnemy(world, 10, 8);

    world.runStage('update', DT);
    expect(state.lives).toBe(3);
  });

  it('ends the game and pauses the world on the last life', () => {
    const { world, state } = newWorld();
    world.addSystem(new EnemyContactSystem());
    state.lives = 1;
    spawnPlayer(world, 0, 0);
    spawnEnemy(world, 10, 8);

    world.runStage('update', DT);

    expect(state.lives).toBe(0);
    expect(state.status).toBe('lost');
    expect(world.paused).toBe(true);
  });
});

describe('GoalSystem', () => {
  it('wins the game when the player touches the flag', () => {
    const { world, state } = newWorld();
    world.addSystem(new GoalSystem());
    spawnPlayer(world, 0, 0);
    world.spawn(new Goal(), new Position(10, 0), new Collider(24, 56));

    world.runStage('update', DT);

    expect(state.status).toBe('won');
    expect(state.score).toBe(100);
    expect(world.paused).toBe(true);
  });
});

describe('PatrolSystem', () => {
  it('keeps an entity walking back and forth inside its route', () => {
    const world = new World().addSystem(new PatrolSystem()).addSystem(new MovementSystem());
    const e = world.spawn(
      new Position(0, 0),
      new Velocity(),
      new Collider(24, 24),
      new Patrol(0, 100, 50),
    );
    const pos = world.getComponent(e, Position)!;

    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 400; i++) {
      world.runStage('update', DT);
      min = Math.min(min, pos.x);
      max = Math.max(max, pos.x);
    }

    expect(min).toBeGreaterThanOrEqual(-1);
    expect(max).toBeGreaterThan(70);
    expect(max).toBeLessThanOrEqual(78);
  });
});

describe('InvulnerabilitySystem', () => {
  it('counts down, flickers, then restores the sprite', () => {
    const world = new World().addSystem(new InvulnerabilitySystem());
    const player = spawnPlayer(world, 0, 0, 0, 0.25);
    const sprite = world.getComponent(player, Sprite)!;
    const state = world.getComponent(player, Player)!;

    const alphas = new Set<number>();
    for (let i = 0; i < 30; i++) {
      world.runStage('update', DT);
      alphas.add(sprite.alpha);
    }

    expect(alphas.has(0.35)).toBe(true);
    expect(state.invulnerableFor).toBe(0);
    expect(sprite.alpha).toBe(1);
  });
});

describe('RestartSystem', () => {
  const held = (...codes: string[]): KeyState => ({
    isDown: (...wanted) => wanted.some((c) => codes.includes(c)),
  });

  it('restarts once, even when several steps run while the key is held', () => {
    const { world, state } = newWorld();
    let restarts = 0;
    world.addSystem(new RestartSystem(held('KeyR'), () => restarts++));
    state.status = 'lost';
    world.paused = true;

    for (let i = 0; i < 5; i++) world.runStage('update', DT);
    expect(restarts).toBe(1);
  });

  it('ignores the key while the game is still being played', () => {
    const { world } = newWorld();
    let restarts = 0;
    world.addSystem(new RestartSystem(held('KeyR'), () => restarts++));

    world.runStage('update', DT);
    expect(restarts).toBe(0);
  });
});
