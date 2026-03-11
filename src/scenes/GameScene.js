import { Player } from '../entities/Player.js';
import { Oni, Zombie } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { MagicSystem } from '../systems/MagicSystem.js';
import { Shrine } from '../entities/Shrine.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.lastCheckpoint = null;
    }

    preload() {
        // Personagem Heróico (Cavaleiro) - Azul Meia-noite e Aço
        this.createPlaceholder('player_placeholder', 32, 64, '#1a2533', '#4a627a');

        // Terreno - Rocha Vulcânica / Escura
        this.createPlaceholder('ground_tile', 32, 32, '#0f0f12', '#1c1c21');

        // Zombie (Cinza cadavérico e túnica podre)
        this.createPlaceholder('zombie_placeholder', 32, 55, '#3b4d42', '#1a241e');

        // Oni (Carmim profundo e chifres negros)
        this.createPlaceholder('oni_placeholder', 48, 80, '#6d1c1c', '#111111');

        // Magias
        this.createPlaceholder('fire_placeholder', 20, 20, '#d35400', '#f39c12');
        this.createPlaceholder('stone_placeholder', 24, 24, '#2c3e50', '#7f8c8d');

        // Shrine (Ouro Velho e Chamas)
        this.createPlaceholder('shrine_placeholder', 50, 80, '#2c3e50', '#b8860b');
        
        // Boss (Estilo Gótico/Sombrio)
        this.createPlaceholder('boss_placeholder', 160, 240, '#2c003e', '#ff0000');
        
        // Background elements
        this.createPlaceholder('bg_mountain', 400, 300, '#1a1a1a', '#000000');
    }

    createPlaceholder(key, width, height, color, strokeColor = null) {
        let canvas = this.textures.createCanvas(key, width, height);
        let ctx = canvas.getContext();

        let grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, color);
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;

        ctx.fillRect(0, 0, width, height);
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 4;
            ctx.strokeRect(2, 2, width - 4, height - 4);
        }
        canvas.refresh();
    }

    create() {
        // Background Parallax
        this.createParallaxBackground();

        // Mundo e Colisões
        this.platforms = this.physics.add.staticGroup();
        
        // Chão principal
        for (let i = 0; i < 200; i++) {
            this.platforms.create(i * 32, 688, 'ground_tile');
        }

        // Design de nível mais complexo
        this.platforms.create(800, 520, 'ground_tile');
        this.platforms.create(832, 520, 'ground_tile');
        this.platforms.create(864, 520, 'ground_tile');
        
        this.platforms.create(1100, 400, 'ground_tile');
        this.platforms.create(1132, 400, 'ground_tile');
        
        this.platforms.create(1500, 500, 'ground_tile');
        this.platforms.create(1532, 500, 'ground_tile');
        this.platforms.create(1564, 500, 'ground_tile');
        this.platforms.create(1596, 500, 'ground_tile');

        this.platforms.create(1800, 350, 'ground_tile');
        this.platforms.create(2100, 500, 'ground_tile');
        this.platforms.create(2400, 400, 'ground_tile');

        // Checkpoints (Santuários)
        this.shrines = this.physics.add.staticGroup();
        this.shrine1 = new Shrine(this, 1200, 688 - 30);
        this.shrines.add(this.shrine1);
        
        this.shrine2 = new Shrine(this, 3000, 688 - 30);
        this.shrines.add(this.shrine2);

        // Player e Magia
        this.player = new Player(this, 200, 600);
        this.magicSystem = new MagicSystem(this, this.player);
        this.player.magicSystem = this.magicSystem;

        // Inimigos
        this.enemies = this.physics.add.group({ runChildUpdate: true });
        this.enemySpawnData = [
            { type: 'zombie', x: 600, y: 600 },
            { type: 'zombie', x: 950, y: 600 },
            { type: 'zombie', x: 1400, y: 600 },
            { type: 'oni', x: 1800, y: 600 },
            { type: 'zombie', x: 2200, y: 600 },
            { type: 'oni', x: 2600, y: 600 },
            { type: 'zombie', x: 3200, y: 600 },
            { type: 'oni', x: 3800, y: 600 },
            { type: 'boss', x: 5500, y: 500 }
        ];
        this.respawnEnemies();

        // Configurações de Física
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);

        // Interação com Inimigos (Ataque e Dano)
        this.physics.add.overlap(this.player.attackHitbox, this.enemies, (hitbox, enemy) => {
            if (this.player.isAttacking) {
                enemy.takeDamage(25);
            }
        });

        this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
            if (!this.player.isAttacking) {
                this.player.takeDamage(10);
            }
        });

        // Interação com Santuários
        this.physics.add.overlap(this.player, this.shrines, (p, shrine) => {
            if (Phaser.Input.Keyboard.JustDown(this.player.keyV)) {
                shrine.rest(this.player);
            }
        });

        this.setupMagicCollisions();
        this.setupUI();

        // Câmera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, 6400, 720);
        this.physics.world.setBounds(0, 0, 6400, 720);
    }

    createParallaxBackground() {
        // Céu Noturno
        this.add.rectangle(0, 0, 6400, 720, 0x050508).setOrigin(0).setScrollFactor(0);
        
        // Montanhas Distantes (Parallax lenta)
        for (let i = 0; i < 20; i++) {
            this.add.image(i * 400, 450, 'bg_mountain')
                .setOrigin(0, 1)
                .setScrollFactor(0.2)
                .setTint(0x1a1a2e)
                .setAlpha(0.4);
        }

        // Montanhas Médias (Parallax média)
        for (let i = 0; i < 15; i++) {
            this.add.image(i * 500, 600, 'bg_mountain')
                .setOrigin(0, 1)
                .setScrollFactor(0.5)
                .setTint(0x111111)
                .setAlpha(0.7);
        }
    }

    respawnEnemies() {
        this.enemies.clear(true, true);
        this.enemySpawnData.forEach(data => {
            let enemy;
            if (data.type === 'zombie') {
                enemy = new Zombie(this, data.x, data.y);
            } else if (data.type === 'oni') {
                enemy = new Oni(this, data.x, data.y);
            } else if (data.type === 'boss') {
                enemy = new Boss(this, data.x, data.y);
            }
            this.enemies.add(enemy);
        });
    }

    setupMagicCollisions() {
        // Fogo (Dano contínuo + Visual)
        this.physics.add.overlap(this.magicSystem.fireballs, this.enemies, (fire, enemy) => {
            enemy.takeDamage(8);
            const boom = this.add.circle(fire.x, fire.y, 30, 0xe67e22, 0.6);
            this.tweens.add({ targets: boom, scale: 2, alpha: 0, duration: 300, onComplete: () => boom.destroy() });
        });

        // Pedra (Stun e Impacto visual)
        this.physics.add.overlap(this.magicSystem.stones, this.enemies, (stone, enemy) => {
            enemy.takeDamage(20, 1500); 
            const crack = this.add.rectangle(stone.x, stone.y, 50, 50, 0xbdc3c7, 0.5);
            this.tweens.add({ targets: crack, alpha: 0, duration: 400, onComplete: () => crack.destroy() });
            stone.destroy();
        });
    }

    setupUI() {
        this.uiContainer = this.add.container(0, 0).setScrollFactor(0);

        this.add.text(20, 20, 'Rosseti Blasphemous: Penitência', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setScrollFactor(0);
        this.add.text(20, 55, 'V: Descansar | Z: Ataque | X: Dash | C: Cura | 1,2,3: Magias', { fontSize: '14px', fill: '#aaa' }).setScrollFactor(0);

        // Barras de Status
        const barBgWidth = 200;
        this.add.rectangle(1050, 35, barBgWidth, 20, 0x000000, 0.5).setOrigin(0).setScrollFactor(0);
        this.add.rectangle(1050, 60, barBgWidth, 20, 0x000000, 0.5).setOrigin(0).setScrollFactor(0);

        this.hpBar = this.add.rectangle(1050, 35, barBgWidth, 20, 0xc0392b).setOrigin(0).setScrollFactor(0);
        this.manaBar = this.add.rectangle(1050, 60, barBgWidth, 20, 0x2980b9).setOrigin(0).setScrollFactor(0);

        this.add.text(1020, 35, 'HP', { fontSize: '16px', fill: '#fff' }).setScrollFactor(0);
        this.add.text(1020, 60, 'MP', { fontSize: '16px', fill: '#fff' }).setScrollFactor(0);

        this.flaskText = this.add.text(1050, 90, `Estus: ${this.player.flasks}`, { fontSize: '18px', fill: '#2ecc71', fontStyle: 'bold' }).setScrollFactor(0);
    }

    showVictoryScreen() {
        // Overlay de tela cheia
        const overlay = this.add.rectangle(0, 0, 6400, 720, 0x000000, 0.8).setOrigin(0).setScrollFactor(0).setDepth(2000);
        
        // Texto de Vitória (Estilo Blasphemous)
        const victoryText = this.add.text(640, 300, 'PENITÊNCIA CONCLUÍDA', { 
            fontSize: '72px', 
            fill: '#e67e22', 
            fontStyle: 'bold',
            fontFamily: 'Georgia, serif',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001).setAlpha(0);

        this.tweens.add({
            targets: victoryText,
            alpha: 1,
            y: 280,
            duration: 2000,
            ease: 'Power2'
        });

        // Botão de Retorno
        const restartBtn = this.add.text(640, 450, 'RECOMEÇAR JORNADA', {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();

        restartBtn.on('pointerover', () => restartBtn.setStyle({ fill: '#ff0' }));
        restartBtn.on('pointerout', () => restartBtn.setStyle({ fill: '#fff' }));
        restartBtn.on('pointerdown', () => this.scene.restart());

        // Créditos rápidos
        this.add.text(640, 650, 'Desenvolvido por Rosseti & Antigravity AI', { 
            fontSize: '16px', 
            fill: '#888' 
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);
    }

    update() {
        this.player.update();
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.update) {
                enemy.update(this.player);
            }
        });

        this.hpBar.width = Math.max(0, (this.player.hp / this.player.maxHp) * 200);
        this.manaBar.width = Math.max(0, (this.player.mana / this.player.maxMana) * 200);
        this.flaskText.setText(`Estus: ${this.player.flasks}`);
    }
}
