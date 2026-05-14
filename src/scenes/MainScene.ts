import Phaser from 'phaser';
import { flap } from '../core/flight';
import { type GameConstants, type GameState, step as stepGame } from '../core/gameState';
import { spawnPipe } from '../core/pipe';

const CANVAS_WIDTH = 540;
const CANVAS_HEIGHT = 960;

const BIRD_START = { x: 270, y: 240 };
const BIRD_SIZE = 48;
const BIRD_COLOR = 0xffffff;

const PIPE_WIDTH = 80;
const PIPE_GAP_HEIGHT = 270;
const PIPE_GAP_CENTER_Y = 240;
const PIPE_COLOR = 0x2e8b57;

const CONSTANTS: GameConstants = {
  gravity: 1500,
  pipeSpeed: 400,
};

function makeStartingState(): GameState {
  return {
    bird: { position: { ...BIRD_START }, velocity: { x: 0, y: 0 } },
    pipe: spawnPipe({
      x: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
      gapCenterY: PIPE_GAP_CENTER_Y,
      gapHeight: PIPE_GAP_HEIGHT,
      pipeWidth: PIPE_WIDTH,
    }),
    gameOver: false,
  };
}

export class MainScene extends Phaser.Scene {
  private gameState: GameState = makeStartingState();
  private birdSprite!: Phaser.GameObjects.Rectangle;
  private topPipeSprite!: Phaser.GameObjects.Rectangle;
  private bottomPipeSprite!: Phaser.GameObjects.Rectangle;
  private birdFrame = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    this.gameState = makeStartingState();
    this.birdFrame = 0;

    this.birdSprite = this.add
      .rectangle(
        this.gameState.bird.position.x,
        this.gameState.bird.position.y,
        BIRD_SIZE,
        BIRD_SIZE,
        BIRD_COLOR
      )
      .setOrigin(0.5);

    this.topPipeSprite = this.add
      .rectangle(
        this.gameState.pipe.top.x,
        this.gameState.pipe.top.y,
        this.gameState.pipe.top.width,
        this.gameState.pipe.top.height,
        PIPE_COLOR
      )
      .setOrigin(0, 0);

    this.bottomPipeSprite = this.add
      .rectangle(
        this.gameState.pipe.bottom.x,
        this.gameState.pipe.bottom.y,
        this.gameState.pipe.bottom.width,
        this.gameState.pipe.bottom.height,
        PIPE_COLOR
      )
      .setOrigin(0, 0);

    const flapAction = (): void => {
      if (this.gameState.gameOver) return;
      this.gameState = { ...this.gameState, bird: flap(this.gameState.bird) };
    };

    this.input.on('pointerdown', flapAction);
    this.input.keyboard?.on('keydown-SPACE', flapAction);
    this.input.keyboard?.on('keydown-Z', flapAction);

    this.game.canvas.setAttribute('data-phaser-ready', 'true');
    this.syncCanvasState();
  }

  override update(_time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;
    this.gameState = stepGame(this.gameState, dt, CONSTANTS);

    this.birdSprite.setPosition(this.gameState.bird.position.x, this.gameState.bird.position.y);
    this.topPipeSprite.setPosition(this.gameState.pipe.top.x, this.gameState.pipe.top.y);
    this.bottomPipeSprite.setPosition(this.gameState.pipe.bottom.x, this.gameState.pipe.bottom.y);

    this.birdFrame += 1;
    this.syncCanvasState();
  }

  private syncCanvasState(): void {
    this.game.canvas.setAttribute(
      'data-bird-y',
      String(Math.round(this.gameState.bird.position.y))
    );
    this.game.canvas.setAttribute('data-bird-frame', String(this.birdFrame));
    this.game.canvas.setAttribute('data-game-over', this.gameState.gameOver ? 'true' : 'false');
  }
}
