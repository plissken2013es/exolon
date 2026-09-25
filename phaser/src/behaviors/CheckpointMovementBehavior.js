/**
 * Moves the host through a list of checkpoints, each one a velocity kept for
 * a distance (the last one forever).
 */
export default class CheckpointMovementBehavior {
  constructor(host) {
    this.host = host;
    this.checkpoint = 0;
    this.passedDistance = 0;
  }

  update() {
    const cp = this.checkpoints[this.checkpoint];
    this.host.pos.add(cp.vel);
    this.passedDistance += cp.vel.length();
    if (this.checkpoint < this.checkpoints.length - 1 && this.passedDistance >= cp.distance) {
      this.passedDistance = 0;
      this.checkpoint++;
    }
  }
}
