import * as Phaser from "phaser";
import game from "../engine/game.js";
import audio from "../engine/audio.js";
import CollisionMap from "../engine/CollisionMap.js";
import FixedStep from "../engine/FixedStep.js";
import config from "../config.js";
import global from "../global.js";
import util from "../util.js";
import entities from "../entities/index.js";
import GameOverWindow from "../entities/GameOverWindow.js";
import HarbringerCreatorEntity from "../entities/HarbringerCreatorEntity.js";
import HUD from "../hud/HUD.js";
import AmmoHUD from "../hud/AmmoHUD.js";
import GrenadesHUD from "../hud/GrenadesHUD.js";
import PointsHUD from "../hud/PointsHUD.js";
import LivesHUD from "../hud/LivesHUD.js";
import ZonesHUD from "../hud/ZonesHUD.js";

// melonJS gave z 0 to the map and 1 to its background color, then numbered
// the layers and object groups in the order they appear in the map.
const BACKGROUND_COLOR_Z = 1;
const FIRST_LAYER_Z = 2;
const HUD_Z = 999;

const STARS_COUNT = 50;
const STAR_TILES = [10, 11, 12, 13, 14];

/**
 * An object that does nothing, standing in the object list for a melonJS
 * object drawn by Phaser (a map layer).
 */
