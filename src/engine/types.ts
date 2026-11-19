import type { World } from './World';

/** An entity is just an ID. The brand stops you passing a random number by accident. */
export type Entity = number & { readonly __brand: 'Entity' };

/** Any class can be a component. The class itself is the key, e.g. `Position`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentClass<T extends object = object> = new (...args: any[]) => T;

/** Turns a tuple of component classes into a tuple of their instances. */
export type ComponentInstances<T extends readonly ComponentClass[]> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T]: T[K] extends new (...args: any[]) => infer I ? I : never;
};

/** What `world.query(A, B)` yields: the entity, then an `A` and a `B`. */
export type QueryResult<T extends readonly ComponentClass[]> = [
  Entity,
  ...ComponentInstances<T>,
];

export type Stage = 'update' | 'render';

export interface System {
  /** `update` runs at a fixed timestep, `render` once per drawn frame. Defaults to `update`. */
  readonly stage?: Stage;
  /** While the world is paused, `update` systems are skipped unless they set this. */
  readonly runWhenPaused?: boolean;
  run(world: World, dt: number): void;
}
