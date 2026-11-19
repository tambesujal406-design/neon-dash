import { roundRectPath } from '../render/draw';
import { FONT, THEME } from '../render/theme';
import type { System } from '../engine/types';
import type { World } from '../engine/World';
import { GameState } from '../game/GameState';
import { Time } from '../game/resources';

type Ctx = CanvasRenderingContext2D;

const TAU = Math.PI * 2;
const MAX_LIVES = 3;

function heartPath(ctx: Ctx, cx: number, cy: number, size: number): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.8);
  ctx.bezierCurveTo(cx - size * 1.5, cy - size * 0.1, cx - size * 0.7, cy - size * 1.1, cx, cy - size * 0.35);
  ctx.bezierCurveTo(cx + size * 0.7, cy - size * 1.1, cx + size * 1.5, cy - size * 0.1, cx, cy + size * 0.8);
  ctx.closePath();
}

function starPath(ctx: Ctx, cx: number, cy: number, outer: number, inner: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Draws the glass-style top bar (score, coins, lives) and the end screen. */
export class HudSystem implements System {
  readonly stage = 'render' as const;
  private shownScore = 0;

  constructor(private readonly ctx: Ctx) {}

  run(world: World, dt: number): void {
    const state = world.getResource(GameState);
    const time = world.findResource(Time)?.elapsed ?? 0;

    // The score counts up smoothly instead of jumping.
    this.shownScore += (state.score - this.shownScore) * Math.min(1, dt * 8);
    if (Math.abs(state.score - this.shownScore) < 0.5) this.shownScore = state.score;

    this.drawTopBar(state);
    if (state.status !== 'playing') this.drawEndScreen(state, time);
  }

  private panel(x: number, y: number, w: number, h: number): void {
    const { ctx } = this;
    roundRectPath(ctx, x, y, w, h, 12);
    ctx.fillStyle = 'rgba(12,8,45,0.62)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(139,108,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawTopBar(state: GameState): void {
    const { ctx } = this;
    const { width } = ctx.canvas;
    ctx.textBaseline = 'middle';

    // Score
    this.panel(16, 14, 170, 56);
    ctx.textAlign = 'left';
    ctx.font = `500 10px ${FONT}`;
    ctx.fillStyle = '#9aa3c7';
    ctx.fillText('SCORE', 32, 28);
    ctx.save();
    ctx.shadowColor = THEME.cyan;
    ctx.shadowBlur = 10;
    ctx.font = `700 26px ${FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(Math.round(this.shownScore)), 32, 51);
    ctx.restore();

    // Coins
    const coinX = (width - 150) / 2;
    this.panel(coinX, 14, 150, 40);
    ctx.save();
    ctx.shadowColor = 'rgba(255,200,61,0.9)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = THEME.gold;
    ctx.beginPath();
    ctx.arc(coinX + 28, 34, 9, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.textAlign = 'left';
    ctx.font = `700 18px ${FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${state.coins} / ${state.totalCoins}`, coinX + 50, 35);

    // Lives
    const livesX = width - 16 - 140;
    this.panel(livesX, 14, 140, 40);
    for (let i = 0; i < MAX_LIVES; i++) {
      const cx = livesX + 34 + i * 36;
      ctx.save();
      heartPath(ctx, cx, 34, 8);
      if (i < state.lives) {
        ctx.shadowColor = THEME.pink;
        ctx.shadowBlur = 12;
        ctx.fillStyle = THEME.pink;
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(255,77,141,0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawEndScreen(state: GameState, time: number): void {
    const { ctx } = this;
    const { width, height } = ctx.canvas;
    const won = state.status === 'won';
    const cy = height / 2;

    // A lighter veil on a win, so the confetti and the scene still shine through.
    const shade = ctx.createLinearGradient(0, 0, 0, height);
    shade.addColorStop(0, won ? 'rgba(8,5,30,0.5)' : 'rgba(8,5,30,0.82)');
    shade.addColorStop(1, won ? 'rgba(40,10,70,0.6)' : 'rgba(40,10,70,0.88)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);

    if (won) {
      const total = Math.max(1, state.totalCoins);
      const earned = state.coins >= total ? 3 : state.coins >= total * 0.6 ? 2 : 1;
      for (let i = 0; i < 3; i++) {
        const sx = width / 2 + (i - 1) * 64;
        const sy = cy - 108 - (i === 1 ? 10 : 0);
        ctx.save();
        starPath(ctx, sx, sy, 24, 10);
        if (i < earned) {
          ctx.shadowColor = THEME.gold;
          ctx.shadowBlur = 18;
          ctx.fillStyle = THEME.gold;
          ctx.fill();
        } else {
          ctx.strokeStyle = 'rgba(255,200,61,0.35)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.shadowColor = won ? THEME.mint : THEME.danger;
    ctx.shadowBlur = 26;
    ctx.font = `900 46px ${FONT}`;
    ctx.fillStyle = won ? THEME.mint : THEME.danger;
    ctx.fillText(won ? 'LEVEL COMPLETE' : 'GAME OVER', width / 2, cy - 36);
    ctx.restore();

    ctx.font = `500 20px ${FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Score ${state.score}   Coins ${state.coins} of ${state.totalCoins}`, width / 2, cy + 22);

    ctx.save();
    ctx.globalAlpha = 0.55 + 0.45 * Math.sin(time * 4);
    ctx.font = `500 15px ${FONT}`;
    ctx.fillStyle = THEME.cyan;
    ctx.fillText('PRESS R OR ENTER TO PLAY AGAIN', width / 2, cy + 70);
    ctx.restore();
  }
}
