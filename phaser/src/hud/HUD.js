import { addText } from "../engine/fonts.js";

const HUD_DEPTH = 999;

/**
 * The play screen HUD, like melonJS's `me.HUD_Object`: a set of named items
 * drawn at an offset.
 */
export default class HUD {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.items = {};
  }

  update() {
    return false;
  }

  addItem(name, item) {
    this.items[name] = item;
    item.create(this.scene, this.x, this.y, HUD_DEPTH);
  }

  setItemValue(name, value) {
    if (this.items[name]) {
      this.items[name].set(value);
    }
  }

  updateItemValue(name, value) {
    if (this.items[name]) {
      this.items[name].update(value);
    }
  }
}

/**
 * A HUD item: a label with a value below it.
 */
export class HUDItem {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value || 0;
    this.valueText = null;
  }

  create(scene, hudX, hudY, depth) {
    const x = hudX + this.x;
    const y = hudY + this.y;
    addText(scene, this.labelFont, x, y, this.label).setDepth(depth);
    this.valueText = addText(scene, this.valueFont, x + this.valueOffsetX, y + 16, "").setDepth(depth);
    this.draw();
  }

  set(value) {
    this.value = value;
    this.draw();
  }

  update(value) {
    this.set(this.value + value);
  }

  draw() {
    if (this.valueText) {
      this.valueText.setText(this.formatValue(this.value));
    }
  }

  formatValue(value) {
    return String(value);
  }
}
