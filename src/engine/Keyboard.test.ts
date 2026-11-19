import { describe, expect, it } from 'vitest';
import { Keyboard } from './Keyboard';

type KeyEventType = 'keydown' | 'keyup';

const press = (target: EventTarget, type: KeyEventType, code: string): void => {
  target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), { code }));
};

describe('Keyboard', () => {
  it('tracks keys while they are held', () => {
    const target = new EventTarget();
    const keyboard = new Keyboard(target);

    press(target, 'keydown', 'KeyA');
    expect(keyboard.isDown('KeyA')).toBe(true);
    expect(keyboard.isDown('ArrowLeft', 'KeyA')).toBe(true);
    expect(keyboard.isDown('KeyD')).toBe(false);

    press(target, 'keyup', 'KeyA');
    expect(keyboard.isDown('KeyA')).toBe(false);
  });

  it('clears held keys when the window loses focus', () => {
    const target = new EventTarget();
    const keyboard = new Keyboard(target);

    press(target, 'keydown', 'ArrowRight');
    target.dispatchEvent(new Event('blur'));
    expect(keyboard.isDown('ArrowRight')).toBe(false);
  });

  it('stops listening after dispose', () => {
    const target = new EventTarget();
    const keyboard = new Keyboard(target);
    keyboard.dispose();

    press(target, 'keydown', 'KeyA');
    expect(keyboard.isDown('KeyA')).toBe(false);
  });
});
