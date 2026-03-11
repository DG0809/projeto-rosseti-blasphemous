export class MagicSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        // Grupos de projéteis
        this.fireballs = scene.physics.add.group();
        this.lightningBolts = scene.physics.add.group();
        this.stones = scene.physics.add.group();

        this.magicCosts = {
            fire: 30,
            lightning: 20,
            stone: 40
        };
    }

    castFire() {
        if (this.player.mana < this.magicCosts.fire) return;
        this.player.mana -= this.magicCosts.fire;

        const direction = this.player.flipX ? -1 : 1;
        const fire = this.scene.physics.add.sprite(this.player.x + (20 * direction), this.player.y - 30, 'fire_placeholder');

        this.fireballs.add(fire);
        fire.body.setAllowGravity(false);
        fire.setVelocityX(400 * direction);

        // Efeito de fogo (DoT simulado com timer)
        this.scene.time.delayedCall(1500, () => fire.destroy());
    }

    castLightning() {
        if (this.player.mana < this.magicCosts.lightning) return;
        this.player.mana -= this.magicCosts.lightning;

        const direction = this.player.flipX ? -1 : 1;
        const bolt = this.scene.add.rectangle(this.player.x + (640 * direction), this.player.y - 30, 1280, 10, 0xffff00);
        this.scene.physics.add.existing(bolt, true);

        this.scene.cameras.main.flash(100, 255, 255, 0);

        // Lógica de dano movida para o sistema
        this.scene.enemies.getChildren().forEach(enemy => {
            const distanceX = Math.abs(enemy.x - this.player.x);
            const sameSide = (this.player.flipX && enemy.x < this.player.x) || (!this.player.flipX && enemy.x > this.player.x);
            
            if (distanceX < 650 && sameSide && Math.abs(enemy.y - this.player.y) < 60) {
                enemy.takeDamage(40);
                
                // Pequeno efeito visual no inimigo atingido
                const hit = this.scene.add.circle(enemy.x, enemy.y, 20, 0xffff00, 0.8);
                this.scene.tweens.add({ targets: hit, scale: 2, alpha: 0, duration: 200, onComplete: () => hit.destroy() });
            }
        });

        this.scene.time.delayedCall(100, () => bolt.destroy());
    }

    castStone() {
        if (this.player.mana < this.magicCosts.stone) return;
        this.player.mana -= this.magicCosts.stone;

        const direction = this.player.flipX ? -1 : 1;
        const stone = this.scene.physics.add.sprite(this.player.x + (20 * direction), this.player.y - 40, 'stone_placeholder');

        this.stones.add(stone);
        stone.setVelocity(300 * direction, -200);
        stone.setAngularVelocity(300);
        stone.setBounce(0.2);

        this.scene.time.delayedCall(3000, () => stone.destroy());
    }

    update() {
        // Recuperação passiva de mana
        if (this.player.mana < this.player.maxMana) {
            this.player.mana += 0.1;
        }
    }
}
