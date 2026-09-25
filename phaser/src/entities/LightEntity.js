import Entity from "../engine/Entity.js";

export default class LightEntity extends Entity {
  constructor(x, y, settings) {
    settings.image = "light";
    settings.spritewidth = 16;
    settings.spriteheight = 16;
    super(x, y, settings);
    this.animationspeed = 1;
    this.addAnimation("floor", [0, 1, 2, 3, 4, 5, 6, 7]);
    this.addAnimation("ceiling", [8, 9, 10, 11, 12, 13, 14, 15]);
    this.setCurrentAnimation(settings.placement);
  }
}
