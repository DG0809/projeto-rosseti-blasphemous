export class Shrine extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'shrine_placeholder');
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Estático

        this.active = false;
        this.setTint(0x555555); // Desativado inicialmente
    }

    activate() {
        if (this.active) return;
        this.active = true;
        this.setTint(0xffffff); // Brilha ao ativar

        // Efeito visual de ativação
        this.scene.cameras.main.flash(500, 255, 255, 255);

        // Partículas ou Tween de brilho
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true
        });
    }

    rest(player) {
        this.activate();

        // Recuperar vida e frascos
        player.hp = player.maxHp;
        player.flasks = player.maxFlasks;
        player.mana = player.maxMana;

        // Definir como ponto de renascimento
        this.scene.lastCheckpoint = { x: this.x, y: this.y - 40 };

        // Gatilho para respawn de inimigos (implementado na Scene)
        this.scene.respawnEnemies();

        console.log("Descansou no Santuário: Vida e Frascos restaurados!");
    }
}