class LayerStandIn {
  update() {
    return false;
  }
}

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super("Play");
  }

  create() {
    game.init(this);
    this.fixedStep = new FixedStep();
    this.paused = false;
    this.layers = {};

    this.loadLevel(global.nextLevel);

    const vitorc = game.getEntityByName("vitorc")[0];
    this.setVitorcRespawnPosition(vitorc);
    vitorc.outfit = config.initialVitorcOutfit;

    game.HUD = new HUD(this, 0, 352);
    game.add(game.HUD, HUD_Z);
    game.HUD.addItem("ammo", new AmmoHUD(0, 0, global.ammo));
    game.HUD.addItem("grenades", new GrenadesHUD(80, 0, global.grenades));
    game.HUD.addItem("points", new PointsHUD(224, 0, global.points));
    game.HUD.addItem("lives", new LivesHUD(336, 0, global.lives));
    game.HUD.addItem("zones", new ZonesHUD(432, 0, global.zones));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (game.scene === this) {
        // (the HUD is going away with the scene: don't update it)
        game.HUD = null;
        game.removeAll();
        game.currentLevel = null;
      }
      // the map goes away with the scene
      this.tilemap = null;
    });
  }

  update(time, delta) {
    this.fixedStep.tick(delta, () => {
      if (this.paused || game.changingScene) {
        return false;
      }
      game.update();
    });
    game.render();
  }

  loadLevel(level) {
    game.removeAll();
    // melonJS kept the HUD in the object list across levels
    if (game.HUD) {
      game.add(game.HUD, HUD_Z);
    }
    if (this.tilemap) {
      this.tilemap.destroy();
    }

    const data = this.cache.tilemap.get(level).data;
    const properties = {};
    for (const property of data.properties || []) {
      properties[property.name] = property.value;
    }
    game.currentLevel = { name: level, data, ...properties };
    game.collisionMap = new CollisionMap(data);

    this.cameras.main.setBackgroundColor(properties.background_color || "#000000");

    const map = this.make.tilemap({ key: level });
    const tilesets = map.tilesets.map((tileset) => map.addTilesetImage(tileset.name, tileset.name));
    for (const tileset of tilesets) {
      // Like Tiled (and melonJS), draw tiles bigger than the map grid aligned
      // to the bottom-left corner of their cell; Phaser aligns them top-left.
      tileset.tileOffset.set(0, tileset.tileHeight - map.tileHeight);
    }
    this.tilemap = map;
    this.layers = {};

    // melonJS also kept the map layers in its object list. They don't do
    // anything, but they take a place in the list, which matters for the
    // objects updated in the frame the level changes (see game.update).
    game.add(new LayerStandIn(), BACKGROUND_COLOR_Z);

    let z = FIRST_LAYER_Z;
    for (const layer of data.layers) {
      if (layer.type === "tilelayer") {
        const isCollisionLayer = layer.name.toLowerCase().includes("collision");
        if (layer.visible && (!isCollisionLayer || config.renderCollisionMap)) {
          this.layers[layer.name] = map.createLayer(layer.name, tilesets).setDepth(z);
          game.add(new LayerStandIn(), z);
        }
      } else if (layer.type === "objectgroup" && layer.visible) {
        for (const object of layer.objects) {
          this.addEntity(data, object, z);
        }
      }
      z++;
    }
    game.sort();
    game.flush();

    global.nextLevel = game.currentLevel.nextLevel;
    this.addStars();
    this.addHarbringerCreator();
  }

  /**
   * Creates the entity for a map object.
   */
  addEntity(map, object, z) {
    const settings = { name: object.name, width: object.width, height: object.height, z };
    for (const property of object.properties || []) {
      settings[property.name] = property.value;
    }

    let y = object.y;
    if (object.gid) {
      // tile objects are positioned by their bottom-left corner
      const tileset = map.tilesets.filter((t) => t.firstgid <= object.gid).pop();
      settings.image = tileset.name;
      settings.width = settings.spritewidth = tileset.tilewidth;
      settings.height = tileset.tileheight;
      y -= tileset.tileheight;
    }

    const EntityClass = entities[object.name];
    if (EntityClass) {
      game.add(new EntityClass(object.x, y, settings), z);
    } else {
      console.warn(`Unknown object "${object.name}" in map ${game.currentLevel.name}`);
    }
  }

  nextLevel() {
    const prevLevelVitorc = game.getEntityByName("vitorc")[0];
    const prevState = {
      y: prevLevelVitorc.pos.y,
      velX: prevLevelVitorc.vel.x,
      velY: prevLevelVitorc.vel.y,
      animation: prevLevelVitorc.current.name,
      falling: prevLevelVitorc.falling,
      jumping: prevLevelVitorc.jumping,
      outfit: prevLevelVitorc.outfit,
    };

    this.loadLevel(game.currentLevel.nextLevel);

    const vitorc = game.getEntityByName("vitorc")[0];
    this.restoreVitorcProperties(vitorc, prevState);
    this.setVitorcRespawnPosition(vitorc);

    util.updateZones(1);
  }

  gameOver() {
    const window = new GameOverWindow();
    game.add(window, 10);
    game.sort();

    this.paused = true;

    global.nextLevel = config.initialLevel;

    global.ammo = config.initialAmmo;
    global.grenades = config.initialGrenades;
    global.points = config.initialPoints;
    global.lives = config.initialLives;
    global.zones = config.initialZones;

    global.aliveBlasterBulletCount = 0;
    global.aliveGrenadesCount = 0;
    global.aliveMissilesCount = 0;

    this.time.delayedCall(4000, () => game.changeScene("Title"));
    audio.play("gameover");
  }

  restoreVitorcProperties(vitorc, prevState) {
    vitorc.pos.y = prevState.y;
    vitorc.vel.x = prevState.velX;
    vitorc.vel.y = prevState.velY;
    vitorc.setCurrentAnimation(prevState.animation);
    vitorc.falling = prevState.falling;
    vitorc.jumping = prevState.jumping;
    vitorc.outfit = prevState.outfit;
  }

  setVitorcRespawnPosition(vitorc) {
    const x = vitorc.pos.x;
    let y = vitorc.pos.y;
    const collisionMap = game.collisionMap;

    // find nearest ground tiles
    while (
      !collisionMap.getTile(x, y + vitorc.height) &&
      !collisionMap.getTile(x + 16, y + vitorc.height) &&
      !collisionMap.getTile(x + 32, y + vitorc.height) &&
      y < collisionMap.realheight
    ) {
      y++;
    }

    vitorc.respawnPos.x = x;
    vitorc.respawnPos.y = y;
  }

  addStars() {
    const layer = this.layers["Stars"];
    if (!layer) {
      return;
    }

    let i = 0;
    while (i < STARS_COUNT) {
      const x = util.getRandomInt(0, 31);
      const y = util.getRandomInt(0, 17);
      // The original meant to skip cells already taken, but it looked up the
      // tile coordinates as if they were pixels, i.e. it checked the cell at
      // (x / 16, y / 16). Kept as is, so stars can land on the planets, as
      // they did, and the random numbers drawn stay the same.
      if (layer.getTileAt(Math.floor(x / 16), Math.floor(y / 16))) {
        continue;
      }
      layer.putTileAt(util.arrayRandomElement(STAR_TILES), x, y);
      i++;
    }
  }

  addHarbringerCreator() {
    const creator = new HarbringerCreatorEntity();
    game.add(creator, HUD_Z);
    game.sort();
  }
}
