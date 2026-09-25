import ObstacleEntity from "./ObstacleEntity.js";
import game from "../engine/game.js";
import EggEntity from "./EggEntity.js";

/**
 * An obstacle with eggs moving inside.
 */
export default class IncubatorEntity extends ObstacleEntity {
  constructor(x, y, settings) {
    settings.image = "incubator";
    super(x, y, settings);
    this.eggs = [];
    this.createEggs(settings.z);
  }

  createEggs(z) {
    for (let i = 0; i < IncubatorEntity.EGG_COUNT; ++i) {
      const bounds = { x: this.pos.x + 16, y: this.pos.y + 16, w: 32, h: 32 };
      const egg = new EggEntity(this.pos.x + 20, this.pos.y + EggEntity.HEIGHT + 20, { bounds });
      game.add(egg, z);
      this.eggs.push(egg);
    }
    game.sort();
  }

  onDestroyEvent() {
    // the eggs are free once the incubator is destroyed
    for (const egg of this.eggs) {
      egg.bounds = null;
    }
  }
}

IncubatorEntity.EGG_COUNT = 8;
