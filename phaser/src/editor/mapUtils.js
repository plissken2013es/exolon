/**
 * Helpers to work with Tiled JSON maps (as produced by maps/tmx.js).
 */

export const TILE = 16;

export function cloneMap(map) {
  return JSON.parse(JSON.stringify(map));
}

export function basename(path) {
  return path.slice(path.lastIndexOf("/") + 1);
}

/**
 * Identifies a tileset independently of the map it's in (its firstgid
 * changes from map to map).
 */
export function tilesetKey(tileset) {
  return `${tileset.name}@${tileset.tilewidth}x${tileset.tileheight}`;
}

export function tilesetForGid(map, gid) {
  let found = null;
  for (const tileset of map.tilesets) {
    if (tileset.firstgid <= gid && (!found || tileset.firstgid > found.firstgid)) {
      found = tileset;
    }
  }
  return found;
}

/**
 * The rectangle of a tile in its tileset image.
 */
export function tileFrame(tileset, localId) {
  return {
    sx: (localId % tileset.columns) * tileset.tilewidth,
    sy: Math.floor(localId / tileset.columns) * tileset.tileheight,
    w: tileset.tilewidth,
    h: tileset.tileheight,
  };
}

export function isCollisionLayer(layer) {
  return layer.type === "tilelayer" && layer.name.toLowerCase().includes("collision");
}

/**
 * The gid of the solid tile used in the collision layer.
 */
export function solidGid(map) {
  for (const tileset of map.tilesets) {
    for (const tile of tileset.tiles || []) {
      if ((tile.properties || []).some((p) => p.name === "type" && p.value === "solid")) {
        return tileset.firstgid + tile.id;
      }
    }
  }
  return 0;
}

/**
 * Returns the tileset of the map matching `def` (a tileset from another
 * map), adding it to the map if needed.
 */
export function ensureTileset(map, def) {
  const key = tilesetKey(def);
  const existing = map.tilesets.find((t) => tilesetKey(t) === key && basename(t.image) === basename(def.image));
  if (existing) {
    return existing;
  }
  const firstgid = map.tilesets.reduce((max, t) => Math.max(max, t.firstgid + t.tilecount), 1);
  const tileset = { ...JSON.parse(JSON.stringify(def)), firstgid };
  map.tilesets.push(tileset);
  return tileset;
}

/**
 * The bounds of an object in pixels. Tile objects are positioned by their
 * bottom-left corner, the others (rectangles) by their top-left one.
 */
export function objectBounds(map, object) {
  if (object.gid) {
    const tileset = tilesetForGid(map, object.gid);
    return { x: object.x, y: object.y - tileset.tileheight, w: tileset.tilewidth, h: tileset.tileheight };
  }
  return { x: object.x, y: object.y, w: object.width || TILE, h: object.height || TILE };
}

export function getProperty(object, name) {
  const property = (object.properties || []).find((p) => p.name === name);
  return property ? property.value : undefined;
}

/**
 * Sets (or with `undefined`, removes) a custom property, typing the value
 * as the maps do.
 */
export function setProperty(object, name, value) {
  const properties = (object.properties || []).filter((p) => p.name !== name);
  if (value !== undefined && value !== "") {
    const property = { name, ...typedValue(value) };
    const index = (object.properties || []).findIndex((p) => p.name === name);
    properties.splice(index >= 0 ? index : properties.length, 0, property);
  }
  if (properties.length) {
    object.properties = properties;
  } else {
    delete object.properties;
  }
}

function typedValue(value) {
  if (typeof value === "boolean") {
    return { type: "bool", value };
  }
  const s = String(value).trim();
  if (s === "true" || s === "false") {
    return { type: "bool", value: s === "true" };
  }
  if (s !== "" && !isNaN(s)) {
    const number = Number(s);
    return { type: Number.isInteger(number) ? "int" : "float", value: number };
  }
  return { type: "string", value: s };
}
