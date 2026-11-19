import { Particle, Position } from '../components';
import type { World } from '../engine/World';
import { Camera } from './resources';

export interface BurstOptions {
  count: number;
  color: string | readonly string[];
  speed: number;
  life: number;
  size?: number;
  gravity?: number;
  /** `up` sprays upwards like dust, `all` explodes in every direction. */
  direction?: 'up' | 'all';
}

/** Sprays short-lived particles from a point. */
export function spawnBurst(world: World, x: number, y: number, options: BurstOptions): void {
  const { count, color, speed, life, size = 3, gravity = 700, direction = 'all' } = options;
  for (let i = 0; i < count; i++) {
    const angle =
      direction === 'up'
        ? -Math.PI / 2 + (Math.random() - 0.5) * 1.7
        : Math.random() * Math.PI * 2;
    const velocity = speed * (0.4 + Math.random() * 0.6);
    const tint =
      typeof color === 'string' ? color : (color[Math.floor(Math.random() * color.length)] ?? '#ffffff');
    world.spawn(
      new Position(x, y),
      new Particle(
        Math.cos(angle) * velocity,
        Math.sin(angle) * velocity,
        life * (0.6 + Math.random() * 0.4),
        size * (0.6 + Math.random() * 0.8),
        tint,
        gravity,
      ),
    );
  }
}

/** Shakes the screen, if this world has a camera. */
export function shakeScreen(world: World, amount: number): void {
  world.findResource(Camera)?.addShake(amount);
}
