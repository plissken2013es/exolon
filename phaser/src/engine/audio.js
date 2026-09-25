import game from "./game.js";

/**
 * Sound effects and music, like melonJS's `me.audio`.
 */
let enabled = true;
let track = null;

const audio = {
  play(name) {
    if (enabled) {
      game.scene.sound.play(name);
    }
  },

  playTrack(name) {
    this.stopTrack();
    track = game.scene.sound.add(name);
    if (enabled) {
      track.play();
    }
  },

  stopTrack() {
    if (track) {
      track.destroy();
      track = null;
    }
  },

  isAudioEnabled() {
    return enabled;
  },

  enable() {
    enabled = true;
    if (track && track.isPaused) {
      track.resume();
    }
  },

  disable() {
    enabled = false;
    game.scene.sound.getAllPlaying().forEach((sound) => {
      if (sound === track) {
        sound.pause();
      } else {
        sound.stop();
      }
    });
  },
};

export default audio;
