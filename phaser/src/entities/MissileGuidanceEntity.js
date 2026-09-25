import ObstacleEntity from "./ObstacleEntity.js";
import game from "../engine/game.js";
import global from "../global.js";
import AwardPointsEntity from "./AwardPointsEntity.js";
import MissileEntity from "./MissileEntity.js";

/**
 * Launches a guided missile whenever there is none.
 */
export default class MissileGuidanceEntity extends ObstacleEntity {
  constructor(x, y, settings) {
    settings.image = "missile_guidance";
    super(x, y, settings);
    this.vitorc = null;
    this.missile = null;
  }

  update() {
    if (this.vitorc == null) {
      this.vitorc = game.getEntityByName("vitorc")[0];
    }

    if (global.aliveMissilesCount > 0 || !this.alive || this.vitorc.isCurrentAnimation("die")) {
      return false;
    }

    this.missile = new MissileEntity(this.vitorc);
    game.add(this.missile, this.vitorc.z);
    game.sort();

    return false;
  }

  onDestroyEvent() {
    // (the original crashed here when destroyed before its first update)
    if (this.missile) {
      this.missile.explode();
    }

    const award = new AwardPointsEntity(MissileGuidanceEntity.POINTS);
    game.add(award, 999);
    game.sort();
  }
}

MissileGuidanceEntity.prototype.points = 0;

MissileGuidanceEntity.POINTS = 1000;
