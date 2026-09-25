import Entity from "../engine/Entity.js";
import util from "../util.js";

/**
 * An electric discharge, drawn with random frames.
 */
export default class DischargeEntity extends Entity {
  constructor(x, y, settings) {
    settings.image = "discharge";
    settings.spritewidth = 64;
    settings.spriteheight = 32;
    super(x, y, settings);
    this.animationspeed = 1;
  }

  update() {
    this.setAnimationFrame(util.getRandomInt(0, 39));
    return true;
  }
}
