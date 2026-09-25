import Entity from "../engine/Entity.js";
import game from "../engine/game.js";
import explosion from "../explosion.js";
import AwardPointsEntity from "./AwardPointsEntity.js";

/**
 * A deadly energy barrier, destroyed by enough blaster shots.
 */
export default class BeamEntity extends Entity {
  constructor(x, y, settings) {
    settings.image = "beam";
    settings.spritewidth = 16;
    super(x, y, settings);

    this.hitPoints = 50;
    this.animationspeed = 1;
    this.collidable = true;
    this.isSolid = true;
    this.isLethal = true;
  }

  onCollision(res, obj) {
    if (obj.name == "blaster_bullet") {
      this.hitPoints--;
      if (this.hitPoints <= 0) {
        explosion.create(this.pos.x + this.width / 2 - 8, this.pos.y + this.height / 2, 50);
        game.remove(this);

        const award = new AwardPointsEntity(this.points);
        game.add(award, 999);
        game.sort();
      }
    }
  }
}

BeamEntity.prototype.points = 1000;
