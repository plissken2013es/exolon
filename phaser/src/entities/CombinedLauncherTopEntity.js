import ObstacleEntity from "./ObstacleEntity.js";
import game from "../engine/game.js";
import TurretTubeEntity from "./TurretTubeEntity.js";

export default class CombinedLauncherTopEntity extends ObstacleEntity {
  constructor(x, y, settings) {
    settings.image = "combined_launcher_top";
    super(x, y, settings);
    this.tube = null;
    this.createTube(settings.z);
  }

  createTube(z) {
    this.tube = new TurretTubeEntity(this.pos.x - 16, this.pos.y, this);
    game.add(this.tube, z);
    game.sort();
  }

  onDestroyEvent() {
    game.remove(this.tube);
  }
}
