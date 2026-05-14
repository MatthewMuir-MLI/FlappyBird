import Phaser from 'phaser';
import { type AudioPlayer, flapWithAudio, playTransitionAudio } from '../core/audioEvents';
import {
  type Cloud,
  type CloudParallaxConstants,
  initialClouds,
  stepClouds,
} from '../core/cloudParallax';
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

const PIPE_WIDTH = 80;
const PIPE_GAP_HEIGHT = 270;

const CLOUD_COUNT = 3;
const CLOUD_DISPLAY_WIDTH = 200;
const CLOUD_DISPLAY_HEIGHT = 130;
const CLOUD_PARALLAX: CloudParallaxConstants = {
  speed: 30, // ~7.5% of pipe speed — distant-parallax feel
  canvasWidth: CANVAS_WIDTH,
  cloudWidth: CLOUD_DISPLAY_WIDTH,
};

const SPRITE_KEYS = ['bird', 'pipe', 'cloud'] as const;
const AUDIO_KEYS = {
  flap: 'audio-flap',
  score: 'audio-score',
  hit: 'audio-hit',
} as const;
const AUDIO_VOLUMES = {
  flap: 0.3,
  score: 0.35,
  hit: 0.4,
} as const;

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
  top: Phaser.GameObjects.Image;
  bottom: Phaser.GameObjects.Image;
}

export class MainScene extends Phaser.Scene {
  private gameState!: GameState;
  private birdSprite!: Phaser.GameObjects.Image;
  private scoreText!: Phaser.GameObjects.Text;
  private pipeSprites = new Map<number, PipeSpritePair>();
  private birdFrame = 0;
  private clouds: Cloud[] = [];
  private cloudSprites: Phaser.GameObjects.Image[] = [];
  private audioPlayer!: AudioPlayer;
  private audioReady = false;
  private audioGestureSeen = false;
  private audioCallCounts = { flap: 0, score: 0, hit: 0 };

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // Vite rewrites import.meta.env.BASE_URL to '/' in dev and '/FlappyBird/'
    // in production (set in vite.config.ts). Both match where Pages serves
    // the public/ directory contents.
    const base = import.meta.env.BASE_URL;
    this.load.image('bird', `${base}assets/bird.png`);
    this.load.image('pipe', `${base}assets/pipe.png`);
    this.load.image('cloud', `${base}assets/cloud.png`);
    this.load.audio(AUDIO_KEYS.flap, `${base}assets/audio/flap.wav`);
    this.load.audio(AUDIO_KEYS.score, `${base}assets/audio/score.wav`);
    this.load.audio(AUDIO_KEYS.hit, `${base}assets/audio/hit.wav`);
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
    this.audioReady = false;
    this.audioGestureSeen = false;
    this.audioCallCounts = { flap: 0, score: 0, hit: 0 };
    this.audioPlayer = {
      flap: () => {
        this.audioCallCounts.flap += 1;
        this.sound.play(AUDIO_KEYS.flap, { volume: AUDIO_VOLUMES.flap });
      },
      score: () => {
        this.audioCallCounts.score += 1;
        this.sound.play(AUDIO_KEYS.score, { volume: AUDIO_VOLUMES.score });
      },
      hit: () => {
        this.audioCallCounts.hit += 1;
        this.sound.play(AUDIO_KEYS.hit, { volume: AUDIO_VOLUMES.hit });
      },
    };

    // Clouds first so they paint behind the bird, pipes, and score.
    this.clouds = initialClouds(CANVAS_WIDTH, CANVAS_HEIGHT, CLOUD_COUNT);
    this.cloudSprites = this.clouds.map((cloud) =>
      this.add
        .image(cloud.x, cloud.y, 'cloud')
        .setDisplaySize(CLOUD_DISPLAY_WIDTH, CLOUD_DISPLAY_HEIGHT)
        .setOrigin(0.5)
    );

    this.birdSprite = this.add
      .image(this.gameState.bird.position.x, this.gameState.bird.position.y, 'bird')
      .setDisplaySize(BIRD_SIZE, BIRD_SIZE)
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
      this.audioGestureSeen = true;
      this.sound.unlock();
      this.gameState = { ...this.gameState, bird: flapWithAudio(this.gameState.bird, this.audioPlayer) };
    };

    this.input.on('pointerdown', flapAction);
    this.input.keyboard?.on('keydown-SPACE', flapAction);
    this.input.keyboard?.on('keydown-Z', flapAction);

    this.game.canvas.setAttribute('data-phaser-ready', 'true');
    this.game.canvas.setAttribute(
      'data-sprites-loaded',
      SPRITE_KEYS.every((key) => this.textures.exists(key)) ? 'true' : 'false'
    );
    this.syncCanvasState();
  }

  override update(_time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;
    const previousState = this.gameState;
    const nextState = stepGame(previousState, dt, CONSTANTS);
    playTransitionAudio(previousState, nextState, this.audioPlayer);
    this.gameState = nextState;
    this.clouds = stepClouds(this.clouds, dt, CLOUD_PARALLAX);

    if (this.audioGestureSeen && !this.audioReady && !this.sound.locked) {
      this.audioReady = true;
    }

    this.birdSprite.setPosition(this.gameState.bird.position.x, this.gameState.bird.position.y);
    this.syncPipeSprites();
    this.syncCloudSprites();
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
        // The pipe.png has its cap at the top. For the TOP pipe (extends from
        // the gap upward off-screen-top), flip the texture vertically so the
        // cap sits at the bottom edge facing the gap. The BOTTOM pipe (extends
        // from the gap downward) uses the texture as-is.
        pair = {
          top: this.add
            .image(pipe.top.x, pipe.top.y, 'pipe')
            .setOrigin(0, 0)
            .setDisplaySize(pipe.top.width, pipe.top.height)
            .setFlipY(true),
          bottom: this.add
            .image(pipe.bottom.x, pipe.bottom.y, 'pipe')
            .setOrigin(0, 0)
            .setDisplaySize(pipe.bottom.width, pipe.bottom.height),
        };
        this.pipeSprites.set(pipe.id, pair);
      }
      pair.top.setPosition(pipe.top.x, pipe.top.y).setDisplaySize(pipe.top.width, pipe.top.height);
      pair.bottom
        .setPosition(pipe.bottom.x, pipe.bottom.y)
        .setDisplaySize(pipe.bottom.width, pipe.bottom.height);
    }

    for (const [id, pair] of this.pipeSprites) {
      if (!activeIds.has(id)) {
        pair.top.destroy();
        pair.bottom.destroy();
        this.pipeSprites.delete(id);
      }
    }
  }

  private syncCloudSprites(): void {
    for (let i = 0; i < this.cloudSprites.length; i++) {
      const sprite = this.cloudSprites[i];
      const cloud = this.clouds[i];
      if (sprite && cloud) {
        sprite.setPosition(cloud.x, cloud.y);
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
    this.game.canvas.setAttribute('data-cloud-count', String(this.cloudSprites.length));
    this.game.canvas.setAttribute('data-score-text', this.scoreText.text);
    this.game.canvas.setAttribute('data-audio-ready', this.audioReady ? 'true' : 'false');
    this.game.canvas.setAttribute('data-audio-flap-count', String(this.audioCallCounts.flap));
    this.game.canvas.setAttribute('data-audio-score-count', String(this.audioCallCounts.score));
    this.game.canvas.setAttribute('data-audio-hit-count', String(this.audioCallCounts.hit));
  }
}
