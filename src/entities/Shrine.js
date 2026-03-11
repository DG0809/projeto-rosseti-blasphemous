export class Shrine extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Criar um visual mais trabalhado para o Santuário (Estilo Gótico)
        scene.createPlaceholder('shrine_placeholder', 50, 80, '#2c3e50', '#b8860b');
        super(scene, x, y, 'shrine_placeholder');
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.active = false;
        this.setTint(0x333333); 
        this.setOrigin(0.5, 1);
        
        // Adicionar uma pequena chama/luz desativada
        this.glow = scene.add.circle(x, y - 60, 15, 0xffd700, 0);
        this.glow.setDepth(this.depth - 1);
    }

    activate() {
        if (this.active) return;
        this.active = true;
        this.setTint(0xffffff);

        // Animação de ativação: Chamas e Brilho
        this.scene.tweens.add({
            targets: this.glow,
            alpha: 0.6,
            scale: 2,
            duration: 800,
            ease: 'Power2'
        });

        // Partículas simples de fogo (simuladas com tweens se não houver asset)
        for (let i = 0; i < 5; i++) {
            let spark = this.scene.add.circle(this.x, this.y - 20, 4, 0xffa500);
            this.scene.tweens.add({
                targets: spark,
                x: this.x + Phaser.Math.Between(-30, 30),
                y: this.y - 120,
                alpha: 0,
                duration: 1000 + i * 200,
                onComplete: () => spark.destroy()
            });
        }

        this.scene.cameras.main.flash(400, 255, 230, 150, 0.3);
    }

    rest(player) {
        this.activate();

        // Recuperar recursos
        player.hp = player.maxHp;
        player.mana = player.maxMana;
        player.flasks = player.maxFlasks;

        // Efeito visual no player
        this.scene.tweens.add({
            targets: player,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 2
        });

        this.scene.lastCheckpoint = { x: this.x, y: this.y };
        this.scene.respawnEnemies();
    }
}
