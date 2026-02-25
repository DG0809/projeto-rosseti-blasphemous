export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player_placeholder');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setOrigin(0.5, 1);

        // Ajuste Visual para "Cavaleiro" (Placeholding com cores)
        // Redimensionando para parecer mais heróico
        this.setDisplaySize(40, 70);

        // Atributos de Movimentação
        this.moveSpeed = 280; // "Peso" aumentado (levemente mais devagar que antes)
        this.jumpForce = -580;
        this.isDashing = false;
        this.dashCooldown = false;
        this.dashDuration = 200;
        this.dashDistance = 700;
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
        this.magicSystem = null;

        // Visual do Ataque
        this.attackHitbox = scene.add.rectangle(0, 0, 80, 50, 0xffffff, 0.3);
        this.attackHitbox.setVisible(false);
        scene.physics.add.existing(this.attackHitbox);
        this.attackHitbox.body.setAllowGravity(false);

        // Input
        this.setupInput(scene);
    }

    setupInput(scene) {
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keyZ = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyX = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        this.keyC = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        this.key1 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        this.keyV = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V); // Tecla para descansar no Shrine
    }

    update() {
        if (this.isDashing) return;

        // Movimentação Lateral
        if (this.cursors.left.isDown) {
            this.setVelocityX(-this.moveSpeed);
            this.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.setVelocityX(this.moveSpeed);
            this.setFlipX(false);
        } else {
            this.setVelocityX(this.body.velocity.x * 0.85);
        }

        // Pulo
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.body.blocked.down) {
            this.setVelocityY(this.jumpForce);
        }

        if (this.cursors.up.isUp && this.body.velocity.y < 0) {
            this.setVelocityY(this.body.velocity.y * 0.8);
        }

        // Dash
        if (Phaser.Input.Keyboard.JustDown(this.keyX) && !this.dashCooldown) {
            this.dash();
        }

        // Ataque (Z)
        if (Phaser.Input.Keyboard.JustDown(this.keyZ) && !this.isAttacking) {
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
        this.setAlpha(0.6);

        const direction = this.flipX ? -1 : 1;
        this.setVelocityX(this.dashDistance * direction);
        this.setVelocityY(0);
        this.body.allowGravity = false;

        this.scene.time.delayedCall(this.dashDuration, () => {
            this.isDashing = false;
            this.iframes = false;
            this.setAlpha(1);
            this.body.allowGravity = true;
        });

        this.scene.time.delayedCall(800, () => {
            this.dashCooldown = false;
        });
    }

    attack() {
        this.isAttacking = true;
        this.comboStep = (this.comboStep % 3) + 1;

        // Ativar visual da hitbox de ataque
        const range = 60;
        const direction = this.flipX ? -1 : 1;
        this.attackHitbox.setPosition(this.x + (range * direction), this.y - 35);
        this.attackHitbox.setVisible(true);

        // Efeito de "Slash" (flash branco rápido)
        this.scene.tweens.add({
            targets: this.attackHitbox,
            alpha: { from: 0.8, to: 0 },
            duration: 200,
            onComplete: () => {
                this.attackHitbox.setVisible(false);
                this.isAttacking = false;
            }
        });

        // Pequeno avanço ao atacar
        this.setVelocityX(150 * direction);
    }

    heal() {
        if (this.flasks > 0 && this.hp < this.maxHp) {
            this.flasks--;
            this.hp = Math.min(this.maxHp, this.hp + 40);

            // Efeito visual de cura
            const healEffect = this.scene.add.circle(this.x, this.y - 30, 40, 0x2ecc71, 0.5);
            this.scene.tweens.add({
                targets: healEffect,
                scale: 1.5,
                alpha: 0,
                duration: 500,
                onComplete: () => healEffect.destroy()
            });
        }
    }

    takeDamage(amount) {
        if (this.iframes) return;

        this.hp -= amount;
        this.iframes = true;
        this.scene.cameras.main.shake(150, 0.015);

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 80,
            yoyo: true,
            repeat: 4,
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
        this.scene.cameras.main.fadeOut(1000, 0, 0, 0);
        this.scene.time.delayedCall(1000, () => {
            if (this.scene.lastCheckpoint) {
                this.setPosition(this.scene.lastCheckpoint.x, this.scene.lastCheckpoint.y);
                this.hp = this.maxHp;
                this.scene.respawnEnemies();
                this.scene.cameras.main.fadeIn(500);
            } else {
                this.scene.scene.restart();
            }
        });
    }
}
