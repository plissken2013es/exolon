/**
 * The collision layer of a level: a port of melonJS 0.9.4's collision
 * `me.TiledLayer`. Only tiles whose tileset `type` property is "solid" are
 * collidable (the only kind of collision tile the Exolon maps use).
 */
export default class CollisionMap {
  /**
   * `map` is a Tiled JSON map, `layerName` the (case-insensitive) name of
   * its collision layer.
   */
  constructor(map, layerName = "collision") {
    const layer = map.layers.find(
      (l) => l.type === "tilelayer" && l.name.toLowerCase().includes(layerName)
    );
    if (!layer) {
      throw new Error("No collision layer found in the map");
    }

    const solidGids = new Set();
    for (const tileset of map.tilesets) {
      for (const tile of tileset.tiles || []) {
        const type = (tile.properties || []).find((p) => p.name === "type");
        if (type && String(type.value).toLowerCase() === "solid") {
          solidGids.add(tileset.firstgid + tile.id);
        }
      }
    }

    this.width = layer.width;
    this.height = layer.height;
    this.tilewidth = map.tilewidth;
    this.tileheight = map.tileheight;
    this.realwidth = this.width * this.tilewidth;
    this.realheight = this.height * this.tileheight;

    // tiles[x][y] is the tile at column x and row y, or null
    this.tiles = [];
    for (let x = 0; x < this.width; x++) {
      this.tiles[x] = [];
      for (let y = 0; y < this.height; y++) {
        const gid = layer.data[y * this.width + x];
        this.tiles[x][y] = gid
          ? { col: x, row: y, gid, solid: solidGids.has(gid), pos: { x: x * this.tilewidth, y: y * this.tileheight } }
          : null;
      }
    }
  }

  /**
   * Returns the tile at the given pixel coordinates, or null.
   */
  getTile(x, y) {
    const column = this.tiles[~~(x / this.tilewidth)];
    return (column && column[~~(y / this.tileheight)]) || null;
  }

  isCollidable(tile) {
    return tile !== null && tile.solid;
  }

  /**
   * Checks the movement of the box `obj` by the vector `pv` against the map.
   *
   * Like melonJS, only the corners of the box on the side it is moving to are
   * tested, so boxes bigger than a tile can overlap single tiles in between.
   * The result has `x`/`y` set to the blocked movement on each axis (0 when
   * free) and `xtile`/`ytile` set to the tiles hit.
   */
  checkCollision(obj, pv) {
    const x = pv.x < 0 ? ~~(obj.left + pv.x) : Math.ceil(obj.right - 1 + pv.x);
    const y = pv.y < 0 ? ~~(obj.top + pv.y) : Math.ceil(obj.bottom - 1 + pv.y);

    const res = { x: 0, xtile: undefined, y: 0, ytile: undefined };

    if (x <= 0 || x >= this.realwidth) {
      // world limits
      res.x = pv.x;
    } else if (pv.x !== 0) {
      // x, bottom corner
      res.xtile = this.getTile(x, Math.ceil(obj.bottom - 1));
      if (this.isCollidable(res.xtile)) {
        res.x = pv.x;
      } else {
        // x, top corner
        res.xtile = this.getTile(x, ~~obj.top);
        if (this.isCollidable(res.xtile)) {
          res.x = pv.x;
        }
      }
    }

    if (pv.y !== 0) {
      // leading corner first
      res.ytile = this.getTile(pv.x < 0 ? ~~obj.left : Math.ceil(obj.right - 1), y);
      if (this.isCollidable(res.ytile)) {
        res.y = pv.y || 1;
      } else {
        res.ytile = this.getTile(pv.x < 0 ? Math.ceil(obj.right - 1) : ~~obj.left, y);
        if (this.isCollidable(res.ytile)) {
          res.y = pv.y || 1;
        }
      }
    }

    return res;
  }
}
