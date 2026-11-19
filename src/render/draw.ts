import type { Particle, Position, Sprite, Squash } from '../components';
import { THEME } from './theme';

type Ctx = CanvasRenderingContext2D;

const TAU = Math.PI * 2;

export function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function glow(ctx: Ctx, color: string, blur: number): void {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function noGlow(ctx: Ctx): void {
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}

/** The ground: a violet floor with a synthwave grid and a glowing neon edge. */
export function drawGround(ctx: Ctx, pos: Position, sprite: Sprite): void {
  const { x, y } = pos;
  const { width: w, height: h } = sprite;

  // Light spilling upwards from the neon edge.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const spill = ctx.createLinearGradient(0, y - 36, 0, y);
  spill.addColorStop(0, 'rgba(61,232,255,0)');
  spill.addColorStop(1, 'rgba(61,232,255,0.14)');
  ctx.fillStyle = spill;
  ctx.fillRect(x, y - 36, w, 36);
  ctx.restore();

  const body = ctx.createLinearGradient(0, y, 0, y + h);
  body.addColorStop(0, '#2b1f78');
  body.addColorStop(1, '#0a0828');
  ctx.fillStyle = body;
  ctx.fillRect(x, y, w, h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = 'rgba(139,108,255,0.28)';
  ctx.lineWidth = 1;
  const cx = x + w / 2;
  ctx.beginPath();
  for (let gx = x - 200; gx <= x + w + 200; gx += 40) {
    ctx.moveTo(gx, y);
    ctx.lineTo(cx + (gx - cx) * 1.7, y + h);
  }
  for (const gy of [9, 22, 40]) {
    ctx.moveTo(x, y + gy);
    ctx.lineTo(x + w, y + gy);
  }
  ctx.stroke();
  ctx.restore();

  const edge = ctx.createLinearGradient(x, 0, x + w, 0);
  edge.addColorStop(0, THEME.cyan);
  edge.addColorStop(0.5, THEME.violet);
  edge.addColorStop(1, THEME.pink);
  ctx.save();
  glow(ctx, THEME.cyan, 16);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + 1.5);
  ctx.lineTo(x + w, y + 1.5);
  ctx.stroke();
  ctx.restore();
}

/** A floating platform with a glowing top edge and little pulsing end lights. */
export function drawPlatform(ctx: Ctx, pos: Position, sprite: Sprite, time: number): void {
  const { x, y } = pos;
  const { width: w, height: h } = sprite;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const under = ctx.createLinearGradient(0, y + h, 0, y + h + 46);
  under.addColorStop(0, 'rgba(61,232,255,0.2)');
  under.addColorStop(1, 'rgba(61,232,255,0)');
  ctx.fillStyle = under;
  ctx.fillRect(x + 4, y + h, w - 8, 46);
  ctx.restore();

  const body = ctx.createLinearGradient(0, y, 0, y + h);
  body.addColorStop(0, '#4636a8');
  body.addColorStop(1, '#1a1450');
  ctx.fillStyle = body;
  roundRectPath(ctx, x, y, w, h, 4);
  ctx.fill();

  ctx.save();
  glow(ctx, THEME.cyan, 12);
  ctx.strokeStyle = THEME.cyan;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 1.5);
  ctx.lineTo(x + w - 4, y + 1.5);
  ctx.stroke();
  ctx.restore();

  const pulse = 0.55 + 0.45 * Math.sin(time * 3 + x * 0.05);
  ctx.save();
  glow(ctx, THEME.pink, 8);
  ctx.fillStyle = THEME.pink;
  ctx.globalAlpha = pulse;
  for (const lx of [x + 7, x + w - 7]) {
    ctx.beginPath();
    ctx.arc(lx, y + h / 2 + 1, 1.8, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** A spinning, bobbing gold coin with a soft glow. */
export function drawCoin(ctx: Ctx, pos: Position, sprite: Sprite, time: number): void {
  const { width: w, height: h } = sprite;
  const phase = time * 4 + pos.x * 0.05;
  const cx = pos.x + w / 2;
  const cy = pos.y + h / 2 + Math.sin(time * 3 + pos.x * 0.05) * 3;
  const rx = Math.max(1.5, Math.abs(Math.cos(phase)) * (w / 2));

  ctx.save();
  ctx.globalAlpha = sprite.alpha;
  glow(ctx, 'rgba(255,200,61,0.9)', 14 + 4 * Math.sin(time * 5 + pos.x));
  const fill = ctx.createRadialGradient(cx - rx * 0.3, cy - h * 0.25, 1, cx, cy, h / 2);
  fill.addColorStop(0, '#fff3b0');
  fill.addColorStop(0.5, THEME.gold);
  fill.addColorStop(1, '#d98a00');
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, h / 2, 0, 0, TAU);
  ctx.fill();
  noGlow(ctx);
  if (rx > 5) {
    ctx.strokeStyle = 'rgba(166,98,0,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.58, h * 0.3, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

/** A wobbling red blob with angry eyes that look where it is walking. */
export function drawEnemy(ctx: Ctx, pos: Position, sprite: Sprite, dir: number, time: number): void {
  const { width: w, height: h } = sprite;
  const wobble = Math.sin(time * 9 + pos.x * 0.03);

  ctx.save();
  ctx.globalAlpha = sprite.alpha;
  ctx.translate(pos.x + w / 2, pos.y + h);
  ctx.scale(1 + 0.07 * wobble, 1 - 0.07 * wobble);

  glow(ctx, 'rgba(255,90,95,0.85)', 18);
  const body = ctx.createLinearGradient(0, -h, 0, 0);
  body.addColorStop(0, '#ff8a7a');
  body.addColorStop(1, '#d42b47');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(-w / 2, -h * 0.45);
  ctx.bezierCurveTo(-w / 2, -h * 1.2, w / 2, -h * 1.2, w / 2, -h * 0.45);
  ctx.lineTo(w / 2, 0);
  ctx.closePath();
  ctx.fill();
  noGlow(ctx);

  const eyeY = -h * 0.52;
  for (const ex of [-5.5, 5.5]) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex + dir * 1.2, eyeY, 4, 4.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a0614';
    ctx.beginPath();
    ctx.arc(ex + dir * 2.8, eyeY + 0.5, 1.9, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = '#4a0a1a';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-10, eyeY - 6.5);
  ctx.lineTo(-2.5, eyeY - 3.5);
  ctx.moveTo(10, eyeY - 6.5);
  ctx.lineTo(2.5, eyeY - 3.5);
  ctx.stroke();
  ctx.restore();
}

/** The player: a little robot with a glowing visor, squash and stretch, and a blinking antenna. */
export function drawPlayer(
  ctx: Ctx,
  pos: Position,
  sprite: Sprite,
  dir: number,
  squash: Squash,
  time: number,
): void {
  const { width: w, height: h } = sprite;

  ctx.save();
  ctx.globalAlpha = sprite.alpha;
  ctx.translate(pos.x + w / 2, pos.y + h);
  ctx.scale(squash.scaleX, squash.scaleY);

  glow(ctx, 'rgba(94,231,200,0.75)', 16);
  const body = ctx.createLinearGradient(0, -h, 0, 0);
  body.addColorStop(0, '#9ff7e0');
  body.addColorStop(1, '#2fb59a');
  ctx.fillStyle = body;
  roundRectPath(ctx, -w / 2, -h, w, h, 7);
  ctx.fill();
  noGlow(ctx);

  ctx.fillStyle = THEME.ink;
  roundRectPath(ctx, -w / 2 + 3 + dir, -h + 7, w - 6, 13, 5);
  ctx.fill();

  const blink = time % 3.4 < 0.12;
  glow(ctx, THEME.cyan, 8);
  ctx.fillStyle = THEME.cyan;
  for (const ex of [-5, 5]) {
    ctx.beginPath();
    ctx.ellipse(ex + dir * 2.5, -h + 13.5, 2.3, blink ? 0.5 : 3.3, 0, 0, TAU);
    ctx.fill();
  }
  noGlow(ctx);

  ctx.fillStyle = 'rgba(11,8,48,0.3)';
  roundRectPath(ctx, -w / 2 + 4, -9, w - 8, 4, 2);
  ctx.fill();

  ctx.strokeStyle = '#2fb59a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.lineTo(0, -h - 6);
  ctx.stroke();
  glow(ctx, THEME.pink, 10);
  ctx.fillStyle = THEME.pink;
  ctx.beginPath();
  ctx.arc(0, -h - 7, 2.2 + 0.6 * Math.sin(time * 6), 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** The goal pole: a glowing rod, a pulsing orb and a beam of light to spot it from far away. */
export function drawPole(ctx: Ctx, pos: Position, sprite: Sprite, time: number): void {
  const topX = pos.x + sprite.width / 2;
  const topY = pos.y;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const beam = ctx.createLinearGradient(0, topY - 120, 0, topY);
  beam.addColorStop(0, 'rgba(94,231,200,0)');
  beam.addColorStop(1, `rgba(94,231,200,${0.22 + 0.08 * Math.sin(time * 3)})`);
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(topX - 3, topY);
  ctx.lineTo(topX + 3, topY);
  ctx.lineTo(topX + 24, topY - 120);
  ctx.lineTo(topX - 24, topY - 120);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  glow(ctx, THEME.mint, 10);
  ctx.fillStyle = '#e9f7ff';
  ctx.fillRect(pos.x, pos.y, sprite.width, sprite.height);
  ctx.fillStyle = THEME.mint;
  ctx.beginPath();
  ctx.arc(topX, topY - 3, 4.5 + 0.7 * Math.sin(time * 5), 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** The goal banner, rippling like a flag in the wind. */
export function drawBanner(ctx: Ctx, pos: Position, sprite: Sprite, time: number): void {
  const steps = 10;
  const top: [number, number][] = [];
  const bottom: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = pos.x + sprite.width * t;
    const y = pos.y + Math.sin(time * 6 - i * 0.7) * 2.2 * t;
    top.push([x, y]);
    bottom.push([x, y + sprite.height * (1 - 0.5 * t)]);
  }

  ctx.save();
  glow(ctx, THEME.mint, 10);
  const fill = ctx.createLinearGradient(pos.x, 0, pos.x + sprite.width, 0);
  fill.addColorStop(0, THEME.mint);
  fill.addColorStop(1, THEME.cyan);
  ctx.fillStyle = fill;
  ctx.beginPath();
  top.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  for (let i = bottom.length - 1; i >= 0; i--) {
    const point = bottom[i];
    if (point) ctx.lineTo(point[0], point[1]);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** A glowing spark that shrinks and fades as it ages. */
export function drawParticle(ctx: Ctx, pos: Position, particle: Particle): void {
  const age = Math.max(0, particle.life / particle.maxLife);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.min(1, age * 1.4);
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, Math.max(0.4, particle.size * (0.35 + 0.65 * age)), 0, TAU);
  ctx.fill();
  ctx.restore();
}
