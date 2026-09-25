import Entity from "../engine/Entity.js";
import game from "../engine/game.js";
import explosion from "../explosion.js";
import MineFireEntity from "./MineFireEntity.js";

/**
 * A mine on the floor: deadly, unless wearing the exolon outfit.
 */
export default class MineEntity extends Entity {
  constructor(x, y, settings) {
    // uses the image of its tile in the map
    super(x, y, settings);
    this.collidable = true;
    this.updateColRect(14, 4, -2, 1);
  }

  onCollision(res, obj) {
    if (obj.name == "vitorc") {
      explosion.create(this.pos.x + this.width / 2, this.pos.y + this.height / 2, 30);
      game.remove(this);
      this.createFire();
    }
  }

  createFire() {
    const fire = new MineFireEntity(this.pos.x, this.pos.y);
    game.add(fire, this.z);
    game.sort();
  }
}
