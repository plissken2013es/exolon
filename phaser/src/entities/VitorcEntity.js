import Entity from "../engine/Entity.js";
import game from "../engine/game.js";
import input from "../engine/input.js";
import audio from "../engine/audio.js";
import util from "../util.js";
import config from "../config.js";
import global from "../global.js";
import BlasterBulletEntity from "./BlasterBulletEntity.js";
import GrenadeEntity from "./GrenadeEntity.js";
import GrenadeTraceEntity from "./GrenadeTraceEntity.js";
import TeleportFlashEntity from "./TeleportFlashEntity.js";

export default class VitorcEntity extends Entity {
  constructor(x, y, settings) {
    settings.image = "vitorc2";
    settings.spritewidth = 48;
    settings.spriteheight = 64;

    super(x, y, settings);

    this.collidable = true;

    this.outfit = "vitorc";

    this.addAnimation("vitorc_stand", [0]);
    this.addAnimation("vitorc_move", [0, 1, 2, 3, 4, 0, 5, 6, 7, 8]);
    this.addAnimation("vitorc_jump", [3]);
    this.addAnimation("vitorc_duck", [9]);
    this.addAnimation("vitorc_die", [10]);
    this.addAnimation("vitorc_fall", [8]);

    this.addAnimation("exolon_stand", [11]);
    this.addAnimation("exolon_move", [11, 12, 13, 14, 15, 11, 16, 17, 18, 19]);
    this.addAnimation("exolon_jump", [14]);
    this.addAnimation("exolon_duck", [20]);
    this.addAnimation("exolon_die", [21]);
    this.addAnimation("exolon_fall", [19]);

    this._setCurrentAnimation("stand");

    this.animationspeed = 2;

    this.setVelocity(1.5, 2.75);
    this.gravity = 0.1;

    this.firePressed = input.isKeyPressed("fire");
    this.jumpPressed = false;

    this.grenadeFireDuration = 35;
    this.grenadeFireTimer = 0;

    this.direction = "right";

    this.dieTimer = 0;
    this.dieDuration = 70;

    this.invincible = false;

    this.insideTeleport = false;
    this.thisTeleport = null;

    this.insideCapsule = false;

    this.jumpDistance = 0;

    this.respawnPos = { x: 0, y: 0 };
  }

  _setCurrentAnimation(animation) {
    this.setCurrentAnimation(this.outfit + "_" + animation);
  }

  _isCurrentAnimation(animation) {
    return this.isCurrentAnimation(this.outfit + "_" + animation);
  }

  update() {
    this.updateJump();
    this.updateDieTimer();
    this.handleInput();
    const res = this.updateMovement();
    this.handleCollisionsWithCollisionMap(res);
    this.handleCollisionsWithEntities();
    this.handleCollisionsWithEntities();
    this.handleFallFromPlatform();
    this.handleNextScreen();
    super.update();
    return true;
  }

  updateJump() {
    if (!this._isCurrentAnimation("jump")) {
      return;
    }
    if (this.vel.x != 0 && this.falling) {
      this.jumpDistance += Math.abs(this.vel.x);
      if (this.jumpDistance > VitorcEntity.JUMP_DISTANCE) {
        this._setCurrentAnimation("fall");
        this.jumpDistance = 0;
      }
    }
    if (this.isOnTheGround()) {
      this._setCurrentAnimation("stand");
      this.jumpDistance = 0;
    }
  }

  updateDieTimer() {
    if (!this._isCurrentAnimation("die")) {
      return;
    }
    if (!this.isOnTheGround()) {
      return;
    }
    this.dieTimer++;
    if (this.dieTimer > this.dieDuration) {
      if (global.lives > 0) {
        util.updateLives(-1);
      }

      if (global.lives == 0) {
        game.scene.gameOver();
        return;
      }

      this.dieTimer = 0;
      this._setCurrentAnimation("stand");
      this.respawn();
      this.makeTemporarilyInvincible();

      util.setAmmo(config.initialAmmo);
      util.setGrenades(config.initialGrenades);
    }
  }

  handleInput() {
    if (this._isCurrentAnimation("die")) {
      return;
    }

    this.handleFireKey();

    if (this.falling) {
      return;
    } else if (this._isCurrentAnimation("jump")) {
      this.handleInputDuringJump();
    } else {
      this.handleInputOnTheGround();
    }
  }

  handleCollisionsWithCollisionMap(res) {
    if (!this._isCurrentAnimation("jump") && res.x) {
      this._setCurrentAnimation("stand");
    }
  }

