import * as Phaser from "phaser";
import game from "./engine/game.js";
import global from "./global.js";
import input from "./engine/input.js";
import audio from "./engine/audio.js";
import BootScene from "./scenes/BootScene.js";
import LoadingScene from "./scenes/LoadingScene.js";
import TitleScene from "./scenes/TitleScene.js";
import PlayScene from "./scenes/PlayScene.js";

input.bindKey(input.KEY.LEFT, "left");
input.bindKey(input.KEY.RIGHT, "right");
input.bindKey(input.KEY.UP, "jump");
input.bindKey(input.KEY.DOWN, "duck");
input.bindKey(input.KEY.SPACE, "fire");

initSoundToggle();

if (import.meta.env.DEV) {
  // handy from the browser console, and used by automated tests
  window.exolon = { game, global };
}

new Phaser.Game({
  // The tileset offsets set in PlayScene#loadLevel assume the WebGL renderer
  type: Phaser.WEBGL,
  parent: "app",
  width: 512,
  height: 384,
  backgroundColor: "#000000",
  pixelArt: true,
  // Keyboard input is read directly from the window (see engine/input.js).
  input: { keyboard: false, mouse: false, touch: false, gamepad: false },
  audio: { disableWebAudio: false },
  scene: [BootScene, LoadingScene, TitleScene, PlayScene],
});

function initSoundToggle() {
  const anchor = document.createElement("a");
  anchor.id = "toggleSound";
  anchor.href = "#";
  anchor.textContent = "DISABLE SOUND";
  anchor.addEventListener("click", (event) => {
    event.preventDefault();
    if (audio.isAudioEnabled()) {
      audio.disable();
      anchor.textContent = "ENABLE SOUND";
    } else {
      audio.enable();
      anchor.textContent = "DISABLE SOUND";
    }
  });
  document.getElementById("sound").append(anchor);
}
