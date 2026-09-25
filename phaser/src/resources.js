// Every asset the game uses. Image keys double as tileset names in the maps.

export const images = [
  "loading_bg",

  // fonts
  "font_white",
  "font_cyan",
  "font_green",
  "font_purple",
  "font_yellow",
  "font_red",

  // tiles
  "metatiles",
  "tiles",
  "rocks",
  "ship",
  "gate",

  // sprites
  "star",
  "vitorc",
  "vitorc2",
  "blaster_bullet",
  "blaster_explosion",
  "grenade",
  "grenade_trace",
  "grenade_pack",
  "ammo_pack",
  "turret",
  "turret_body",
  "turret_tube",
  "turret_bullet",
  "explosion_particle",
  "cocoon",
  "radar",
  "rocket",
  "ship_fire",
  "light",
  "teleport",
  "teleport_flash",
  "piston",
  "harbringer",
  "circular_explosion",
  "bubble",
  "incubator",
  "egg",
  "double_launcher",
  "double_launcher_bullet",
  "mine",
  "mine_fire",
  "missile_guidance",
  "missile",
  "interceptor",
  "jellyfish",
  "waggon",
  "combined_launcher_top",
  "combined_launcher_bottom",
  "square_light",
  "discharge",
  "level_complete_window",
  "fungus",
  "louse",
  "beam",
  "flasher",
  "fir",
  "title",
  "bonus_screen",
  "arrow",
].map((name) => ({ name, src: `images/${name}.${name === "egg" ? "png" : "gif"}` }));

export const sounds = [
  "theme",
  "shot1",
  "shot2",
  "gameover",
  "grenade",
  "explosion",
  "explosion2",
  "explosion3",
  "pick1",
  "pick2",
  "teleport",
  "burst",
  "rocket",
  "points",
  "ding",
].map((name) => ({ name, src: [`sound/${name}.ogg`, `sound/${name}.mp3`] }));

export const maps = [];
for (let level = 1; level <= 3; level++) {
  for (let screen = 1; screen <= 25; screen++) {
    const name = "L0" + level + "S" + String(screen).padStart(2, "0");
    maps.push({ name, src: `phaser/maps/${name}.json` });
  }
}
