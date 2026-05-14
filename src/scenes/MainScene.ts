import Phaser from 'phaser';
import { GameInfo } from '../core/gameInfo';

export class MainScene extends Phaser.Scene {
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

    // Mark the canvas as ready so headless tests can wait on it deterministically.
    this.game.canvas.setAttribute('data-phaser-ready', 'true');
  }
}
