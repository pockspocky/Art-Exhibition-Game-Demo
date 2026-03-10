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
         debug: false,
         debug: {
             showAxes: false,
             showAngleIndicator: false,
             angleColor: 0xe81153,
             showBroadphase: false,
             broadphaseColor: 0xffb400,
             showBounds: false,
             boundsColor: 0xffffff,
             showVelocity: false,
             velocityColor: 0x00aeef,
             showCollisions: false,
             collisionColor: 0xf5950c,
             showSeparations: false,
             separationColor: 0xffa500,
             showBody: false, // toggle hitbox
             showStaticBody: false, // toggle hitbox
             showInternalEdges: false,
             renderFill: false,
             renderLine: true,
             fillColor: 0x106909,
             fillOpacity: 1,
             lineColor: 0x28de19,
             lineOpacity: 1,
             lineThickness: 1,
             staticFillColor: 0x0d177b,
             staticLineColor: 0x1327e4,
             showSleeping: false,
             staticBodySleepOpacity: 0.7,
             sleepFillColor: 0x464646,
             sleepLineColor: 0x999a99,
             showSensors: true,
             sensorFillColor: 0x0d177b,
             sensorLineColor: 0x1327e4,
             showPositions: true,
             positionSize: 4,
             positionColor: 0xe042da,
             showJoint: true,
             jointColor: 0xe0e042,
             jointLineOpacity: 1,
             jointLineThickness: 2,
             pinSize: 4,
             pinColor: 0x42e0e0,
             springColor: 0xe042e0,
             anchorColor: 0xefefef,
             anchorSize: 4,
             showConvexHulls: false,
             hullColor: 0xd703d0
         }
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
            