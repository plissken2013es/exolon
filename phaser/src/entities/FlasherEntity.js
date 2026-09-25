import KamikazeEntity from "./KamikazeEntity.js";
import util from "../util.js";
import AccelerationMovementBehavior from "../behaviors/AccelerationMovementBehavior.js";
import SwingMovementBehavior from "../behaviors/SwingMovementBehavior.js";
import UpAndDownMovementBehavior from "../behaviors/UpAndDownMovementBehavior.js";

export default class FlasherEntity extends KamikazeEntity {
  constructor(x, y, behavior) {
    const settings = {};
    settings.image = "flasher";
    settings.spritewidth = FlasherEntity.WIDTH;
    settings.spriteheight = FlasherEntity.HEIGHT;
    super(x, y + FlasherEntity.HEIGHT, settings);

    this.addAnimation("yellow", [0, 1]);
    this.addAnimation("purple", [2, 3]);
    this.addAnimation("cyan", [4, 5]);
    this.addAnimation("green", [6, 7]);
    this.addAnimation("white", [8, 9]);
    this.addAnimation("red", [10, 11]);
    this.setCurrentAnimation(util.arrayRandomElement(["green", "cyan", "purple", "yellow", "red", "white"]));

    this.animationspeed = 2;
    this.gravity = 0;
    this.collidable = true;
    this.isDestroyable = true;

    if (behavior == "acceleration") {
      this.behavior = new AccelerationMovementBehavior(this);
    } else if (behavior == "swing") {
      this.behavior = new SwingMovementBehavior(this);
    } else {
      this.behavior = new UpAndDownMovementBehavior(this);
    }
  }

  updateMovement() {
    this.behavior.update();
  }
}

FlasherEntity.prototype.points = 150;

FlasherEntity.WIDTH = 32;
FlasherEntity.HEIGHT = 32;
