import game from "./game.js";

/**
 * Animates numeric properties of an object over time (linear easing), like
 * melonJS's `me.Tween`. Durations and delays are in ms of game time.
 */
export default class Tween {
  constructor(object) {
    this.object = object;
    this.valuesStart = {};
    this.valuesDelta = {};
    this.valuesEnd = {};
    this.duration = 1000;
    this.delayTime = 0;
    this.startTime = null;
    this.chainedTween = null;
    this.onUpdateCallback = null;
    this.onCompleteCallback = null;
  }

  to(properties, duration) {
    if (duration !== null) {
      this.duration = duration;
    }
    for (const property in properties) {
      if (this.object[property] !== null) {
        this.valuesEnd[property] = properties[property];
      }
    }
    return this;
  }

  start() {
    game.add(this, 999);
    this.startTime = game.time + this.delayTime;
    for (const property in this.valuesEnd) {
      if (this.object[property] !== null) {
        this.valuesStart[property] = this.object[property];
        this.valuesDelta[property] = this.valuesEnd[property] - this.object[property];
      }
    }
    return this;
  }

  stop() {
    game.remove(this);
    return this;
  }

  delay(amount) {
    this.delayTime = amount;
    return this;
  }

  chain(chainedTween) {
    this.chainedTween = chainedTween;
    return this;
  }

  onUpdate(callback) {
    this.onUpdateCallback = callback;
    return this;
  }

  onComplete(callback) {
    this.onCompleteCallback = callback;
    return this;
  }

  update() {
    const time = game.time;
    if (time < this.startTime) {
      return true;
    }
    const elapsed = Math.min((time - this.startTime) / this.duration, 1);
    for (const property in this.valuesDelta) {
      this.object[property] = this.valuesStart[property] + this.valuesDelta[property] * elapsed;
    }
    if (this.onUpdateCallback !== null) {
      this.onUpdateCallback.call(this.object, elapsed);
    }
    if (elapsed === 1) {
      game.remove(this);
      if (this.onCompleteCallback !== null) {
        this.onCompleteCallback.call(this.object);
      }
      if (this.chainedTween !== null) {
        this.chainedTween.start();
      }
    }
    return true;
  }
}
