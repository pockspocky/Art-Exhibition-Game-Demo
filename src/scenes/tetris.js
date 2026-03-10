export class Tetris extends Phaser.Scene {

    constructor() {
        super('Tetris');
    }

    preload() {
        this.load.image('background1', 'assets/Background1.png');
        this.load.image('logo', 'assets/phaser.png');
        this.load.image('block0', 'assets/TetrisBlocks/BlockSprite0.png')
        this.load.image('block1', 'assets/TetrisBlocks/BlockSprite1.png')
        this.load.image('block2', 'assets/TetrisBlocks/BlockSprite2.png')
        this.load.image('block3', 'assets/TetrisBlocks/BlockSprite3.png')
        this.load.image('block4', 'assets/TetrisBlocks/BlockSprite4.png')
        this.load.image('block5', 'assets/TetrisBlocks/BlockSprite5.png')
        this.load.image('block6', 'assets/TetrisBlocks/BlockSprite6.png')
        this.load.image('ground', 'assets/TetrisBlocks/Ground.png')

        //  The ship sprite is CC0 from https://ansimuz.itch.io - check out his other work!
        this.load.spritesheet('ship', 'assets/spaceship.png', { frameWidth: 176, frameHeight: 96 });
    }

    create() {

        const background = this.make.image({
            x: 0,
            y: 0,
            key: 'background1',
            scale : {
               x: 2.3,
               y: 2.3
            },
            origin: {x: 0, y: 0},
            add: true
        });

        // Game state
        this.currentBlock = null;
        this.isDropping = false;
        this.blockArr = [];
        this.horizontalSpeed = 200;
        this.movingRight = true;

        const ground = this.matter.add.sprite(640, 700, 'ground').setScale(10, 1).setStatic(true).setBounce(0.7);

        // UI Text buttons
        const spinText = this.add.text(100, 50, 'Spin', {
            fontSize: '48px',
            color: '#000000',
            fontStyle: 'bold'
        }).setInteractive();

        const dropText = this.add.text(1100, 50, 'Drop', {
            fontSize: '48px',
            color: '#000000',
            fontStyle: 'bold'
        }).setInteractive();

        // Spin button interaction
        spinText.on('pointerdown', () => {
            if (this.currentBlock && !this.isDropping) {
                this.rotateBlock();
            }
        });

        // Drop button interaction
        dropText.on('pointerdown', () => {
            if (this.currentBlock && !this.isDropping) {
                this.dropBlock();
            }
        });

        // Pointer input (for clicking anywhere else)
        this.input.on('pointerdown', (pointer) => {
            // Only drop if not clicking on the text buttons
            if (this.currentBlock && !this.isDropping) {
                const clickedOnButton = spinText.getBounds().contains(pointer.x, pointer.y) || 
                                       dropText.getBounds().contains(pointer.x, pointer.y);
                if (!clickedOnButton) {
                    this.dropBlock();
                }
            }
        });

        // Keyboard input for rotation
        this.input.keyboard.on('keydown-R', () => {
            if (this.currentBlock && !this.isDropping) {
                this.rotateBlock();
            }
        });

        // Start the first block
        this.spawnBlock();
    }

    spawnBlock() {
        const blockType = Math.floor(Math.random() * 7);    
        this.currentBlock = this.matter.add.sprite(640, 100, `block${blockType}`);
        this.currentBlock.setStatic(true);
        this.currentBlock.setBounce(0.7);
        this.blockArr.push(this.currentBlock);
        this.isDropping = false;
        this.movingRight = true;
    }

    rotateBlock() {
        this.currentBlock.angle += 90;
    }

    dropBlock() {
        this.isDropping = true;
        this.currentBlock.setStatic(false);
        this.currentBlock.setVelocityX(0);
        
        // Wait for block to settle before spawning next one
        this.time.delayedCall(2000, () => {
            this.spawnBlock();
        });
    }

    update() {
        if (this.currentBlock && !this.isDropping) {
            // Move block horizontally
            if (this.movingRight) {
                this.currentBlock.x += this.horizontalSpeed * (1/60);
                if (this.currentBlock.x >= 1200) {
                    this.movingRight = false;
                }
            } else {
                this.currentBlock.x -= this.horizontalSpeed * (1/60);
                if (this.currentBlock.x <= 80) {
                    this.movingRight = true;
                }
            }
        }
    }
}