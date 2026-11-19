import type { World } from './World';

/**
 * Fixed-timestep loop: game logic always advances in equal steps (so physics
 * behaves the same on a 60 Hz and a 144 Hz screen), while rendering happens
 * once per animation frame.
 */
export class GameLoop {
  private rafId = 0;
  private last = 0;
  private accumulator = 0;
  private running = false;

  constructor(
    private readonly world: World,
    private readonly fixedStep = 1 / 60,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private readonly frame = (now: number): void => {
    if (!this.running) return;

    // Clamp so a background tab doesn't trigger a huge catch-up burst.
    const delta = Math.min((now - this.last) / 1000, 0.25);
    this.last = now;
    this.accumulator += delta;

    while (this.accumulator >= this.fixedStep) {
      this.world.runStage('update', this.fixedStep);
      this.accumulator -= this.fixedStep;
    }
    this.world.runStage('render', delta);

    this.rafId = requestAnimationFrame(this.frame);
  };
}
