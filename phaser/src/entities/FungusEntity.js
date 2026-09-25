import ObstacleEntity from "./ObstacleEntity.js";

export default class FungusEntity extends ObstacleEntity {
  constructor(x, y, settings) {
    settings.image = "fungus";
    super(x, y, settings);
  }
}
