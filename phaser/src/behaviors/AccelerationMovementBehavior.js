import util from "../util.js";

export default class AccelerationMovementBehavior {
  constructor(host) {
    this.host = host;
    this.host.vel.x = AccelerationMovementBehavior.SPEED_NORMAL;
    this.host.pos.y += util.getRandomArbitrary(-32, 32);
  }

  update() {
    if (this.host.pos.x < 304) {
      this.host.vel.x = AccelerationMovementBehavior.SPEED_FAST;
    }
    this.host.pos.x -= this.host.vel.x;
  }
}

AccelerationMovementBehavior.SPEED_NORMAL = 1.5;
AccelerationMovementBehavior.SPEED_FAST = 4;
