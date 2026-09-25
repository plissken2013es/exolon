import { addText } from "../engine/fonts.js";
import game from "../engine/game.js";

export default class GameOverWindow {
  constructor() {
    const scene = game.scene;
    this.objects = [
      scene.add.rectangle(160, 144, 176, 48, 0xef0000).setOrigin(0, 0),
      addText(scene, "font_yellow", 176, 160, "GAME OVER"),
    ];
  }

  update() {
    return true;
  }

  render() {
    for (const obj of this.objects) {
      obj.setDepth(this.z);
    }
  }

  destroy() {
    for (const obj of this.objects) {
      obj.destroy();
    }
  }
}
