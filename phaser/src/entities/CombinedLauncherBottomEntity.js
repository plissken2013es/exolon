import DoubleLauncherEntity from "./DoubleLauncherEntity.js";
import DoubleLauncherBulletEntity from "./DoubleLauncherBulletEntity.js";

export default class CombinedLauncherBottomEntity extends DoubleLauncherEntity {
  getBulletPosition() {
    const pos = {};
    pos.x = this.pos.x - DoubleLauncherBulletEntity.WIDTH;
    pos.y = this.pos.y;
    return pos;
  }
}

CombinedLauncherBottomEntity.prototype.points = 3000;

CombinedLauncherBottomEntity.SPRITE_IMAGE = "combined_launcher_bottom";
