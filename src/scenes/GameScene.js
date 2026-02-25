import { Player } from '../entities/Player.js';
import { Oni, Zombie } from '../entities/Enemy.js';
import { MagicSystem } from '../systems/MagicSystem.js';
import { Shrine } from '../entities/Shrine.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.lastCheckpoint = null;
    }

    preload() {
        // Personagem Heróico (Cavaleiro) - Azul escuro e cinza
        this.createPlaceholder('player_placeholder', 32, 64, '#2c3e50', '#95a5a6');

        // Terreno
        this.createPlaceholder('ground_tile', 32, 32, '#1a1a1a', '#333333');

        // Zombie (Verde pálido, lento)
        this.createPlaceholder('zombie_placeholder', 32, 55, '#7f8c8d', '#27ae60');

        // Oni (Maior e Vermelho)
        this.createPlaceholder('oni_placeholder', 48, 80, '#c0392b', '#000000');

        // Magias com brilho
        this.createPlaceholder('fire_placeholder', 20, 20, '#e67e22', '#f1c40f');
        this.createPlaceholder('stone_placeholder', 24, 24, '#34495e', '#bdc3c7');

        // Shrine (Santuário inspirado em Blasphemous/Souls)
        this.createPlaceholder('shrine_placeholder', 40, 60, '#f1c40f', '#d35400');
    }

    createPlaceholder(key, width, height, color, strokeColor = null) {
        let canvas = this.textures.createCanvas(key, width, height);
        let ctx = canvas.getContext();
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 4;
            ctx.strokeRect(0, 0, width, height);
        }
        canvas.refresh();
    }

    create() {
        // Mundo e Colisões
        this.platforms = this.physics.add.staticGroup();
        for (let i = 0; i < 150; i++) {
            this.platforms.create(i * 32, 688, 'ground_tile');
        }

        // Algumas plataformas para exploração
        this.platforms.create(800, 500, 'ground_tile');
        this.platforms.create(832, 500, 'ground_tile');
        this.platforms.create(1500, 450, 'ground_tile');

        // Checkpoints (Santuários)
        this.shrines = this.physics.add.staticGroup();
        this.shrine1 = new Shrine(this, 1200, 688 - 30);
        this.shrines.add(this.shrine1);

        // Player e Magia
        this.player = new Player(this, 200, 600);
        this.magicSystem = new MagicSystem(this, this.player);
        this.player.magicSystem = this.magicSystem;

        // Inimigos
        this.enemies = this.physics.add.group({ runChildUpdate: true });
        this.enemySpawnData = [
            { type: 'zombie', x: 600, y: 600 },
            { type: 'zombie', x: 900, y: 600 },
            { type: 'oni', x: 1800, y: 600 },
            { type: 'zombie', x: 2200, y: 600 }
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
        this.cameras.main.setBounds(0, 0, 4800, 720);
        this.physics.world.setBounds(0, 0, 4800, 720);
    }

    respawnEnemies() {
        this.enemies.clear(true, true);
        this.enemySpawnData.forEach(data => {
            let enemy;
            if (data.type === 'zombie') {
                enemy = new Zombie(this, data.x, data.y);
            } else {
                enemy = new Oni(this, data.x, data.y);
            }
            this.enemies.add(enemy);
        });
    }

    setupMagicCollisions() {
        // Fogo (Dano contínuo + Visual)
        this.physics.add.overlap(this.magicSystem.fireballs, this.enemies, (fire, enemy) => {
            enemy.takeDamage(8);
            // Pequena explosão visual ao atingir
            const boom = this.add.circle(fire.x, fire.y, 30, 0xe67e22, 0.6);
            this.tweens.add({ targets: boom, scale: 2, alpha: 0, duration: 300, onComplete: () => boom.destroy() });
        });

        // Pedra (Stun e Impacto visual)
        this.physics.add.overlap(this.magicSystem.stones, this.enemies, (stone, enemy) => {
            enemy.takeDamage(20, 1500); // 1.5s de stun
            const crack = this.add.rectangle(stone.x, stone.y, 50, 50, 0xbdc3c7, 0.5);
            this.tweens.add({ targets: crack, alpha: 0, duration: 400, onComplete: () => crack.destroy() });
            stone.destroy();
        });

        // Raio
        this.input.keyboard.on('keydown-TWO', () => {
            this.enemies.getChildren().forEach(enemy => {
                const distanceX = Math.abs(enemy.x - this.player.x);
                const sameSide = (this.player.flipX && enemy.x < this.player.x) || (!this.player.flipX && enemy.x > this.player.x);
                if (distanceX < 650 && sameSide && Math.abs(enemy.y - this.player.y) < 60) {
                    enemy.takeDamage(40);
                }
            });
        });
    }

    setupUI() {
        this.uiContainer = this.add.container(0, 0).setScrollFactor(0);

        this.add.text(20, 20, 'Shinobi Souls: Knight Edition', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setScrollFactor(0);
        this.add.text(20, 55, 'V: Descansar no Santuário | Z: Ataque | X: Dash | 1,2,3: Magias', { fontSize: '14px', fill: '#aaa' }).setScrollFactor(0);

        this.hpBar = this.add.rectangle(1100, 35, 150, 15, 0xc0392b).setScrollFactor(0);
        this.manaBar = this.add.rectangle(1100, 60, 150, 15, 0x2980b9).setScrollFactor(0);

        this.add.text(1050, 28, 'HP', { fontSize: '16px', fill: '#fff' }).setScrollFactor(0);
        this.add.text(1050, 53, 'MP', { fontSize: '16px', fill: '#fff' }).setScrollFactor(0);

        this.flaskText = this.add.text(1100, 85, `Frascos: ${this.player.flasks}`, { fontSize: '18px', fill: '#2ecc71' }).setScrollFactor(0);
    }

    update() {
        this.player.update();
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.update) {
                if (enemy instanceof Oni) enemy.update(this.player);
                else enemy.update();
            }
        });

        this.hpBar.width = (this.player.hp / this.player.maxHp) * 150;
        this.manaBar.width = (this.player.mana / this.player.maxMana) * 150;
        this.flaskText.setText(`Frascos: ${this.player.flasks}`);
    }
}
