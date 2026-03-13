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
        this.isMoving = false;
        this.blockArr = [];
        this.stickyPairs = new Set();
        this.pendingSticky = new Map();
        this.cheeseLinks = [];

        this.createCheeseLinkTexture();
        this.matter.world.engine.enableSleeping = true;

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

        this.matter.world.on('collisionstart', (event) => {
            this.handleStickyCollision(event);
        });

        this.matter.world.on('collisionend', (event) => {
            this.cancelPendingSticky(event);
        });
    }

    spawnBlock() {
        const blockType = Math.floor(Math.random() * 7);    
        this.currentBlock = this.matter.add.sprite(640, 100, `block${blockType}`);
        this.currentBlock.setStatic(true);
        this.currentBlock.setBounce(0.7);
        this.currentBlock.setInteractive(); // Make it interactive
        this.currentBlock.setSleepThreshold(0);
        
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
        this.currentBlock.setSleepThreshold(0);
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
        this.updateCheeseLinks();
    }

    createCheeseLinkTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffd36b, 1);
        g.fillRoundedRect(0, 0, 24, 16, 6);
        g.fillStyle(0xf0b24a, 1);
        g.fillCircle(7, 6, 2);
        g.fillCircle(14, 10, 3);
        g.fillCircle(19, 5, 1.5);
        g.generateTexture('cheese_link', 24, 16);
        g.destroy();
    }

    isBlockSprite(body) {
        if (!body || !body.gameObject || !body.gameObject.texture) return false;
        const key = body.gameObject.texture.key;
        return key && key.startsWith('block');
    }

    isBlockSprite1(body) {
        if (!body || !body.gameObject || !body.gameObject.texture) return false;
        return body.gameObject.texture.key === 'block1';
    }

    handleStickyCollision(event) {
        const pairs = event.pairs || [];
        for (const pair of pairs) {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;

            if (!this.isBlockSprite(bodyA) || !this.isBlockSprite(bodyB)) {
                continue;
            }

            const aIsSticky = this.isBlockSprite1(bodyA);
            const bIsSticky = this.isBlockSprite1(bodyB);
            if (!aIsSticky && !bIsSticky) {
                continue;
            }

            const idA = Math.min(bodyA.id, bodyB.id);
            const idB = Math.max(bodyA.id, bodyB.id);
            const pairKey = `${idA}-${idB}`;
            if (this.stickyPairs.has(pairKey)) {
                continue;
            }
            if (this.pendingSticky.has(pairKey)) {
                continue;
            }

            const delayMs = 1000;
            const bodyRefA = bodyA;
            const bodyRefB = bodyB;
            const timer = this.time.delayedCall(delayMs, () => {
                this.pendingSticky.delete(pairKey);
                this.createFaceStick(bodyRefA, bodyRefB, pairKey);
            });
            this.pendingSticky.set(pairKey, timer);
        }
    }

    cancelPendingSticky(event) {
        const pairs = event.pairs || [];
        for (const pair of pairs) {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;
            const idA = Math.min(bodyA.id, bodyB.id);
            const idB = Math.max(bodyA.id, bodyB.id);
            const pairKey = `${idA}-${idB}`;
            const timer = this.pendingSticky.get(pairKey);
            if (timer) {
                timer.remove(false);
                this.pendingSticky.delete(pairKey);
            }
        }
    }

    createFaceStick(bodyA, bodyB, pairKey) {
        if (this.stickyPairs.has(pairKey)) return;

        if (!this.isBlockSprite(bodyA) || !this.isBlockSprite(bodyB)) return;

        const Matter = Phaser.Physics.Matter.Matter;
        const collisions = Matter.Query.collides(bodyA, [bodyB]);
        if (!collisions || collisions.length === 0) return;
        const collision = collisions[0];

        const supportsRaw = collision.supports || [];
        const supports = supportsRaw.filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));

        let normal = collision.normal;
        if (!normal || !Number.isFinite(normal.x) || !Number.isFinite(normal.y)) {
            const dx = bodyB.position.x - bodyA.position.x;
            const dy = bodyB.position.y - bodyA.position.y;
            const len = Math.hypot(dx, dy) || 1;
            normal = { x: dx / len, y: dy / len };
        }
        const tangent = { x: -normal.y, y: normal.x };

        const sizeA = Math.min(bodyA.bounds.max.x - bodyA.bounds.min.x, bodyA.bounds.max.y - bodyA.bounds.min.y);
        const sizeB = Math.min(bodyB.bounds.max.x - bodyB.bounds.min.x, bodyB.bounds.max.y - bodyB.bounds.min.y);
        const offset = Math.max(10, Math.min(sizeA, sizeB) * 0.35);

        let pStart;
        let pEnd;
        if (supports.length >= 2) {
            pStart = supports[0];
            pEnd = supports[1];
        } else {
            const base = supports.length === 1
                ? supports[0]
                : { x: (bodyA.position.x + bodyB.position.x) * 0.5, y: (bodyA.position.y + bodyB.position.y) * 0.5 };
            pStart = { x: base.x + tangent.x * offset, y: base.y + tangent.y * offset };
            pEnd = { x: base.x - tangent.x * offset, y: base.y - tangent.y * offset };
        }

        const pointCount = 50;
        const pointsA = [];
        const pointsB = [];
        const constraints = [];

        for (let i = 0; i < pointCount; i++) {
            const t = pointCount === 1 ? 0.5 : i / (pointCount - 1);
            const px = pStart.x + (pEnd.x - pStart.x) * t;
            const py = pStart.y + (pEnd.y - pStart.y) * t;

            const pointA = { x: px - bodyA.position.x, y: py - bodyA.position.y };
            const pointB = { x: px - bodyB.position.x, y: py - bodyB.position.y };

            pointsA.push(pointA);
            pointsB.push(pointB);

            constraints.push(this.matter.add.constraint(bodyA, bodyB, 0, 1.0, {
                pointA,
                pointB,
                damping: 0.8,
            }));

        }

        bodyA.friction = Math.max(bodyA.friction || 0, 0.9);
        bodyB.friction = Math.max(bodyB.friction || 0, 0.9);
        bodyA.frictionAir = Math.max(bodyA.frictionAir || 0, 0.05);
        bodyB.frictionAir = Math.max(bodyB.frictionAir || 0, 0.05);
        bodyA.sleepThreshold = Math.max(bodyA.sleepThreshold || 0, 60);
        bodyB.sleepThreshold = Math.max(bodyB.sleepThreshold || 0, 60);

        const sprites = [];
        const spriteCount = 3;
        for (let i = 0; i < spriteCount; i++) {
            const t = spriteCount === 1 ? 0.5 : i / (spriteCount - 1);
            const px = pStart.x + (pEnd.x - pStart.x) * t;
            const py = pStart.y + (pEnd.y - pStart.y) * t;
            const linkSprite = this.add.image(px, py, 'cheese_link');
            linkSprite.setDepth(2);
            sprites.push({ pointA: { x: px - bodyA.position.x, y: py - bodyA.position.y }, pointB: { x: px - bodyB.position.x, y: py - bodyB.position.y }, sprite: linkSprite });
        }
        const faceAngle = Phaser.Math.Angle.Between(pStart.x, pStart.y, pEnd.x, pEnd.y);
        for (const s of sprites) {
            s.sprite.setRotation(faceAngle);
        }

        this.cheeseLinks.push({
            bodyA,
            bodyB,
            pointsA,
            pointsB,
            sprites,
            constraints,
        });

        this.stickyPairs.add(pairKey);
    }

    updateCheeseLinks() {
        for (const link of this.cheeseLinks) {
            if (!link.pointsA || link.pointsA.length === 0) continue;

            const firstA = link.pointsA[0];
            const lastA = link.pointsA[link.pointsA.length - 1];
            const ax0 = link.bodyA.position.x + firstA.x;
            const ay0 = link.bodyA.position.y + firstA.y;
            const ax1 = link.bodyA.position.x + lastA.x;
            const ay1 = link.bodyA.position.y + lastA.y;
            const faceAngle = Phaser.Math.Angle.Between(ax0, ay0, ax1, ay1);

            for (const s of link.sprites) {
                const ax = link.bodyA.position.x + s.pointA.x;
                const ay = link.bodyA.position.y + s.pointA.y;
                const bx = link.bodyB.position.x + s.pointB.x;
                const by = link.bodyB.position.y + s.pointB.y;
                s.sprite.x = (ax + bx) * 0.5;
                s.sprite.y = (ay + by) * 0.5;
                s.sprite.rotation = faceAngle;
            }

        }
    }
}
