import game from "../engine/game.js";

/**
 * Sends a kamikaze towards the player every `delay` seconds.
 */
export default class KamikazeCreatorEntity {
  constructor(x, y, settings) {
    if (settings) {
      if (settings.behavior) {
        this.behavior = settings.behavior;
      }
      if (settings.delay) {
        this.delay = settings.delay;
      }
    }
    this.vitorc = null;
    this.timer = 0;
  }

  update() {
    if (this.vitorc == null) {
      this.vitorc = game.getEntityByName("vitorc")[0];
    }

    if (this.vitorc.isCurrentAnimation("die")) {
      this.timer = 0;
    }

    this.timer += 1 / 60;
    if (this.timer > this.delay) {
      this.timer = 0;
      this.createKamikaze();
    }

    return false;
  }

  createKamikaze() {
    if (!this.shouldCreate()) {
      return;
    }
    const kamikaze = this.createSpecificKamikaze(512, this.vitorc.pos.y + 2);
    game.add(kamikaze, this.vitorc.z);
    game.sort();
  }

  createSpecificKamikaze() {
    // should be overriden by subclasses
  }

  shouldCreate() {
    if (this.vitorc.pos.x > 320) {
      return false;
    }
    return true;
  }
}

// in sec
KamikazeCreatorEntity.prototype.delay = 5;
