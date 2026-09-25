#!/usr/bin/env node
/**
 * Plays the original melonJS game (exolon.html) and the Phaser port side by
 * side, one frame at a time, with the same keys held, and compares the
 * player's state after every frame: position, velocity, jump/fall state,
 * animation, hit box, screen, outfit, bullets and grenades in flight...
 *
 * Both games are driven by hand (their own loops are paused), so the
 * comparison is exact and doesn't depend on timing.
 *
 * Until all the entities are ported, the other map objects are removed from
 * both games (and the enemy spawners of the original are disabled), so the
 * comparison is about the player alone.
 *
 * Usage:
 *   npm run dev                      # the Phaser port, on port 5173
 *   python3 -m http.server 8000      # the original, from the project root
 *   npx playwright install chromium  # once
 *   npm run compare
 *
 * The URLs can be changed with the OLD_URL and NEW_URL environment variables.
 */
import { chromium } from "playwright";

const OLD_URL = process.env.OLD_URL || "http://localhost:8000/exolon.html";
const NEW_URL = process.env.NEW_URL || "http://localhost:5173/";

// melonJS screen ids (src/screens.js)
const TITLE = 101;
const PLAY = 102;

// [frames, keys held, action run in both games before those frames]
const SCRIPT = [
  [20, []],
  [90, ["ArrowRight"]],
  [10, []],
  [60, ["ArrowLeft"]],
  [5, ["ArrowLeft", "ArrowUp"]],
  [70, ["ArrowLeft"]],
  [30, []],
  [8, ["ArrowUp"]],
  [60, []],
  [30, ["ArrowRight", "ArrowUp"]],
  [60, ["ArrowRight"]],
  [20, ["ArrowDown"]],
  [3, ["ArrowDown", "Space"]],
  [20, ["ArrowDown"]],
  [3, ["Space"]],
  [30, []],
  [60, ["Space"]],
  [90, []],
  [40, ["ArrowLeft"]],
  [80, ["ArrowRight"]],
  [45, ["Space"]],
  [120, []],
  // die and respawn (with the invincibility timer)
  [150, [], "die"],
  [20, ["ArrowRight"], "die"],
  [200, ["ArrowRight"]],
  // exolon outfit: two bullets per shot
  [3, ["Space"], "exolon"],
  [40, []],
  [3, ["Space"]],
  [40, ["ArrowLeft"]],
  [3, ["Space"]],
  [60, ["ArrowRight"]],
  [3, [], "vitorc"],
  // run through several screens, jumping now and then
  ...Array.from({ length: 30 }, (_, i) => [
    [60 + (i % 5) * 7, ["ArrowRight"]],
    [25, ["ArrowRight", "ArrowUp"]],
  ]).flat(),
];

const ACTIONS = {
  die: () => G.getEntityByName("vitorc")[0].die(),
  exolon: () => {
    G.getEntityByName("vitorc")[0].outfit = "exolon";
  },
  vitorc: () => {
    G.getEntityByName("vitorc")[0].outfit = "vitorc";
  },
};

// Map objects (and objects they spawn) not ported yet
const UNPORTED =
  "ammo_pack beam bubble_creator capsule cocoon combined_launcher_bottom combined_launcher_top " +
  "discharge double_launcher egg exit fir_creator flasher_creator fungus grenade_pack incubator " +
  "interceptor_creator jellyfish_creator light louse_creator mine missile_guidance piston radar " +
  "rocket ship_fire square_light teleport turret turret_bullet waggon";

// Runs in both pages, where `G` is the game object manager.
function removeUnported(names) {
  for (const name of names.split(" ")) {
    for (const e of G.getEntityByName(name)) {
      G.remove(e);
    }
  }
  for (const e of G.getEntityByName("")) {
    if (e.isEntity) {
      G.remove(e);
    }
  }
}

function sample() {
  const v = G.getEntityByName("vitorc")[0];
  const b = v.collisionBox;
  const round = (n) => +n.toFixed(3);
  const list = (name) =>
    G.getEntityByName(name)
      .map((e) => [e.pos.x, e.pos.y].map(round).join(","))
      .sort()
      .join(" ");
  return {
    x: round(v.pos.x),
    y: round(v.pos.y),
    vx: round(v.vel.x),
    vy: round(v.vel.y),
    falling: v.falling,
    jumping: v.jumping,
    anim: v.current.name,
    frame: v.current.idx,
    box: [b.left, b.top, b.width, b.height].map(round).join(","),
    screen: G.currentLevel.name.toLowerCase(),
    outfit: v.outfit,
    invincible: v.invincible,
    dieTimer: v.dieTimer,
    bullets: list("blaster_bullet"),
    grenades: list("grenade"),
  };
}

