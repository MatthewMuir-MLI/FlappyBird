import Phaser from 'phaser';
import { type BirdState, createBirdState, flap, tickBird } from '../core/flight';
import { GameInfo } from '../core/gameInfo';

export class MainScene extends Phaser.Scene {
  private bird!: Phaser.GameObjects.Arc;
  private birdState!: BirdState;
  private birdFrame = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2, GameInfo.Title, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.birdState = createBirdState(height / 2);
    this.bird = this.add.circle(width / 2, this.birdState.y, 24, 0xffe066);

    const flapAction = (): void => {
      this.birdState = flap(this.birdState);
    };

    this.input.on('pointerdown', flapAction);
    this.input.keyboard?.on('keydown-SPACE', flapAction);
    this.input.keyboard?.on('keydown-Z', flapAction);

    // Mark the canvas as ready so headless tests can wait on it deterministically.
    this.game.canvas.setAttribute('data-phaser-ready', 'true');
    this.syncCanvasState();
  }

  update(_time: number, delta: number): void {
    this.birdState = tickBird(this.birdState, delta / 1000);
    this.bird.setY(this.birdState.y);
    this.birdFrame += 1;
    this.syncCanvasState();
  }

  private syncCanvasState(): void {
    this.game.canvas.setAttribute('data-bird-y', this.birdState.y.toFixed(3));
    this.game.canvas.setAttribute('data-bird-frame', String(this.birdFrame));
  }
}
