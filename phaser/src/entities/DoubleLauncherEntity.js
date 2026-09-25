import Entity from "../engine/Entity.js";
import game from "../engine/game.js";
import audio from "../engine/audio.js";
import util from "../util.js";
import AwardPointsEntity from "./AwardPointsEntity.js";
import DoubleLauncherBulletEntity from "./DoubleLauncherBulletEntity.js";

/**
 * A rocket launcher, captured (for points) by touching it.
 */
export default class DoubleLauncherEntity extends Entity {
  constructor(x, y, settings) {
    settings.image = new.target.SPRITE_IMAGE;
    super(x, y, settings);

    this.collidable = true;
    this.captured = false;
    this.vitorc = null;

    this.fireDurationMin = settings.fireDurationMin ? settings.fireDurationMin : 20;
    this.fireDurationMax = settings.fireDurationMax ? settings.fireDurationMax : 160;
    this.resetFireDurationAndTimer();
  }

  update() {
    if (this.vitorc == null) {
      this.vitorc = game.getEntityByName("vitorc")[0];
    }

    this.fireTimer++;
    if (this.fireTimer > this.fireDuration) {
      this.resetFireDurationAndTimer();
      this.fire();
    }
  }

  resetFireDurationAndTimer() {
    this.fireDuration = util.getRandomInt(this.fireDurationMin, this.fireDurationMax);
    this.fireTimer = 0;
  }

  fire() {
    if (!this.shouldFire()) {
      return;
    }

    const pos = this.getBulletPosition();
    const bullet = new DoubleLauncherBulletEntity(pos.x, pos.y);
    game.add(bullet, this.z);
    game.sort();
    audio.play("rocket");
  }

  getBulletPosition() {
    const pos = {};
    pos.x = this.pos.x - DoubleLauncherBulletEntity.WIDTH;
    pos.y = util.arrayRandomElement([this.pos.y, this.pos.y + 16]);
    return pos;
  }

  shouldFire() {
    if (this.vitorcTooClose()) {
      return false;
    }
    return true;
  }

  onCollision(res, obj) {
    if (obj.name == "vitorc") {
      this.capture();
    }
  }

  capture() {
    if (this.captured) {
      return;
    }
    this.captured = true;
    const award = new AwardPointsEntity(this.points);
    game.add(award, 999);
    game.sort();
  }

  vitorcTooClose() {
    return this.vitorc.pos.x > this.pos.x - DoubleLauncherEntity.STOP_FIRE_DISTANCE;
  }
}

DoubleLauncherEntity.prototype.points = 2000;

DoubleLauncherEntity.SPRITE_IMAGE = "double_launcher";
DoubleLauncherEntity.STOP_FIRE_DISTANCE = 110;
