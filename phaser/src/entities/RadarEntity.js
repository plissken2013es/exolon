import ObstacleEntity from "./ObstacleEntity.js";

export default class RadarEntity extends ObstacleEntity {
  constructor(x, y, settings) {
    settings.image = "radar";
    super(x, y, settings);
    this.updateColRect(6, 68, -1, 0);
  }
}
