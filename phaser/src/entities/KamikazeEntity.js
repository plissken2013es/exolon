import Entity from "../engine/Entity.js";
import game from "../engine/game.js";
import audio from "../engine/audio.js";
import util from "../util.js";
import CircularExplosionEntity from "./CircularExplosionEntity.js";

/**
 * An enemy flying towards the player, destroyed when it hits the player or a
 * blaster bullet.
 */
export default class KamikazeEntity extends Entity {
  constructor(x, y, settings) {
    super(x, y, settings);
    this.isLethal = true;
  }

  update() {
    this.updateMovement();
    this.handleCollisions();
    super.update();
    return true;
  }

  updateMovement() {
    this.pos.x += this.vel.x;
  }

  handleCollisions() {
    const res = game.collide(this);
    const hitVitorc = res && res.obj.name == "vitorc";

    if (this.pos.x < 0 || hitVitorc) {
      game.remove(this);
    }

    if (hitVitorc) {
      this.createExplosion();
      util.updatePoints(this.points);
    }
  }

  onCollision(res, obj) {
    if (obj.name == "blaster_bullet" || obj.name == "vitorc") {
      game.remove(this);
      this.createExplosion();
      util.updatePoints(this.points);
    }
  }

  createExplosion() {
    const explosion = this.createSpecificExplosion(this.pos.x, this.pos.y);
    game.add(explosion, this.z + 1);
    game.sort();
    audio.play("burst");
  }

  createSpecificExplosion(x, y) {
    return new CircularExplosionEntity(x, y);
  }
}

KamikazeEntity.prototype.points = 0;
