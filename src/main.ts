import Phaser from 'phaser';
import { GameInfo } from './core/gameInfo';
import { MainScene } from './scenes/MainScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 540,
  height: 960,
  parent: 'game-root',
  backgroundColor: '#4a90c8',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainScene],
};

console.info(`${GameInfo.Title} v${GameInfo.Version}`);
new Phaser.Game(config);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL;
    void navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
  });
}
