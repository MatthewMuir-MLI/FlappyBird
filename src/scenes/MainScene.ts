import Phaser from 'phaser';
import { flap } from '../core/flight';
import {
  type GameConstants,
  type GameState,
  initialGameState,
  step as stepGame,
} from '../core/gameState';

const CANVAS_WIDTH = 540;
const CANVAS_HEIGHT = 960;

const BIRD_START = { x: 270, y: 240 };
const BIRD_SIZE = 48;
const BIRD_COLOR = 0xffffff;

const PIPE_WIDTH = 80;
const PIPE_GAP_HEIGHT = 270;
const PIPE_COLOR = 0x2e8b57;

// World scrolls 1 second before the first pipe enters the canvas so the player
// isn't forced to react immediately on start.
const FIRST_PIPE_DELAY_PX = 400;

const CONSTANTS: GameConstants = {
  gravity: 1500,
  pipeSpeed: 400,
  pipeSpawnDistance: 500,
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
  pipeWidth: PIPE_WIDTH,
  pipeGapHeight: PIPE_GAP_HEIGHT,
  pipeGapYMin: 200,
  pipeGapYMax: 760,
};

interface PipeSpritePair {
  top: Phaser.GameObjects.Rectangle;
  bottom: Phaser.GameObjects.Rectangle;
}

export class MainScene extends Phaser.Scene {
  private gameState!: GameState;
  private birdSprite!: Phaser.GameObjects.Rectangle;
  private scoreText!: Phaser.GameObjects.Text;
  private pipeSprites = new Map<number, PipeSpritePair>();
  private birdFrame = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    this.gameState = initialGameState(
      {
        position: { ...BIRD_START },
        velocity: { x: 0, y: 0 },
      },
      FIRST_PIPE_DELAY_PX
    );
    this.birdFrame = 0;
    this.pipeSprites.clear();

    this.birdSprite = this.add
      .rectangle(
        this.gameState.bird.position.x,
        this.gameState.bird.position.y,
        BIRD_SIZE,
        BIRD_SIZE,
        BIRD_COLOR
      )
      .setOrigin(0.5);
    this.scoreText = this.add
      .text(CANVAS_WIDTH / 2, 24, '0', {
        fontFamily: 'Arial',
        fontSize: '64px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

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
    this.syncPipeSprites();
    this.scoreText.setText(String(this.gameState.score));

    this.birdFrame += 1;
    this.syncCanvasState();
  }

  private syncPipeSprites(): void {
    const activeIds = new Set<number>();
    for (const pipe of this.gameState.pipes) {
      activeIds.add(pipe.id);
      let pair = this.pipeSprites.get(pipe.id);
      if (!pair) {
        pair = {
          top: this.add
            .rectangle(pipe.top.x, pipe.top.y, pipe.top.width, pipe.top.height, PIPE_COLOR)
            .setOrigin(0, 0),
          bottom: this.add
            .rectangle(
              pipe.bottom.x,
              pipe.bottom.y,
              pipe.bottom.width,
              pipe.bottom.height,
              PIPE_COLOR
            )
            .setOrigin(0, 0),
        };
        this.pipeSprites.set(pipe.id, pair);
      }
      pair.top.setPosition(pipe.top.x, pipe.top.y);
      pair.bottom.setPosition(pipe.bottom.x, pipe.bottom.y);
    }

    for (const [id, pair] of this.pipeSprites) {
      if (!activeIds.has(id)) {
        pair.top.destroy();
        pair.bottom.destroy();
        this.pipeSprites.delete(id);
      }
    }
  }

  private syncCanvasState(): void {
    this.game.canvas.setAttribute(
      'data-bird-y',
      String(Math.round(this.gameState.bird.position.y))
    );
    this.game.canvas.setAttribute('data-bird-frame', String(this.birdFrame));
    this.game.canvas.setAttribute('data-game-over', this.gameState.gameOver ? 'true' : 'false');
    this.game.canvas.setAttribute('data-pipe-count', String(this.gameState.pipes.length));
    this.game.canvas.setAttribute('data-score-text', this.scoreText.text);
  }
}
