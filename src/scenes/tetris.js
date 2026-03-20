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
        this.load.image('science_room', 'assets/science_room.png');
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
        this.isMoving = false;
        this.blockArr = [];

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

        // Global pointer down for dropping
        this.input.on('pointerdown', (pointer) => {
            if (this.currentBlock && !this.isDropping) {
                const clickedOnSpin = spinText.getBounds().contains(pointer.x, pointer.y);
                const clickedOnDrop = dropText.getBounds().contains(pointer.x, pointer.y);
                
                if (!clickedOnSpin && !clickedOnDrop) {
                    // Since the block has its own stopPropagation pointerdown,
                    // if this global listener fires, it means we clicked outside buttons and the block.
                    if (this.isMoving) {
                        this.dropBlock();
                    }
                }
            }
        });

        // Global pointer move to handle following
        this.input.on('pointermove', (pointer) => {
            if (this.currentBlock && !this.isDropping && this.isMoving) {
                this.updateBlockPosition(pointer.x);
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
        this.currentBlock.setInteractive(); 
        spawnBlock() {
    // 设定 20% 的概率出现 science_room 方块
    const isSpecial = Math.random() < 0.2; 
    const blockKey = isSpecial ? 'science_room' : `block${Math.floor(Math.random() * 7)}`;
    
    this.currentBlock = this.matter.add.sprite(640, 100, blockKey);
    

    if (isSpecial) {
        this.currentBlock.setData('type', 'explosive');
    }

    this.currentBlock.setStatic(true);
}
// Make it interactive
        
        // Handle specific click on the block
        this.currentBlock.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation(); // Don't trigger the global pointerdown
            if (!this.isDropping) {
                if (!this.isMoving) {
                    this.isMoving = true;
                    this.updateBlockPosition(pointer.x);
                } else {
                    // If already moving and clicked, drop it
                    this.dropBlock();
                }
            }
        });

        this.blockArr.push(this.currentBlock);
        this.isDropping = false;
        this.isMoving = false; // Reset movement
    }

    rotateBlock() {
        this.currentBlock.angle += 90;
    }

    dropBlock() {
        this.isDropping = true;
        this.isMoving = false; // Stop following the pointer
        this.currentBlock.setStatic(false);
        this.currentBlock.setVelocityX(0);
        
        // Wait for block to settle before spawning next one
        this.time.delayedCall(2000, () => {
            this.spawnBlock();
        });
    }

    updateBlockPosition(x) {
        if (!this.currentBlock) return;

        let targetX = x;

        // Clamp the position to keep the block within the screen bounds
        const halfWidth = this.currentBlock.displayWidth / 2;
        const minX = 80 + halfWidth;
        const maxX = 1200 - halfWidth;
        
        if (targetX < minX) targetX = minX;
        if (targetX > maxX) targetX = maxX;

        this.currentBlock.x = targetX;
    }

    update() {
        // We handle movement in updateBlockPosition via pointer events now
    }
}
