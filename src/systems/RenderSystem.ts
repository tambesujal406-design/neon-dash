import { Facing, Particle, Position, Sprite, Squash } from '../components';
import type { System } from '../engine/types';
import type { World } from '../engine/World';
import { Camera, Time } from '../game/resources';
import { Background } from '../render/Background';
import {
  drawBanner,
  drawCoin,
  drawEnemy,
  drawGround,
  drawParticle,
  drawPlatform,
  drawPlayer,
  drawPole,
} from '../render/draw';
import { THEME } from '../render/theme';

const NEUTRAL_SQUASH = new Squash();

/**
 * Draws the whole scene: background, every sprite (in creation order, so later ones
 * appear on top), then particles, then a dark vignette. The camera shakes all of it
 * except the vignette and the HUD.
 */
export class RenderSystem implements System {
  readonly stage = 'render' as const;
  private background: Background | undefined;
  private vignette: CanvasGradient | undefined;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly groundY: number,
  ) {}

  run(world: World): void {
    const { ctx } = this;
    const { width, height } = ctx.canvas;
    const time = world.findResource(Time)?.elapsed ?? 0;
    const camera = world.findResource(Camera);
    this.background ??= new Background(width, height, this.groundY);

    ctx.fillStyle = THEME.skyTop;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(camera?.offsetX ?? 0, camera?.offsetY ?? 0);
    this.background.draw(ctx, time, camera?.focusX ?? width / 2);
    this.drawSprites(world, time);
    for (const [, pos, particle] of world.query(Position, Particle)) {
      drawParticle(ctx, pos, particle);
    }
    ctx.restore();

    this.drawVignette(width, height);
  }

  private drawSprites(world: World, time: number): void {
    const { ctx } = this;
    for (const [entity, pos, sprite] of world.query(Position, Sprite)) {
      const dir = world.getComponent(entity, Facing)?.dir ?? 1;
      switch (sprite.kind) {
        case 'ground':
          drawGround(ctx, pos, sprite);
          break;
        case 'platform':
          drawPlatform(ctx, pos, sprite, time);
          break;
        case 'coin':
          drawCoin(ctx, pos, sprite, time);
          break;
        case 'enemy':
          drawEnemy(ctx, pos, sprite, dir, time);
          break;
        case 'player':
          drawPlayer(ctx, pos, sprite, dir, world.getComponent(entity, Squash) ?? NEUTRAL_SQUASH, time);
          break;
        case 'pole':
          drawPole(ctx, pos, sprite, time);
          break;
        case 'banner':
          drawBanner(ctx, pos, sprite, time);
          break;
        default:
          ctx.globalAlpha = sprite.alpha;
          ctx.fillStyle = sprite.color;
          ctx.fillRect(pos.x, pos.y, sprite.width, sprite.height);
          ctx.globalAlpha = 1;
      }
    }
  }

  private drawVignette(width: number, height: number): void {
    const { ctx } = this;
    if (!this.vignette) {
      const gradient = ctx.createRadialGradient(width / 2, height / 2, height * 0.45, width / 2, height / 2, width * 0.72);
      gradient.addColorStop(0, 'rgba(5,3,20,0)');
      gradient.addColorStop(1, 'rgba(5,3,20,0.55)');
      this.vignette = gradient;
    }
    ctx.fillStyle = this.vignette;
    ctx.fillRect(0, 0, width, height);
  }
}
