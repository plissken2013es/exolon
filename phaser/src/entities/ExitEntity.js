import InvisibleEntity from "../engine/InvisibleEntity.js";
import game from "../engine/game.js";
import global from "../global.js";
import AwardPointsEntity from "./AwardPointsEntity.js";
import LevelCompleteWindowEntity from "./LevelCompleteWindowEntity.js";

/**
 * The end of a level.
 */
export default class ExitEntity extends InvisibleEntity {
  onCollision(res, obj) {
    if (obj.name == "vitorc") {
      this.collidable = false;
      game.remove(obj);
      this.createBonus(obj);
      this.createLevelCompleteWindow();
      this.awardPoints();
    }
  }

  createBonus(vitorc) {
    this.bonus = {};
    this.bonus.bravery = vitorc.outfit == "vitorc" ? 10000 : 0;
    this.bonus.lives = global.lives;
    this.bonus.lifePrice = 1000;
    this.bonus.total = this.bonus.bravery + this.bonus.lives * this.bonus.lifePrice;
  }

  createLevelCompleteWindow() {
    this.window = new LevelCompleteWindowEntity(this.bonus);
    game.add(this.window, 999);
    game.sort();
  }

  awardPoints() {
    this.award = new AwardPointsEntity(this.bonus.total, 250);
    this.award.onComplete = this.window.onAwardComplete.bind(this.window);
    game.add(this.award, 999);
    game.sort();
  }
}
