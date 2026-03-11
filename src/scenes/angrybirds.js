export class Abirds extends Phaser.Scene {

    constructor() {
        super('Abirds');
    }

    preload() {
       this.load.image("bird","assets/bird.png");
       this.load.image("sling","assets/sling.png");
       this.load.image('bg', 'assets/angrybird_background.png');
       
       // 加载tetris方块贴图
       for(let i = 0; i < 7; i++) {
           this.load.image(`block${i}`, `assets/TetrisBlocks/BlockSprite${i}.png`);
       }
    }

    create() {
        // 增加重力
        this.matter.world.engine.gravity.y = 1.0;
        
        // 禁用睡眠模式，保持物理计算准确
        this.matter.world.engine.enableSleeping = false;

        // 背景
        this.bg = this.add.image(640, 360, "bg");
        this.bg.setScale(1.1);

        // 创建地面
        this.createGround();
        
        // 创建弹弓和小鸟
        this.createSlingshot();
        
        // 创建建筑
        this.createBuildings();
    }

    createGround() {
        this.ground = this.matter.add.rectangle(640, 650, 1280, 40, { 
            isStatic: true 
        });
    }

    createSlingshot() {
        // 弹弓位置
        this.slingX = 150;
        this.slingY = 580;
        
        // 弹弓图像
        this.sling = this.add.image(this.slingX, this.slingY, "sling");
        this.sling.setScale(0.25);

        // 小鸟设置
        this.totalBirds = 5;
        this.currentBirdIndex = 0;
        this.birds = [];
        
        // 创建所有小鸟
        for(let i = 0; i < this.totalBirds; i++) {
            let bird = this.matter.add.image(
                this.slingX - 60 - i * 30,
                this.slingY + 15, 
                "bird"
            );
            bird.setScale(0.25);
            bird.setStatic(true);
            bird.setBounce(0.3);
            bird.setFriction(0.5);
            bird.setFrictionAir(0.002);
            
            this.birds.push(bird);
        }

        // 准备第一只小鸟
        this.loadBirdToSlingshot(0);
        
        // 设置拖动事件
        this.setupDragEvents();
    }

    loadBirdToSlingshot(index) {
        if(index >= this.totalBirds) {
            console.log("所有小鸟已发射完毕！");
            return;
        }
        
        this.currentBird = this.birds[index];
        this.birdStartX = this.slingX;
        this.birdStartY = this.slingY - 25;
        
        // 确保小鸟是静态的
        this.currentBird.setStatic(true);
        this.currentBird.setPosition(this.birdStartX, this.birdStartY);
        this.currentBird.setInteractive();
        this.input.setDraggable(this.currentBird);
    }

    setupDragEvents() {
        // 拖动小鸟
        this.input.on("drag", (_pointer, gameObject, dragX, dragY) => {
            if(gameObject === this.currentBird) {
                // 直接设置位置，不检查静态状态
                gameObject.setPosition(dragX, dragY);
            }
        });

        // 释放小鸟
        this.input.on("dragend", (_pointer, gameObject) => {
            if(gameObject === this.currentBird) {
                // 计算拉伸距离和方向
                let dx = this.birdStartX - gameObject.x;
                let dy = this.birdStartY - gameObject.y;
                
                // 计算距离
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                // 只有拉伸距离大于10像素才发射
                if(distance > 10) {
                    // 先取消静态状态
                    gameObject.setStatic(false);
                    // 设置速度
                    gameObject.setVelocity(dx * 0.16, dy * 0.16);
                    // 禁用拖动
                    this.input.setDraggable(gameObject, false);
                    
                    // 准备下一只小鸟
                    this.currentBirdIndex++;
                    this.time.delayedCall(2000, () => {
                        this.loadBirdToSlingshot(this.currentBirdIndex);
                    });
                } else {
                    // 拉伸不够，返回原位
                    gameObject.setPosition(this.birdStartX, this.birdStartY);
                }
            }
        });
    }

    createBuildings() {
        this.buildingBlocks = [];
        
        // 创建4个建筑，高度递增
        this.buildingBlocks.push(...this.createBuilding(450, 600, 1));
        this.buildingBlocks.push(...this.createBuilding(650, 600, 2));
        this.buildingBlocks.push(...this.createBuilding(850, 600, 3));
        this.buildingBlocks.push(...this.createBuilding(1050, 600, 4));
    }

    createBuilding(x, y, height) {
        const blocks = [];
        const towerHeight = 2 + height;
        
        // 创建左右塔柱
        blocks.push(...this.createTower(x - 44, y, towerHeight, 0));
        blocks.push(...this.createTower(x + 44, y, towerHeight, 1));
        
        // 创建横梁（每2层加一个）
        for(let i = 2; i <= towerHeight; i += 2) {
            blocks.push(this.createBeam(x, y - 26 * i, 4));
        }
        
        // 顶部横梁
        blocks.push(this.createBeam(x, y - 26 * towerHeight, 4));
        
        // 创建金字塔顶部
        blocks.push(...this.createPyramid(x, y - 26 * towerHeight - 18));
        
        return blocks;
    }

    createTower(x, y, height, offset) {
        const blocks = [];
        const squareBlocks = [0, 1, 4, 6];
        
        for(let i = 0; i < height; i++) {
            let block = this.createBlock(
                x, 
                y - i * 26, 
                squareBlocks[(i + offset) % squareBlocks.length],
                26
            );
            blocks.push(block);
        }
        
        return blocks;
    }

    createBeam(x, y, widthMultiplier) {
        return this.matter.add.image(
            x, y, 'block4', null,
            {
                friction: 1.0,
                frictionStatic: 50,   // 极高的静摩擦力
                frictionAir: 0.1,     // 很高的空气阻力
                density: 0.001,
                restitution: 0.05,
                slop: 0.01
            }
        ).setDisplaySize(26 * widthMultiplier, 13);
    }

    createPyramid(x, y) {
        const blocks = [];
        const squareBlocks = [0, 1, 4, 6];
        
        // 底层3个
        for(let i = 0; i < 3; i++) {
            blocks.push(this.createBlock(
                x + (i - 1) * 23, 
                y, 
                squareBlocks[(i + 2) % squareBlocks.length],
                21
            ));
        }
        
        // 中层2个
        for(let i = 0; i < 2; i++) {
            blocks.push(this.createBlock(
                x + (i - 0.5) * 23, 
                y - 20, 
                squareBlocks[(i + 1) % squareBlocks.length],
                21
            ));
        }
        
        // 顶层1个三角形
        blocks.push(this.createBlock(x, y - 40, 3, 21));
        
        return blocks;
    }

    createBlock(x, y, blockType, size) {
        return this.matter.add.image(
            x, y, `block${blockType}`, null,
            {
                friction: 1.0,
                frictionStatic: 50,   // 极高的静摩擦力
                frictionAir: 0.1,     // 很高的空气阻力
                density: 0.001,
                restitution: 0.05,
                slop: 0.01
            }
        ).setDisplaySize(size, size);
    }

    update() {
        // 对所有建筑方块进行速度检查
        if(this.buildingBlocks) {
            this.buildingBlocks.forEach(block => {
                const body = block.body;
                
                // 如果横向速度很小，直接设为0
                if(Math.abs(body.velocity.x) < 1.0) {
                    block.setVelocityX(0);
                }
                
                // 如果纵向速度很小，也设为0
                if(Math.abs(body.velocity.y) < 1.0) {
                    block.setVelocityY(0);
                }
                
                // 如果角速度很小，停止旋转
                if(Math.abs(body.angularVelocity) < 0.05) {
                    block.setAngularVelocity(0);
                }
            });
        }
    }
    
}
