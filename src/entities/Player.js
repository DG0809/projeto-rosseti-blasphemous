export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player_placeholder');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setOrigin(0.5, 1);

        // Atributos de Movimentação
        this.moveSpeed = 300;
        this.jumpForce = -550;
        this.isDashing = false;
        this.dashCooldown = false;
        this.dashDuration = 200;
        this.dashDistance = 800;
        this.iframes = false;

        // Atributos de Combate
        this.hp = 100;
        this.maxHp = 100;
        this.flasks = 3;
        this.maxFlasks = 3;
        this.comboStep = 0;
        this.lastAttackTime = 0;
        this.isAttacking = false;

        // Magias
        this.mana = 100;
        this.maxMana = 100;
        this.magicSystem = null; // Definido na Scene

        // Input
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keyZ = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z); // Ataque
        this.keyX = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X); // Dash
        this.keyC = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C); // Cura
        this.key1 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE); // Fogo
        this.key2 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO); // Raio
        this.key3 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE); // Pedra
    }

    update() {
        if (this.isDashing || this.isAttacking) return;

        // Movimentação Lateral com Inércia
        if (this.cursors.left.isDown) {
            this.setVelocityX(-this.moveSpeed);
            this.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.setVelocityX(this.moveSpeed);
            this.setFlipX(false);
        } else {
            this.setVelocityX(this.body.velocity.x * 0.8); // Inércia leve
        }

        // Pulo com Altura Variável
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.body.blocked.down) {
            this.setVelocityY(this.jumpForce);
        }

        if (this.cursors.up.isUp && this.body.velocity.y < 0) {
            this.setVelocityY(this.body.velocity.y * 0.9); // Release jump early
        }

        // Esquiva (Dash)
        if (Phaser.Input.Keyboard.JustDown(this.keyX) && !this.dashCooldown) {
            this.dash();
        }

        // Ataque Melee
        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.attack();
        }

        // Magias
        if (this.magicSystem) {
            if (Phaser.Input.Keyboard.JustDown(this.key1)) this.magicSystem.castFire();
            if (Phaser.Input.Keyboard.JustDown(this.key2)) this.magicSystem.castLightning();
            if (Phaser.Input.Keyboard.JustDown(this.key3)) this.magicSystem.castStone();
            this.magicSystem.update();
        }

        // Cura
        if (Phaser.Input.Keyboard.JustDown(this.keyC)) {
            this.heal();
        }
    }

    dash() {
        this.isDashing = true;
        this.dashCooldown = true;
        this.iframes = true;
        this.setAlpha(0.5);

        const direction = this.flipX ? -1 : 1;
        this.setVelocityX(this.dashDistance * direction);
        this.setVelocityY(0);
        this.body.allowGravity = false;

        this.scene.time.delayedCall(this.dashDuration, () => {
            this.isDashing = false;
            this.iframes = false;
            this.setAlpha(1);
            this.body.allowGravity = true;
            this.setVelocityX(0);
        });

        this.scene.time.delayedCall(1000, () => {
            this.dashCooldown = false;
        });
    }

    attack() {
        const now = this.scene.time.now;
        if (now - this.lastAttackTime > 1000) {
            this.comboStep = 0;
        }

        this.isAttacking = true;
        this.comboStep = (this.comboStep % 3) + 1;
        this.lastAttackTime = now;

        console.log(`Atacando: Combo ${this.comboStep}`);

        // Simulação de animação de ataque
        this.setVelocityX(0);

        this.scene.time.delayedCall(250, () => {
            this.isAttacking = false;
        });
    }

    heal() {
        if (this.flasks > 0 && this.hp < this.maxHp) {
            this.flasks--;
            this.hp = Math.min(this.maxHp, this.hp + 40);
            console.log(`Curado! HP: ${this.hp}, Frascos: ${this.flasks}`);
        }
    }

    takeDamage(amount) {
        if (this.iframes) return;

        this.hp -= amount;
        this.iframes = true;
        this.scene.cameras.main.shake(100, 0.01);

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 100,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.iframes = false;
                this.setAlpha(1);
            }
        });

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        console.log("Player morreu!");
        this.scene.scene.restart();
    }
}
