import KamikazeCreatorEntity from "./KamikazeCreatorEntity.js";
import JellyfishEntity from "./JellyfishEntity.js";

export default class JellyfishCreatorEntity extends KamikazeCreatorEntity {
  createSpecificKamikaze(x, y) {
    return new JellyfishEntity(x, y, this.behavior);
  }
}

// in sec
JellyfishCreatorEntity.prototype.delay = 1;
