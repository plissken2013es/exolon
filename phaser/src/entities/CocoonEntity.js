import ObstacleEntity from "./ObstacleEntity.js";

export default class CocoonEntity extends ObstacleEntity {
  constructor(x, y, settings) {
    settings.image = "cocoon";
    super(x, y, settings);
  }
}
