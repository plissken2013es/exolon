import Entity from "../engine/Entity.js";
import util from "../util.js";

/**
 * A twinkling star of the title screen.
 */
export default class StarEntity extends Entity {
  constructor() {
    const settings = {};
    settings.image = "star";
    settings.spritewidth = StarEntity.WIDTH;

    const pos = StarEntity.getRandomPosition();
    super(pos.x, pos.y, settings);

    this.addAnimation("default", [0, 1, 2, 1, 3, 1, 2, 0]);
    this.setCurrentAnimation("default", this.changePosition);
    this.animationspeed = 1;

    this.visible_ = false;
    util.executeWithDelay(() => {
      this.visible_ = true;
    }, util.getRandomInt(0, 1000));
  }

  update() {
    if (this.visible_) {
      return super.update();
    }
    return false;
  }

  render() {
    super.render();
    this.sprite.setVisible(this.visible && this.visible_);
  }

  changePosition() {
    const pos = StarEntity.getRandomPosition();
    this.pos.x = pos.x;
    this.pos.y = pos.y;
    this.setCurrentAnimation("default", this.changePosition);
  }

  static getRandomPosition() {
    return {
      x: util.getRandomInt(0, 512 - StarEntity.WIDTH),
      y: util.getRandomInt(0, 384 - StarEntity.HEIGHT),
    };
  }
}

StarEntity.WIDTH = 32;
StarEntity.HEIGHT = 32;
