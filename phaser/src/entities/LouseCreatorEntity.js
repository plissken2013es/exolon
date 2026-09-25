import KamikazeCreatorEntity from "./KamikazeCreatorEntity.js";
import LouseEntity from "./LouseEntity.js";

export default class LouseCreatorEntity extends KamikazeCreatorEntity {
  createSpecificKamikaze(x, y) {
    return new LouseEntity(x, y, this.behavior);
  }
}

// in sec
LouseCreatorEntity.prototype.delay = 0.8;
