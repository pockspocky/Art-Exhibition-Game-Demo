const Phase = {
    BLOCK_PLACEMENT: 'BLOCK_PLACEMENT',
    TRANSITION: 'TRANSITION',
    SHOOTING: 'SHOOTING',
    END: 'END'
};

export { Phase };

export class MergedScene extends Phaser.Scene {

    constructor() {
        super('MergedScene');
    }

    init(data) {
        const d = data || {};

        // blockLimit: default 10, must be positive integer, minimum 1
        if (typeof d.blockLimit === 'number' && Number.isFinite(d.blockLimit) && d.blockLimit >= 1) {
            this.blockLimit = Math.max(1, Math.floor(d.blockLimit));
        } else {
            this.blockLimit = 5;
        }

        // birdCount: default 5, must be positive integer, minimum 1
        if (typeof d.birdCount === 'number' && Number.isFinite(d.birdCount) && d.birdCount >= 1) {
            this.birdCount = Math.max(1, Math.floor(d.birdCount));
        } else {
            this.birdCount = 2;
        }

        // slingshotOffsetX: default 300, must be positive number, minimum 1
        if (typeof d.slingshotOffsetX === 'number' && Number.isFinite(d.slingshotOffsetX) && d.slingshotOffsetX >= 1) {
            this.slingshotOffsetX = Math.max(1, d.slingshotOffsetX);
        } else {
            this.slingshotOffsetX = 300;
        }

        // birdSpeedCoeff: multiplier for bird launch speed, default 1.0
        if (typeof d.birdSpeedCoeff === 'number' && Number.isFinite(d.birdSpeedCoeff) && d.birdSpeedCoeff > 0) {
            this.birdSpeedCoeff = d.birdSpeedCoeff;
        } else {
            this.birdSpeedCoeff = 1.5;
        }
    }

    preload() {
        // Tetris block sprites
        this.load.image('block1', 'assets/TetrisBlocks/BlockSprites1.png');
        this.load.image('block2', 'assets/TetrisBlocks/BlockSprites2.png');
        this.load.image('block3', 'assets/TetrisBlocks/BlockSprites3.png');
        this.load.image('block4', 'assets/TetrisBlocks/BlockSprites4.png');
        this.load.image('block5', 'assets/TetrisBlocks/BlockSprites5.png');

        // Ground
        this.load.image('ground', 'assets/GroundSprite.png');

        // Bird sprites and sling
        this.load.image('bird1', 'assets/BirdSprites/BirdSprite1.png');
        this.load.image('bird2', 'assets/BirdSprites/BirdSprite2.png');
        this.load.image('bird3', 'assets/BirdSprites/BirdSprite3.png');
        this.load.image('bird4', 'assets/BirdSprites/BirdSprite4.png');
        this.load.image('bird5', 'assets/BirdSprites/BirdSprite5.png');
        this.load.image('bird6', 'assets/BirdSprites/BirdSprite6.png');
        this.load.image('bird7', 'assets/BirdSprites/BirdSprite7.png');
        this.load.image('sling', 'assets/sling.png');

        // Background
        this.load.image('background1', 'assets/background.png');

        // Bird shoot SFX
        for (let i = 1; i <= 8; i++) {
            this.load.audio(`birdSound${i}`, `assets/SFX/BirdShoot/BirdSound${i}.mp3`);
        }

        // Explosion SFX
        for (let i = 1; i <= 2; i++) {
            this.load.audio(`explosionSound${i}`, `assets/SFX/Explosion/ExplosionSFX${i}.mp3`);
        }

        // Explosion sprite sheet (10 frames, 256x256 each)
        this.load.spritesheet('explosion', 'assets/ExplosionSprite.png', {
            frameWidth: 256,
            frameHeight: 256
        });
    }

