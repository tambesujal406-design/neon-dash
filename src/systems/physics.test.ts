import { describe, expect, it } from 'vitest';
import {
  Collider,
  Gravity,
  OnGround,
  PlayerInput,
  Position,
  Solid,
  Velocity,
} from '../components';
import { World } from '../engine/World';
import { CollisionSystem } from './CollisionSystem';
import { GravitySystem } from './GravitySystem';
import { JumpSystem } from './JumpSystem';
import { MovementSystem } from './MovementSystem';

const DT = 1 / 60;

function physicsWorld(): World {
  return new World()
    .addSystem(new JumpSystem())
    .addSystem(new GravitySystem())
    .addSystem(new MovementSystem())
    .addSystem(new CollisionSystem());
}

function step(world: World, frames: number): void {
  for (let i = 0; i < frames; i++) world.runStage('update', DT);
}

function addSolid(world: World, x: number, y: number, w: number, h: number): void {
  world.spawn(new Position(x, y), new Collider(w, h), new Solid());
}

describe('gravity', () => {
  it('speeds up falling entities but never past the maximum fall speed', () => {
    const world = physicsWorld();
    const e = world.spawn(new Position(0, 0), new Velocity(), new Gravity(1800, 500));
    step(world, 5);
    const vel = world.getComponent(e, Velocity)!;
    expect(vel.y).toBeGreaterThan(0);
    step(world, 120);
    expect(vel.y).toBe(500);
  });
});

describe('collision', () => {
  it('lands on top of a solid and is marked OnGround', () => {
    const world = physicsWorld();
    addSolid(world, 0, 100, 200, 50);
    const e = world.spawn(
      new Position(50, 0),
      new Velocity(),
      new Collider(24, 32),
      new Gravity(),
    );
    step(world, 120);

    const pos = world.getComponent(e, Position)!;
    expect(pos.y + 32).toBeCloseTo(100, 5);
    expect(world.getComponent(e, Velocity)!.y).toBe(0);
    expect(world.hasComponent(e, OnGround)).toBe(true);
  });

  it('does not tunnel through a thin platform at full fall speed', () => {
    const world = physicsWorld();
    addSolid(world, 0, 500, 200, 16);
    const e = world.spawn(
      new Position(50, -600),
      new Velocity(),
      new Collider(24, 32),
      new Gravity(),
    );
    step(world, 300);
    expect(world.getComponent(e, Position)!.y + 32).toBeCloseTo(500, 5);
  });

  it('stops sideways movement at a wall', () => {
    const world = physicsWorld();
    addSolid(world, 50, 0, 20, 100);
    const e = world.spawn(
      new Position(0, 0),
      new Velocity(100, 0),
      new Collider(24, 32),
    );
    step(world, 60);
    expect(world.getComponent(e, Position)!.x).toBeCloseTo(26, 5);
    expect(world.getComponent(e, Velocity)!.x).toBe(0);
  });

  it('bumps the head on a ceiling', () => {
    const world = physicsWorld();
    addSolid(world, 0, 0, 200, 20);
    const e = world.spawn(
      new Position(50, 30),
      new Velocity(0, -300),
      new Collider(24, 32),
    );
    step(world, 10);
    expect(world.getComponent(e, Position)!.y).toBeCloseTo(20, 5);
    expect(world.getComponent(e, Velocity)!.y).toBe(0);
  });
});

describe('jumping', () => {
  it('jumps only while OnGround', () => {
    const world = physicsWorld();
    const grounded = world.spawn(
      new Velocity(),
      new PlayerInput(false, false, true),
      new OnGround(),
    );
    const airborne = world.spawn(new Velocity(), new PlayerInput(false, false, true));

    world.runStage('update', DT);
    expect(world.getComponent(grounded, Velocity)!.y).toBeLessThan(0);
    expect(world.hasComponent(grounded, OnGround)).toBe(false);
    expect(world.getComponent(airborne, Velocity)!.y).toBe(0);
  });

  it('cuts the jump short when the key is released early', () => {
    const world = new World().addSystem(new JumpSystem());
    const e = world.spawn(new Velocity(0, -600), new PlayerInput(false, false, false));
    world.runStage('update', DT);
    expect(world.getComponent(e, Velocity)!.y).toBe(-260);
  });

  it('completes a full jump and lands back on the ground', () => {
    const world = physicsWorld();
    addSolid(world, 0, 100, 400, 60);
    const player = world.spawn(
      new Position(50, 68),
      new Velocity(),
      new Collider(24, 32),
      new Gravity(),
      new PlayerInput(),
    );
    step(world, 5); // settle on the ground
    expect(world.hasComponent(player, OnGround)).toBe(true);

    const input = world.getComponent(player, PlayerInput)!;
    const pos = world.getComponent(player, Position)!;
    input.jump = true;
    let highest = pos.y;
    for (let i = 0; i < 120; i++) {
      world.runStage('update', DT);
      if (i === 40) input.jump = false;
      highest = Math.min(highest, pos.y);
    }

    expect(68 - highest).toBeGreaterThan(80); // got well off the ground
    expect(pos.y + 32).toBeCloseTo(100, 5); // and came back down
    expect(world.hasComponent(player, OnGround)).toBe(true);
  });
});
