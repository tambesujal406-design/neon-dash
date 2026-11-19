/** Components are plain data. No logic lives here, that belongs in systems. */

export class Position {
  constructor(
    public x = 0,
    public y = 0,
  ) {}
}

export class Velocity {
  constructor(
    public x = 0,
    public y = 0,
  ) {}
}

/** `kind` picks how the renderer draws it: plain boxes, neon platforms, spinning coins and so on. */
export type SpriteKind =
  | 'box'
  | 'ground'
  | 'platform'
  | 'coin'
  | 'enemy'
  | 'player'
  | 'pole'
  | 'banner';

export class Sprite {
  constructor(
    public width: number,
    public height: number,
    public color: string,
    public kind: SpriteKind = 'box',
    public alpha = 1,
  ) {}
}

/** What the player wants to do right now. Written by InputSystem, read by other systems. */
export class PlayerInput {
  constructor(
    public left = false,
    public right = false,
    public jump = false,
  ) {}
}

/** Pulls an entity downwards. `maxFallSpeed` also stops fast fallers tunnelling through thin platforms. */
export class Gravity {
  constructor(
    public strength = 1800,
    public maxFallSpeed = 780,
  ) {}
}

/** The box used for collisions. Separate from Sprite so you can draw big but collide small. */
export class Collider {
  constructor(
    public width: number,
    public height: number,
  ) {}
}

/** Marker component: moving things bump into this and can stand on it. */
export class Solid {}

/** Marker component: CollisionSystem adds it while an entity is standing on something. */
export class OnGround {}

/** The player. Remembers where to respawn and how long it stays unhurtable after a hit. */
export class Player {
  constructor(
    public spawnX: number,
    public spawnY: number,
    public invulnerableFor = 0,
  ) {}
}

export class Coin {
  constructor(public value = 10) {}
}

/** Marker component: touching the side of this hurts the player, landing on top defeats it. */
export class Enemy {}

/** Walk back and forth between two x positions at a fixed speed. */
export class Patrol {
  constructor(
    public minX: number,
    public maxX: number,
    public speed: number,
  ) {}
}

/** Marker component: the player wins by touching this. */
export class Goal {}

/** Which way an entity is looking, so eyes and effects point the right way. */
export class Facing {
  constructor(public dir: 1 | -1 = 1) {}
}

/** Squash and stretch animation state: stretches on take-off, squashes on landing. */
export class Squash {
  scaleX = 1;
  scaleY = 1;
  wasGrounded = true;
  fallSpeed = 0;
  dustTimer = 0;
}

/** A short-lived visual spark. It has its own motion so it keeps animating when the game is paused. */
export class Particle {
  constructor(
    public vx: number,
    public vy: number,
    public life: number,
    public size: number,
    public color: string,
    public gravity = 700,
    public maxLife = life,
  ) {}
}
