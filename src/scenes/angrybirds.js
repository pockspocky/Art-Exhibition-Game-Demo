export class Abirds extends Phaser.Scene {

    constructor() {
        super('ABirds');
    }

    preload() {
       this.load.image("bird","assets/bird.png");
       this.load.image("sling","assets/sling.png");
       this.load.image('bg', 'assets/angrybird_background.png');
    }

    create() {

        this.bg = this.add.image(640,360, "bg");
        this.bg.setScale(1.1);

        this.slingX = 300;

        this.slingY = 500;

        this.sling = this.add.image(this.slingX, this.slingY,"sling");
        this.sling.setScale(0.5);

        this.bird = this.matter.add.image(this.slingX, this.slingY, "bird");
        this.bird.setScale(0.3);

        this.bird.setInteractive();

        this.input.setDraggable(this.bird);
//小鸟可被鼠标拖动
        this.input.on("drag",(pointer, gameObject, dragX, dragY)=>{

            if(gameObject === this.bird){

                gameObject.setStatic(true);

                gameObject.setPosition(dragX, dragY);

    }
            
        });
this.matter.world.on('collisionstart', (event) => {
    event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;

        // 获取碰撞的物体
        const objA = bodyA.gameObject;
        const objB = bodyB.gameObject;

        // 检查是否是小鸟撞到了 science_room
        const isHit = (objA === this.bird && objB?.texture?.key === 'science_room') ||
                      (objB === this.bird && objA?.texture?.key === 'science_room');

        if (isHit) {
            const explosiveBlock = (objA === this.bird) ? objB : objA;
            this.handleExplosion(explosiveBlock);
        }
    });
});
//小鸟会有弹弓效应

        this.input.on("dragend",(pointer, gameObject)=>{

            if(gameObject === this.bird){

                gameObject.setStatic(false);

            let dx = this.slingX - gameObject.x;
            let dy = this.slingY - 150 - gameObject.y;

            gameObject.setVelocity(
                dx * 0.05,
                dy * 0.05
            );

    }
        });
//创建地面
        this.ground = this.matter.add.rectangle(640,700,1280,160,{
            isStatic: true
        })

//小鸟与地面碰撞
//设置反弹
        this.bird.setFriction(0.005);
        this.bird.setBounce(0.8);
//防止小鸟出屏幕
        
        
    }
// 复制这段代码放在 create 结束的大括号之后
    handleExplosion(block) {
        if (!block || !block.active) return;

        const { x, y } = block;

        // 1. 视觉效果：缩放并淡出
        this.tweens.add({
            targets: block,
            scale: 2,
            alpha: 0,
            duration: 100,
            onComplete: () => {
                // 2. 物理冲击：炸飞半径 400 内的所有非静态物体
                const explosionRadius = 400; 
                const allBodies = this.matter.world.localWorld.bodies;

                allBodies.forEach(body => {
                    // 排除掉地面（isStatic）和小鸟本身
                    if (body.gameObject && !body.isStatic && body.gameObject !== this.bird) {
                        const dist = Phaser.Math.Distance.Between(x, y, body.position.x, body.position.y);
                        
                        if (dist < explosionRadius) {
                            const angle = Phaser.Math.Angle.Between(x, y, body.position.x, body.position.y);
                            const force = (1 - dist / explosionRadius) * 0.15; 

                            this.matter.applyForce(body, {
                                x: Math.cos(angle) * force,
                                y: Math.sin(angle) * force
                            });
                        }
                    }
                });

                block.destroy(); // 销毁方块
            }
        });
    }
    update() {
        
    }
    
}
