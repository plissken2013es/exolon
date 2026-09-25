import KamikazeCreatorEntity from "./KamikazeCreatorEntity.js";
import HarbringerEntity from "./HarbringerEntity.js";

/**
 * Sends a harbringer after the player when they stay too long in a screen.
 */
export default class HarbringerCreatorEntity extends KamikazeCreatorEntity {
  createSpecificKamikaze(x, y) {
    return new HarbringerEntity(x, y);
  }
}

// in sec
HarbringerCreatorEntity.prototype.delay = 40;
