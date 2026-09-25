import { HUDItem } from "./HUD.js";

export default class LivesHUD extends HUDItem {
  label = "LIVES";
  labelFont = "font_white";
  valueFont = "font_yellow";
  valueOffsetX = 32;

  formatValue(value) {
    return String(value);
  }
}