    create() {
        // Set initial phase
        this.phase = Phase.BLOCK_PLACEMENT;

        // Background — stored so we can reposition/rescale later to cover the full world
        this.cameras.main.setBackgroundColor('#ffffff');
        this.bgImage = this.add.image(0, 0, 'background1').setOrigin(0, 0).setScale(2.3, 2.3).setAlpha(0.5);

        // Ground — static Matter.js body at y=700 (matching tetris.js)
        this.ground = this.matter.add.sprite(640, 700, 'ground').setScale(10, 1).setStatic(true).setBounce(0);
        // Shift sprite visual up by 30px relative to the hitbox
        this.ground.setOrigin(0.5, 0.5 + (30 / this.ground.displayHeight));

        // State arrays
        this.blockArr = [];
        this.birdQueue = [];
        this.trailPoints = [];
        this.stickyGroups = [];
        this.pendingSticky = new Map();

        // Trail rendering
        this.trailGraphics = this.add.graphics();
        this.isRecordingTrail = false;

        // Block placement state
        this.placedBlockCount = 0;
        this.currentBlock = null;
        this.isDropping = false;
        this.isMoving = false;

        this.matter.world.engine.enableSleeping = true;
        this.stickingDelay = 10;

        // UI Text buttons for block placement (fixed to camera, not world)
        this.spinText = this.add.text(100, 50, 'Spin', {
            fontSize: '48px',
            color: '#000000',
            fontStyle: 'bold'
        }).setInteractive().setScrollFactor(0);

        this.dropText = this.add.text(1100, 50, 'Drop', {
            fontSize: '48px',
            color: '#000000',
            fontStyle: 'bold'
        }).setInteractive().setScrollFactor(0);

        // Spin button interaction
        this.spinText.on('pointerdown', () => {
            if (this.phase !== Phase.BLOCK_PLACEMENT) return;
            if (this.currentBlock && !this.isDropping) {
                this.rotateBlock();
            }
        });

        // Drop button interaction
        this.dropText.on('pointerdown', () => {
            if (this.phase !== Phase.BLOCK_PLACEMENT) return;
            if (this.currentBlock && !this.isDropping) {
                this.dropBlock();
            }
        });

        // Global pointer down for dropping
        this.input.on('pointerdown', (pointer) => {
            if (this.phase !== Phase.BLOCK_PLACEMENT) return;
            if (this.currentBlock && !this.isDropping) {
                const clickedOnSpin = this.spinText.getBounds().contains(pointer.x, pointer.y);
                const clickedOnDrop = this.dropText.getBounds().contains(pointer.x, pointer.y);

                if (!clickedOnSpin && !clickedOnDrop) {
                    if (this.isMoving) {
                        this.dropBlock();
                    }
                }
            }
        });

        // Global pointer move to handle following
        this.input.on('pointermove', (pointer) => {
            if (this.phase !== Phase.BLOCK_PLACEMENT) return;
            if (this.currentBlock && !this.isDropping && this.isMoving) {
                this.updateBlockPosition(pointer.x);
            }
        });

        // Keyboard input for rotation
        this.input.keyboard.on('keydown-R', () => {
            if (this.phase !== Phase.BLOCK_PLACEMENT) return;
            if (this.currentBlock && !this.isDropping) {
                this.rotateBlock();
            }
        });

        // Explosion animation
        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 9 }),
            frameRate: 20,
            repeat: 0
        });

        // Spawn the first block
        this.spawnBlock();

        // Register Matter.js collision listeners for sticky system
        this.matter.world.on('collisionstart', (event) => {
            this.handleStickyCollision(event);
        });

        this.matter.world.on('collisionend', (event) => {
            this.cancelPendingSticky(event);
        });

        // Create minimap (initially hidden)
        this.createMinimap();
    }

    update(time, delta) {
        switch (this.phase) {
            case Phase.BLOCK_PLACEMENT:
                this.updateBlockPlacement(time, delta);
                break;
            case Phase.TRANSITION:
                this.updateTransition(time, delta);
                break;
            case Phase.SHOOTING:
                this.updateShooting(time, delta);
                break;
            case Phase.END:
                this.updateEnd(time, delta);
                break;
        }
    }

    // Phase-specific update stubs — to be implemented in later tasks

    updateBlockPlacement(time, delta) {
        this.syncStickyGroups();
    }

    spawnBlock() {
        const blockType = Math.floor(Math.random() * 5) + 1;

        // Spawn block just above the visible camera area
        const spawnY = this.cameras.main.scrollY + 80;
        this.currentBlock = this.matter.add.sprite(640, spawnY, `block${blockType}`).setScale(1.17);
        this.currentBlock.setStatic(true);
        this.currentBlock.setBounce(0);
        this.currentBlock.setInteractive();
        this.currentBlock.setSleepThreshold(0);
        this.currentBlock.setMass(0.0001);
        this.currentBlock.setFriction(0.0001);

        // Handle specific click on the block
        this.currentBlock.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            if (this.phase !== Phase.BLOCK_PLACEMENT) return;
            if (!this.isDropping) {
                if (!this.isMoving) {
                    this.isMoving = true;
                    this.updateBlockPosition(pointer.x);
                } else {
                    this.dropBlock();
                }
            }
        });

        this.blockArr.push(this.currentBlock);
        this.isDropping = false;
        this.isMoving = false;
    }

    rotateBlock() {
        this.currentBlock.angle += 90;
    }

    /**
     * Check if the build exceeds 70% of screen height and pan the camera up
     * so the player can keep building. The ground is at y=700.
     */
    adjustCameraForBuild() {
        const cam = this.cameras.main;
        const screenH = cam.height;
        const groundY = 700;

        let highestY = groundY;
        let freeCount = 0;
        let groupCount = 0;

        for (const block of this.blockArr) {
            if (!block.body) continue;
            if (block.parentContainer) continue;
            freeCount++;
            const topY = block.y - block.displayHeight / 2;
            if (topY < highestY) highestY = topY;
        }

        for (const group of this.stickyGroups) {
            const cx = group.container.x;
            const cy = group.container.y;
            const angle = group.container.rotation;
            for (const member of group.members) {
                groupCount++;
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);
                const worldY = cy + member.offsetX * sinA + member.offsetY * cosA;
                const topY = worldY - member.bodyHeight / 2;
                if (topY < highestY) highestY = topY;
            }
        }

        // How much of the visible screen does the build fill?
        const visibleTop = cam.scrollY;
        const buildHeight = groundY - highestY;
        const fillRatio = buildHeight / screenH;

        console.log('[adjustCamera]', {
            highestY: highestY.toFixed(1),
            buildHeight: buildHeight.toFixed(1),
            fillPercent: (fillRatio * 100).toFixed(1) + '%',
            scrollY: cam.scrollY.toFixed(1),
            freeBlocks: freeCount,
            groupMembers: groupCount
        });

        if (fillRatio > 0.7) {
            // Pan so the build fills 60% of the screen (40% headroom above highest block)
            const desiredScrollY = highestY - screenH * 0.4;
            if (this._worldTopY === undefined) this._worldTopY = 0;
            this._worldTopY = Math.min(this._worldTopY, desiredScrollY - 100);

            this.matter.world.setBounds(0, this._worldTopY, 1280, groundY + 100 - this._worldTopY);
            cam.setBounds(0, this._worldTopY, 1280, groundY + 100 - this._worldTopY);

            if (this.bgImage) {
                this.bgImage.setPosition(0, this._worldTopY);
                const texW = this.bgImage.texture.getSourceImage().width;
                const texH = this.bgImage.texture.getSourceImage().height;
                this.bgImage.setScale(1280 / texW, (groundY + 100 - this._worldTopY) / texH);
            }

            console.log('[adjustCamera] PANNING from scrollY:', cam.scrollY.toFixed(1), 'to:', desiredScrollY.toFixed(1));
            const panCenterY = desiredScrollY + screenH / 2;
            cam.pan(cam.midPoint.x, panCenterY, 500, 'Sine.easeInOut');
        }
    }

    dropBlock() {
        this.isDropping = true;
        this.isMoving = false;
        this.currentBlock.setSleepThreshold(0);
        this.currentBlock.setStatic(false);
        this.currentBlock.setVelocityX(0);
        this.placedBlockCount++;

        if (this.placedBlockCount >= this.blockLimit) {
            // Block limit reached — stop spawning, disable controls, transition
            this.spinText.setVisible(false);
            this.spinText.disableInteractive();
            this.dropText.setVisible(false);
            this.dropText.disableInteractive();
            this.currentBlock = null;
            this.phase = Phase.TRANSITION;
            this.startSettlePolling();
        } else {
            // Wait for block to settle, adjust camera, then spawn next
            this.time.delayedCall(1000, () => {
                this.adjustCameraForBuild();
                this.spawnBlock();
            });
        }
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

    syncStickyGroups() {
        for (const group of this.stickyGroups) {
            group.container.setPosition(group.compoundBody.position.x, group.compoundBody.position.y);
            group.container.setRotation(group.compoundBody.angle);
        }
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

    findGroupForBody(body) {
        if (!body) return null;
        const id = body.id;
        for (const group of this.stickyGroups) {
            // Match against the compound body itself
            if (group.compoundBody.id === id) return group;
            // Match against compound body parts
            if (group.compoundBody.parts) {
                for (const part of group.compoundBody.parts) {
                    if (part.id === id) return group;
                }
            }
            // Match against stored member bodyId values
            for (const member of group.members) {
                if (member.bodyId === id) return group;
            }
        }
        return null;
    }

    buildCompoundBody(memberBodies) {
        const Matter = Phaser.Physics.Matter.Matter;

        // Clone each body's vertices as parts, positioned at their world coordinates
        const parts = memberBodies.map(b => {
            const clone = Matter.Bodies.rectangle(
                b.position.x, b.position.y,
                b.bounds.max.x - b.bounds.min.x,
                b.bounds.max.y - b.bounds.min.y
            );
            return clone;
        });

        // Matter.Body.create auto-calculates center of mass from parts
        const compound = Matter.Body.create({ parts });

        // Ensure the compound body behaves properly under gravity
        Matter.Body.setStatic(compound, false);
        Matter.Sleeping.set(compound, false);
        compound.friction = 0.1;
        compound.frictionStatic = 0.5;
        compound.restitution = 0;
        compound.sleepThreshold = 60;

        return compound;
    }

    /**
     * Wake all block bodies and sticky group compound bodies so they
     * respond to gravity. Called on impact and periodically during shooting.
     */
    wakeAllBodies() {
        const Matter = Phaser.Physics.Matter.Matter;
        for (const block of this.blockArr) {
            if (block.body && !block.body.isStatic) {
                Matter.Sleeping.set(block.body, false);
            }
        }
        for (const group of this.stickyGroups) {
            if (group.compoundBody) {
                Matter.Sleeping.set(group.compoundBody, false);
            }
        }
    }


    getPairKeyId(body) {
        // For compound body parts, use the parent body's ID so cancelPendingSticky can match
        if (body.parent && body.parent !== body) {
            return body.parent.id;
        }
        return body.id;
    }

    handleStickyCollision(event) {
        const pairs = event.pairs || [];
        for (const pair of pairs) {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;

            // 1. Skip if either body's gameObject is the block currently being positioned
            // (before it's dropped). Once dropped, it should participate in sticking.
            if (this.currentBlock && !this.isDropping) {
                if (bodyA.gameObject === this.currentBlock || bodyB.gameObject === this.currentBlock) {
                    continue;
                }
            }

            // 2. Check group membership for both bodies
            const groupA = this.findGroupForBody(bodyA);
            const groupB = this.findGroupForBody(bodyB);

            let freeBody = null;
            let existingGroup = null;

            if (groupA && groupB) {
                // Both bodies are in groups — skip
                continue;
            } else if (groupA || groupB) {
                // One body is in a group, the other should be free
                existingGroup = groupA || groupB;
                freeBody = groupA ? bodyB : bodyA;

                // After compound body creation, Matter.js reports the compound body
                // (or its parts) in collisions — we cannot distinguish which original
                // member's shape was hit. The group was initiated by a block1, so any
                // collision with the compound body is treated as a valid extension
                // trigger, provided the group has room to grow.
                if (existingGroup.members.length >= 3) {
                    continue;
                }

                // The other body must be a free block sprite (not in any group)
                if (!this.isBlockSprite(freeBody)) {
                    continue;
                }
            } else {
                // Neither body is in a group: both must be block sprites, at least one must be block1
                if (!this.isBlockSprite(bodyA) || !this.isBlockSprite(bodyB)) {
                    continue;
                }
                if (!this.isBlockSprite1(bodyA) && !this.isBlockSprite1(bodyB)) {
                    continue;
                }
            }

            // 3. Compute pair key using compound body parent IDs
            const idA = this.getPairKeyId(bodyA);
            const idB = this.getPairKeyId(bodyB);
            const pairKey = `${Math.min(idA, idB)}-${Math.max(idA, idB)}`;

            // No duplicate pending timer for this pair
            if (this.pendingSticky.has(pairKey)) {
                continue;
            }

            // 4. Start delayed sticking timer
            const bodyRefA = bodyA;
            const bodyRefB = bodyB;
            const capturedGroup = existingGroup;
            const capturedFreeBody = freeBody;

            const timer = this.time.delayedCall(this.stickingDelay, () => {
                this.pendingSticky.delete(pairKey);

                // Re-validate that both bodies/sprites still exist
                if (!bodyRefA.gameObject || !bodyRefB.gameObject) {
                    return;
                }

                if (capturedGroup) {
                    // Extending an existing group — re-validate the free body
                    if (!capturedFreeBody.gameObject) {
                        return;
                    }
                    // Re-check group size (may have changed since timer started)
                    if (capturedGroup.members.length >= 3) {
                        return;
                    }
                    this.extendStickyGroup(capturedGroup, capturedFreeBody);
                } else {
                    // Creating a new group
                    this.createStickyGroup(bodyRefA, bodyRefB);
                }
            });
            this.pendingSticky.set(pairKey, timer);
        }
    }

    cancelPendingSticky(event) {
        const pairs = event.pairs || [];
        for (const pair of pairs) {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;
            const idA = this.getPairKeyId(bodyA);
            const idB = this.getPairKeyId(bodyB);
            const pairKey = `${Math.min(idA, idB)}-${Math.max(idA, idB)}`;
            const timer = this.pendingSticky.get(pairKey);
            if (timer) {
                timer.remove(false);
                this.pendingSticky.delete(pairKey);
            }
        }
    }

    createStickyGroup(bodyA, bodyB) {
        const Matter = Phaser.Physics.Matter.Matter;

        // Determine which body is the initiator (block1)
        const aIsInitiator = this.isBlockSprite1(bodyA);
        const initiatorBody = aIsInitiator ? bodyA : bodyB;
        const otherBody = aIsInitiator ? bodyB : bodyA;

        const spriteA = bodyA.gameObject;
        const spriteB = bodyB.gameObject;
        const initiatorSprite = aIsInitiator ? spriteA : spriteB;

        // Build compound body — its position is auto-calculated by Matter from parts
        const compoundBody = this.buildCompoundBody([bodyA, bodyB]);

        // Use the compound body's actual center as the container origin
        const cx = compoundBody.position.x;
        const cy = compoundBody.position.y;

        // Create Phaser Container at the compound body center
        const container = this.add.container(cx, cy);

        // Convert each body's physics position to container-local offset and add sprite as child
        const members = [initiatorBody, otherBody].map(body => {
            const sprite = body.gameObject;
            const offsetX = body.position.x - cx;
            const offsetY = body.position.y - cy;
            sprite.x = offsetX;
            sprite.y = offsetY;
            container.add(sprite);
            return {
                sprite,
                bodyId: body.id,
                offsetX,
                offsetY,
                bodyWidth: body.bounds.max.x - body.bounds.min.x,
                bodyHeight: body.bounds.max.y - body.bounds.min.y
            };
        });

        // Remove individual Matter.js bodies from the world and add compound body
        this.matter.world.remove(bodyA);
        this.matter.world.remove(bodyB);
        this.matter.world.add(compoundBody);

        // Store the new StickyGroup object
        const group = {
            container,
            compoundBody,
            initiatorBodyId: initiatorBody.id,
            initiatorSprite,
            members
        };

        this.stickyGroups.push(group);
        return group;
    }

    extendStickyGroup(group, newBody) {
        // Enforce max group size of 3
        if (group.members.length >= 3) return;

        const Matter = Phaser.Physics.Matter.Matter;
        const container = group.container;
        const newSprite = newBody.gameObject;
        const oldContainerX = container.x;
        const oldContainerY = container.y;

        // Compute world positions of existing members before any changes
        const existingWorldPositions = group.members.map(member => ({
            member,
            worldX: oldContainerX + member.offsetX,
            worldY: oldContainerY + member.offsetY
        }));

        // New block's world position
        const newWorldPosX = newBody.position.x;
        const newWorldPosY = newBody.position.y;

        // Rebuild compound body from all members + new body
        // Create temporary body representations for existing members using stored body dimensions
        const tempBodies = existingWorldPositions.map(({ member, worldX, worldY }) => {
            return Matter.Bodies.rectangle(
                worldX, worldY,
                member.bodyWidth,
                member.bodyHeight
            );
        });

        // Add the new body (still has its world position)
        tempBodies.push(newBody);

        // Build the new compound body
        const newCompoundBody = this.buildCompoundBody(tempBodies);

        // Remove old compound body from world and add new one
        this.matter.world.remove(group.compoundBody);
        this.matter.world.remove(newBody);
        this.matter.world.add(newCompoundBody);

        // Wake the new compound body so it responds to gravity immediately
        const MatterLib = Phaser.Physics.Matter.Matter;
        MatterLib.Sleeping.set(newCompoundBody, false);

        // Update container position to new compound body centroid
        const newCX = newCompoundBody.position.x;
        const newCY = newCompoundBody.position.y;
        container.setPosition(newCX, newCY);

        // Recalculate all existing member offsets relative to new container position
        for (const { member, worldX, worldY } of existingWorldPositions) {
            member.offsetX = worldX - newCX;
            member.offsetY = worldY - newCY;
            member.sprite.x = member.offsetX;
            member.sprite.y = member.offsetY;
        }

        // Add new sprite to container at its local offset
        const newOffsetX = newWorldPosX - newCX;
        const newOffsetY = newWorldPosY - newCY;
        newSprite.x = newOffsetX;
        newSprite.y = newOffsetY;
        container.add(newSprite);

        // Add new member to the group
        group.members.push({
            sprite: newSprite,
            bodyId: newBody.id,
            offsetX: newOffsetX,
            offsetY: newOffsetY,
            bodyWidth: newBody.bounds.max.x - newBody.bounds.min.x,
            bodyHeight: newBody.bounds.max.y - newBody.bounds.min.y
        });

        group.compoundBody = newCompoundBody;
    }

    startSettlePolling() {
        const SETTLE_THRESHOLD = 0.5;
        const POLL_INTERVAL = 250;
        const MAX_TIMEOUT = 5000;
        let elapsed = 0;

        this.settleTimer = this.time.addEvent({
            delay: POLL_INTERVAL,
            callback: () => {
                elapsed += POLL_INTERVAL;

                // Check if all blocks have settled
                const allSettled = this.blockArr.every(block => {
                    const body = block.body;
                    if (!body) return true;
                    const vx = body.velocity.x;
                    const vy = body.velocity.y;
                    return Math.sqrt(vx * vx + vy * vy) < SETTLE_THRESHOLD;
                });

                if (allSettled) {
                    this.stopSettlePolling();
                    this.initShootingPhase();
                    return;
                }

                // Force-sleep all blocks after timeout
                if (elapsed >= MAX_TIMEOUT) {
                    const Matter = Phaser.Physics.Matter.Matter;
                    for (const block of this.blockArr) {
                        if (block.body) {
                            Matter.Sleeping.set(block.body, true);
                        }
                    }
                    this.stopSettlePolling();
                    this.initShootingPhase();
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    stopSettlePolling() {
        if (this.settleTimer) {
            this.settleTimer.remove(false);
            this.settleTimer = null;
        }
    }

    /**
     * Measure the building height in pixels (ground Y minus highest block top).
     * Only counts blocks still above ground.
     */
    measureBuildingHeight() {
        const groundY = 700;
        let highestY = groundY;

        // Free blocks
        for (const block of this.blockArr) {
            if (!block.body) continue;
            if (block.parentContainer) continue;
            if (block.y > groundY + 20) continue;
            const topY = block.y - block.displayHeight / 2;
            if (topY < highestY) highestY = topY;
        }

        // Sticky group members (world position)
        for (const group of this.stickyGroups) {
            const cx = group.container.x;
            const cy = group.container.y;
            const angle = group.container.rotation;
            for (const member of group.members) {
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);
                const worldY = cy + member.offsetX * sinA + member.offsetY * cosA;
                if (worldY > groundY + 20) continue;
                const topY = worldY - member.bodyHeight / 2;
                if (topY < highestY) highestY = topY;
            }
        }

        return Math.max(0, groundY - highestY);
    }

    /**
     * Snapshot block positions so we can measure displacement after shooting.
     */
    snapshotBlockPositions() {
        this.blockSnapshot = this.blockArr.map(b => ({ x: b.x, y: b.y, ref: b }));
    }

    /**
     * Calculate the final score.
     *
     * Uses two destruction metrics and picks the better one:
     *   1. heightReduction — how much the max height dropped
     *   2. displacementRatio — fraction of blocks moved significantly from
     *      their pre-shot positions (catches sideways scattering)
     *
     * score = buildHeight² × destructionScore × 2
     */
    calculateScore() {
        const remainingHeight = this.measureBuildingHeight();
        const buildHeight = this.preShotBuildHeight || 0;
        if (buildHeight <= 0) return 0;

        const heightReduction = Math.max(0, (buildHeight - remainingHeight) / buildHeight);

        let displacedCount = 0;
        const threshold = 80;
        if (this.blockSnapshot) {
            for (const snap of this.blockSnapshot) {
                const b = snap.ref;
                if (!b.body) { displacedCount++; continue; }
                const dist = Math.sqrt((b.x - snap.x) ** 2 + (b.y - snap.y) ** 2);
                if (dist > threshold || b.y > 720) displacedCount++;
            }
        }
        const total = this.blockSnapshot ? this.blockSnapshot.length : 1;
        const displacementRatio = displacedCount / total;

        const destructionScore = Math.max(heightReduction, displacementRatio);
        const score = Math.round(buildHeight * buildHeight * destructionScore * 2);

        console.log('[calculateScore]', {
            buildHeight, remainingHeight, heightReduction,
            displacedCount, total, displacementRatio,
            destructionScore, score
        });

        return score;
    }

    initShootingPhase() {
        // Record building height before shooting begins (used for scoring)
        this.preShotBuildHeight = this.measureBuildingHeight();
        this.snapshotBlockPositions();
        console.log('[initShootingPhase] preShotBuildHeight:', this.preShotBuildHeight);

        // Wake all compound bodies so they respond to gravity from the start
        this.wakeAllBodies();

        // 1. Calculate leftmost block X from blockArr
        let leftmostX = Infinity;
        for (const block of this.blockArr) {
            if (block.x < leftmostX) {
                leftmostX = block.x;
            }
        }

        // 2. Position slingshot horizontally offset from leftmost block
        this.slingX = leftmostX - this.slingshotOffsetX;

        // 3. Position slingshot vertically at ground level
        this.slingY = 535;

        // 4. Create slingshot sprite
        this.slingSprite = this.add.image(this.slingX, this.slingY, 'sling').setScale(0.5);

        // 5. Create bird queue — line them up on the ground to the left of the sling
        this.birdQueue = [];
        const groundY = 610; // slightly above ground surface
        const birdSpacing = 70;
        const birdSpriteKeys = ['bird1', 'bird2', 'bird3', 'bird4', 'bird5', 'bird6', 'bird7'];
        for (let i = 0; i < this.birdCount; i++) {
            const birdX = this.slingX - 60 - (i * birdSpacing);
            const spriteKey = birdSpriteKeys[i % birdSpriteKeys.length];
            const bird = this.matter.add.image(birdX, groundY, spriteKey).setScale(0.6);
            bird.setCircle(bird.displayWidth / 2);
            bird.setStatic(true);
            bird.setFriction(0.005);
            bird.setBounce(0.8);
            bird.setDensity(0.016);
            bird.setMass(bird.body.mass * 4);
            this.birdQueue.push(bird);
        }

        // Tag one random bird as explosive with a red tint
        const explosiveIndex = Phaser.Math.Between(0, this.birdQueue.length - 1);
        this.birdQueue[explosiveIndex].isExplosive = true;
        this.birdQueue[explosiveIndex].setTint(0xff3333);

        // 6. Initialize shooting state
        this.activeBird = null;
        this.isBirdLaunched = false;
        this.isDragging = false;

        // 7. Set up pointer-based drag handlers (avoids Phaser drag + scrolled camera issues)
        this.input.on('pointerdown', (pointer) => {
            if (this.phase !== Phase.SHOOTING) return;
            if (!this.activeBird || this.isBirdLaunched) return;
            const wx = pointer.worldX;
            const wy = pointer.worldY;
            const dist = Phaser.Math.Distance.Between(wx, wy, this.activeBird.x, this.activeBird.y);
            if (dist < 60) {
                this.isDragging = true;
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.phase !== Phase.SHOOTING) return;
            if (!this.isDragging || !this.activeBird) return;
            const Matter = Phaser.Physics.Matter.Matter;
            Matter.Body.setPosition(this.activeBird.body, {
                x: pointer.worldX,
                y: pointer.worldY
            });
            this.activeBird.x = pointer.worldX;
            this.activeBird.y = pointer.worldY;
        });

        this.input.on('pointerup', (pointer) => {
            if (this.phase !== Phase.SHOOTING) return;
            if (!this.isDragging || !this.activeBird) return;
            this.isDragging = false;
            const dx = this.slingX - this.activeBird.x;
            const dy = (this.slingY - 150) - this.activeBird.y;
            const Matter = Phaser.Physics.Matter.Matter;
            Matter.Body.setStatic(this.activeBird.body, false);
            Matter.Sleeping.set(this.activeBird.body, false);
            Matter.Body.setVelocity(this.activeBird.body, {
                x: dx * 0.05 * this.birdSpeedCoeff,
                y: dy * 0.05 * this.birdSpeedCoeff
            });
            const spin = (Math.random() * 0.4 + 0.3) * (Math.random() < 0.5 ? -1 : 1);
            Matter.Body.setAngularVelocity(this.activeBird.body, spin);
            this.sound.play(`birdSound${Phaser.Math.Between(1, 8)}`);
            this.isBirdLaunched = true;
            this.beginTrail();
            this.followBird(this.activeBird);
        });

        // 8. Load the first bird onto the slingshot
        this.loadBirdOnSlingshot();

        // 9. Listen for bird-block collisions to play explosion SFX once per launch
        this.birdHitBlock = false;
        this.matter.world.on('collisionstart', (event) => {
            if (this.phase !== Phase.SHOOTING || !this.isBirdLaunched || this.birdHitBlock) return;
            for (const pair of event.pairs) {
                const a = pair.bodyA;
                const b = pair.bodyB;
                const aIsBird = a.gameObject === this.activeBird;
                const bIsBird = b.gameObject === this.activeBird;
                const aIsTarget = this.isBlockSprite(a) || !!this.findGroupForBody(a);
                const bIsTarget = this.isBlockSprite(b) || !!this.findGroupForBody(b);
                if ((aIsBird && bIsTarget) || (bIsBird && aIsTarget)) {
                    this.birdHitBlock = true;
                    this.sound.play(`explosionSound${Phaser.Math.Between(1, 2)}`);
                    this.wakeAllBodies();
                    // Explosive bird: radial push + self-destruct
                    if (this.activeBird.isExplosive) {
                        this.detonateExplosiveBird();
                    }
                    return;
                }
            }
        });

        // 9. Update world and camera bounds for shooting phase
        this.updateWorldBounds();

        // 10. Pan camera to slingshot area
        this.panToSlingshot();

        // 11. Set phase to SHOOTING
        this.phase = Phase.SHOOTING;

        // 12. Show minimap during shooting phase
        this.showMinimap();
    }

    loadBirdOnSlingshot() {
        if (this.birdQueue.length === 0) return;

        // Shift the first bird from the queue
        this.activeBird = this.birdQueue.shift();

        // Position at slingshot
        this.activeBird.setPosition(this.slingX, this.slingY);
        this.activeBird.setStatic(true);

        // Reset shooting state
        this.isBirdLaunched = false;
        this.isDragging = false;
        this.birdHitBlock = false;

        // Clear previous trajectory trail
        this.clearTrail();
    }

    launchBird(dx, dy) {
        if (!this.activeBird) return;
        this.activeBird.disableInteractive();
        this.activeBird.setStatic(false);
        this.activeBird.setVelocity(dx * 0.05 * this.birdSpeedCoeff, dy * 0.05 * this.birdSpeedCoeff);
        this.sound.play(`birdSound${Phaser.Math.Between(1, 8)}`);
        this.isBirdLaunched = true;
        this.beginTrail();
        this.followBird(this.activeBird);
    }

    beginTrail() {
        this.trailPoints = [];
        this.isRecordingTrail = true;
        if (this.trailGraphics) this.trailGraphics.clear();
    }

    panToSlingshot(callback) {
        this.cameras.main.pan(this.slingX, this.slingY, 500, 'Sine.easeInOut', true, (cam, progress) => {
            if (progress === 1 && callback) callback();
        });
    }

    followBird(bird) {
        // Stop any active pan/scroll effect so startFollow takes over immediately
        this.cameras.main.stopFollow();
        this.cameras.main.panEffect.reset();
        console.log('[followBird] called, bird exists:', !!bird, 'bird pos:', bird.x, bird.y);
        console.log('[followBird] camera bounds:', this.cameras.main._bounds);
        console.log('[followBird] camera scroll before follow:', this.cameras.main.scrollX, this.cameras.main.scrollY);
        this.cameras.main.startFollow(bird, true, 0.5, 0.5);
        console.log('[followBird] startFollow called, _follow:', this.cameras.main._follow === bird);
    }

    clearTrail() {
        this.trailPoints = [];
        if (this.trailGraphics) {
            this.trailGraphics.clear();
        }
    }

    updateTransition(time, delta) {
        // Settling detection is handled by the polling timer started in startSettlePolling()
    }

    updateShooting(time, delta) {
        if (this.isBirdLaunched) {
            this.checkImpact();
        }
        if (this.isBirdLaunched && this.activeBird) {
            console.log('[updateShooting] bird pos:', this.activeBird.x.toFixed(1), this.activeBird.y.toFixed(1),
                'cam scroll:', this.cameras.main.scrollX.toFixed(1), this.cameras.main.scrollY.toFixed(1),
                'following:', !!this.cameras.main._follow);
        }
        if (this.isBirdLaunched && this.isRecordingTrail && this.activeBird) {
            this.extendTrail(this.activeBird.x, this.activeBird.y);
        }
        this.syncStickyGroups();
    }

    checkImpact() {
        if (!this.isBirdLaunched || !this.activeBird || !this.activeBird.body) return;

        const vx = this.activeBird.body.velocity.x;
        const vy = this.activeBird.body.velocity.y;
        const speed = Math.sqrt(vx * vx + vy * vy);

        // Use actual world bounds instead of hardcoded values
        const outOfBounds =
            this.activeBird.y > this.worldBoundsY + this.worldBoundsHeight ||
            this.activeBird.x < this.worldBoundsX ||
            this.activeBird.x > this.worldBoundsX + this.worldBoundsWidth;

        if (speed < 0.3 || outOfBounds) {
            console.log('[checkImpact] bird stopped/OOB, speed:', speed.toFixed(2), 'oob:', outOfBounds, 'pos:', this.activeBird.x.toFixed(1), this.activeBird.y.toFixed(1));
            this.isBirdLaunched = false;
            this.stopTrail();
            this.stopFollowing();
            this.time.delayedCall(2500, () => {
                this.onPostImpactComplete();
            });
        }
    }

    stopTrail() {
        this.isRecordingTrail = false;
    }

    detonateExplosiveBird() {
        const Matter = Phaser.Physics.Matter.Matter;
        const bx = this.activeBird.x;
        const by = this.activeBird.y;
        const radius = 600;
        const forceMag = 2;

        // Push all nearby bodies outward 
        const allBodies = this.matter.world.localWorld.bodies;
        for (const body of allBodies) {
            if (body === this.activeBird.body || body.isStatic) continue;
            const dx = body.position.x - bx;
            const dy = body.position.y - by;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius && dist > 0) {
                const strength = forceMag * (1 - dist / radius);
                Matter.Body.applyForce(body, body.position, {
                    x: (dx / dist) * strength,
                    y: (dy / dist) * strength
                });
            }
        }

        // Play explosion animation at bird position
        const boom = this.add.sprite(bx, by, 'explosion').setScale(1.5);
        boom.play('explode');
        boom.once('animationcomplete', () => boom.destroy());

        // Wake everything so debris falls properly
        this.wakeAllBodies();

        // Remove the bird
        this.activeBird.destroy();
        this.activeBird = null;
        this.isBirdLaunched = false;
        this.stopTrail();
        this.stopFollowing();

        // Move on to next bird after a short delay
        this.time.delayedCall(2500, () => {
            this.onPostImpactComplete();
        });
    }


    stopFollowing() {
        this.cameras.main.stopFollow();
    }

    extendTrail(x, y) {
        this.trailPoints.push({ x, y });
        if (this.trailGraphics && this.trailPoints.length > 1) {
            this.trailGraphics.clear();
            this.trailGraphics.lineStyle(2, 0xffffff, 1);
            this.trailGraphics.strokePoints(this.trailPoints, false, false);
        }
    }

    onPostImpactComplete() {
        if (this.birdQueue.length > 0) {
            this.panToNextBird(this.slingX, this.slingY, () => {
                this.loadBirdOnSlingshot();
            });
        } else {
            this.phase = Phase.END;
        }
    }

    panToNextBird(x, y, callback) {
        this.cameras.main.pan(x, y, 500, 'Sine.easeInOut', true, (cam, progress) => {
            if (progress === 1 && callback) callback();
        });
    }

    updateWorldBounds() {
        const margin = 500; // extra space for flight trajectories
        const gameWidth = 1280;
        const gameHeight = 720;

        // Find extents from slingshot and blocks
        let minX = this.slingX - margin;
        let maxX = gameWidth;

        for (const block of this.blockArr) {
            if (block.x + block.displayWidth / 2 + margin > maxX) {
                maxX = block.x + block.displayWidth / 2 + margin;
            }
        }

        const worldX = Math.min(minX, 0);
        const worldY = 0;
        const worldWidth = Math.max(maxX - worldX, gameWidth);
        const worldHeight = gameHeight + margin;

        // Store for minimap use
        this.worldBoundsX = worldX;
        this.worldBoundsY = worldY;
        this.worldBoundsWidth = worldWidth;
        this.worldBoundsHeight = worldHeight;

        // Set camera bounds
        this.cameras.main.setBounds(worldX, worldY, worldWidth, worldHeight);

        // Set Matter.js world bounds
        this.matter.world.setBounds(worldX, worldY, worldWidth, worldHeight);

        // Resize background to cover the full world
        if (this.bgImage) {
            this.bgImage.setPosition(worldX, worldY);
            const texW = this.bgImage.texture.getSourceImage().width;
            const texH = this.bgImage.texture.getSourceImage().height;
            this.bgImage.setScale(worldWidth / texW, worldHeight / texH);
        }

        // Reposition ground to span the full world width
        if (this.ground) {
            const groundX = worldX + worldWidth / 2;
            this.ground.setPosition(groundX, 700);
            const groundTexW = this.ground.texture.getSourceImage().width;
            this.ground.setScale(worldWidth / groundTexW, 1);
        }

        // Update minimap bounds to match
        this.updateMinimapBounds();
    }


    createMinimap() {
        const gameWidth = 1280;
        const minimapWidth = 200;
        const minimapHeight = 150;

        this.minimapCamera = this.cameras.add(
            gameWidth - minimapWidth - 10, 10,
            minimapWidth, minimapHeight
        );
        this.minimapCamera.setBackgroundColor('rgba(0,0,0,0.3)');
        this.minimapCamera.setVisible(false);

        // Exclude UI text elements from minimap
        this.minimapCamera.ignore(this.spinText);
        this.minimapCamera.ignore(this.dropText);
    }

    showMinimap() {
        if (this.minimapCamera) {
            this.minimapCamera.setVisible(true);
        }
    }

    hideMinimap() {
        if (this.minimapCamera) {
            this.minimapCamera.setVisible(false);
        }
    }

    updateMinimapBounds() {
        if (!this.minimapCamera) return;

        // Use actual world bounds to determine what the minimap should show
        const worldX = this.worldBoundsX || 0;
        const worldY = this.worldBoundsY || 0;
        const worldW = this.worldBoundsWidth || 1280;
        const worldH = this.worldBoundsHeight || 720;

        // Zoom so the full world fits inside the 200×150 minimap viewport
        const zoomX = 200 / worldW;
        const zoomY = 150 / worldH;
        const zoom = Math.min(zoomX, zoomY) / 0.8;
        this.minimapCamera.setZoom(zoom);

        // Center the minimap camera on the center of the world bounds.
        // Phaser's centerOn sets scrollX = x - width/2, scrollY = y - height/2
        // and the worldView is then centered on (x, y) with size (width/zoom, height/zoom).
        this.minimapCamera.centerOn(
            worldX + worldW / 2,
            worldY + worldH / 2
        );
    }

    updateEnd(time, delta) {
        if (this.endHandled) return;
        this.endHandled = true;

        // Wait a moment for debris to settle, then show score
        this.time.delayedCall(1500, () => {
            const score = this.calculateScore();
            const { width, height } = this.cameras.main;
            const cx = this.cameras.main.scrollX + width / 2;
            const cy = this.cameras.main.scrollY + height / 2;

            // Dim overlay
            const overlay = this.add.rectangle(cx, cy, width, height, 0x000000, 0.55).setDepth(100);

            // Score text
            const scoreText = this.add.text(cx, cy - 40, `Score: ${score.toLocaleString()}`, {
                fontSize: '64px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#fbbf24',
                stroke: '#000',
                strokeThickness: 6
            }).setOrigin(0.5).setDepth(101);

            // Subtitle
            const sub = this.add.text(cx, cy + 40, 'Tap to return to menu', {
                fontSize: '28px',
                color: '#ffffff'
            }).setOrigin(0.5).setDepth(101);

            this.input.once('pointerdown', () => {
                this.scene.start('MenuScene');
            });
        });
    }
}
