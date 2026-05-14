import Phaser from 'phaser';
import { type BirdState, type PhysicsConstants, step } from '../core/birdPhysics';

const STARTING_BIRD_STATE: BirdState = {
  position: { x: 270, y: 240 },
  velocity: { x: 0, y: 0 },
};

const PHYSICS_CONSTANTS: PhysicsConstants = {
  gravity: 1500,
};

const BIRD_SIZE = 48;
const BIRD_COLOR = 0xffffff;

export class MainScene extends Phaser.Scene {
  private birdState: BirdState = STARTING_BIRD_STATE;
  private birdSprite!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    this.birdState = {
      position: { ...STARTING_BIRD_STATE.position },
      velocity: { ...STARTING_BIRD_STATE.velocity },
    };

    this.birdSprite = this.add
      .rectangle(
        this.birdState.position.x,
        this.birdState.position.y,
        BIRD_SIZE,
        BIRD_SIZE,
        BIRD_COLOR
      )
      .setOrigin(0.5);

    this.publishBirdY();

    // Mark the canvas as ready so headless tests can wait deterministically.
    this.game.canvas.setAttribute('data-phaser-ready', 'true');
  }

  override update(_time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;
    this.birdState = step(this.birdState, dt, PHYSICS_CONSTANTS);
    this.birdSprite.setPosition(this.birdState.position.x, this.birdState.position.y);
    this.publishBirdY();
  }

  private publishBirdY(): void {
    // Headless tests read this to assert the bird's vertical position deterministically.
    this.game.canvas.setAttribute('data-bird-y', String(Math.round(this.birdState.position.y)));
  }
}
