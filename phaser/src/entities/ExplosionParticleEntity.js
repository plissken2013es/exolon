import Entity from "../engine/Entity.js";
import game from "../engine/game.js";
import util from "../util.js";

export default class ExplosionParticleEntity extends Entity {
  constructor(x, y) {
    const settings = {};
    settings.image = "explosion_particle";
    settings.spritewidth = 32;
    super(x, y + 16, settings);

    this.addAnimation("yellow", [0]);
    this.addAnimation("white", [1]);
    this.addAnimation("green", [2]);
    this.addAnimation("cyan", [3]);

    this.gravity = 0;

    this.setRandomColor();
    this.setRandomVelocity();

    if (this.accel.x > 0) {
      this.flipX(true);
    }
  }

  update() {
    this.updateMovement();
    this.handleCollisions();
  }

  setRandomColor() {
    this.setCurrentAnimation(util.arrayRandomElement(["yellow", "white", "green", "cyan"]));
  }

  setRandomVelocity() {
    this.vel.x = 0;
    this.vel.y = 0;

    const xSign = util.randomSign();
    const ySign = util.randomSign();

    this.accel.x = (Math.random() * 0.4 + 0.01) * xSign;
    this.accel.y = (Math.random() * 0.4 + 0.01) * ySign;

    this.maxVel.x = (Math.random() * 7 + 3) * xSign;
    this.maxVel.y = (Math.random() * 7 + 3) * ySign;
  }

  updateMovement() {
    this.vel.x += this.accel.x;
    if (Math.abs(this.vel.x) > Math.abs(this.maxVel.x)) {
      this.vel.x = this.maxVel.x;
    }

    this.vel.y += this.accel.y;
    if (Math.abs(this.vel.y) > Math.abs(this.maxVel.y)) {
      this.vel.y = this.maxVel.y;
    }

    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
  }

  handleCollisions() {
    if (this.pos.x + this.width < 0 || this.pos.x > 512 || this.pos.y + this.height < 0 || this.pos.y + this.height > 352) {
      game.remove(this);
    }
  }
}
