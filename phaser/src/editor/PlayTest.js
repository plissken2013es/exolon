/**
 * Plays the screen being edited in the game, running in an iframe
 * (index.html?embedded, see phaser/src/editorBridge.js).
 */
export default class PlayTest {
  /**
   * `container` holds the iframe; `onEdit` is called when the player presses
   * Escape in the game.
   */
  constructor(container, onEdit) {
    this.container = container;
    this.onEdit = onEdit;
    this.frame = null;
    this.frameOptions = null;
    this.ready = false;
    this.pending = null;
    window.addEventListener("message", (event) => this.onMessage(event));
  }

  get playing() {
    return !this.container.hidden;
  }

  /**
   * Plays `map` (not saved yet, maybe) as screen `name`.
   */
  play(name, map, { god, zoom }) {
    const options = `${god}|${zoom}`;
    if (!this.frame || this.frameOptions !== options) {
      if (this.frame) {
        this.frame.remove();
      }
      this.frame = document.createElement("iframe");
      this.frame.width = 512 * zoom;
      this.frame.height = 384 * zoom;
      this.frame.src = `index.html?embedded&level=${name}&zoom=${zoom}${god ? "&god" : ""}`;
      this.frameOptions = options;
      this.ready = false;
      this.container.prepend(this.frame);
    }
    this.pending = { type: "exolon:play-map", name, map };
    if (this.ready) {
      this.flush();
    }
    this.container.hidden = false;
    this.focusGame();
  }

  stop() {
    this.send({ type: "exolon:pause" });
    this.container.hidden = true;
  }

  focusGame() {
    if (this.frame) {
      this.frame.focus();
      if (this.frame.contentWindow) {
        this.frame.contentWindow.focus();
      }
    }
  }

  flush() {
    if (this.pending) {
      this.send(this.pending);
      this.pending = null;
    }
  }

  send(message) {
    if (this.frame && this.frame.contentWindow) {
      this.frame.contentWindow.postMessage(message, location.origin);
    }
  }

  onMessage(event) {
    if (!this.frame || event.source !== this.frame.contentWindow || !event.data) {
      return;
    }
    if (event.data.type === "exolon:ready") {
      this.ready = true;
      this.flush();
    } else if (event.data.type === "exolon:edit") {
      this.onEdit();
    }
  }
}
