import { TILE, basename, isCollisionLayer, objectBounds, tileFrame, tilesetForGid } from "./mapUtils.js";

// what the player sees: the map is wider, objects past it (like the enemy
// spawners) are off screen
const SCREEN_WIDTH = 512;

const images = new Map(); // file -> HTMLImageElement

/**
 * Loads the images of the given tilesets (from images/).
 */
export function loadImages(tilesets) {
  const files = new Set(tilesets.map((t) => basename(t.image)));
  return Promise.all(
    [...files]
      .filter((file) => !images.has(file))
      .map(
        (file) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = img.onerror = () => resolve();
            img.src = "images/" + file;
            images.set(file, img);
          })
      )
  );
}

export function tilesetImage(tileset) {
  return images.get(basename(tileset.image));
}

/**
 * Draws a tile with its bottom-left corner at (x, y), like Tiled and the game
 * do for tiles bigger than the grid.
 */
export function drawTile(ctx, tileset, localId, x, y) {
  const img = tilesetImage(tileset);
  if (!img || !img.complete) {
    return;
  }
  const f = tileFrame(tileset, localId);
  ctx.drawImage(img, f.sx, f.sy, f.w, f.h, x, y - f.h, f.w, f.h);
}

export function drawGid(ctx, map, gid, x, y) {
  const tileset = tilesetForGid(map, gid);
  if (tileset) {
    drawTile(ctx, tileset, gid - tileset.firstgid, x, y);
  }
}

/**
 * Draws the map. `view` says what to show: hidden layers, grid, selected
 * object, hovered cell and a ghost of what would be painted or placed.
 */
export function renderMap(ctx, map, view) {
  const width = map.width * TILE;
  const height = map.height * TILE;
  const bg = (map.properties || []).find((p) => p.name === "background_color");

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = bg ? bg.value : "#000";
  ctx.fillRect(0, 0, width, height);

  for (const layer of map.layers) {
    if (view.hidden.has(layer.name) || isCollisionLayer(layer)) {
      continue;
    }
    ctx.globalAlpha = view.dimOthers && layer.name !== view.activeLayer ? 0.35 : 1;
    if (layer.type === "tilelayer") {
      for (let row = 0; row < layer.height; row++) {
        for (let col = 0; col < layer.width; col++) {
          const gid = layer.data[row * layer.width + col];
          if (gid) {
            drawGid(ctx, map, gid, col * TILE, (row + 1) * TILE);
          }
        }
      }
    } else if (layer.type === "objectgroup") {
      for (const object of layer.objects) {
        if (object.gid) {
          drawGid(ctx, map, object.gid, object.x, object.y);
        } else {
          const b = objectBounds(map, object);
          ctx.fillStyle = "rgba(0, 222, 222, 0.15)";
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.strokeStyle = "#00dede";
          ctx.lineWidth = 1;
          ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
          label(ctx, object.name.toUpperCase(), b.x + 2, b.y + 2, "#00dede");
        }
      }
    }
  }
  ctx.globalAlpha = 1;

  const collision = map.layers.find(isCollisionLayer);
  if (collision && !view.hidden.has(collision.name)) {
    ctx.fillStyle = "rgba(239, 0, 0, 0.4)";
    for (let i = 0; i < collision.data.length; i++) {
      if (collision.data[i]) {
        ctx.fillRect((i % collision.width) * TILE, Math.floor(i / collision.width) * TILE, TILE, TILE);
      }
    }
  }

  if (view.grid) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = TILE; x < width; x += TILE) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
    }
    for (let y = TILE; y < height; y += TILE) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
    }
    ctx.stroke();
  }

  // the edge of the screen and the part of the map the player doesn't see
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(SCREEN_WIDTH, 0, width - SCREEN_WIDTH, height);
  ctx.strokeStyle = "#e800e8";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(SCREEN_WIDTH + 0.5, 0);
  ctx.lineTo(SCREEN_WIDTH + 0.5, height);
  ctx.stroke();
  ctx.setLineDash([]);
  // (the HUD covers the bottom of the screen)
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 352, SCREEN_WIDTH, height - 352);

  if (view.ghost) {
    ctx.globalAlpha = 0.6;
    view.ghost(ctx);
    ctx.globalAlpha = 1;
  }

  if (view.selected) {
    const b = objectBounds(map, view.selected);
    ctx.strokeStyle = "#ffff00";
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x - 0.5, b.y - 0.5, b.w + 1, b.h + 1);
  }

  if (view.hover) {
    ctx.strokeStyle = "rgba(255, 255, 0, 0.8)";
    ctx.strokeRect(view.hover.x + 0.5, view.hover.y + 0.5, view.hover.w - 1, view.hover.h - 1);
  }

  ctx.restore();
}

function label(ctx, text, x, y, color) {
  ctx.font = "bold 8px Verdana, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#000";
  ctx.fillRect(x - 1, y - 1, ctx.measureText(text).width + 2, 10);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

/**
 * Draws a tileset for picking tiles, at `scale`, highlighting the selected
 * block of tiles ({col, row, cols, rows}).
 */
export function renderPalette(ctx, tileset, scale, selection) {
  const img = tilesetImage(tileset);
  const w = tileset.imagewidth * scale;
  const h = tileset.imageheight * scale;
  ctx.canvas.width = w;
  ctx.canvas.height = h;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  if (img && img.complete) {
    ctx.drawImage(img, 0, 0, w, h);
  }

  const tw = tileset.tilewidth * scale;
  const th = tileset.tileheight * scale;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = tw; x < w; x += tw) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
  }
  for (let y = th; y < h; y += th) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
  }
  ctx.stroke();

  if (selection) {
    ctx.strokeStyle = "#ffff00";
    ctx.lineWidth = 2;
    ctx.strokeRect(selection.col * tw + 1, selection.row * th + 1, selection.cols * tw - 2, selection.rows * th - 2);
  }
}

/**
 * A small picture of an object kind, for the list of objects.
 */
export function renderThumbnail(canvas, info, size) {
  const ctx = canvas.getContext("2d");
  canvas.width = size;
  canvas.height = size;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  if (info.tileset) {
    const img = tilesetImage(info.tileset);
    const f = tileFrame(info.tileset, info.localId);
    const scale = Math.min(1, size / Math.max(f.w, f.h));
    const w = f.w * scale;
    const h = f.h * scale;
    if (img && img.complete) {
      ctx.drawImage(img, f.sx, f.sy, f.w, f.h, (size - w) / 2, (size - h) / 2, w, h);
    }
  } else {
    ctx.strokeStyle = "#00dede";
    ctx.strokeRect(size / 4 + 0.5, 4.5, size / 2 - 1, size - 9);
  }
}
