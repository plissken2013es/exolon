import Entity from "../engine/Entity.js";

export default class SquareLightEntity extends Entity {
  constructor(x, y, settings) {
    settings.image = "square_light";
    settings.spritewidth = 16;
    super(x, y, settings);
    this.animationspeed = 1;
  }
}
