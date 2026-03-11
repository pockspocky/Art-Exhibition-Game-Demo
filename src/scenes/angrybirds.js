export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
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

            gameObject.setVelocity(dx*3, dy*3);
        });
//创建地面
        this.ground = this.matter.add.staticImage(640,700,null)
            .setDisplaySize(1280,40)
            .refreshBody();

//小鸟与地面碰撞
        this.matter.add.collider(this.bird, this.ground);
//设置反弹
        this.bird.setBounce(0.7);
//防止小鸟出屏幕
        this.bird.setCollideWorldBounds(true);
        
    }

    update() {
        
    }
    
}
