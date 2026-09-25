import * as Phaser from "phaser";
import game from "../engine/game.js";
import input from "../engine/input.js";
import FixedStep from "../engine/FixedStep.js";
import { addText } from "../engine/fonts.js";
import config from "../config.js";
import global from "../global.js";
import util from "../util.js";

const POINTS = [0, 1000, 0, 3000, 0, 5000, 0, 7000];
const POINTS_X = 144;
const POINTS_Y = 208;

/**
 * The screen between levels, where a moving pointer is stopped to win points.
 */
export default class BonusScene extends Phaser.Scene {
  constructor() {
    super("Bonus");
  }

  create() {
    game.init(this);
    this.fixedStep = new FixedStep();
    this.cameras.main.setBackgroundColor("#000000");

    this.add.image(0, 0, "bonus_screen").setOrigin(0, 0);
    this.add.image(128, 48, "title").setOrigin(0, 0);
    addText(this, "font_white", 96, 128, "EXOLON BONUS SCREEN!");
    addText(this, "font_green", 48, 160, "PRESS FIRE TO STOP POINTER");

    let font = "font_cyan";
    POINTS.forEach((points, i) => {
      font = font === "font_cyan" ? "font_yellow" : "font_cyan";
      addText(this, font, POINTS_X, POINTS_Y + i * 16, util.strlpad(points, "0", 5) + " POINTS");
    });
    this.arrow = this.add.image(POINTS_X + 13 * 16, POINTS_Y, "arrow").setOrigin(0, 0);

    this.pointer = 0;
    this.pointerTimer = 0;
    this.pointerDuration = 1;
    this.active = true;
    this.firePressed = input.isKeyPressed("fire");

    // like the melonJS screen object, updated with the other game objects
    game.add({ update: () => this.updateScreen() }, 999);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (game.scene === this) {
        game.removeAll();
      }
    });
  }

  update(time, delta) {
    this.fixedStep.tick(delta, () => {
      if (game.changingScene) {
        return false;
      }
      game.update();
    });
    game.render();
    this.arrow.setY(POINTS_Y + this.pointer * 16);
  }

  updateScreen() {
    if (!this.active) {
      return false;
    }
    this.updatePointer();
    this.handleInput();
    return true;
  }

  updatePointer() {
    this.pointerTimer++;
    if (this.pointerTimer > this.pointerDuration) {
      this.pointerTimer = 0;
      this.pointer++;
      if (this.pointer >= POINTS.length) {
        this.pointer = 0;
      }
    }
  }

  handleInput() {
    if (input.isKeyPressed("fire")) {
      if (!this.firePressed) {
        this.firePressed = true;
        this.active = false;
        util.executeWithDelay(() => this.nextLevel(), 1000);
      }
    } else {
      this.firePressed = false;
    }
  }

  nextLevel() {
    util.updatePoints(POINTS[this.pointer]);
    util.updateZones(1);
    if (global.lives < config.maxLives) {
      util.updateLives(1);
    }
    global.ammo = config.initialAmmo;
    global.grenades = config.initialGrenades;
    game.changeScene("Play");
  }
}
