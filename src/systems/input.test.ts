import { describe, expect, it } from 'vitest';
import { PlayerInput, Velocity } from '../components';
import type { KeyState } from '../engine/Keyboard';
import { World } from '../engine/World';
import { InputSystem } from './InputSystem';
import { PlayerControlSystem } from './PlayerControlSystem';

const keys = (...held: string[]): KeyState => ({
  isDown: (...codes) => codes.some((code) => held.includes(code)),
});

function runFrame(held: string[]) {
  const world = new World();
  world.addSystem(new InputSystem(keys(...held))).addSystem(new PlayerControlSystem(100));
  const player = world.spawn(new PlayerInput(), new Velocity());
  world.runStage('update', 1 / 60);
  return {
    vel: world.getComponent(player, Velocity)!,
    input: world.getComponent(player, PlayerInput)!,
  };
}

describe('input and player control', () => {
  it('moves right with ArrowRight or D', () => {
    expect(runFrame(['ArrowRight']).vel.x).toBe(100);
    expect(runFrame(['KeyD']).vel.x).toBe(100);
  });

  it('moves left with ArrowLeft or A', () => {
    expect(runFrame(['ArrowLeft']).vel.x).toBe(-100);
    expect(runFrame(['KeyA']).vel.x).toBe(-100);
  });

  it('stands still with no keys, or with both directions held', () => {
    expect(runFrame([]).vel.x).toBe(0);
    expect(runFrame(['ArrowLeft', 'ArrowRight']).vel.x).toBe(0);
  });

  it('records the jump intent for later systems', () => {
    expect(runFrame(['Space']).input.jump).toBe(true);
    expect(runFrame([]).input.jump).toBe(false);
  });
});
