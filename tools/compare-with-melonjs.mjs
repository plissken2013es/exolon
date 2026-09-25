#!/usr/bin/env node
/**
 * Plays the original melonJS game (exolon.html) and the Phaser port side by
 * side, one frame at a time, with the same keys held, and compares their
 * state after every frame: the player (position, velocity, jump/fall state,
 * animation, hit box, outfit...), the counters (ammo, grenades, points, lives,
 * zones) and the position of every other entity on the screen.
 *
 * Both games are driven by hand (their own loops are paused) and Math.random
 * is replaced by the same seeded generator in both, so enemies, shots and
 * stars are the same and the comparison is exact.
 *
 * Each run starts at a screen and plays a fixed input pattern (walking right,
 * jumping, shooting, throwing grenades) for a number of frames, or until the
 * game leaves the play screen (game over, end of level).
 *
 * Usage:
 *   npm run dev                      # the Phaser port, on port 5173
 *   python3 -m http.server 8000      # the original, from the project root
 *   npx playwright install chromium  # once
 *   npm run compare [-- SCREEN...]   # e.g. npm run compare -- L02S05
 *
 * Environment variables: OLD_URL and NEW_URL (the two games), FRAMES (frames
 * per screen, default 1500), SEED (random seed, default 1), VERBOSE (print
 * the state every 100 frames), TRACE_FROM (print it every frame from then).
 */
import { chromium } from "playwright";

const OLD_URL = process.env.OLD_URL || "http://localhost:8000/exolon.html";
const NEW_URL = process.env.NEW_URL || "http://localhost:5173/";
const FRAMES = +(process.env.FRAMES || 1500);
const SEED = +(process.env.SEED || 1);

const DEFAULT_SCREENS = ["L01S01", "L01S06", "L01S10", "L01S17", "L01S22", "L02S03", "L02S12", "L02S20", "L03S05", "L03S13", "L03S20"];
const SCREENS = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_SCREENS;

// melonJS screen ids (src/screens.js)
const TITLE = 101;
const PLAY = 102;

/**
 * Keys held at a given frame: walk right, jumping now and then, tapping fire
 * and sometimes holding it to throw a grenade.
 */
function keysAt(frame) {
  const t = frame % 300;
  const keys = [];
  if (t < 200 || t >= 260) {
    keys.push("ArrowRight");
  }
  if ((t >= 60 && t < 70) || (t >= 150 && t < 158)) {
    keys.push("ArrowUp");
  }
  if (t % 20 < 3 || (t >= 210 && t < 250)) {
    keys.push("Space");
  }
  if (t >= 200 && t < 205) {
    keys.push("ArrowDown");
  }
  return keys;
}

// Names of the entities (unnamed ones: enemies, eggs, explosions...)
const NAMES = [
  "", "blaster_bullet", "grenade", "turret_bullet", "turret", "cocoon", "radar", "rocket", "ship_fire", "light",
  "grenade_pack", "ammo_pack", "teleport", "piston", "incubator", "egg", "double_launcher", "mine",
  "missile_guidance", "waggon", "combined_launcher_top", "combined_launcher_bottom", "square_light", "discharge",
  "exit", "fungus", "capsule", "beam",
];

// Runs in both pages: `G` is the game object manager, `GLOBAL` the counters.
function sample(names) {
  const round = (n) => +n.toFixed(3);
  const state = {};
  const v = G.getEntityByName("vitorc")[0];
  if (v) {
    const b = v.collisionBox;
    Object.assign(state, {
      x: round(v.pos.x),
      y: round(v.pos.y),
      vx: round(v.vel.x),
      vy: round(v.vel.y),
      falling: v.falling,
      jumping: v.jumping,
      anim: v.current.name,
      frame: v.current.idx,
      box: [b.left, b.top, b.width, b.height].map(round).join(","),
      outfit: v.outfit,
      invincible: v.invincible,
    });
  }
  state.screen = G.currentLevel.name.toLowerCase();
  state.randomCalls = window.RANDOM_CALLS;
  for (const counter of ["ammo", "grenades", "points", "lives", "zones"]) {
    state[counter] = GLOBAL[counter];
  }
  for (const name of names) {
    state["@" + (name || "unnamed")] = G.getEntityByName(name)
      .filter((e) => e.isEntity)
      .map((e) => [e.pos.x, e.pos.y].map(round).join(","))
      .sort()
      .join(" ");
  }
  return state;
}

