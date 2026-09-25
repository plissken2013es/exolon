import Entity from "../engine/Entity.js";
import game from "../engine/game.js";
import Tween from "../engine/Tween.js";
import util from "../util.js";

/**
 * A deadly piston coming out of the floor every now and then.
 */
export default class PistonEntity extends Entity {
  constructor(x, y, settings) {
    settings.image = "piston";
    super(x, y, settings);
    this.collidable = true;
    this.isLethal = true;
    this.pos.y += this.height;
    this.moving = false;
  }

  update() {
    game.collide(this);
    if (!this.moving) {
      this.startMove();
      return false;
    }
    return true;
  }

  startMove() {
    this.moving = true;

    const up = new Tween(this.pos).to({ y: this.pos.y - this.height }, 300).delay(util.getRandomInt(1000, 5000));
    const down = new Tween(this.pos).to({ y: this.pos.y }, 300).delay(1000);

    up.chain(down);
    down.onComplete(() => {
      this.moving = false;
    });

    up.start();
  }
}
