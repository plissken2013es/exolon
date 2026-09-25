import ObstacleEntity from "./ObstacleEntity.js";
import game from "../engine/game.js";
import TurretTubeEntity from "./TurretTubeEntity.js";

export default class TurretEntity extends ObstacleEntity {
  constructor(x, y, settings) {
    settings.image = "turret_body";
    settings.spritewidth = 64;
    super(x + 32, y, settings);
    this.updateColRect(8, 48, -1, 0);
    this.tube = null;
    this.createTube(settings.z);
  }

  createTube(z) {
    this.tube = new TurretTubeEntity(this.pos.x - TurretTubeEntity.WIDTH, this.pos.y + 16, this);
    game.add(this.tube, z);
    game.sort();
  }

  onDestroyEvent() {
    game.remove(this.tube);
  }
}
