/** The only thing systems need to know about the keyboard. Easy to fake in tests. */
export interface KeyState {
  /** True if ANY of the given key codes is currently held, e.g. isDown('ArrowLeft', 'KeyA'). */
  isDown(...codes: string[]): boolean;
}

// Keys the browser would otherwise use to scroll the page while you play.
const BLOCKED_DEFAULTS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
]);

/**
 * Tracks which keys are held. It uses `event.code` (the physical key), so
 * WASD works the same on any keyboard layout.
 */
export class Keyboard implements KeyState {
  private readonly held = new Set<string>();

  constructor(private readonly target: EventTarget = window) {
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('blur', this.onBlur);
  }

  isDown(...codes: string[]): boolean {
    return codes.some((code) => this.held.has(code));
  }

  dispose(): void {
    this.target.removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('keyup', this.onKeyUp);
    this.target.removeEventListener('blur', this.onBlur);
    this.held.clear();
  }

  private readonly onKeyDown = (event: Event): void => {
    const { code } = event as KeyboardEvent;
    if (BLOCKED_DEFAULTS.has(code)) event.preventDefault();
    this.held.add(code);
  };

  private readonly onKeyUp = (event: Event): void => {
    this.held.delete((event as KeyboardEvent).code);
  };

  // If the window loses focus mid-press, we never get the keyup. Reset to avoid stuck keys.
  private readonly onBlur = (): void => {
    this.held.clear();
  };
}
