import {
  Coin,
  Collider,
  Enemy,
  Facing,
  Goal,
  Gravity,
  Patrol,
  Player,
  PlayerInput,
  Position,
  Solid,
  Sprite,
  Squash,
  Velocity,
} from '../components';
import type { KeyState } from '../engine/Keyboard';
import { World } from '../engine/World';
import { BoundsSystem } from '../systems/BoundsSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { EnemyContactSystem } from '../systems/EnemyContactSystem';
import { FacingSystem } from '../systems/FacingSystem';
import { GoalSystem } from '../systems/GoalSystem';
import { GravitySystem } from '../systems/GravitySystem';
import { HudSystem } from '../systems/HudSystem';
import { InputSystem } from '../systems/InputSystem';
import { InvulnerabilitySystem } from '../systems/InvulnerabilitySystem';
import { JumpSystem } from '../systems/JumpSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { PatrolSystem } from '../systems/PatrolSystem';
import { PickupSystem } from '../systems/PickupSystem';
import { PlayerControlSystem } from '../systems/PlayerControlSystem';
import { RenderSystem } from '../systems/RenderSystem';
import { RestartSystem } from '../systems/RestartSystem';
import { SquashSystem } from '../systems/SquashSystem';
import { TimeSystem } from '../systems/TimeSystem';
import { GameState } from './GameState';
import { Camera, Time } from './resources';

export interface LevelOptions {
  ctx: CanvasRenderingContext2D;
  keys: KeyState;
  onRestart: () => void;
}

// [x, y, width] of each platform's top-left corner (the level assumes a 960 x 540 canvas).
const PLATFORMS = [
  [150, 380, 180],
  [400, 300, 220],
  [700, 380, 180],
] as const;

// [x, y] of each coin, sitting just above a platform.
const COINS = [
  [190, 350],
  [240, 350],
  [290, 350],
  [450, 270],
  [500, 270],
  [550, 270],
  [720, 350],
  [770, 350],
  [810, 350],
] as const;

const COIN_SIZE = 16;
const PLAYER = { width: 24, height: 32 };
const ENEMY_SIZE = 24;

/** Builds a fresh world: all systems in running order, plus the level's entities. */
export function createWorld({ ctx, keys, onRestart }: LevelOptions): World {
  const { width, height } = ctx.canvas;
  const groundY = height - 60;
  const world = new World();

  // Systems run in the order they are added:
  // read keys, decide, apply forces, move, resolve collisions, react, then draw.
  world
    .addSystem(new InputSystem(keys))
    .addSystem(new RestartSystem(keys, onRestart))
    .addSystem(new PlayerControlSystem())
    .addSystem(new JumpSystem())
    .addSystem(new PatrolSystem())
    .addSystem(new GravitySystem())
    .addSystem(new MovementSystem())
    .addSystem(new CollisionSystem())
    .addSystem(new BoundsSystem(width))
    .addSystem(new PickupSystem())
    .addSystem(new EnemyContactSystem())
    .addSystem(new GoalSystem())
    .addSystem(new InvulnerabilitySystem())
    .addSystem(new FacingSystem())
    .addSystem(new SquashSystem())
    .addSystem(new ParticleSystem())
    // Render stage: advance the clock and camera, draw the scene, then the HUD on top.
    .addSystem(new TimeSystem())
    .addSystem(new CameraSystem())
    .addSystem(new RenderSystem(ctx, groundY))
    .addSystem(new HudSystem(ctx));

  world.addResource(new GameState(COINS.length)).addResource(new Time()).addResource(new Camera());

  // Ground and platforms. Entities are drawn in creation order, so the player goes last.
  world.spawn(
    new Position(0, groundY),
    new Sprite(width, 60, '#2f3a5f', 'ground'),
    new Collider(width, 60),
    new Solid(),
  );
  for (const [x, y, w] of PLATFORMS) {
    world.spawn(
      new Position(x, y),
      new Sprite(w, 16, '#4f6bb0', 'platform'),
      new Collider(w, 16),
      new Solid(),
    );
  }

  for (const [x, y] of COINS) {
    world.spawn(
      new Position(x, y),
      new Sprite(COIN_SIZE, COIN_SIZE, '#EF9F27', 'coin'),
      new Collider(COIN_SIZE, COIN_SIZE),
      new Coin(),
    );
  }

  // Goal flag on the last platform: a pole (which also counts as the goal) and a banner.
  world.spawn(
    new Position(850, 324),
    new Sprite(4, 56, '#D3D1C7', 'pole'),
    new Collider(24, 56),
    new Goal(),
  );
  world.spawn(new Position(854, 324), new Sprite(20, 14, '#5DCAA5', 'banner'));

  // One enemy patrols the ground, another patrols the middle platform.
  for (const [x, y, minX, maxX, speed] of [
    [420, groundY - ENEMY_SIZE, 380, 700, 90],
    [480, 300 - ENEMY_SIZE, 470, 620, 60],
  ] as const) {
    world.spawn(
      new Position(x, y),
      new Velocity(),
      new Sprite(ENEMY_SIZE, ENEMY_SIZE, '#E24B4A', 'enemy'),
      new Collider(ENEMY_SIZE, ENEMY_SIZE),
      new Facing(),
      new Gravity(),
      new Patrol(minX, maxX, speed),
      new Enemy(),
    );
  }

  const spawnX = 40;
  const spawnY = groundY - PLAYER.height;
  world.spawn(
    new Position(spawnX, spawnY),
    new Velocity(),
    new Sprite(PLAYER.width, PLAYER.height, '#5DCAA5', 'player'),
    new Collider(PLAYER.width, PLAYER.height),
    new Facing(),
    new Squash(),
    new Gravity(),
    new PlayerInput(),
    new Player(spawnX, spawnY),
  );

  return world;
}
