import * as Phaser from "phaser";
import CheckpointMovementBehavior from "./CheckpointMovementBehavior.js";

const Vector2 = Phaser.Math.Vector2;

export default class ZigZagMovementBehavior extends CheckpointMovementBehavior {
  constructor(host) {
    super(host);
    this.checkpoints = [
      { vel: new Vector2(-2.5, -3), distance: 120 },
      { vel: new Vector2(-2.5, 3), distance: 120 },
      { vel: new Vector2(-2.5, -3), distance: 60 },
      { vel: new Vector2(0, 3), distance: 40 },
      { vel: new Vector2(-2.5, 0), distance: 180 },
      { vel: new Vector2(0, -2.5), distance: 60 },
      { vel: new Vector2(2.5, 0), distance: 60 },
      { vel: new Vector2(0, 2.5), distance: 60 },
      { vel: new Vector2(-5, 0) },
    ];
  }
}
