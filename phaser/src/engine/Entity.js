import * as Phaser from "phaser";
import game from "./game.js";

/**
 * An axis-aligned hit box attached to an entity position, like melonJS's
 * collision `me.Rect` with an adjusted size.
 */
export class CollisionBox {
  constructor(pos, width, height) {
    this.pos = pos;
    this.colPos = { x: 0, y: 0 };
    this.width = width;
    this.height = height;
    this.hWidth = ~~(width / 2);
    this.hHeight = ~~(height / 2);
  }

  get left() {
    return this.pos.x + this.colPos.x;
  }

  get right() {
    return this.pos.x + this.colPos.x + this.width;
  }

  get top() {
    return this.pos.y + this.colPos.y;
  }

  get bottom() {
    return this.pos.y + this.colPos.y + this.height;
  }

  adjustSize(x, w, y, h) {
    if (x !== -1) {
      this.colPos.x = x;
      this.width = w;
      this.hWidth = ~~(w / 2);
    }
    if (y !== -1) {
      this.colPos.y = y;
      this.height = h;
      this.hHeight = ~~(h / 2);
    }
  }

  flipX(spriteWidth) {
    this.colPos.x = spriteWidth - this.width - this.colPos.x;
  }

  overlaps(r) {
    return this.left < r.right && r.left < this.right && this.top < r.bottom && r.top < this.bottom;
  }

  /**
   * AABB vs AABB collision. Returns the penetration vector along the axis of
   * least penetration, or {x: 0, y: 0} if the boxes don't overlap.
   */
  collideVsAABB(rect) {
    const p = { x: 0, y: 0 };
    if (this.overlaps(rect)) {
      const dx = this.left + this.hWidth - rect.left - rect.hWidth;
      const dy = this.top + this.hHeight - rect.top - rect.hHeight;
      p.x = rect.hWidth + this.hWidth - Math.abs(dx);
      p.y = rect.hHeight + this.hHeight - Math.abs(dy);
      if (p.x < p.y) {
        p.y = 0;
        p.x = dx < 0 ? -p.x : p.x;
      } else {
        p.x = 0;
        p.y = dy < 0 ? -p.y : p.y;
      }
    }
    return p;
  }
}

/**
 * Returns the name of the frame of `key` at `index` in a grid of
 * `width` x `height` cells, adding the frame to the texture if needed.
 */
function getFrame(key, width, height, index, columns) {
  const texture = game.scene.textures.get(key);
  const name = `${width}x${height}:${index}`;
  if (!texture.has(name)) {
    texture.add(name, 0, width * (index % columns), height * Math.floor(index / columns), width, height);
  }
  return name;
}

/**
 * A game entity: a port of melonJS 0.9.4's `me.ObjectEntity` (together with
 * the `me.AnimationSheet` and `me.SpriteObject` it inherits from).
 *
 * Positions are the top-left corner of the sprite, in pixels. Velocities
 * are in pixels per frame, and animations advance one frame every
 * `animationspeed + 1` updates, so the game plays exactly as it did in
 * melonJS as long as it's updated 60 times per second.
 *
 * `settings` are the object properties from the map (or built by the code
 * spawning the entity): `image`, `spritewidth`, `spriteheight`, `name`,
 * `height`, `collidable`...
 */
export default class Entity {
  constructor(x, y, settings) {
    const scene = game.scene;
    const source = scene.textures.get(settings.image).getSourceImage();

    this.image = settings.image;
    this.width = settings.spritewidth || source.width;
    this.height = settings.spriteheight || source.height;
    this.spritecount = {
      x: ~~(source.width / this.width),
      y: ~~(source.height / this.height),
    };

    this.name = settings.name ? settings.name.toLowerCase() : "";
    this.z = 0;
    this.visible = true;
    this.isEntity = true;
    this.alive = true;
    this.collidable = settings.collidable || false;
    this.type = settings.type || 0;

    // map objects are positioned by their bottom-left corner
    this.pos = new Phaser.Math.Vector2(x, game.currentLevel ? y + (settings.height || 0) - this.height : y);
    this.vel = new Phaser.Math.Vector2();
    this.accel = new Phaser.Math.Vector2();
    this.maxVel = new Phaser.Math.Vector2(1000, 1000);
    this.gravity = 0.98;
    this.falling = false;
    this.jumping = true;

    this.collisionBox = new CollisionBox(this.pos, this.width, this.height);
    this.lastflipX = false;
    this.lastflipY = false;

    this.sprite = scene.add.image(0, 0, this.image).setOrigin(0, 0).setVisible(false);

    // animations
    this.anim = {};
    this.current = null;
    this.resetAnim = null;
    this.fpscount = 0;
    this.animationspeed = 6; // me.sys.fps / 10
    this.frame = "__BASE";
    this.singleFrame = this.spritecount.x * this.spritecount.y === 1;
    this.addAnimation("default", null);
    this.setCurrentAnimation("default");
  }

  // the entity rectangle (the sprite bounds, not the collision box)

  get left() {
    return this.pos.x;
  }

  get right() {
    return this.pos.x + this.width;
  }

  get top() {
    return this.pos.y;
  }

