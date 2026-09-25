import KamikazeEntity from "./KamikazeEntity.js";
import util from "../util.js";
import SwingAndAccelerationMovementBehavior from "../behaviors/SwingAndAccelerationMovementBehavior.js";
import ZigZagMovementBehavior from "../behaviors/ZigZagMovementBehavior.js";

export default class FirEntity extends KamikazeEntity {
  constructor(x, y, behavior) {
    const settings = {};
    settings.image = "fir";
    settings.spritewidth = FirEntity.WIDTH;
    settings.spriteheight = FirEntity.HEIGHT;
    super(x, y + FirEntity.HEIGHT, settings);

    this.addAnimation("yellow", [0]);
    this.addAnimation("purple", [1]);
    this.addAnimation("cyan", [2]);
    this.addAnimation("green", [3]);
    this.addAnimation("white", [4]);
    this.addAnimation("red", [5]);
    this.setCurrentAnimation(util.arrayRandomElement(["green", "cyan", "purple", "yellow", "red", "white"]));

    this.gravity = 0;
    this.collidable = true;
    this.isDestroyable = true;

    if (behavior == "swing_and_acceleration") {
      this.behavior = new SwingAndAccelerationMovementBehavior(this);
    } else {
      this.behavior = new ZigZagMovementBehavior(this);
    }
  }

  updateMovement() {
    this.behavior.update();
  }
}

FirEntity.prototype.points = 150;

FirEntity.WIDTH = 32;
FirEntity.HEIGHT = 32;
