import Entity from "../engine/Entity.js";
import game from "../engine/game.js";
import explosion from "../explosion.js";
import util from "../util.js";

/**
 * A solid obstacle that grenades destroy.
 */
export default class ObstacleEntity extends Entity {
  constructor(x, y, settings) {
    super(x, y, settings);
    this.collidable = true;
    this.isSolid = true;
    this.alive = true;
  }

  onCollision(res, obj) {
    if (obj.name == "grenade") {
      explosion.create(this.pos.x + this.width / 2 - 8, this.pos.y + this.height / 2, 50);
      game.remove(this);
      this.alive = false;
      util.updatePoints(this.points);
    }
  }
}

ObstacleEntity.prototype.points = 150;
