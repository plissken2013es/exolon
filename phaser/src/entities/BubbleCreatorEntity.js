import KamikazeCreatorEntity from "./KamikazeCreatorEntity.js";
import BubbleEntity from "./BubbleEntity.js";

export default class BubbleCreatorEntity extends KamikazeCreatorEntity {
  createSpecificKamikaze(x, y) {
    return new BubbleEntity(x, y, this.behavior);
  }
}

// in sec
BubbleCreatorEntity.prototype.delay = 1;
