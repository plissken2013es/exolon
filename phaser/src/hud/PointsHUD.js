import util from "../util.js";
import { HUDItem } from "./HUD.js";

export default class PointsHUD extends HUDItem {
  label = "POINTS";
  labelFont = "font_green";
  valueFont = "font_cyan";
  valueOffsetX = 0;

  formatValue(value) {
    return util.strlpad(value, "0", 6);
  }
}
