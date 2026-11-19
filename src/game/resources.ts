/** Real elapsed seconds, used to drive animations. Keeps counting while the game is paused. */
export class Time {
  elapsed = 0;
}

/** Where the view is focused (for background parallax) and how hard it is shaking. */
export class Camera {
  focusX = 480;
  trauma = 0;
  offsetX = 0;
  offsetY = 0;

  /** Adds screen shake. 0.3 is a small bump, 1 is the maximum. */
  addShake(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }
}
