import KamikazeEntity from "./KamikazeEntity.js";
import util from "../util.js";
import AccelerationMovementBehavior from "../behaviors/AccelerationMovementBehavior.js";
import SwingAndAccelerationMovementBehavior from "../behaviors/SwingAndAccelerationMovementBehavior.js";
import ZigZagMovementBehavior from "../behaviors/ZigZagMovementBehavior.js";

export default class InterceptorEntity extends KamikazeEntity {
  constructor(x, y, behavior) {
    const settings = {};
    settings.image = "interceptor";
    settings.spritewidth = InterceptorEntity.WIDTH;
    settings.spriteheight = InterceptorEntity.HEIGHT;
    super(x, y + InterceptorEntity.HEIGHT, settings);

    this.addAnimation("yellow", [0, 1, 2, 1]);
    this.addAnimation("purple", [3, 4, 5, 4]);
    this.addAnimation("cyan", [6, 7, 8, 7]);
    this.addAnimation("green", [9, 10, 11, 10]);
    this.addAnimation("white", [12, 13, 14, 13]);
    this.addAnimation("red", [15, 16, 17, 16]);
    this.setCurrentAnimation(util.arrayRandomElement(["green", "cyan", "purple", "yellow", "red", "white"]));

    this.animationspeed = 1;
    this.gravity = 0;
    this.collidable = true;
    this.isDestroyable = true;

    if (behavior == "acceleration") {
      this.behavior = new AccelerationMovementBehavior(this);
    } else if (behavior == "zig_zag") {
      this.behavior = new ZigZagMovementBehavior(this);
    } else {
      this.behavior = new SwingAndAccelerationMovementBehavior(this);
    }
  }

  updateMovement() {
    this.behavior.update();
  }
}

InterceptorEntity.prototype.points = 150;

InterceptorEntity.WIDTH = 32;
InterceptorEntity.HEIGHT = 32;
