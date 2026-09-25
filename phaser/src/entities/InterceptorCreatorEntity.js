import KamikazeCreatorEntity from "./KamikazeCreatorEntity.js";
import InterceptorEntity from "./InterceptorEntity.js";

export default class InterceptorCreatorEntity extends KamikazeCreatorEntity {
  createSpecificKamikaze(x, y) {
    return new InterceptorEntity(x, y, this.behavior);
  }
}

// in sec
InterceptorCreatorEntity.prototype.delay = 1.5;
