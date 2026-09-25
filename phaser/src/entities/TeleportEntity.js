import Entity from "../engine/Entity.js";

export default class TeleportEntity extends Entity {
  constructor(x, y, settings) {
    settings.image = "teleport";
    settings.spritewidth = 64;
    super(x, y, settings);
    this.collidable = true;
    this.animationspeed = 1;
    this.updateColRect(16, 32, 32, 48);
  }
}