  handleCollisionsWithEntities() {
    this.insideTeleport = false;
    this.insideCapsule = false;

    const res = game.collide(this);
    if (!res) {
      return;
    }

    this.handleCollisionWithSolidObject(res, res.obj);
    this.handleCollisionWithTeleport(res, res.obj);
    this.handleCollisionWithMine(res, res.obj);
    this.handleCollisionWithCapsule(res, res.obj);
    this.handleCollisionWithLethalEntities(res, res.obj);
  }

  handleCollisionWithSolidObject(res, obj) {
    if (!obj.isSolid) {
      return;
    }

    this.pos.subtract(res);

    if (res.y > 0) {
      this.vel.y = 0;
      this.falling = false;
    }

    if (res.x && this.isOnTheGround()) {
      this.vel.x = 0;
      this._setCurrentAnimation("stand");
    }
  }

  handleCollisionWithTeleport(res, obj) {
    if (obj.name == "teleport") {
      this.insideTeleport = true;
      this.thisTeleport = obj;
    }
  }

  handleCollisionWithMine(res, obj) {
    if (obj.name == "mine" && this.outfit == "vitorc") {
      this.die();
    }
  }

  handleCollisionWithCapsule(res, obj) {
    if (obj.name == "capsule") {
      this.insideCapsule = true;
    }
  }

  handleCollisionWithLethalEntities(res, obj) {
    if (this._isCurrentAnimation("die")) {
      return;
    }

    if (obj.isLethal) {
      if (obj.name == "piston" && this.outfit == "exolon") {
        return;
      }
      this.die();
    }
  }

  onCollision(res, obj) {
    this.handleCollisionWithLethalEntities(res, obj);
  }

  handleFallFromPlatform() {
    if (!this._isCurrentAnimation("jump") && !this._isCurrentAnimation("die") && this.falling) {
      this.vel.x = 0;
      this._setCurrentAnimation("fall");
    }
  }

  handleNextScreen() {
    if (this.pos.x > 510) {
      game.scene.nextLevel();
    }
  }

  handleFireKey() {
    if (input.isKeyPressed("fire")) {
      this.fireBlaster();
      this.fireGrenade();
      this.firePressed = true;
      this.grenadeFireTimer++;
    } else {
      this.firePressed = false;
      this.grenadeFireTimer = 0;
    }
  }

  handleInputDuringJump() {
    if (input.isKeyPressed("right") && this.direction == "right") {
      this.doWalk(false);
    } else if (input.isKeyPressed("left") && this.direction == "left") {
      this.doWalk(true);
    }
  }

  handleInputOnTheGround() {
    if (input.isKeyPressed("duck")) {
      this.duck();
      return;
    }

    this.stand();

    if (input.isKeyPressed("right")) {
      this.direction = "right";
      this._setCurrentAnimation("move");
      this.doWalk(false);
    } else if (input.isKeyPressed("left")) {
      this.direction = "left";
      this._setCurrentAnimation("move");
      this.doWalk(true);
    }

    this.handleJumpKey();
  }

  handleJumpKey() {
    if (!input.isKeyPressed("jump")) {
      this.jumpPressed = false;
      return;
    }

    if (this.insideTeleport) {
      if (!this.jumpPressed) {
        this.doTeleport();
        audio.play("teleport");
      }
    } else if (this.insideCapsule) {
      if (!this.jumpPressed) {
        this.doChangeOutfit();
        audio.play("ding");
      }
    } else {
      this._setCurrentAnimation("jump");
      this.doJump();
    }

    this.jumpPressed = true;
  }

  fireBlaster() {
    if (!this.canFireBlaster()) {
      return;
    }
    const pos = this.getBlasterBulletPosition();
    const bullet = new BlasterBulletEntity(pos.x, pos.y, this.direction);
    game.add(bullet, this.z);

    if (this.outfit == "exolon") {
      const bullet2 = new BlasterBulletEntity(pos.x, pos.y + 12, this.direction);
      game.add(bullet2, this.z);
    }

    game.sort();

    global.aliveBlasterBulletCount++;
    util.updateAmmo(-1);

    audio.play("shot2");
  }

  fireGrenade() {
    if (!this.canFireGrenade()) {
      return;
    }
    const grenadePos = this.getGrenadePosition();
    const grenade = new GrenadeEntity(grenadePos.x, grenadePos.y, this.direction);
    game.add(grenade, this.z);

    const tracePos = this.getGrenadeTracePosition();
    const trace = new GrenadeTraceEntity(tracePos.x, tracePos.y, this.direction);
    game.add(trace, this.z);

    game.sort();

    global.aliveGrenadesCount++;
    util.updateGrenades(-1);

    audio.play("grenade");
  }

  duck() {
    this._setCurrentAnimation("duck");
    this.vel.x = 0;
    this.updateColRect(1, 46, 12, 52);
  }

