export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this.showRules = false;
  }

  preload() {
    // 如果有图片资源可以在这里加载
  }

  create() {
    const { width, height } = this.cameras.main;

    // 创建背景渐变效果
    this.createBackground(width, height);

    // 创建浮动云朵装饰
    this.createClouds(width, height);

    // 创建标题
    this.createTitle(width);

    // 创建按钮组
    this.createButtons(width, height);

    // 创建装饰性emoji
    this.createDecorations(width, height);
  }

  createBackground(width, height) {
    // 创建渐变背景 (从天蓝到绿色)
    const graphics = this.add.graphics();

    // 天空部分
    graphics.fillGradientStyle(0x7dd3fc, 0x7dd3fc, 0xbae6fd, 0xbae6fd, 1);
    graphics.fillRect(0, 0, width, height * 0.7);

    // 地面部分
    graphics.fillGradientStyle(0xbae6fd, 0xbae6fd, 0xbbf7d0, 0xbbf7d0, 1);
    graphics.fillRect(0, height * 0.7, width, height * 0.3);
  }

  createClouds(width, height) {
    // 创建3个浮动的云朵
    const cloud1 = this.add.circle(-50, height * 0.1, 80, 0xffffff, 0.7);
    cloud1.setBlendMode(Phaser.BlendModes.NORMAL);
    this.tweens.add({
      targets: cloud1,
      x: width + 100,
      duration: 30000,
      repeat: -1,
      ease: 'Linear'
    });

    const cloud2 = this.add.circle(width + 50, height * 0.3, 60, 0xffffff, 0.6);
    this.tweens.add({
      targets: cloud2,
      x: -100,
      duration: 25000,
      repeat: -1,
      ease: 'Linear'
    });

    const cloud3 = this.add.circle(-50, height * 0.5, 70, 0xffffff, 0.5);
    this.tweens.add({
      targets: cloud3,
      x: width + 100,
      duration: 35000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  createTitle(width) {
    // 创建"ANGRY"文字
    const angryText = this.add.text(width / 2, 150, 'ANGRY', {
      fontSize: '96px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#dc2626',
      stroke: '#8B0000',
      strokeThickness: 8,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 创建"WAPREP"文字
    const waprepText = this.add.text(width / 2, 250, 'WAPREP', {
      fontSize: '96px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#fbbf24',
      stroke: '#B8860B',
      strokeThickness: 8,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 添加标题动画
    this.tweens.add({
      targets: [angryText, waprepText],
      y: '+=10',
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createButtons(width, height) {
    const centerX = width / 2;
    const startY = height / 2 + 50;
    const buttonSpacing = 100;

    // 开始游戏按钮
    const startButton = this.createButton(
      centerX,
      startY,
      '🎮 Start Game',
      0x22c55e,
      0x16a34a,
      () => this.handleStartGame()
    );

    // 游戏规则按钮
    const rulesButton = this.createButton(
      centerX,
      startY + buttonSpacing,
      '📖 Game Rules',
      0x3b82f6,
      0x2563eb,
      () => this.toggleRules()
    );

    // 添加按钮入场动画
    [startButton, rulesButton].forEach((btn, index) => {
      btn.container.setAlpha(0);
      btn.container.x = -300;
      this.tweens.add({
        targets: btn.container,
        x: centerX,
        alpha: 1,
        duration: 500,
        delay: 300 + index * 200,
        ease: 'Back.easeOut'
      });
    });
  }

  createButton(x, y, text, colorTop, colorBottom, onClick) {
    const container = this.add.container(x, y);

    // 创建按钮背景（模拟渐变效果）
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(colorTop, 1);
    buttonBg.fillRoundedRect(-200, -30, 400, 60, 20);

    const buttonShadow = this.add.graphics();
    buttonShadow.fillStyle(colorBottom, 1);
    buttonShadow.fillRoundedRect(-200, -25, 400, 60, 20);

    // 创建按钮文字
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([buttonShadow, buttonBg, buttonText]);
    container.setSize(400, 60);

    // 设置交互
    const hitArea = new Phaser.Geom.Rectangle(-200, -30, 400, 60);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        ease: 'Back.easeOut'
      });
    });

    container.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 200
      });
    });

    container.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: onClick
      });
    });

    return { container, text: buttonText, bg: buttonBg };
  }

  createDecorations(width, height) {
    // 装饰性小鸟图标
    const bird1 = this.add.text(width - 100, 150, '🐦', {
      fontSize: '64px'
    }).setOrigin(0.5);

    const bird2 = this.add.text(100, height - 200, '🐤', {
      fontSize: '56px'
    }).setOrigin(0.5);

    // 添加浮动动画
    this.tweens.add({
      targets: bird1,
      y: '+=20',
      rotation: 0.2,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: bird2,
      y: '+=15',
      rotation: -0.2,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  toggleRules() {
    if (this.showRules) {
      this.hideRules();
    } else {
      this.displayRules();
    }
  }

  displayRules() {
    this.showRules = true;
    const { width, height } = this.cameras.main;

    // 创建半透明背景遮罩
    this.rulesOverlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.6
    ).setInteractive();

    this.rulesOverlay.on('pointerdown', () => this.hideRules());

    // 创建规则弹窗容器
    this.rulesContainer = this.add.container(width / 2, height / 2);

    // 弹窗背景
    const modalBg = this.add.graphics();
    modalBg.fillStyle(0xffffff, 1);
    modalBg.fillRoundedRect(-400, -300, 800, 600, 30);

    // 标题
    const title = this.add.text(0, -250, 'Game Rules', {
      fontSize: '48px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#dc2626'
    }).setOrigin(0.5);

    // Build Phase 区域
    const buildPhaseBg = this.add.graphics();
    buildPhaseBg.fillStyle(0xdbeafe, 1);
    buildPhaseBg.lineStyle(3, 0x93c5fd);
    buildPhaseBg.fillRoundedRect(-350, -180, 700, 180, 15);
    buildPhaseBg.strokeRoundedRect(-350, -180, 700, 180, 15);

    const buildPhaseTitle = this.add.text(-330, -160, '🏗️ Build Phase', {
      fontSize: '28px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#1e40af'
    });

    const buildRule1 = this.add.text(-330, -120, '🖱️ Click with your mouse to have the blocks move with you', {
      fontSize: '16px',
      color: '#1f2937',
      wordWrap: { width: 650 }
    });

    const buildRule2 = this.add.text(-330, -80, '🔄 Press R to change the orientation of blocks', {
      fontSize: '16px',
      color: '#1f2937'
    });

    const buildRule3 = this.add.text(-330, -40, '⬇️ Left click to drop blocks and watch them fall!', {
      fontSize: '16px',
      color: '#1f2937'
    });

    // Destroy Phase 区域
    const destroyPhaseBg = this.add.graphics();
    destroyPhaseBg.fillStyle(0xfee2e2, 1);
    destroyPhaseBg.lineStyle(3, 0xfca5a5);
    destroyPhaseBg.fillRoundedRect(-350, 20, 700, 140, 15);
    destroyPhaseBg.strokeRoundedRect(-350, 20, 700, 140, 15);

    const destroyPhaseTitle = this.add.text(-330, 40, '💥 Destroy Phase', {
      fontSize: '28px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#991b1b'
    });

    const destroyRule1 = this.add.text(-330, 80, '🎯 Launch Waprep student and staff heads to destroy the school!', {
      fontSize: '18px',
      color: '#1f2937'
    });

    const destroyRule2 = this.add.text(-330, 115, '🏆 Demolish all structures to win the game! 💪', {
      fontSize: '18px',
      color: '#1f2937'
    });

    // 关闭按钮
    const closeButton = this.createButton(0, 230, 'Got it! 🚀', 0x22c55e, 0x16a34a, () => this.hideRules());
    closeButton.container.setScale(0.8);

    this.rulesContainer.add([
      modalBg,
      title,
      buildPhaseBg,
      buildPhaseTitle,
      buildRule1,
      buildRule2,
      buildRule3,
      destroyPhaseBg,
      destroyPhaseTitle,
      destroyRule1,
      destroyRule2,
      closeButton.container
    ]);

    // 弹窗出现动画
    this.rulesOverlay.setAlpha(0);
    this.rulesContainer.setScale(0.8);
    this.rulesContainer.setAlpha(0);

    this.tweens.add({
      targets: this.rulesOverlay,
      alpha: 0.6,
      duration: 300
    });

    this.tweens.add({
      targets: this.rulesContainer,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
  }

  hideRules() {
    if (!this.showRules) return;

    this.tweens.add({
      targets: [this.rulesOverlay, this.rulesContainer],
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.rulesOverlay.destroy();
        this.rulesContainer.destroy();
        this.showRules = false;
      }
    });
  }

  handleStartGame() {
    console.log('Start Game');
    this.scene.start('MergedScene', { blockLimit: 25, birdCount: 5, slingshotOffsetX: 300 });
  }

}
