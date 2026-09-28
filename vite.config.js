import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { parseTmx } from "./phaser/src/maps/tmx.js";

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

const MAP_NAME = /^[A-Za-z0-9_-]+$/;

/**
 * Development helpers for the maps:
 *
 * - Whenever a TMX map in maps/ changes (saved from Tiled or the level
 *   editor), converts it to phaser/maps/ and tells the page, which reloads it
 *   (see phaser/src/maps/hotReload.js).
 * - PUT /__exolon/maps/<name> with a TMX map saves it as maps/<name>.tmx
 *   (used by the level editor).
 */
function mapsDevServer() {
  return {
    name: "exolon-maps",
    apply: "serve",
    configureServer(server) {
      const mapsDir = path.resolve("maps");
      const converted = new Map(); // name -> last TMX converted

      function convert(name) {
        const tmx = fs.readFileSync(path.join(mapsDir, name + ".tmx"), "utf8");
        if (converted.get(name) === tmx) {
          return;
        }
        try {
          const json = parseTmx(tmx);
          fs.writeFileSync(path.resolve("phaser/maps", name + ".json"), JSON.stringify(json) + "\n");
          converted.set(name, tmx);
          server.config.logger.info(`[exolon] ${name}.tmx converted`, { timestamp: true });
          server.ws.send({ type: "custom", event: "exolon:map-updated", data: { name } });
        } catch (e) {
          server.config.logger.error(`[exolon] ${name}.tmx: ${e.message}`, { timestamp: true });
          server.ws.send({ type: "custom", event: "exolon:map-error", data: { name, message: e.message } });
        }
      }

      function onFileChange(file) {
        if (path.dirname(file) === mapsDir && file.endsWith(".tmx")) {
          convert(path.basename(file, ".tmx"));
        }
      }

      server.watcher.add(mapsDir);
      server.watcher.on("add", onFileChange);
      server.watcher.on("change", onFileChange);

      server.middlewares.use("/__exolon/maps/", (req, res) => {
        const name = decodeURIComponent(req.url.replace(/^\//, "").split("?")[0]);
        if (req.method !== "PUT" || !MAP_NAME.test(name)) {
          res.statusCode = 400;
          res.end("Expected PUT /__exolon/maps/<name>");
          return;
        }
        let body = "";
        req.setEncoding("utf8");
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            parseTmx(body); // don't save a broken map
            fs.writeFileSync(path.join(mapsDir, name + ".tmx"), body);
            convert(name);
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ saved: `maps/${name}.tmx` }));
          } catch (e) {
            res.statusCode = 400;
            res.end(e.message);
          }
        });
      });
    },
  };
}

export default defineConfig({
  base: "./",
  publicDir: false,
  plugins: [copyRuntimeAssets(), mapsDevServer()],
  build: {
    // Phaser alone is larger than Vite's default warning threshold.
    chunkSizeWarningLimit: 2000,
  },
});