function seedRandom(seed) {
  // mulberry32, counting the numbers drawn
  let a = seed;
  window.RANDOM_CALLS = 0;
  Math.random = () => {
    window.RANDOM_CALLS++;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function openOriginal(browser) {
  const page = await browser.newPage();
  await page.goto(OLD_URL);
  await page.waitForFunction((title) => window.me && me.state.isCurrent(title), TITLE, { timeout: 120000 });
  await page.evaluate((play) => me.state.change(play), PLAY);
  await page.waitForFunction((play) => me.state.isCurrent(play) && me.game.getEntityByName("vitorc").length, PLAY);
  await page.evaluate(() => {
    me.state.pause();
    window.G = me.game;
    window.GLOBAL = require("src/global");
    // melonJS tweens run on the real time of the frame: give them 60 fps
    // frame time instead, as the frames are stepped by hand
    let time = 0;
    me.timer.getTime = () => time;
    window.advanceTime = () => (time += 1000 / 60);
    // record the end of the play screen instead of leaving it
    const playScreen = me.state.current();
    playScreen.gameOver = () => (window.ENDED = "game over");
    me.state.change = () => (window.ENDED = "level complete");
  });
  return {
    page,
    start: (screen, seed) =>
      page.evaluate(
        ({ screen, seed, seedRandom }) => {
          new Function("seed", seedRandom)(seed);
          window.ENDED = null;
          Object.assign(GLOBAL, { nextLevel: screen, ammo: 99, grenades: 10, points: 0, lives: 9, zones: 0 });
          const playScreen = me.state.current();
          playScreen.onDestroyEvent();
          playScreen.reset();
          // (clearing the previous screen may leave these off in the original)
          Object.assign(GLOBAL, { aliveBlasterBulletCount: 0, aliveGrenadesCount: 0, aliveMissilesCount: 0 });
          return new Promise((resolve) => setTimeout(resolve, 10));
        },
        { screen, seed, seedRandom: bodyOf(seedRandom) }
      ),
    step: () =>
      page.evaluate(
        () =>
          new Promise((resolve) => {
            advanceTime();
            me.game.update();
            setTimeout(resolve, 2); // melonJS defers removals and sorting
          })
      ),
    ended: () => page.evaluate(() => window.ENDED),
  };
}

async function openPort(browser) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log("Phaser port error:", e.message));
  await page.goto(NEW_URL);
  await page.waitForFunction(() => window.exolon);
  await page.evaluate(() => {
    window.G = window.exolon.game;
    window.GLOBAL = window.exolon.global;
  });
  await page.waitForFunction(() => G.scene && G.scene.sys.settings.key === "Title", null, { timeout: 60000 });
  await page.evaluate(() => G.changeScene("Play"));
  await page.waitForFunction(() => G.scene.sys.settings.key === "Play" && G.getEntityByName("vitorc").length > 0);
  await page.evaluate(() => {
    G.scene.scene.pause();
    G.scene.gameOver = () => (window.ENDED = "game over");
    G.changeScene = () => (window.ENDED = "level complete");
  });
  return {
    page,
    start: (screen, seed) =>
      page.evaluate(
        ({ screen, seed, seedRandom }) => {
          new Function("seed", seedRandom)(seed);
          window.ENDED = null;
          Object.assign(GLOBAL, { nextLevel: screen, ammo: 99, grenades: 10, points: 0, lives: 9, zones: 0 });
          // like the original, reset the play screen in place
          G.scene.create();
          Object.assign(GLOBAL, { aliveBlasterBulletCount: 0, aliveGrenadesCount: 0, aliveMissilesCount: 0 });
        },
        { screen, seed, seedRandom: bodyOf(seedRandom) }
      ),
    step: () =>
      page.evaluate(() => {
        G.update();
        G.render();
      }),
    ended: () => page.evaluate(() => window.ENDED),
  };
}

function bodyOf(fn) {
  const source = fn.toString();
  return source.slice(source.indexOf("{") + 1, source.lastIndexOf("}"));
}

async function setKeys(game, held, keys) {
  for (const key of held) {
    if (!keys.includes(key)) {
      await game.page.keyboard.up(key);
    }
  }
  for (const key of keys) {
    if (!held.includes(key)) {
      await game.page.keyboard.down(key);
    }
  }
}

// software WebGL, so it also runs headless on machines without a GPU
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const games = [await openOriginal(browser), await openPort(browser)];

let totalFrames = 0;
let totalMismatches = 0;

for (const screen of SCREENS) {
  let held = [];
  for (const g of games) {
    await setKeys(g, held, []);
    await g.start(screen, SEED);
  }

  let frame = 0;
  let mismatches = 0;
  let ended = null;
  const screens = new Set();
  try {
    for (; frame < FRAMES; frame++) {
      const keys = keysAt(frame);
      for (const g of games) {
        await setKeys(g, held, keys);
      }
      held = keys;

      await games[0].step();
      await games[1].step();

      const [a, b] = await Promise.all(games.map((g) => g.page.evaluate(sample, NAMES)));
      screens.add(a.screen);
      if ((process.env.VERBOSE && frame % 100 === 0) || frame >= +(process.env.TRACE_FROM || Infinity)) {
        console.log(`  ${screen} frame ${frame}`, JSON.stringify(a));
      }
      const diff = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => a[k] !== b[k]);
      if (diff.length && mismatches++ < 10) {
        console.log(
          `  ${screen} frame ${frame} [${keys.join("+")}]`,
          diff.map((k) => `${k}: melonJS=${a[k]} phaser=${b[k]}`).join(" | ")
        );
      }

      const [endA, endB] = await Promise.all(games.map((g) => g.ended()));
      if (endA || endB) {
        ended = endA === endB ? endA : `melonJS: ${endA}, phaser: ${endB}`;
        if (endA !== endB) {
          mismatches++;
        }
        frame++;
        break;
      }
    }
  } catch (e) {
    console.log(`  ${screen}: stopped at frame ${frame}: ${e.message.split("\n")[0]}`);
    mismatches++;
  }

  console.log(
    `${screen}: ${frame} frames over ${[...screens].join(", ")}${ended ? ` (${ended})` : ""}: ` +
      `${mismatches ? mismatches + " with differences" : "identical"}`
  );
  totalFrames += frame;
  totalMismatches += mismatches;
}

console.log(`${totalFrames} frames compared: ${totalMismatches ? totalMismatches + " with differences" : "all identical"}`);
await browser.close();
process.exit(totalMismatches ? 1 : 0);
