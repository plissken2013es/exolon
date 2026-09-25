import util from "../util.js";
import { HUDItem } from "./HUD.js";

export default class ZonesHUD extends HUDItem {
  label = "ZONES";
  labelFont = "font_purple";
  valueFont = "font_yellow";
  valueOffsetX = 16;

  formatValue(value) {
    return util.strlpad(value, "0", 3);
  }
}
