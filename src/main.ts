import { GameLoop } from './engine/GameLoop';
import { Keyboard } from './engine/Keyboard';
import { createWorld } from './game/level';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
const ctx = canvas?.getContext('2d');
if (!canvas || !ctx) throw new Error('Canvas 2D is not available in this browser');

const context: CanvasRenderingContext2D = ctx;
const keys = new Keyboard();
let loop: GameLoop | undefined;

/** Starts a brand new game. Restarting simply builds a fresh world. */
function start(): void {
  loop?.stop();
  loop = new GameLoop(createWorld({ ctx: context, keys, onRestart: start }));
  loop.start();
}

// Canvas text needs the web font to be ready before the first frame. If it is slow
// or offline, start anyway after a moment and fall back to the system font.
const fontsReady = Promise.race([
  Promise.all([
    document.fonts.load('500 16px "Orbitron"'),
    document.fonts.load('700 16px "Orbitron"'),
    document.fonts.load('900 16px "Orbitron"'),
  ]),
  new Promise((resolve) => setTimeout(resolve, 1500)),
]).catch(() => undefined);

void fontsReady.then(start);
