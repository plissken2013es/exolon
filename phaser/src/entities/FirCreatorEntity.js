import KamikazeCreatorEntity from "./KamikazeCreatorEntity.js";
import FirEntity from "./FirEntity.js";

export default class FirCreatorEntity extends KamikazeCreatorEntity {
  createSpecificKamikaze(x, y) {
    return new FirEntity(x, y + 8, this.behavior);
  }
}

// in sec
FirCreatorEntity.prototype.delay = 1.2;
