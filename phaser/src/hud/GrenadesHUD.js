import util from "../util.js";
import { HUDItem } from "./HUD.js";

export default class GrenadesHUD extends HUDItem {
  label = "GRENADES";
  labelFont = "font_yellow";
  valueFont = "font_purple";
  valueOffsetX = 48;

  formatValue(value) {
    return util.strlpad(value, "0", 2);
  }
}
