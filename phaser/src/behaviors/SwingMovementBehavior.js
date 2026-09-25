import util from "../util.js";

export default class SwingMovementBehavior {
  constructor(host) {
    this.host = host;
    this.host.pos.y += util.getRandomArbitrary(-16, 0);
    this.host.pos.x += util.getRandomArbitrary(0, 32);
  }

  update() {
    this.host.pos.x -= SwingMovementBehavior.SPEED;
    this.host.pos.y += util.getRandomArbitrary(1, 3) * Math.sin(this.host.pos.x / 20);
  }
}

SwingMovementBehavior.SPEED = 1.7;
