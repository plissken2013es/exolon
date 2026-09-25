#!/usr/bin/env node
/**
 * Builds the website published on GitHub Pages into dist-site/:
 *
 *   index.html     a menu to choose the version to play (from site/)
 *   exolon.html    the original melonJS version, as it was (same URL as
 *                  before, so existing links keep working)
 *   phaser4/       the Phaser 4 version (the Vite build)
 *
 * Both games get a "MENU" link back to the menu.
 *
 * Usage: npm run build:site
 */
import fs from "node:fs";
import path from "node:path";
import { build } from "vite";

const OUT = "dist-site";

// what the original version needs
const ORIGINAL = ["exolon.html", "runGame.js", "css", "images", "lib", "maps", "sound", "src"];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);

await build({ logLevel: "warn", build: { outDir: path.join(OUT, "phaser4"), emptyOutDir: true } });

for (const file of ORIGINAL) {
  fs.cpSync(file, path.join(OUT, file), { recursive: true });
}
fs.copyFileSync("site/index.html", path.join(OUT, "index.html"));
// serve the files as they are (no Jekyll processing)
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

addMenuLink(path.join(OUT, "exolon.html"), "./");
addMenuLink(path.join(OUT, "phaser4", "index.html"), "../");

console.log(`Site built in ${OUT}/`);

/**
 * Adds a link to the menu at the top left of a game page.
 */
function addMenuLink(file, href) {
  const html = fs.readFileSync(file, "utf8");
  const link = `<a href="${href}" style="float: left; color: #00dede; text-decoration: none">&larr; MENU</a>`;
  const updated = html.replace('<div id="info">', `<div id="info">\n        ${link}`);
  if (updated === html) {
    throw new Error(`No #info element in ${file}`);
  }
  fs.writeFileSync(file, updated);
}
