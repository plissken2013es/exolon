import Entity from "../engine/Entity.js";
import game from "../engine/game.js";
import global from "../global.js";
import CircularExplosionEntity from "./CircularExplosionEntity.js";

/**
 * A guided missile: follows the player's height.
 */
export default class MissileEntity extends Entity {
  constructor(vitorc) {
    const settings = {};
    settings.image = "missile";
    settings.spritewidth = MissileEntity.WIDTH;
    super(512, 146, settings);

    this.vitorc = vitorc;

    this.gravity = 0;
    this.isLethal = true;
    this.collidable = true;

    this.addAnimation("normal", [0]);
    this.addAnimation("fast", [1]);
    this.setCurrentAnimation("normal");

    this.vel.x = -MissileEntity.SPEED_X_NORMAL;

    global.aliveMissilesCount++;
  }

  update() {
    this.updateMovement();
    this.handleCollisions();
    return true;
  }

  updateMovement() {
    if (this.isCurrentAnimation("normal") && this.pos.x <= 280) {
      this.setCurrentAnimation("fast");
      this.vel.x = -MissileEntity.SPEED_X_FAST;
    }

    this.pos.x += this.vel.x;

    if (this.pos.y > this.vitorc.pos.y) {
      this.pos.y -= MissileEntity.SPEED_Y;
    } else if (this.pos.y < this.vitorc.pos.y) {
      this.pos.y += MissileEntity.SPEED_Y;
    }
  }

  handleCollisions() {
    const res = game.collide(this);
    const hitVitorc = res && res.obj.name == "vitorc";

    if (this.pos.x < 0 || hitVitorc) {
      game.remove(this);
    }

    if (hitVitorc) {
      this.createExplosion();
    }
  }

  explode() {
    game.remove(this);
    this.createExplosion();
  }

  createExplosion() {
    const explosion = new CircularExplosionEntity(this.pos.x, this.pos.y);
    game.add(explosion, this.z);
    game.sort();
  }

  onDestroyEvent() {
    global.aliveMissilesCount--;
  }
}

MissileEntity.WIDTH = 32;
MissileEntity.HEIGHT = 32;
MissileEntity.SPEED_X_NORMAL = 1.5;
MissileEntity.SPEED_X_FAST = 3;
MissileEntity.SPEED_Y = 1;