  stand() {
    this._setCurrentAnimation("stand");
    this.vel.x = 0;
    this.updateColRect(1, 46, 1, 63);
  }

  die() {
    if (this.invincible) {
      return;
    }

    this._setCurrentAnimation("die");
    this.vel.x = 0;
    this.forceJump();
  }

  respawn() {
    this.pos.x = this.respawnPos.x;
    this.pos.y = this.respawnPos.y;
  }

  makeTemporarilyInvincible() {
    this.invincible = true;
    util.executeWithDelay(() => {
      this.invincible = false;
    }, VitorcEntity.INVINCIBILITY_DURATION);
  }

  doTeleport() {
    const teleports = game.getEntityByName("teleport");
    this.createTeleportFlashes(teleports);
    const otherTeleport = this.getOtherTeleport(teleports);
    this.pos.x = otherTeleport.pos.x;
    this.pos.y = otherTeleport.pos.y + 32;
  }

  doChangeOutfit() {
    this.outfit = this.outfit == "vitorc" ? "exolon" : "vitorc";
  }

  createTeleportFlashes(teleports) {
    for (const teleport of teleports) {
      const x = teleport.pos.x + 16;
      const y = teleport.pos.y + 32;
      const flash = new TeleportFlashEntity(x, y);
      game.add(flash, this.z + 1);
    }
    game.sort();
  }

  getOtherTeleport(teleports) {
    return teleports.find((teleport) => teleport !== this.thisTeleport) || null;
  }

  getBlasterBulletPosition() {
    const pos = {};

    if (this.direction == "right") {
      pos.x = this.pos.x + this.width + VitorcEntity.BLASTER_BULLET_OFFSET_X;
    } else {
      pos.x = this.pos.x - BlasterBulletEntity.WIDTH - VitorcEntity.BLASTER_BULLET_OFFSET_X;
    }

    if (this._isCurrentAnimation("duck")) {
      pos.y = this.pos.y + VitorcEntity.BLASTER_BULLET_OFFSET_Y + VitorcEntity.DUCK_OFFSET;
    } else {
      pos.y = this.pos.y + VitorcEntity.BLASTER_BULLET_OFFSET_Y;
    }

    return pos;
  }

  getGrenadePosition() {
    const pos = {};

    if (this.direction == "right") {
      pos.x = this.pos.x + VitorcEntity.GRENADE_OFFSET_X;
    } else {
      pos.x = this.pos.x + this.width - GrenadeEntity.WIDTH - VitorcEntity.GRENADE_OFFSET_X;
    }

    if (this._isCurrentAnimation("duck")) {
      pos.y = this.pos.y + VitorcEntity.GRENADE_OFFSET_Y + VitorcEntity.DUCK_OFFSET;
    } else {
      pos.y = this.pos.y + VitorcEntity.GRENADE_OFFSET_Y;
    }

    return pos;
  }

  getGrenadeTracePosition() {
    const pos = {};

    if (this.direction == "right") {
      pos.x = this.pos.x + VitorcEntity.GRENADE_TRACE_OFFSET_X;
    } else {
      pos.x = this.pos.x + this.width - GrenadeTraceEntity.WIDTH - VitorcEntity.GRENADE_TRACE_OFFSET_X;
    }

    if (this._isCurrentAnimation("duck")) {
      pos.y = this.pos.y + VitorcEntity.GRENADE_TRACE_OFFSET_Y + VitorcEntity.DUCK_OFFSET;
    } else {
      pos.y = this.pos.y + VitorcEntity.GRENADE_TRACE_OFFSET_Y;
    }

    return pos;
  }

  isOnTheGround() {
    return !this.jumping && !this.falling;
  }

  canFireBlaster() {
    if (this.firePressed || global.ammo == 0) {
      return false;
    }
    return true;
  }

  canFireGrenade() {
    if (global.aliveBlasterBulletCount > 0) {
      return false;
    }
    if (global.aliveGrenadesCount > 0) {
      return false;
    }
    if (this.grenadeFireTimer < this.grenadeFireDuration) {
      return false;
    }
    if (global.grenades == 0) {
      return false;
    }
    return true;
  }
}

VitorcEntity.DUCK_OFFSET = 10;

VitorcEntity.BLASTER_BULLET_OFFSET_X = 2;
VitorcEntity.BLASTER_BULLET_OFFSET_Y = 30;

VitorcEntity.GRENADE_OFFSET_X = 20;
VitorcEntity.GRENADE_OFFSET_Y = 12;

VitorcEntity.GRENADE_TRACE_OFFSET_X = 4;
VitorcEntity.GRENADE_TRACE_OFFSET_Y = 10;

VitorcEntity.INVINCIBILITY_DURATION = 3000;
VitorcEntity.JUMP_DISTANCE = 50;
