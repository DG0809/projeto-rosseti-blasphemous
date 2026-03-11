import { Enemy } from './Enemy.js';

export class Boss extends Enemy {
    constructor(scene, x, y) {
        // Estilo Gótico/Sombrio para o Boss
        scene.createPlaceholder('boss_placeholder', 160, 240, '#2c003e', '#ff0000');
        super(scene, x, y, 'boss_placeholder');
        
        this.hp = 5000;
        this.maxHp = 5000;
        this.moveSpeed = 70;
        this.detectionRange = 1200;
        this.isAttacking = false;
        this.attackCooldown = false;
        this.isAggro = false;
        
        this.setScale(1.5); // Escala Visual 2.5x a 3x maior (ajuste proporcional)
        this.body.setSize(140, 220);
        
        // Imunidade a Stun
        this.stunImmune = true; 
        
        this.setupBossUI();
    }

    setupBossUI() {
        // Barra no topo agora
        this.bossHpBg = this.scene.add.rectangle(640, 60, 900, 30, 0x000000, 0.7).setScrollFactor(0).setDepth(100).setVisible(false).setStrokeStyle(2, 0x555555);
        this.bossHpFill = this.scene.add.rectangle(190, 60, 900, 30, 0x990000).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101).setVisible(false);
        
        this.bossName = this.scene.add.text(640, 30, 'PENITENTE DO ABISMO, O REI ONI', { 
            fontSize: '28px', 
            fill: '#ff0000', 
            fontStyle: 'bold',
            fontFamily: 'Georgia, serif',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(102).setVisible(false);
    }

    takeDamage(amount, stunDuration = 0) {
        // Override para ignorar stun
        super.takeDamage(amount, 0); 
    }

    update(player) {
        if (this.isDead) return;

        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // Ativação por Trigger Zone (Área de Arena)
        if (!this.isAggro && distance < 800) {
            this.isAggro = true;
            this.bossHpBg.setVisible(true);
            this.bossHpFill.setVisible(true);
            this.bossName.setVisible(true);
            
            // Música ou efeitos podem ser adicionados aqui
            this.scene.cameras.main.shake(500, 0.01);
        }

        if (this.isAggro) {
            this.bossHpFill.width = Math.max(0, (this.hp / this.maxHp) * 900);

            const direction = player.x < this.x ? -1 : 1;
            this.setFlipX(direction < 0);

            if (distance < 250 && !this.attackCooldown) {
                this.bossAttack(player);
            } else if (!this.isAttacking) {
                this.setVelocityX(this.moveSpeed * direction);
            }
        }
    }

    bossAttack(player) {
        this.isAttacking = true;
        this.attackCooldown = true;
        this.setVelocityX(0);

        this.setTint(0xff0000);
        
        this.scene.time.delayedCall(1000, () => {
            if (this.isDead) return;
            this.clearTint();
            
            this.scene.cameras.main.shake(400, 0.02);
            
            const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            if (distance < 350) {
                player.takeDamage(25 * 2.5); // Dano 2.5x maior (base era 10, mas player.takeDamage usa amount)
                // Knockback massivo
                const dir = player.x < this.x ? -1 : 1;
                player.setVelocityX(600 * dir);
                player.setVelocityY(-300);
            }

            const blast = this.scene.add.circle(this.x, this.y + 100, 60, 0xff0000, 0.4);
            this.scene.tweens.add({
                targets: blast,
                scale: 10,
                alpha: 0,
                duration: 800,
                onComplete: () => blast.destroy()
            });

            this.scene.time.delayedCall(1200, () => this.isAttacking = false);
            this.scene.time.delayedCall(3500, () => this.attackCooldown = false);
        });
    }

    die() {
        this.isDead = true;
        this.setVelocity(0, 0);
        this.bossHpBg.setVisible(false);
        this.bossHpFill.setVisible(false);
        
        this.setTint(0x000000);
        this.scene.cameras.main.shake(1000, 0.03);

        this.scene.time.delayedCall(2000, () => {
            this.scene.showVictoryScreen();
            this.destroy();
        });
    }
}
