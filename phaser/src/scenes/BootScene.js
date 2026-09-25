import * as Phaser from "phaser";

/**
 * Loads the loading screen background.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.image("loading_bg", "images/loading_bg.gif");
  }

  create() {
    const message = document.getElementById("loading");
    if (message) {
      message.remove();
    }
    this.scene.start("Loading");
  }
}
