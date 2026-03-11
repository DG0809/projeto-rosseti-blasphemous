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

        // Visual do Ataque (Mantendo a lógica, mas removendo a visibilidade)
        this.attackHitbox = scene.add.rectangle(0, 0, 85, 50, 0xffffff, 0); // Alfa 0 para invisibilidade
        this.attackHitbox.setVisible(false);
        scene.physics.add.existing(this.attackHitbox);
        this.attackHitbox.body.setAllowGravity(false);

        // Atributos Extras de Física
        this.fallMultiplier = 2.5; // Gravidade extra ao cair
        this.lowJumpMultiplier = 2.1; // Gravidade extra ao soltar o pulo cedo
        this.airControl = 0.65; // Controle reduzido no ar (mas ainda responsivo)

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

        const onGround = this.body.blocked.down;
        const currentSpeed = onGround ? this.moveSpeed : this.moveSpeed * this.airControl;

        // Movimentação Lateral
        if (this.cursors.left.isDown) {
            this.setVelocityX(-currentSpeed);
            this.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.setVelocityX(currentSpeed);
            this.setFlipX(false);
        } else {
            // Atrito/Deceleração
            const friction = onGround ? 0.85 : 0.95;
            this.setVelocityX(this.body.velocity.x * friction);
        }

        // Pulo (Coyote time ou buffer podem ser adicionados depois)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && onGround) {
            this.setVelocityY(this.jumpForce);
        }

        // --- Lógica de "Better Jump" & "Faster Fall" ---
        if (this.body.velocity.y > 0) {
            // Caindo: Aumenta a gravidade
            this.body.velocity.y += this.fallMultiplier;
        } else if (this.body.velocity.y < 0 && !this.cursors.up.isDown) {
            // Subindo mas soltou o botão: Cai mais rápido (Variable Jump Height)
            this.body.velocity.y += this.lowJumpMultiplier;
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

        // Ativar lógica da hitbox de ataque
        const range = 65;
        const direction = this.flipX ? -1 : 1;
        this.attackHitbox.setPosition(this.x + (range * direction), this.y - 35);
        this.attackHitbox.setVisible(false); // Hitbox agora é invisível

        // Flash visual rápido no personagem para indicar ataque (como não temos animação ainda)
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
            this.isAttacking = false;
        });

        // Pequeno avanço ao atacar
        this.setVelocityX(200 * direction);
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
        const diedText = this.scene.add.text(640, 360, 'VOCÊ MORREU', { 
            fontSize: '64px', 
            fill: '#ff0000', 
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000).setAlpha(0);

        this.scene.tweens.add({
            targets: diedText,
            alpha: 1,
            duration: 500
        });

        this.scene.cameras.main.fadeOut(2000, 0, 0, 0);
        this.scene.time.delayedCall(2000, () => {
            diedText.destroy();
            if (this.scene.lastCheckpoint) {
                this.setPosition(this.scene.lastCheckpoint.x, this.scene.lastCheckpoint.y);
                this.hp = this.maxHp;
                this.flasks = this.maxFlasks; // Também recupera frascos no respawn
                this.scene.respawnEnemies();
                this.scene.cameras.main.fadeIn(500);
            } else {
                this.scene.scene.restart();
            }
        });
    }
}
