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
        this.pendingSticky = new Map();
        this.stickingDelay = 10;
        this.stickyGroups = [];

        this.matter.world.engine.enableSleeping = true;

        const ground = this.matter.add.sprite(640, 700, 'ground').setScale(10, 1).setStatic(true).setBounce(0);

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
        this.currentBlock = this.matter.add.sprite(640, 100, `block${blockType}`).setScale(1.2);
        this.currentBlock.setStatic(true);
        this.currentBlock.setBounce(0);
        this.currentBlock.setInteractive(); // Make it interactive
        this.currentBlock.setSleepThreshold(0);
        this.currentBlock.setMass(0.0001);
        this.currentBlock.setFriction(0.0001);
        
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
        this.syncStickyGroups();
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
        // Don't override with setPosition — let Matter decide the center
        const compound = Matter.Body.create({ parts });
        return compound;
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


}
