import { describe, expect, it } from 'vitest';
import type { System } from './types';
import { World } from './World';

class Position {
  constructor(
    public x = 0,
    public y = 0,
  ) {}
}

class Velocity {
  constructor(
    public x = 0,
    public y = 0,
  ) {}
}

describe('World', () => {
  it('creates entities with unique ids', () => {
    const world = new World();
    expect(world.createEntity()).not.toBe(world.createEntity());
    expect(world.entityCount).toBe(2);
  });

  it('query returns only entities that have every requested component', () => {
    const world = new World();
    const moving = world.spawn(new Position(1, 2), new Velocity(3, 4));
    world.spawn(new Position(5, 6));

    const results = [...world.query(Position, Velocity)];
    expect(results).toHaveLength(1);

    const [entity, pos, vel] = results[0]!;
    expect(entity).toBe(moving);
    expect(pos.x).toBe(1);
    expect(vel.y).toBe(4);
  });

  it('types each queried component', () => {
    const world = new World();
    world.spawn(new Position(), new Velocity());

    for (const [, pos, vel] of world.query(Position, Velocity)) {
      const sum: number = pos.x + vel.x;
      expect(sum).toBe(0);
      // @ts-expect-error Velocity has no property called "z"
      void vel.z;
    }
  });

  it('yields nothing when no entity has a requested component type', () => {
    const world = new World();
    world.spawn(new Position());
    expect([...world.query(Position, Velocity)]).toHaveLength(0);
  });

  it('removes components and destroys entities', () => {
    const world = new World();
    const e = world.spawn(new Position(), new Velocity());

    world.removeComponent(e, Velocity);
    expect(world.hasComponent(e, Velocity)).toBe(false);
    expect([...world.query(Position, Velocity)]).toHaveLength(0);

    world.destroyEntity(e);
    expect(world.isAlive(e)).toBe(false);
    expect([...world.query(Position)]).toHaveLength(0);
  });

  it('can destroy entities while iterating a query', () => {
    const world = new World();
    for (let i = 0; i < 5; i++) world.spawn(new Position(i));
    for (const [entity] of world.query(Position)) world.destroyEntity(entity);
    expect(world.entityCount).toBe(0);
  });

  it('runs systems by stage', () => {
    const world = new World();
    const calls: string[] = [];
    const update: System = { run: () => calls.push('update') };
    const render: System = { stage: 'render', run: () => calls.push('render') };
    world.addSystem(update).addSystem(render);

    world.runStage('update', 1 / 60);
    world.runStage('render', 1 / 60);
    expect(calls).toEqual(['update', 'render']);
  });
});

class Score {
  constructor(public value = 0) {}
}

describe('World resources', () => {
  it('stores one resource per class and returns it', () => {
    const world = new World().addResource(new Score(5));
    expect(world.getResource(Score).value).toBe(5);
  });

  it('throws a clear error for a missing resource', () => {
    expect(() => new World().getResource(Score)).toThrow(/Score/);
  });
});

describe('World pause', () => {
  it('skips update systems while paused, except those marked runWhenPaused', () => {
    const world = new World();
    const calls: string[] = [];
    world
      .addSystem({ run: () => calls.push('normal') })
      .addSystem({ runWhenPaused: true, run: () => calls.push('always') })
      .addSystem({ stage: 'render', run: () => calls.push('render') });

    world.paused = true;
    world.runStage('update', 1 / 60);
    world.runStage('render', 1 / 60);
    expect(calls).toEqual(['always', 'render']);
  });
});

describe('World.findResource', () => {
  it('returns undefined instead of throwing for a missing resource', () => {
    expect(new World().findResource(Score)).toBeUndefined();
  });
});
