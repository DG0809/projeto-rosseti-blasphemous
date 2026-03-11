export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.hp = 50;
        this.damage = 10;
        this.isDead = false;
        this.stunned = false;
        this.moveSpeed = 60;
        this.direction = 1;

        this.setCollideWorldBounds(true);
    }

    takeDamage(amount, stunDuration = 0) {
        if (this.isDead) return;

        this.hp -= amount;
        this.scene.cameras.main.shake(50, 0.005);
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());

        if (stunDuration > 0) {
            this.stunned = true;
            this.setVelocityX(0);
            this.scene.time.delayedCall(stunDuration, () => this.stunned = false);
        }

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.setAlpha(0.5);
        this.body.enable = false;
        this.scene.time.delayedCall(1000, () => this.destroy());
    }
}

export class Zombie extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'zombie_placeholder');
        this.hp = 40;
        this.moveSpeed = 60;
        this.aggroSpeed = 140;
        this.detectionRange = 300;

        // Timer para mudar de direção aleatoriamente quando em patrulha
        this.scene.time.addEvent({
            delay: Phaser.Math.Between(3000, 6000),
            callback: this.changeDirection,
            callbackScope: this,
            loop: true
        });
    }

    changeDirection() {
        if (this.isDead || this.stunned || this.isAggro) return;
        this.direction *= -1;
    }

    update(player) {
        if (this.isDead || this.stunned) return;

        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        if (distance < this.detectionRange && Math.abs(this.y - player.y) < 100) {
            // Mordida/Lunge do Zumbi
            this.isAggro = true;
            this.direction = player.x < this.x ? -1 : 1;
            this.setVelocityX(this.aggroSpeed * this.direction);
            this.setFlipX(this.direction < 0);

            // Pequeno salto se estiver muito perto
            if (distance < 80 && this.body.blocked.down) {
                this.setVelocityY(-200);
            }
        } else {
            this.isAggro = false;
            // Patrulha básica
            this.setVelocityX(this.moveSpeed * this.direction);
            this.setFlipX(this.direction < 0);
        }

        if (this.body.blocked.left) this.direction = 1;
        if (this.body.blocked.right) this.direction = -1;
    }
}

export class Oni extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'oni_placeholder');
        this.hp = 120; // Mais vida para o Oni
        this.moveSpeed = 100;
        this.detectionRange = 450;
        this.isAttacking = false;
        this.attackCooldown = false;
    }

    update(player) {
        if (this.isDead || this.stunned || this.isAttacking) return;

        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        if (distance < this.detectionRange) {
            const direction = player.x < this.x ? -1 : 1;
            this.setFlipX(direction < 0);

            // Ataque Smash se estiver perto
            if (distance < 120 && !this.attackCooldown) {
                this.smashAttack(player);
            } else {
                this.setVelocityX(this.moveSpeed * direction);
            }
        } else {
            this.setVelocityX(0);
        }
    }

    smashAttack(player) {
        this.isAttacking = true;
        this.attackCooldown = true;
        this.setVelocityX(0);

        // Feedback Visual de Carregamento
        this.setTint(0xff8888);

        this.scene.time.delayedCall(600, () => {
            if (this.isDead) return;

            this.clearTint();
            // Impacto do Smash
            const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            if (distance < 150) {
                player.takeDamage(25);
                // Knockback no player
                const knockDir = player.x < this.x ? -1 : 1;
                player.setVelocityX(400 * knockDir);
                player.setVelocityY(-200);
            }

            // Efeito de poeira/onda de choque visual (usando círculo temporário)
            const shockwave = this.scene.add.circle(this.x, this.y + 30, 10, 0xffffff, 0.5);
            this.scene.tweens.add({
                targets: shockwave,
                scale: 15,
                alpha: 0,
                duration: 400,
                onComplete: () => shockwave.destroy()
            });

            this.scene.cameras.main.shake(200, 0.01);

            this.scene.time.delayedCall(400, () => {
                this.isAttacking = false;
            });

            // Cooldown entre ataques
            this.scene.time.delayedCall(2000, () => {
                this.attackCooldown = false;
            });
        });
    }
}
