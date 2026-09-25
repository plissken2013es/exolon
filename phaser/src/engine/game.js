import config from "../config.js";

/**
 * The game object manager, a port of melonJS 0.9.4's `me.game`.
 *
 * The original game logic depends on details of how melonJS updated and
 * collided its objects, so this keeps the same rules instead of using
 * Phaser's scene list or Arcade Physics:
 *
 * - Objects are kept in a list sorted by descending z and updated from the
 *   end, i.e. lowest z first (among equal z, the most recently added first).
 * - Objects added during a frame are not updated until the next frame.
 * - Removal is deferred until the end of the frame: removed objects are
 *   still updated until then.
 * - `collide` returns the first overlapping collidable entity, in update order.
 * - Entities outside the viewport become invisible, which also makes them
 *   non-collidable and freezes their animation.
 *
 * Whatever needs a Phaser scene (sprites, sounds) uses `game.scene`, the
 * scene currently running the simulation.
 */
const game = {
  scene: null,

  // current level (a Tiled JSON map), or null outside the play screen
  currentLevel: null,
  collisionMap: null,

  // the play screen HUD, or null
  HUD: null,

  viewport: { left: 0, top: 0, right: 512, bottom: 384 },

  objects: [],
  pendingRemovals: [],
  sortPending: false,

  // game time in ms, advanced by 1000/60 every update (melonJS used the
  // real time of the frame, which is the same at 60 fps)
  time: 0,

  // true once a scene change has been requested, to stop simulating the
  // scene being left
  changingScene: false,

  debugGraphics: null,

  /**
   * Binds the manager to the scene that will run the simulation.
   */
  init(scene) {
    this.removeAll();
    this.scene = scene;
    this.currentLevel = null;
    this.collisionMap = null;
    this.HUD = null;
    this.changingScene = false;
    this.debugGraphics = config.renderHitBox ? scene.add.graphics().setDepth(10000) : null;
  },

  /**
   * Switches to another scene at the end of the frame, like
   * `me.state.change`.
   */
  changeScene(key) {
    if (!this.changingScene) {
      this.changingScene = true;
      this.scene.scene.start(key);
    }
  },

  add(obj, z) {
    obj.z = z ? z : obj.z;
    this.objects.push(obj);
  },

  /**
   * Destroys `obj` and takes it out of the list at the end of the frame (it
   * is still updated until then). As in melonJS, removing an object twice
   * destroys it twice.
   */
  remove(obj) {
    if (obj.destroy) {
      obj.destroy();
    }
    obj.visible = false;
    obj.isEntity = false;
    this.pendingRemovals.push(obj);
  },

  /**
   * Destroys all the objects, including those removed during this frame
   * (which are then destroyed twice, as in melonJS).
   */
  removeAll() {
    const objects = this.objects;
    for (let i = objects.length - 1; i >= 0; i--) {
      if (objects[i].destroy) {
        objects[i].destroy();
      }
    }
    this.objects = [];
    this.pendingRemovals = [];
    this.sortPending = false;
  },

  /**
   * Sorts the object list by z at the end of the current frame.
   */
  sort() {
    this.sortPending = true;
  },

  /**
   * Runs one frame of the simulation (melonJS ran exactly one update per
   * displayed frame, at 60 fps).
   */
  update() {
    this.time += 1000 / 60;
    // Like melonJS, keep reading the current list: when the level changes
    // during an update the loop carries on over the new level's objects.
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      if (obj === undefined) {
        break;
      }
      obj.update();
      if (obj.isEntity) {
        obj.visible = this.isVisible(obj.collisionBox);
      }
    }
    this.flush();
  },

  flush() {
    if (this.pendingRemovals.length) {
      const removed = new Set(this.pendingRemovals);
      this.objects = this.objects.filter((obj) => !removed.has(obj));
      this.pendingRemovals = [];
    }
    if (this.sortPending) {
      // Array#sort is stable, as the melonJS code relied on
      this.objects.sort((a, b) => b.z - a.z);
      this.sortPending = false;
    }
  },

  /**
   * Updates the Phaser game objects from the simulation state.
   */
  render() {
    for (const obj of this.objects) {
      if (obj.render) {
        obj.render();
      }
    }
    if (this.debugGraphics) {
      this.drawHitBoxes();
    }
  },

  isVisible(rect) {
    const vp = this.viewport;
    return rect.left < vp.right && vp.left < rect.right && rect.top < vp.bottom && vp.top < rect.bottom;
  },

  /**
   * Returns the collision vector (with a reference to the other object in
   * `res.obj`) of the first entity colliding with `objB`, or null.
   */
  collide(objB) {
    const objects = this.objects;
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (obj.visible && obj.collidable && obj.isEntity && obj !== objB) {
        const res = obj.checkCollision(objB);
        if (res) {
          return res;
        }
      }
    }
    return null;
  },

  getEntityByName(name) {
    name = name.toLowerCase();
    const list = [];
    for (let i = this.objects.length - 1; i >= 0; i--) {
      if (this.objects[i].name === name) {
        list.push(this.objects[i]);
      }
    }
    return list;
  },

  drawHitBoxes() {
    const g = this.debugGraphics;
    g.clear();
    for (const obj of this.objects) {
      if (obj.isEntity && obj.visible) {
        g.lineStyle(1, 0x0000ff).strokeRect(obj.pos.x, obj.pos.y, obj.width, obj.height);
        const box = obj.collisionBox;
        g.lineStyle(1, 0xff0000).strokeRect(box.left, box.top, box.width, box.height);
      }
    }
  },
};

export default game;
