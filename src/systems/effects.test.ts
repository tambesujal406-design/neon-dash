import { describe, expect, it } from 'vitest';
import {
  Collider,
  Coin,
  Facing,
  OnGround,
  Particle,
  Player,
  Position,
  Squash,
  Velocity,
} from '../components';
import { World } from '../engine/World';
import { spawnBurst } from '../game/effects';
import { GameState } from '../game/GameState';
import { Camera } from '../game/resources';
import { FacingSystem } from './FacingSystem';
import { ParticleSystem } from './ParticleSystem';
import { PickupSystem } from './PickupSystem';
import { SquashSystem } from './SquashSystem';

const DT = 1 / 60;
const count = (world: World): number => [...world.query(Particle)].length;

describe('particles', () => {
  it('spawnBurst creates the requested number of particles', () => {
    const world = new World();
    spawnBurst(world, 10, 10, { count: 7, color: ['#fff', '#000'], speed: 100, life: 1 });
    expect(count(world)).toBe(7);
  });

  it('ParticleSystem moves particles, applies gravity and removes them when they expire', () => {
    const world = new World().addSystem(new ParticleSystem());
    const e = world.spawn(new Position(0, 0), new Particle(60, 0, 0.5, 3, '#fff', 600));
    world.runStage('update', DT);

    const pos = world.getComponent(e, Position)!;
    expect(pos.x).toBeGreaterThan(0);
    expect(pos.y).toBeGreaterThan(0);

    for (let i = 0; i < 40; i++) world.runStage('update', DT);
    expect(world.isAlive(e)).toBe(false);
  });

  it('keeps animating while the game is paused, so the win confetti still falls', () => {
    const world = new World().addSystem(new ParticleSystem());
    const e = world.spawn(new Position(0, 0), new Particle(0, 0, 1, 3, '#fff', 600));
    world.paused = true;
    world.runStage('update', DT);
    expect(world.getComponent(e, Position)!.y).toBeGreaterThan(0);
  });

  it('collecting a coin sprays sparkles', () => {
    const world = new World().addResource(new GameState(1)).addSystem(new PickupSystem());
    world.spawn(new Player(0, 0), new Position(0, 0), new Collider(24, 32));
    world.spawn(new Coin(), new Position(5, 5), new Collider(16, 16));
    world.runStage('update', DT);
    expect(count(world)).toBeGreaterThan(0);
  });
});

describe('FacingSystem', () => {
  it('turns toward the direction of travel and keeps it when standing still', () => {
    const world = new World().addSystem(new FacingSystem());
    const e = world.spawn(new Facing(), new Velocity(-50, 0));
    const facing = world.getComponent(e, Facing)!;
    const vel = world.getComponent(e, Velocity)!;

    world.runStage('update', DT);
    expect(facing.dir).toBe(-1);

    vel.x = 0;
    world.runStage('update', DT);
    expect(facing.dir).toBe(-1);

    vel.x = 80;
    world.runStage('update', DT);
    expect(facing.dir).toBe(1);
  });
});

describe('SquashSystem', () => {
  const setup = () => {
    const world = new World().addSystem(new SquashSystem());
    const e = world.spawn(
      new Squash(),
      new Position(0, 0),
      new Velocity(0, 500),
      new Collider(24, 32),
    );
    return { world, e, squash: world.getComponent(e, Squash)! };
  };

  it('squashes and sprays dust when landing from a fall', () => {
    const { world, e, squash } = setup();
    world.runStage('update', DT); // falling, remembers the speed
    world.addComponent(e, new OnGround());
    world.runStage('update', DT); // lands

    expect(squash.scaleY).toBeLessThan(1);
    expect(squash.scaleX).toBeGreaterThan(1);
    expect(count(world)).toBeGreaterThan(0);
  });

  it('stretches when jumping off the ground and eases back to normal', () => {
    const { world, e, squash } = setup();
    world.addComponent(e, new OnGround());
    world.runStage('update', DT);
    world.removeComponent(e, OnGround);
    world.getComponent(e, Velocity)!.y = -600;
    world.runStage('update', DT);
    expect(squash.scaleY).toBeGreaterThan(1);

    for (let i = 0; i < 90; i++) world.runStage('update', DT);
    expect(squash.scaleY).toBeCloseTo(1, 1);
  });
});

describe('Camera', () => {
  it('caps screen shake at the maximum', () => {
    const camera = new Camera();
    camera.addShake(0.8);
    camera.addShake(0.8);
    expect(camera.trauma).toBe(1);
  });
});
