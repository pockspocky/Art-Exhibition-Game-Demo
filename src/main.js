import { Start } from './scenes/Start.js';
import { Tetris } from './scenes/tetris.js';
import { Abirds } from './scenes/angrybirds.js';

const config = {
    type: Phaser.AUTO,
  physics: {
    default: "matter",
    matter: {
         enabled: true,
         positionIterations: 6,
         velocityIterations: 4,
         constraintIterations: 2,
         enableSleeping: false,
         plugins: {
             attractors: false,
             wrap: false,
         },
         gravity: {
             x: 0,
             y: 0.8,
         },
        //  setBounds: {
        //      x: 0,
        //      y: 0,
        //      width: 1000,
        //      height: 600,
        //      thickness: 64,
        //      left: true,
        //      right: true,
        //      top: true,
        //      bottom: true,
        //  },
         timing: {
             timestamp: 0,
             timeScale: 1,
         },
         correction: 1,
         getDelta: (function() { return 1000 / 60; }),
         autoUpdate: true,
         debug: false
    },
  },
    title: 'Overlord Rising',
    description: '',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#f0f0f0ff',
    pixelArt: false,
    scene: [
        Start,
        Tetris,
        Abirds
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
            
