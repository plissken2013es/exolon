import * as Phaser from "phaser";
import util from "../util.js";
import CheckpointMovementBehavior from "./CheckpointMovementBehavior.js";

const Vector2 = Phaser.Math.Vector2;

export default class UpAndDownMovementBehavior extends CheckpointMovementBehavior {
  constructor(host) {
    super(host);
    this.checkpoints = [
      { vel: new Vector2(-3, 0), distance: 176 },
      { vel: new Vector2(0, -1), distance: 80 },
      { vel: new Vector2(0, 1), distance: 80 - util.getRandomInt(0, 32) },
      { vel: new Vector2(-4, 0) },
    ];
  }
}
