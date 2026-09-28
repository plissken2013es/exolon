import { basename, isCollisionLayer, tilesetForGid, tilesetKey } from "./mapUtils.js";

/**
 * What can be put in a map, learnt from all the maps of the game: the
 * tilesets used to draw the screens, and for each kind of object, how it's
 * drawn (its tileset and tile) and the properties it takes.
 */
export function buildCatalogue(maps) {
  const tileTilesets = new Map(); // key -> tileset (without firstgid)
  const objects = new Map(); // name -> info

  function definition(tileset) {
    const { firstgid, ...def } = tileset;
    return def;
  }

  for (const map of maps) {
    for (const layer of map.layers) {
      if (layer.type === "tilelayer" && !isCollisionLayer(layer)) {
        for (const gid of layer.data) {
          if (gid) {
            const tileset = tilesetForGid(map, gid);
            tileTilesets.set(tilesetKey(tileset) + "|" + basename(tileset.image), definition(tileset));
          }
        }
      } else if (layer.type === "objectgroup") {
        for (const object of layer.objects) {
          let info = objects.get(object.name);
          if (!info) {
            info = { name: object.name, count: 0, looks: new Map(), sizes: new Map() };
            objects.set(object.name, info);
          }
          info.count++;
          if (object.gid) {
            const tileset = tilesetForGid(map, object.gid);
            const look = tilesetKey(tileset) + ":" + (object.gid - tileset.firstgid);
            const entry = info.looks.get(look) || { tileset: definition(tileset), localId: object.gid - tileset.firstgid, count: 0 };
            entry.count++;
            info.looks.set(look, entry);
          } else {
            const size = `${object.width}x${object.height}`;
            info.sizes.set(size, (info.sizes.get(size) || 0) + 1);
          }
        }
      }
    }
  }

  const mostCommon = (entries) => [...entries].sort((a, b) => b[1] - a[1])[0];

  return {
    tileTilesets: [...tileTilesets.values()].sort((a, b) => (a.name === "tiles" ? -1 : b.name === "tiles" ? 1 : 0)),
    objects: [...objects.values()]
      .map((info) => {
        const look = info.looks.size ? [...info.looks.values()].sort((a, b) => b.count - a.count)[0] : null;
        const size = info.sizes.size ? mostCommon([...info.sizes.entries()].map(([s, n]) => [s, n]))[0] : null;
        const [width, height] = size ? size.split("x").map(Number) : [0, 0];
        return { name: info.name, tileset: look && look.tileset, localId: look && look.localId, width, height };
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/**
 * The properties each kind of object understands (see the entities code).
 */
const CREATOR = (behaviors, delay) => [
  { name: "behavior", options: behaviors, default: behaviors[0], help: "how the enemies move" },
  { name: "delay", type: "number", placeholder: String(delay), help: "seconds between enemies" },
];

export const PROPERTIES = {
  light: [{ name: "placement", options: ["floor", "ceiling"], required: true }],
  bubble_creator: CREATOR(["swing", "circular", "zig_zag"], 1),
  fir_creator: CREATOR(["zig_zag", "swing_and_acceleration"], 1.2),
  flasher_creator: CREATOR(["up_and_down", "acceleration", "swing"], 0.8),
  interceptor_creator: CREATOR(["swing_and_acceleration", "acceleration", "zig_zag"], 1.5),
  jellyfish_creator: CREATOR(["circular", "swing_and_acceleration", "up_and_down"], 1).map((p) =>
    p.name === "behavior" ? { ...p, required: true } : p
  ),
  louse_creator: CREATOR(["acceleration", "circular", "swing"], 0.8).map((p) =>
    p.name === "behavior" ? { ...p, required: true } : p
  ),
  double_launcher: [
    { name: "fireDurationMin", type: "number", placeholder: "20", help: "min frames between shots" },
    { name: "fireDurationMax", type: "number", placeholder: "160", help: "max frames between shots" },
  ],
};

/**
 * The tile of a light depends on where it is (its tileset has the floor
 * lights first, then the ceiling ones).
 */
export const LIGHT_TILES = { floor: 0, ceiling: 8 };

export const DESCRIPTIONS = {
  vitorc: "the player (one per screen)",
  exit: "end of the level",
  capsule: "changes the outfit (jump inside)",
  teleport: "teleports come in pairs",
  egg: "egg (lethal, moves around)",
  incubator: "obstacle with 8 eggs inside",
  mine: "lethal unless wearing the exolon outfit",
  piston: "lethal piston",
  beam: "energy barrier, 50 shots to destroy",
  double_launcher: "rocket launcher, capture it for points",
  missile_guidance: "launches guided missiles",
  ammo_pack: "refills ammo",
  grenade_pack: "refills grenades",
};
