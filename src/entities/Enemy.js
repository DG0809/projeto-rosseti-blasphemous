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
        this.moveSpeed = 50;

        // Timer para mudar de direção aleatoriamente
        this.scene.time.addEvent({
            delay: Phaser.Math.Between(2000, 5000),
            callback: this.changeDirection,
            callbackScope: this,
            loop: true
        });
    }

    changeDirection() {
        if (this.isDead || this.stunned) return;
        this.direction *= -1;
    }

    update() {
        if (this.isDead || this.stunned) return;

        // Patrulha básica de um lado para o outro
        this.setVelocityX(this.moveSpeed * this.direction);
        this.setFlipX(this.direction < 0);

        // Se bater em parede, inverte
        if (this.body.blocked.left) this.direction = 1;
        if (this.body.blocked.right) this.direction = -1;
    }
}

export class Oni extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'oni_placeholder');
        this.hp = 80;
        this.moveSpeed = 100;
        this.detectionRange = 400;
    }

    update(player) {
        if (this.isDead || this.stunned) return;

        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        if (distance < this.detectionRange) {
            if (player.x < this.x) {
                this.setVelocityX(-this.moveSpeed);
                this.setFlipX(true);
            } else {
                this.setVelocityX(this.moveSpeed);
                this.setFlipX(false);
            }
        } else {
            this.setVelocityX(0);
        }
    }
}