  get bottom() {
    return this.pos.y + this.height;
  }

  get collisionMap() {
    return game.collisionMap;
  }

  // --- animation -----------------------------------------------------------

  addAnimation(name, frames) {
    if (frames == null) {
      frames = [];
      for (let i = 0, count = this.spritecount.x * this.spritecount.y; i < count; i++) {
        frames[i] = i;
      }
    }
    this.anim[name] = {
      name,
      frame: this.singleFrame
        ? ["__BASE"]
        : frames.map((i) => getFrame(this.image, this.width, this.height, i, this.spritecount.x)),
      idx: 0,
      length: frames.length,
    };
  }

  /**
   * `resetAnim` is either the name of the animation to switch to when this
   * one ends, or a function called (with this entity as `this`) when it ends.
   */
  setCurrentAnimation(name, resetAnim) {
    this.current = this.anim[name];
    this.resetAnim = resetAnim || null;
    this.setAnimationFrame(this.current.idx);
  }

  isCurrentAnimation(name) {
    return this.current.name === name;
  }

  setAnimationFrame(idx) {
    if (this.singleFrame) {
      return;
    }
    this.current.idx = (idx || 0) % this.current.length;
    this.frame = this.current.frame[this.current.idx];
  }

  /**
   * Advances the current animation. Entities overriding `update` call this
   * (as `super.update()`) to keep their animation running.
   */
  update() {
    if (this.visible && this.fpscount++ > this.animationspeed) {
      this.setAnimationFrame(++this.current.idx);
      this.fpscount = 0;

      if (this.current.idx === 0 && this.resetAnim) {
        if (typeof this.resetAnim === "string") {
          this.setCurrentAnimation(this.resetAnim);
        } else {
          this.resetAnim();
        }
      }
      return true;
    }
    return false;
  }

  // --- rendering -----------------------------------------------------------

  flipX(flip) {
    if (flip !== this.lastflipX) {
      this.lastflipX = flip;
      this.collisionBox.flipX(this.width);
    }
  }

  render() {
    if (this.sprite.frame.name !== this.frame) {
      this.sprite.setFrame(this.frame);
    }
    this.sprite
      .setVisible(this.visible)
      .setPosition(~~this.pos.x, ~~this.pos.y)
      .setFlipX(this.lastflipX)
      .setDepth(this.z);
  }

  /**
   * Called by `game.remove`.
   */
  destroy() {
    this.sprite.destroy();
    this.onDestroyEvent();
  }

  onDestroyEvent() {}

  // --- collisions ----------------------------------------------------------

  updateColRect(x, w, y, h) {
    this.collisionBox.adjustSize(x, w, y, h);
  }

  checkCollision(obj) {
    const res = this.collisionBox.collideVsAABB(obj.collisionBox);
    if (res.x !== 0 || res.y !== 0) {
      this.onCollision(res, obj);
      res.type = this.type;
      res.obj = this;
      return res;
    }
    return null;
  }

  /**
   * Called when `obj` collides with this entity.
   */
  onCollision(res, obj) {}

  // --- movement ------------------------------------------------------------

  setVelocity(x, y) {
    this.accel.x = x !== 0 ? x : this.accel.x;
    this.accel.y = y !== 0 ? y : this.accel.y;
    this.setMaxVelocity(x, y);
  }

  setMaxVelocity(x, y) {
    this.maxVel.x = x;
    this.maxVel.y = y;
  }

  doWalk(left) {
    this.flipX(left);
    this.vel.x += left ? -this.accel.x : this.accel.x;
  }

  doJump() {
    if (!this.jumping && !this.falling) {
      this.vel.y = -this.maxVel.y;
      this.jumping = true;
      return true;
    }
    return false;
  }

  forceJump() {
    this.jumping = this.falling = false;
    this.doJump();
  }

  computeVelocity(vel) {
    if (this.gravity) {
      vel.y += this.gravity;
      this.falling = vel.y > 0;
      this.jumping = this.falling ? false : this.jumping;
    }
    if (vel.y !== 0) {
      vel.y = Phaser.Math.Clamp(vel.y, -this.maxVel.y, this.maxVel.y);
    }
    if (vel.x !== 0) {
      vel.x = Phaser.Math.Clamp(vel.x, -this.maxVel.x, this.maxVel.x);
    }
  }

  /**
   * Applies gravity, moves the entity by its velocity and stops it against
   * solid tiles. Returns the collision result of the collision map
   * (`res.x`/`res.y` are non-zero on a collision along that axis).
   */
  updateMovement() {
    this.computeVelocity(this.vel);

    const collision = game.collisionMap.checkCollision(this.collisionBox, this.vel);

    if (collision.y > 0) {
      // landed on a solid tile
      this.pos.y = ~~this.pos.y;
      this.vel.y = this.falling ? collision.ytile.pos.y - this.collisionBox.bottom : 0;
      this.falling = false;
    } else if (collision.y < 0) {
      // hit the ceiling
      this.falling = true;
      this.vel.y = 0;
    }

    if (collision.x) {
      this.vel.x = 0;
    }

    this.pos.add(this.vel);

    return collision;
  }
}
