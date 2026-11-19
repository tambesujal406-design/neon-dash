import { THEME } from './theme';

interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
  speed: number;
}

interface Firefly {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  color: string;
}

interface Layer {
  image: HTMLCanvasElement;
  factor: number;
  margin: number;
}

interface CityStyle {
  color: string;
  rim: string;
  minHeight: number;
  maxHeight: number;
  lit: number;
  windowAlpha: number;
}

const WINDOW_COLORS = ['#ffb86b', '#5ee7ff', '#ff7ab6'];
const TAU = Math.PI * 2;

/** Small seeded random generator, so the scenery looks the same every time. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The night scene behind the game: gradient sky, twinkling stars, a moon, a shooting
 * star, three parallax layers (mountains and two city skylines) and drifting fireflies.
 * The layers are drawn once to hidden canvases and then just slide as the player moves.
 */
export class Background {
  private readonly stars: Star[];
  private readonly fireflies: Firefly[];
  private readonly layers: Layer[];
  private sky: CanvasGradient | undefined;

  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly groundY: number,
  ) {
    const rand = seeded(7);
    this.stars = Array.from({ length: 90 }, () => ({
      x: rand() * width,
      y: rand() * groundY * 0.62,
      size: 0.8 + rand() * 1.4,
      phase: rand() * TAU,
      speed: 0.8 + rand() * 2.2,
    }));
    const colors = [THEME.pink, THEME.cyan, THEME.gold];
    this.fireflies = Array.from({ length: 16 }, (_, i) => ({
      x: rand() * width,
      y: groundY - 40 - rand() * 220,
      r: 1.5 + rand() * 1.5,
      phase: rand() * TAU,
      speed: 0.3 + rand() * 0.5,
      color: colors[i % colors.length] ?? THEME.cyan,
    }));
    this.layers = [
      this.buildMountains(0.06, 11),
      this.buildCity(0.14, 23, {
        color: '#17114a',
        rim: 'rgba(139,108,255,0.5)',
        minHeight: 70,
        maxHeight: 160,
        lit: 0.22,
        windowAlpha: 0.75,
      }),
      this.buildCity(0.26, 37, {
        color: '#0e0a30',
        rim: 'rgba(61,232,255,0.4)',
        minHeight: 40,
        maxHeight: 110,
        lit: 0.12,
        windowAlpha: 0.6,
      }),
    ];
  }

  draw(ctx: CanvasRenderingContext2D, time: number, focusX: number): void {
    const { width, height, groundY } = this;

    if (!this.sky) {
      const sky = ctx.createLinearGradient(0, 0, 0, groundY);
      sky.addColorStop(0, THEME.skyTop);
      sky.addColorStop(0.55, THEME.skyMid);
      sky.addColorStop(1, THEME.skyLow);
      this.sky = sky;
    }
    ctx.fillStyle = this.sky;
    ctx.fillRect(-40, -40, width + 80, groundY + 40);
    ctx.fillStyle = THEME.skyLow;
    ctx.fillRect(-40, groundY, width + 80, height - groundY + 40);

    const horizon = ctx.createRadialGradient(width / 2, groundY, 10, width / 2, groundY, 470);
    horizon.addColorStop(0, 'rgba(255,77,141,0.42)');
    horizon.addColorStop(0.5, 'rgba(139,108,255,0.14)');
    horizon.addColorStop(1, 'rgba(139,108,255,0)');
    ctx.fillStyle = horizon;
    ctx.fillRect(-40, -40, width + 80, groundY + 40);

    this.drawStars(ctx, time);
    this.drawShootingStar(ctx, time);
    this.drawMoon(ctx);

    for (const layer of this.layers) {
      const shift = -(focusX - width / 2) * layer.factor;
      ctx.drawImage(layer.image, -layer.margin + shift, 0);
    }

    this.drawFireflies(ctx, time);
  }

  private drawStars(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.fillStyle = '#ffffff';
    for (const star of this.stars) {
      ctx.globalAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * star.speed + star.phase));
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;
  }

  private drawShootingStar(ctx: CanvasRenderingContext2D, time: number): void {
    const t = (time % 9) / 0.8;
    if (t >= 1) return;
    const x = 140 + t * 280;
    const y = 30 + t * 120;
    const tail = ctx.createLinearGradient(x - 70, y - 30, x, y);
    tail.addColorStop(0, 'rgba(255,255,255,0)');
    tail.addColorStop(1, `rgba(255,255,255,${1 - t})`);
    ctx.strokeStyle = tail;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 70, y - 30);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  private drawMoon(ctx: CanvasRenderingContext2D): void {
    const mx = this.width * 0.8;
    const my = 118;
    const halo = ctx.createRadialGradient(mx, my, 20, mx, my, 150);
    halo.addColorStop(0, 'rgba(244,239,230,0.28)');
    halo.addColorStop(1, 'rgba(244,239,230,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(mx - 150, my - 150, 300, 300);

    const disc = ctx.createLinearGradient(mx - 40, my - 40, mx + 40, my + 40);
    disc.addColorStop(0, '#fffaf0');
    disc.addColorStop(1, '#cfc9e6');
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(mx, my, 42, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(120,110,160,0.25)';
    for (const [dx, dy, r] of [
      [-14, -10, 8],
      [12, 8, 11],
      [-6, 18, 5],
    ] as const) {
      ctx.beginPath();
      ctx.arc(mx + dx, my + dy, r, 0, TAU);
      ctx.fill();
    }
  }

  private drawFireflies(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const fly of this.fireflies) {
      const x = fly.x + Math.sin(time * fly.speed + fly.phase) * 34;
      const y = fly.y + Math.cos(time * fly.speed * 1.3 + fly.phase) * 18;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, fly.r * 5);
      glow.addColorStop(0, fly.color);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time * 2 + fly.phase);
      ctx.fillStyle = glow;
      ctx.fillRect(x - fly.r * 5, y - fly.r * 5, fly.r * 10, fly.r * 10);
    }
    ctx.restore();
  }

  private makeLayer(factor: number): { image: HTMLCanvasElement; c: CanvasRenderingContext2D; margin: number } {
    const margin = Math.ceil((this.width * factor) / 2) + 12;
    const image = document.createElement('canvas');
    image.width = this.width + margin * 2;
    image.height = this.groundY;
    const c = image.getContext('2d');
    if (!c) throw new Error('Canvas 2D is not available in this browser');
    return { image, c, margin };
  }

  private buildMountains(factor: number, seed: number): Layer {
    const { image, c, margin } = this.makeLayer(factor);
    const rand = seeded(seed);
    const w = image.width;
    const h = image.height;

    const points: [number, number][] = [];
    for (let x = 0; x <= w; x += 20) {
      const y =
        h -
        70 -
        55 * (0.5 + 0.5 * Math.sin(x * 0.011 + 1.3)) -
        45 * (0.5 + 0.5 * Math.sin(x * 0.027 + 2.1)) -
        rand() * 8;
      points.push([x, y]);
    }

    const fill = c.createLinearGradient(0, h - 210, 0, h);
    fill.addColorStop(0, '#34227a');
    fill.addColorStop(1, '#150f3d');
    c.fillStyle = fill;
    c.beginPath();
    c.moveTo(0, h);
    for (const [x, y] of points) c.lineTo(x, y);
    c.lineTo(w, h);
    c.closePath();
    c.fill();

    c.strokeStyle = 'rgba(160,120,255,0.35)';
    c.lineWidth = 1.5;
    c.beginPath();
    points.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
    c.stroke();

    return { image, factor, margin };
  }

  private buildCity(factor: number, seed: number, style: CityStyle): Layer {
    const { image, c, margin } = this.makeLayer(factor);
    const rand = seeded(seed);
    const w = image.width;
    const h = image.height;

    let x = -10;
    while (x < w) {
      const bw = 26 + rand() * 44;
      const bh = style.minHeight + rand() * (style.maxHeight - style.minHeight);

      c.fillStyle = style.color;
      c.fillRect(x, h - bh, bw, bh);
      c.fillStyle = style.rim;
      c.fillRect(x, h - bh, bw, 1.5);

      for (let wy = h - bh + 8; wy < h - 6; wy += 11) {
        for (let wx = x + 5; wx < x + bw - 6; wx += 9) {
          if (rand() >= style.lit) continue;
          c.globalAlpha = style.windowAlpha * (0.5 + rand() * 0.5);
          c.fillStyle = WINDOW_COLORS[Math.floor(rand() * WINDOW_COLORS.length)] ?? '#ffb86b';
          c.fillRect(wx, wy, 3, 5);
        }
      }
      c.globalAlpha = 1;

      if (rand() < 0.25) {
        c.fillStyle = style.color;
        c.fillRect(x + bw / 2 - 1, h - bh - 14, 2, 14);
        c.fillStyle = THEME.danger;
        c.fillRect(x + bw / 2 - 1.5, h - bh - 16, 3, 3);
      }

      x += bw + (rand() < 0.35 ? 4 + rand() * 10 : 0);
    }

    return { image, factor, margin };
  }
}
