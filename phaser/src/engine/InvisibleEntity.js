import * as Phaser from "phaser";
import { CollisionBox } from "./Entity.js";

/**
 * A collidable area without a sprite, like melonJS's `me.InvisibleEntity`.
 * Unlike `Entity`, its position is the top-left corner of the map object.
 */
export default class InvisibleEntity {
  constructor(x, y, settings) {
    this.pos = new Phaser.Math.Vector2(x, y);
    this.width = settings.width;
    this.height = settings.height;
    this.collisionBox = new CollisionBox(this.pos, this.width, this.height);
    this.name = settings.name ? settings.name.toLowerCase() : "";
    this.z = 0;
    this.visible = true;
    this.collidable = true;
    this.isEntity = true;
  }

  update() {
    return false;
  }

  updateColRect(x, w, y, h) {
    this.collisionBox.adjustSize(x, w, y, h);
  }

  checkCollision(obj) {
    const res = this.collisionBox.collideVsAABB(obj.collisionBox);
    if (res.x !== 0 || res.y !== 0) {
      this.onCollision(res, obj);
      res.obj = this;
      return res;
    }
    return null;
  }

  onCollision(res, obj) {}

  destroy() {
    this.onDestroyEvent();
  }

  onDestroyEvent() {}
}
