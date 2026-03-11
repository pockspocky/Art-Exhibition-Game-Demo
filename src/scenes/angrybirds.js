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

        this.slingX = 200;

        this.slingY = 400;

        this.sling = this.add.image(this.slingX, this.slingY,"sling");

        this.bird = this.matter.add.image(this.slingX, this.slingY, "bird");

        this.bird.setInteractive();

        this.input.setDraggable(this.bird);
//小鸟可被鼠标拖动
        this.input.on("drag",(pointer, gameObject, dragX, dragY)=>{

            gameObject.x = dragX;
            gameObject.y = dragY;
            
        });
//小鸟会有弹弓效应
        this.input.on("dragend",(pointer, gameObject)=>{

            let dx = this.slingX - gameObject.x;
            let dy = this.slingY - gameObject.y;

            gameObject.setVelocity({
                x: dx * 0.0005,
                y: dy * 0.0005
            });
        });
//创建地面
        this.ground = this.matter.add.rectangle(640,700,1280,40,{
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
