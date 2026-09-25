import ObstacleEntity from "./ObstacleEntity.js";

export default class RocketEntity extends ObstacleEntity {
  constructor(x, y, settings) {
    settings.image = "rocket";
    super(x, y, settings);
    this.updateColRect(12, 52, 10, 86);
  }
}
