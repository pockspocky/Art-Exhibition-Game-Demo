export class Tetris extends Phaser.Scene {

    constructor() {
        super('Tetris');
    }

    preload() {
        this.load.image('background1', 'assets/Background1.png');
        this.load.image('logo', 'assets/phaser.png');
        this.load.image('block0', 'assets/TetrisBlocks/BlockSprite0.png');
        this.load.image('block1', 'assets/TetrisBlocks/BlockSprite1.png');
        this.load.image('block2', 'assets/TetrisBlocks/BlockSprite2.png');
        this.load.image('block3', 'assets/TetrisBlocks/BlockSprite3.png');
        this.load.image('block4', 'assets/TetrisBlocks/BlockSprite4.png');
        this.load.image('block5', 'assets/TetrisBlocks/BlockSprite5.png');
        this.load.image('block6', 'assets/TetrisBlocks/BlockSprite6.png');
        this.load.image('ground', 'assets/TetrisBlocks/Ground.png');

        this.load.spritesheet('ship', 'assets/spaceship.png', { frameWidth: 176, frameHeight: 96 });
    }

    create() {
        this.make.image({
            x: 0,
            y: 0,
            key: 'background1',
            scale: { x: 2.3, y: 2.3 },
            origin: { x: 0, y: 0 },
            add: true
        });

        this.currentBlock = null;
        this.isDropping = false;
        this.isMoving = false;
        this.pendingBlock1 = null;
        this.pendingTargets = new Set();
        this.linkFinalizeScheduled = false;
        this.linkedContainers = [];

        const ground = this.matter.add.sprite(640, 700, 'ground');
        ground.setScale(10, 1).setStatic(true).setBounce(0.7);
        ground.setData('blockType', 'ground');
        ground.setData('linkedLocked', true);
        ground.setData('isProxy', false);

        this.setupCollisionHandling();

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

        spinText.on('pointerdown', () => {
            if (this.currentBlock && !this.isDropping) {
                this.rotateBlock();
            }
        });

        dropText.on('pointerdown', () => {
            if (this.currentBlock && !this.isDropping) {
                this.dropBlock();
            }
        });

        this.input.on('pointerdown', (pointer) => {
            if (!this.currentBlock || this.isDropping) {
                return;
            }

            const clickedOnSpin = spinText.getBounds().contains(pointer.x, pointer.y);
            const clickedOnDrop = dropText.getBounds().contains(pointer.x, pointer.y);

            if (!clickedOnSpin && !clickedOnDrop && this.isMoving) {
                this.dropBlock();
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.currentBlock && !this.isDropping && this.isMoving) {
                this.updateBlockPosition(pointer.x);
            }
        });

        this.input.keyboard.on('keydown-R', () => {
            if (this.currentBlock && !this.isDropping) {
                this.rotateBlock();
            }
        });

        this.spawnBlock();
    }

    spawnBlock() {
        const blockType = Phaser.Math.Between(0, 6);

        this.currentBlock = this.matter.add.sprite(640, 100, `block${blockType}`);
        this.currentBlock.setStatic(true);
        this.currentBlock.setBounce(0.7);
        this.currentBlock.setInteractive();
        this.currentBlock.setData('blockType', blockType);
        this.currentBlock.setData('linkedLocked', false);
        this.currentBlock.setData('isProxy', false);
        this.currentBlock.setData('hasLinkedOnce', false);

        this.currentBlock.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();

            if (this.isDropping) {
                return;
            }

            if (!this.isMoving) {
                this.isMoving = true;
                this.updateBlockPosition(pointer.x);
                return;
            }

            this.dropBlock();
        });

        this.isDropping = false;
        this.isMoving = false;
    }

    rotateBlock() {
        this.currentBlock.angle += 90;
    }

    dropBlock() {
        this.isDropping = true;
        this.isMoving = false;
        this.currentBlock.setStatic(false);
        this.currentBlock.setVelocity(0, 0);

        if (this.currentBlock.getData('blockType') === 1 && !this.currentBlock.getData('hasLinkedOnce')) {
            this.pendingBlock1 = this.currentBlock;
            this.pendingTargets.clear();
            this.linkFinalizeScheduled = false;
        } else {
            this.pendingBlock1 = null;
            this.pendingTargets.clear();
        }

        this.time.delayedCall(2000, () => {
            this.spawnBlock();
        });
    }

    updateBlockPosition(x) {
        if (!this.currentBlock) {
            return;
        }

        const halfWidth = this.currentBlock.displayWidth / 2;
        const minX = 80 + halfWidth;
        const maxX = 1200 - halfWidth;

        this.currentBlock.x = Phaser.Math.Clamp(x, minX, maxX);
    }

    update() {
        this.linkedContainers.forEach(({ container, proxy }) => {
            if (!proxy.body) {
                return;
            }

            container.x = proxy.x;
            container.y = proxy.y;
            container.rotation = proxy.rotation;
        });
    }

    setupCollisionHandling() {
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach((pair) => {
                const objectA = pair.bodyA.gameObject;
                const objectB = pair.bodyB.gameObject;

                if (!objectA || !objectB) {
                    return;
                }

                this.handleBlock1Contact(objectA, objectB);
            });
        });
    }

    handleBlock1Contact(objectA, objectB) {
        if (!this.pendingBlock1 || this.pendingBlock1.getData('hasLinkedOnce')) {
            return;
        }

        let target = null;

        if (objectA === this.pendingBlock1) {
            target = objectB;
        } else if (objectB === this.pendingBlock1) {
            target = objectA;
        }

        if (!target) {
            return;
        }

        if (target.getData('blockType') === 'ground') {
            return;
        }

        if (target.getData('linkedLocked') || target.getData('isProxy')) {
            return;
        }

        this.pendingTargets.add(target);

        if (this.linkFinalizeScheduled) {
            return;
        }

        this.linkFinalizeScheduled = true;
        this.time.delayedCall(0, () => this.finalizeContainerLink());
    }

    finalizeContainerLink() {
        this.linkFinalizeScheduled = false;

        if (!this.pendingBlock1 || this.pendingTargets.size === 0) {
            return;
        }

        const members = [this.pendingBlock1, ...this.pendingTargets];
        this.createBlockContainer(members);

        this.pendingBlock1.setData('hasLinkedOnce', true);
        this.pendingBlock1 = null;
        this.pendingTargets.clear();
    }

    createBlockContainer(blocks) {
        const bounds = this.getCombinedBounds(blocks);
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;

        const container = this.add.container(centerX, centerY);
        const proxy = this.add.rectangle(centerX, centerY, 1, 1, 0xffffff, 0);

        this.matter.add.gameObject(proxy);
        proxy.setVisible(false);
        proxy.setData('blockType', 'containerProxy');
        proxy.setData('linkedLocked', true);
        proxy.setData('isProxy', true);

        const body = this.buildCompoundBody(blocks);
        proxy.setExistingBody(body);
        proxy.setBounce(0.05);
        proxy.setFriction(0.9);
        proxy.setFrictionAir(0.03);

        blocks.forEach((block) => {
            const blockType = block.getData('blockType');
            const child = this.add.image(block.x - centerX, block.y - centerY, `block${blockType}`);

            child.setDisplaySize(block.displayWidth, block.displayHeight);
            child.rotation = block.rotation;
            container.add(child);

            block.setData('linkedLocked', true);
            block.destroy();
        });

        this.linkedContainers.push({ container, proxy });
    }

    buildCompoundBody(blocks) {
        const { Bodies, Body } = Phaser.Physics.Matter.Matter;
        const parts = blocks.map((block) =>
            Bodies.rectangle(
                block.x,
                block.y,
                block.displayWidth,
                block.displayHeight,
                { angle: block.rotation }
            )
        );

        return Body.create({ parts });
    }

    getCombinedBounds(blocks) {
        const bounds = {
            minX: Number.POSITIVE_INFINITY,
            minY: Number.POSITIVE_INFINITY,
            maxX: Number.NEGATIVE_INFINITY,
            maxY: Number.NEGATIVE_INFINITY
        };

        blocks.forEach((block) => {
            const halfWidth = block.displayWidth / 2;
            const halfHeight = block.displayHeight / 2;

            bounds.minX = Math.min(bounds.minX, block.x - halfWidth);
            bounds.minY = Math.min(bounds.minY, block.y - halfHeight);
            bounds.maxX = Math.max(bounds.maxX, block.x + halfWidth);
            bounds.maxY = Math.max(bounds.maxY, block.y + halfHeight);
        });

        return bounds;
    }
}
