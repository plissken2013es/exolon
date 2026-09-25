import KamikazeEntity from "./KamikazeEntity.js";

export default class HarbringerEntity extends KamikazeEntity {
  constructor(x, y) {
    const settings = {};
    settings.image = "harbringer";
    settings.spritewidth = HarbringerEntity.WIDTH;
    super(x, y + HarbringerEntity.HEIGHT, settings);

    this.animationspeed = 1;
    this.gravity = 0;
    this.vel.x = -HarbringerEntity.SPEED;
    this.updateColRect(0, 32, -1, 0);
  }
}

HarbringerEntity.WIDTH = 128;
HarbringerEntity.HEIGHT = 32;
HarbringerEntity.SPEED = 3;