const RESET = () => {
  const v = G.getEntityByName("vitorc")[0];
  v.pos.x = 64;
  v.pos.y = 224;
  v.vel.x = v.vel.y = 0;
  v.falling = v.jumping = false;
  v.firePressed = v.jumpPressed = false;
  v.grenadeFireTimer = 0;
  v.direction = "right";
  v.flipX(false);
  v.setCurrentAnimation("vitorc_stand");
  v.fpscount = 0;
  for (const name in v.anim) {
    v.anim[name].idx = 0;
  }
};

async function openOriginal(browser) {
  const page = await browser.newPage();
  await page.goto(OLD_URL);
  await page.waitForFunction((title) => window.me && me.state.isCurrent(title), TITLE, { timeout: 120000 });
  await page.evaluate((play) => me.state.change(play), PLAY);
  await page.waitForFunction((play) => me.state.isCurrent(play) && me.game.getEntityByName("vitorc").length, PLAY);
  await page.evaluate(
    ({ removeUnported, unported }) => {
      me.state.pause();
      window.G = me.game;
      // the enemy spawners aren't ported yet: keep them from spawning
      require("src/entities/KamikazeCreatorEntity").prototype.update = () => false;
      // removed before its first update, it would crash (it has no missile)
      require("src/entities/MissileGuidanceEntity").prototype.onDestroyEvent = () => {};
      new Function("names", removeUnported)(unported);
    },
    { removeUnported: bodyOf(removeUnported), unported: UNPORTED }
  );
  await page.waitForTimeout(100); // let melonJS apply the deferred removals
  return {
    page,
    step: () =>
      page.evaluate(
        ({ removeUnported, unported }) =>
          new Promise((resolve) => {
            const screen = me.game.currentLevel.name;
            me.game.update();
            if (me.game.currentLevel.name !== screen) {
              new Function("names", removeUnported)(unported);
            }
            setTimeout(resolve, 2); // melonJS defers removals and sorting
          }),
        { removeUnported: bodyOf(removeUnported), unported: UNPORTED }
      ),
  };
}

async function openPort(browser) {
  const page = await browser.newPage();
  await page.goto(NEW_URL);
  await page.waitForFunction(() => window.exolon);
  await page.evaluate(() => {
    window.G = window.exolon.game;
  });
  await page.waitForFunction(() => G.scene && G.scene.sys.settings.key === "Title", null, { timeout: 60000 });
  await page.evaluate(() => G.scene.scene.start("Play"));
  await page.waitForFunction(() => G.scene.sys.settings.key === "Play" && G.getEntityByName("vitorc").length > 0);
  await page.evaluate(
    ({ removeUnported, unported }) => {
      G.scene.scene.pause();
      new Function("names", removeUnported)(unported);
      G.flush();
    },
    { removeUnported: bodyOf(removeUnported), unported: UNPORTED }
  );
  return {
    page,
    step: () =>
      page.evaluate(
        ({ removeUnported, unported }) => {
          const screen = G.currentLevel.name;
          G.update();
          if (G.currentLevel.name !== screen) {
            new Function("names", removeUnported)(unported);
            G.flush();
          }
          G.render();
        },
        { removeUnported: bodyOf(removeUnported), unported: UNPORTED }
      ),
  };
}

function bodyOf(fn) {
  const source = fn.toString();
  return source.slice(source.indexOf("{") + 1, source.lastIndexOf("}"));
}

// software WebGL, so it also runs headless on machines without a GPU
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const games = [await openOriginal(browser), await openPort(browser)];
for (const g of games) {
  await g.page.evaluate(RESET);
}

let frame = 0;
let mismatches = 0;
let held = [];
const screens = new Set();

try {
  for (const [frames, keys, action] of SCRIPT) {
    for (const g of games) {
      if (action) {
        await g.page.evaluate(ACTIONS[action]);
      }
      for (const key of held) {
        if (!keys.includes(key)) {
          await g.page.keyboard.up(key);
        }
      }
      for (const key of keys) {
        if (!held.includes(key)) {
          await g.page.keyboard.down(key);
        }
      }
    }
    held = keys;

    for (let i = 0; i < frames; i++, frame++) {
      await games[0].step();
      await games[1].step();
      const [a, b] = await Promise.all(games.map((g) => g.page.evaluate(sample)));
      screens.add(a.screen);
      const diff = Object.keys(a).filter((k) => a[k] !== b[k]);
      if (diff.length && mismatches++ < 20) {
        console.log(
          `frame ${frame} [${keys.join("+")}]`,
          diff.map((k) => `${k}: melonJS=${a[k]} phaser=${b[k]}`).join(" | ")
        );
      }
    }
  }
} catch (e) {
  console.log(`Stopped at frame ${frame}: ${e.message.split("\n")[0]}`);
}

console.log(`${frame} frames compared over screens ${[...screens].join(", ")}: ${mismatches} with differences`);
await browser.close();
process.exit(mismatches ? 1 : 0);
