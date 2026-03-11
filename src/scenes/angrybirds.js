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

    update() {
        
    }
    
}
