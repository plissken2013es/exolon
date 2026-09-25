import util from "../util.js";
import { HUDItem } from "./HUD.js";

export default class AmmoHUD extends HUDItem {
  label = "AMMO";
  labelFont = "font_cyan";
  valueFont = "font_white";
  valueOffsetX = 16;

  formatValue(value) {
    return util.strlpad(value, "0", 2);
  }
}
