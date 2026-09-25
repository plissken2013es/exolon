import * as Phaser from "phaser";
import { images, sounds, maps } from "../resources.js";
import { registerFonts } from "../engine/fonts.js";

const BAR = { x: 416, y: 368, width: 96, height: 16 };

export default class LoadingScene extends Phaser.Scene {
  constructor() {
    super("Loading");
  }

  preload() {
    this.add.image(0, 0, "loading_bg").setOrigin(0, 0);
    const bar = this.add.graphics();
    const drawBar = (progress) => {
      const width = Math.floor(progress * BAR.width);
      bar.clear();
      bar.lineStyle(1, 0x00c5c5).strokeRect(BAR.x + 0.5, BAR.y + 0.5, BAR.width - 1, BAR.height - 1);
      bar.fillStyle(0x00b500).fillRect(BAR.x + 2, BAR.y + 2, Math.max(0, width - 4), BAR.height - 4);
    };
    drawBar(0);
    this.load.on("progress", drawBar);

    for (const image of images) {
      if (!this.textures.exists(image.name)) {
        this.load.image(image.name, image.src);
      }
    }
    for (const sound of sounds) {
      this.load.audio(sound.name, sound.src);
    }
    for (const map of maps) {
      this.load.tilemapTiledJSON(map.name, map.src);
    }
  }

  create() {
    registerFonts(this);
    this.scene.start("Title");
  }
}
