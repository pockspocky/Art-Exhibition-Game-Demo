export class Tetris extends Phaser.Scene {

    constructor() {
        super('Tetris');
    }

    preload() {
        this.load.image('background', 'assets/space.png');
        this.load.image('logo', 'assets/phaser.png');

        //  The ship sprite is CC0 from https://ansimuz.itch.io - check out his other work!
        this.load.spritesheet('ship', 'assets/spaceship.png', { frameWidth: 176, frameHeight: 96 });
    }

    create() {
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');

        const logo = this.add.image(640, 200, 'logo');

        const ship = this.add.sprite(640, 360, 'ship');

        ship.anims.create({
            key: 'fly',
            frames: this.anims.generateFrameNumbers('ship', { start: 0, end: 2 }),
            frameRate: 15,
            repeat: -1
        });

        ship.play('fly');

        // Spaceship moves in a clockwise circle
        const shipCircle = { angle: 0 };
        this.tweens.add({
            targets: shipCircle,
            angle: Math.PI * 4,
            duration: 3000,
            ease: 'Linear',
            repeat: -1,
            onUpdate: () => {
                const radius = 150;
                ship.x = 640 + Math.cos(shipCircle.angle) * radius;
                ship.y = 360 + Math.sin(shipCircle.angle) * radius;
            }
        });

        // Logo moves in a counter-clockwise circle
        const logoCircle = { angle: 0 };
        this.tweens.add({
            targets: logoCircle,
            angle: -Math.PI * 4,
            duration: 3000,
            ease: 'Linear',
            repeat: -1,
            onUpdate: () => {
                const radius = 150;
                logo.x = 640 + Math.cos(logoCircle.angle) * radius;
                logo.y = 360 + Math.sin(logoCircle.angle) * radius;
            }
        });
    }

    update() {
        this.background.tilePositionX += 2;
    }
    
}
