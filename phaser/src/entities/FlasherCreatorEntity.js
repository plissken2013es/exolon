import KamikazeCreatorEntity from "./KamikazeCreatorEntity.js";
import FlasherEntity from "./FlasherEntity.js";

export default class FlasherCreatorEntity extends KamikazeCreatorEntity {
  createSpecificKamikaze(x, y) {
    return new FlasherEntity(x, y, this.behavior);
  }
}

// in sec
FlasherCreatorEntity.prototype.delay = 0.8;
