import * as Phaser from "phaser";
import game from "../engine/game.js";
import input from "../engine/input.js";
import audio from "../engine/audio.js";
import FixedStep from "../engine/FixedStep.js";
import { addText } from "../engine/fonts.js";
import util from "../util.js";
import StarEntity from "../entities/StarEntity.js";

const THEME_SONG_LENGTH_MS = 42000;
const STARS_NUM = 10;

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create() {
    game.init(this);
    this.fixedStep = new FixedStep();
    this.cameras.main.setBackgroundColor("#000000");

    this.add.image(128, 0, "title").setOrigin(0, 0).setDepth(100);
    addText(this, "font_green", 112, 112, "BY  RAFFAELE CECCO").setDepth(100);
    addText(this, "font_cyan", 112, 112 + 16 * 6, "PRESS      TO PLAY").setDepth(100);
    addText(this, "font_purple", 112, 112 + 16 * 6, "      FIRE        ").setDepth(100);
    addText(this, "font_red", 32, 368, "EXOLON COPYRIGHT 1987 HEWSON").setDepth(100);

    util.executeWithDelay(() => this.createStars(), THEME_SONG_LENGTH_MS);
    audio.playTrack("theme");

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      audio.stopTrack();
      if (game.scene === this) {
        game.removeAll();
      }
    });
  }

  update(time, delta) {
    this.fixedStep.tick(delta, () => {
      if (input.isKeyPressed("fire")) {
        this.scene.start("Play");
        return false;
      }
      game.update();
    });
    game.render();
  }

  createStars() {
    for (let i = 0; i < STARS_NUM; ++i) {
      game.add(new StarEntity());
    }
  }
}
