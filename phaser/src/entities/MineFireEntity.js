import Entity from "../engine/Entity.js";
import util from "../util.js";

export default class MineFireEntity extends Entity {
  constructor(x, y) {
    const settings = {};
    settings.image = "mine_fire";
    settings.spritewidth = 32;
    settings.spriteheight = 16;
    super(x, y + settings.spriteheight, settings);

    this.fireColor = 0;
    this.fireSize = 0;
  }

  update() {
    this.updateAnimation();
    return true;
  }

  updateAnimation() {
    this.fireSize++;
    if (this.fireSize > 1) {
      this.fireSize = 0;
    }
    this.fireColor = util.getRandomInt(0, 3);
    this.setAnimationFrame(this.fireColor * 3 + this.fireSize);
  }
}
