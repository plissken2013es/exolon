#!/usr/bin/env node
/**
 * Converts the Tiled TMX maps in maps/ into the Tiled JSON format that
 * Phaser's tilemap loader understands, writing them to phaser/maps/.
 * (`npm run dev` also does it by itself whenever a TMX map changes.)
 *
 * With --check, also verifies that writing each map back to TMX gives the
 * original file, byte for byte (what the level editor relies on).
 *
 * Usage: node tools/tmx2json.mjs [--check] [inputDir] [outputDir]
 */
import fs from "node:fs";
import path from "node:path";
import { parseTmx, writeTmx } from "../phaser/src/maps/tmx.js";

const args = process.argv.slice(2);
const check = args.includes("--check");
const [inputDir = "maps", outputDir = "phaser/maps"] = args.filter((a) => a !== "--check");

fs.mkdirSync(outputDir, { recursive: true });
const files = fs.readdirSync(inputDir).filter((f) => f.endsWith(".tmx")).sort();
const mismatches = [];
for (const file of files) {
  const tmx = fs.readFileSync(path.join(inputDir, file), "utf8");
  const json = parseTmx(tmx);
  fs.writeFileSync(path.join(outputDir, file.replace(/\.tmx$/, ".json")), JSON.stringify(json) + "\n");
  if (check && writeTmx(json) !== tmx) {
    mismatches.push(file);
  }
}
console.log(`Converted ${files.length} maps from ${inputDir}/ to ${outputDir}/`);

if (check) {
  if (mismatches.length) {
    console.error(`Writing back to TMX changes ${mismatches.length} maps: ${mismatches.join(", ")}`);
    process.exit(1);
  }
  console.log("Writing them back to TMX gives the same files");
}
