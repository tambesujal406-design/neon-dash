import type {
  ComponentClass,
  Entity,
  QueryResult,
  Stage,
  System,
} from './types';

export class World {
  private nextId = 1;
  private readonly alive = new Set<Entity>();
  private readonly stores = new Map<ComponentClass, Map<Entity, object>>();
  private readonly systems: Record<Stage, System[]> = { update: [], render: [] };
  private readonly resources = new Map<ComponentClass, object>();

  /** When true, `update` systems are skipped (except those marked `runWhenPaused`). Rendering never pauses. */
  paused = false;

  get entityCount(): number {
    return this.alive.size;
  }

  createEntity(): Entity {
    const entity = this.nextId++ as Entity;
    this.alive.add(entity);
    return entity;
  }

  /** Create an entity and attach components in one go. */
  spawn(...components: object[]): Entity {
    const entity = this.createEntity();
    for (const component of components) this.addComponent(entity, component);
    return entity;
  }

  isAlive(entity: Entity): boolean {
    return this.alive.has(entity);
  }

  destroyEntity(entity: Entity): void {
    for (const store of this.stores.values()) store.delete(entity);
    this.alive.delete(entity);
  }

  /** Components must be class instances: the class is how they are looked up. */
  addComponent<T extends object>(entity: Entity, component: T): this {
    const type = component.constructor as ComponentClass<T>;
    let store = this.stores.get(type);
    if (!store) {
      store = new Map();
      this.stores.set(type, store);
    }
    store.set(entity, component);
    return this;
  }

  getComponent<T extends object>(
    entity: Entity,
    type: ComponentClass<T>,
  ): T | undefined {
    return this.stores.get(type)?.get(entity) as T | undefined;
  }

  hasComponent(entity: Entity, type: ComponentClass): boolean {
    return this.stores.get(type)?.has(entity) ?? false;
  }

  removeComponent(entity: Entity, type: ComponentClass): void {
    this.stores.get(type)?.delete(entity);
  }

  /**
   * Yields every entity that has ALL the requested components, with the
   * component instances fully typed, in the order you asked for them:
   *
   *   for (const [entity, pos, vel] of world.query(Position, Velocity)) { ... }
   */
  *query<T extends ComponentClass[]>(
    ...types: T
  ): IterableIterator<QueryResult<T>> {
    const stores: Map<Entity, object>[] = [];
    for (const type of types) {
      const store = this.stores.get(type);
      if (!store) return;
      stores.push(store);
    }
    if (stores.length === 0) return;

    // Walk the smallest store, and check the others for each candidate.
    const smallest = stores.reduce((a, b) => (a.size <= b.size ? a : b));
    for (const entity of Array.from(smallest.keys())) {
      const components: object[] = [];
      let matches = true;
      for (const store of stores) {
        const component = store.get(entity);
        if (component === undefined) {
          matches = false;
          break;
        }
        components.push(component);
      }
      if (matches) yield [entity, ...components] as unknown as QueryResult<T>;
    }
  }

  /** Resources are world-wide singletons (score, settings), looked up by class like components. */
  addResource<T extends object>(resource: T): this {
    this.resources.set(resource.constructor as ComponentClass<T>, resource);
    return this;
  }

  getResource<T extends object>(type: ComponentClass<T>): T {
    const resource = this.findResource(type);
    if (!resource) throw new Error(`Resource ${type.name} has not been added to the world`);
    return resource;
  }

  /** Like getResource, but returns undefined instead of throwing. For optional extras. */
  findResource<T extends object>(type: ComponentClass<T>): T | undefined {
    return this.resources.get(type) as T | undefined;
  }

  addSystem(system: System): this {
    this.systems[system.stage ?? 'update'].push(system);
    return this;
  }

  runStage(stage: Stage, dt: number): void {
    const skipGameplay = this.paused && stage === 'update';
    for (const system of this.systems[stage]) {
      if (skipGameplay && !system.runWhenPaused) continue;
      system.run(this, dt);
    }
  }
}
