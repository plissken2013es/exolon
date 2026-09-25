import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

// The game loads its images, sounds and maps at runtime by URL, so they are
// not part of the module graph. Vite serves them from the project root in
// development; this plugin copies them next to the bundle on build.
const RUNTIME_ASSETS = ["images", "sound", "phaser/maps"];

function copyRuntimeAssets() {
  let outDir;
  return {
    name: "copy-runtime-assets",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      for (const dir of RUNTIME_ASSETS) {
        fs.cpSync(dir, path.join(outDir, dir), { recursive: true });
      }
    },
  };
}

export default defineConfig({
  base: "./",
  publicDir: false,
  plugins: [copyRuntimeAssets()],
  build: {
    // Phaser alone is larger than Vite's default warning threshold.
    chunkSizeWarningLimit: 2000,
  },
});
