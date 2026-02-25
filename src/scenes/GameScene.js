import { Player } from '../entities/Player.js';
import { Oni } from '../entities/Enemy.js';
import { MagicSystem } from '../systems/MagicSystem.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // Criando placeholders coloridos para teste
        this.createPlaceholder('player_placeholder', 32, 64, '#3498db');
        this.createPlaceholder('ground_tile', 32, 32, '#2c3e50', '#27ae60');
        this.createPlaceholder('oni_placeholder', 48, 80, '#e74c3c');
        this.createPlaceholder('fire_placeholder', 20, 20, '#f35400');
        this.createPlaceholder('stone_placeholder', 24, 24, '#7f8c8d');
    }

    createPlaceholder(key, width, height, color, strokeColor = null) {
        let canvas = this.textures.createCanvas(key, width, height);
        let ctx = canvas.getContext();
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.strokeRect(0, 0, width, height);
        }
        canvas.refresh();
    }

    create() {
        // Chão e mundo
        this.platforms = this.physics.add.staticGroup();
        for (let i = 0; i < 100; i++) {
            this.platforms.create(i * 32, 688, 'ground_tile');
        }
        this.platforms.create(600, 500, 'ground_tile');
        this.platforms.create(632, 500, 'ground_tile');
        this.platforms.create(664, 500, 'ground_tile');

        // Player
        this.player = new Player(this, 100, 450);
        this.magicSystem = new MagicSystem(this, this.player);
        this.player.magicSystem = this.magicSystem;

        // Inimigos
        this.enemies = this.physics.add.group({ runChildUpdate: true });
        this.spawnOni(800, 600);
        this.spawnOni(1200, 600);

        // Colisões
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);

        // Combate: Player Ataca Inimigo
        this.physics.add.overlap(this.player, this.enemies, (p, e) => {
            if (this.player.isAttacking) {
                e.takeDamage(20);
            } else {
                this.player.takeDamage(5); // Inimigo dá dano no contato se player não atacar
            }
        });

        // Colisões de Magia
        this.setupMagicCollisions();

        // UI
        this.setupUI();

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, 3200, 720);
        this.physics.world.setBounds(0, 0, 3200, 720);
    }

    spawnOni(x, y) {
        const oni = new Oni(this, x, y);
        this.enemies.add(oni);
    }

    setupMagicCollisions() {
        // Fogo (DoT)
        this.physics.add.overlap(this.magicSystem.fireballs, this.enemies, (fire, enemy) => {
            enemy.takeDamage(5); // Fogo dá pouco dano mas pode ser contínuo
        });

        // Pedra (Stun pesado)
        this.physics.add.overlap(this.magicSystem.stones, this.enemies, (stone, enemy) => {
            enemy.takeDamage(15, 1000); // 1s de stun
            stone.destroy();
        });

        // Raio (Dano alto, atravessa)
        // Como o raio é um retângulo instantâneo, usamos uma lógica diferente
        this.input.keyboard.on('keydown-TWO', () => {
            this.enemies.getChildren().forEach(enemy => {
                const distanceX = Math.abs(enemy.x - this.player.x);
                const sameSide = (this.player.flipX && enemy.x < this.player.x) || (!this.player.flipX && enemy.x > this.player.x);
                if (distanceX < 600 && sameSide && Math.abs(enemy.y - this.player.y) < 50) {
                    enemy.takeDamage(30);
                }
            });
        });
    }

    setupUI() {
        this.add.text(16, 16, 'Shinobi Souls - Alpha Test', { fontSize: '24px', fill: '#fff' }).setScrollFactor(0);
        this.add.text(16, 50, 'Z: Ataque | X: Dash | 1, 2, 3: Magias | C: Curar', { fontSize: '16px', fill: '#fff' }).setScrollFactor(0);

        this.hpBar = this.add.rectangle(1100, 30, 150, 20, 0xff0000).setScrollFactor(0);
        this.manaBar = this.add.rectangle(1100, 60, 150, 20, 0x3498db).setScrollFactor(0);

        this.add.text(1020, 22, 'HP', { fontSize: '18px', fill: '#fff' }).setScrollFactor(0);
        this.add.text(1020, 52, 'MP', { fontSize: '18px', fill: '#fff' }).setScrollFactor(0);

        this.flaskText = this.add.text(1100, 90, `Frascos: ${this.player.flasks}`, { fontSize: '20px', fill: '#00ff00' }).setScrollFactor(0);
    }

    update() {
        this.player.update();
        this.enemies.getChildren().forEach(enemy => enemy.update(this.player));

        // Atualizar UI
        this.hpBar.width = (this.player.hp / this.player.maxHp) * 150;
        this.manaBar.width = (this.player.mana / this.player.maxMana) * 150;
        this.flaskText.setText(`Frascos: ${this.player.flasks}`);
    }
}
