import game from "./engine/game.js";
import global from "./global.js";

const util = {};

/**
 * Return random integer in the range [min, max] (min and max are included).
 */
util.getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

util.arrayRandomElement = function (arr) {
  return arr[Math.floor(Math.random() * arr.length)];
};

util.randomSign = function () {
  return util.arrayRandomElement([-1, 1]);
};

// Returns a random number between min and max
util.getRandomArbitrary = function (min, max) {
  return Math.random() * (max - min) + min;
};

util.strlpad = function (s, padString, length) {
  let str = "" + s;
  while (str.length < length) {
    str = padString + str;
  }
  return str;
};

/**
 * Calls `callback` after `delay` ms of game time. The delay is counted in
 * frames (at 60 fps), so it stops while the game is paused.
 */
class ExecutionTimer {
  constructor(callback, delay) {
    this.time = 0;
    this.callback = callback;
    this.delay = delay;
  }

  update() {
    this.time += 1000 / 60;
    if (this.time > this.delay) {
      this.callback();
      game.remove(this);
    }
  }
}

util.executeWithDelay = function (callback, delay) {
  game.add(new ExecutionTimer(callback, delay), 1);
  game.sort();
};

// Counters shown in the HUD. The set* functions set a value, the update*
// functions add to it.
for (const [name, Name] of [
  ["ammo", "Ammo"],
  ["grenades", "Grenades"],
  ["points", "Points"],
  ["lives", "Lives"],
  ["zones", "Zones"],
]) {
  util["set" + Name] = function (value) {
    if (game.HUD) {
      game.HUD.setItemValue(name, value);
    }
    global[name] = value;
  };

  util["update" + Name] = function (value) {
    if (game.HUD) {
      game.HUD.updateItemValue(name, value);
    }
    global[name] += value;
  };
}

export default util;
