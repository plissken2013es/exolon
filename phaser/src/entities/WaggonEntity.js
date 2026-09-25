import ObstacleEntity from "./ObstacleEntity.js";

export default class WaggonEntity extends ObstacleEntity {
  constructor(x, y, settings) {
    settings.image = "waggon";
    super(x, y, settings);
  }
}
