import game from "../engine/game.js";
import audio from "../engine/audio.js";
import util from "../util.js";

/**
 * Adds points to the score little by little.
 */
export default class AwardPointsEntity {
  constructor(points, step) {
    this.points = points;
    this.step = step !== undefined ? step : 25;
    this.timer = 0;
    this.delay = 0.04;
    this.onComplete = null;
    audio.play("points");
  }

  update() {
    this.timer += 1 / 60;
    if (this.timer > this.delay) {
      this.timer = 0;
      this.award();
    }
    return false;
  }

  award() {
    this.points -= this.step;
    util.updatePoints(this.step);
    if (this.points <= 0) {
      if (this.onComplete) {
        this.onComplete();
      }
      game.remove(this);
    }
  }

  destroy() {
    // If player left the screen before all points were added, add remaining
    // points.
    if (this.points > 0) {
      util.updatePoints(this.points);
    }
  }
}
