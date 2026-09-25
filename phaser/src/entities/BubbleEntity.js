import KamikazeEntity from "./KamikazeEntity.js";
import util from "../util.js";
import CircularMovementBehavior from "../behaviors/CircularMovementBehavior.js";
import SwingMovementBehavior from "../behaviors/SwingMovementBehavior.js";
import ZigZagMovementBehavior from "../behaviors/ZigZagMovementBehavior.js";

export default class BubbleEntity extends KamikazeEntity {
  constructor(x, y, behavior) {
    const settings = {};
    settings.image = "bubble";
    settings.spritewidth = BubbleEntity.WIDTH;
    settings.spriteheight = BubbleEntity.HEIGHT;
    super(x, y + BubbleEntity.HEIGHT, settings);

    this.addAnimation("green", [0, 1, 2]);
    this.addAnimation("cyan", [3, 4, 5]);
    this.addAnimation("purple", [6, 7, 8]);
    this.addAnimation("yellow", [9, 10, 11]);
    this.addAnimation("red", [12, 13, 14]);
    this.addAnimation("white", [15, 16, 17]);
    this.setCurrentAnimation(util.arrayRandomElement(["green", "cyan", "purple", "yellow", "red", "white"]));

    this.animationspeed = 1;
    this.gravity = 0;
    this.collidable = true;
    this.isDestroyable = true;

    if (behavior == "circular") {
      this.behavior = new CircularMovementBehavior(this);
    } else if (behavior == "zig_zag") {
      this.behavior = new ZigZagMovementBehavior(this);
    } else {
      this.behavior = new SwingMovementBehavior(this);
    }
  }

  updateMovement() {
    this.behavior.update();
  }
}

BubbleEntity.prototype.points = 150;

BubbleEntity.WIDTH = 32;
BubbleEntity.HEIGHT = 32;
