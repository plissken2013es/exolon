const STEP = 1000 / 60;

// Tolerance so that a 60 Hz display runs exactly one step per frame even
// when frame times jitter a bit around 16.7 ms.
const TOLERANCE = 1;

// Never run more than this many steps in a frame (e.g. after the tab was
// in the background), so the game doesn't try to catch up.
const MAX_STEPS = 4;

/**
 * Runs the game logic at a fixed 60 updates per second, whatever the display
 * refresh rate: the logic counts time in frames, as melonJS ran it.
 */
export default class FixedStep {
  constructor() {
    this.accumulator = 0;
  }

  /**
   * Calls `step` as many times as needed for `delta` ms of game time.
   * `step` can return false to skip the remaining steps of this frame.
   */
  tick(delta, step) {
    this.accumulator = Math.min(this.accumulator + delta, STEP * MAX_STEPS);
    while (this.accumulator >= STEP - TOLERANCE) {
      this.accumulator -= STEP;
      if (step() === false) {
        this.accumulator = 0;
        break;
      }
    }
  }
}
