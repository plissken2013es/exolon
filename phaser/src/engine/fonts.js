import * as Phaser from "phaser";

/**
 * The game fonts are fixed-width 16x16 strips of the characters from space
 * to "Z", which is exactly Phaser's RetroFont TEXT_SET2.
 */
export const FONTS = ["font_white", "font_cyan", "font_green", "font_purple", "font_yellow", "font_red"];

export const FONT_SIZE = 16;

export function registerFonts(scene) {
  for (const key of FONTS) {
    if (scene.cache.bitmapFont.exists(key)) {
      continue;
    }
    // In Phaser 4 Parse returns the whole cache entry ({data, texture, frame})
    const entry = Phaser.GameObjects.RetroFont.Parse(scene, {
      image: key,
      width: FONT_SIZE,
      height: FONT_SIZE,
      chars: Phaser.GameObjects.RetroFont.TEXT_SET2,
      charsPerRow: scene.textures.get(key).getSourceImage().width / FONT_SIZE,
      offset: { x: 0, y: 0 },
      spacing: { x: 0, y: 0 },
    });
    scene.cache.bitmapFont.add(key, entry);
  }
}

/**
 * Adds a left-aligned text to the scene, `x`/`y` being its top-left corner.
 */
export function addText(scene, font, x, y, text) {
  return scene.add.bitmapText(x, y, font, String(text), FONT_SIZE);
}
