import game from "../engine/game.js";
import input from "../engine/input.js";
import { addText } from "../engine/fonts.js";
import util from "../util.js";

/**
 * The window shown at the end of a level while the bonus is added.
 */
export default class LevelCompleteWindowEntity {
  /**
   * @param {Object} bonus see ExitEntity#createBonus for details
   */
  constructor(bonus) {
    this.bonus = bonus;
    this.visible = true;
    this.listenKeys = false;

    const scene = game.scene;
    this.objects = [
      scene.add.image(112, 48, "level_complete_window").setOrigin(0, 0),
      addText(scene, "font_purple", 160, 96, "BRAVERY BONUS"),
      addText(scene, "font_white", 224, 128, util.strlpad(this.bonus.bravery, "0", 5)),
      addText(scene, "font_green", 176, 160, "LIVES BONUS"),
      addText(scene, "font_yellow", 208, 192, this.bonus.lives + " X " + this.bonus.lifePrice),
      addText(scene, "font_cyan", 160, 224, "PRESS FIRE TO"),
      addText(scene, "font_cyan", 176, 256, "RESUME PLAY"),
    ];
  }

  update() {
    if (this.listenKeys && input.isKeyPressed("fire")) {
      game.changeScene("Bonus");
    }
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

  onAwardComplete() {
    this.listenKeys = true;
  }
}
