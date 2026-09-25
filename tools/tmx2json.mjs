#!/usr/bin/env node
/**
 * Converts the Tiled TMX maps in maps/ into the Tiled JSON format that
 * Phaser's tilemap loader understands, writing them to phaser/maps/.
 *
 * Only the TMX features used by the Exolon maps are supported: orthogonal
 * maps, embedded tilesets with a single image, uncompressed base64 (or CSV)
 * layer data, object groups and custom properties.
 *
 * Usage: node tools/tmx2json.mjs [inputDir] [outputDir]
 */
import fs from "node:fs";
import path from "node:path";

const inputDir = process.argv[2] || "maps";
const outputDir = process.argv[3] || "phaser/maps";

// --- tiny XML parser (enough for TMX) -------------------------------------

function parseXml(xml) {
  const root = { tag: "#root", attrs: {}, children: [], text: "" };
  const stack = [root];
  const re = /<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<(\/?)([\w:-]+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(xml))) {
    const [, closing, tag, attrString, selfClosing, text] = m;
    const top = stack[stack.length - 1];
    if (text !== undefined) {
      top.text += text;
    } else if (tag && closing) {
      stack.pop();
    } else if (tag) {
      const attrs = {};
      for (const a of attrString.matchAll(/([\w:-]+)="([^"]*)"/g)) {
        attrs[a[1]] = decodeEntities(a[2]);
      }
      const node = { tag, attrs, children: [], text: "" };
      top.children.push(node);
      if (!selfClosing) {
        stack.push(node);
      }
    }
  }
  return root.children[0];
}

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

const child = (node, tag) => node.children.find((c) => c.tag === tag);
const children = (node, tag) => node.children.filter((c) => c.tag === tag);
const int = (v, def = 0) => (v === undefined ? def : parseInt(v, 10));

// --- conversion ------------------------------------------------------------

function convertProperties(node) {
  const props = child(node, "properties");
  if (!props) {
    return undefined;
  }
  return children(props, "property").map((p) => {
    const value = p.attrs.value !== undefined ? p.attrs.value : p.text;
    return { name: p.attrs.name, ...typedValue(value) };
  });
}

// The maps were made with an old Tiled that stored every property as an
// untyped string. Infer the types the same way melonJS did when reading them.
function typedValue(value) {
  if (!value || value === "true" || value === "false") {
    return { type: "bool", value: value ? value === "true" : true };
  }
  if (value.trim() !== "" && !isNaN(value)) {
    const number = Number(value);
    return { type: Number.isInteger(number) ? "int" : "float", value: number };
  }
  return { type: "string", value };
}

function convertTileset(node) {
  const image = child(node, "image");
  const tilewidth = int(node.attrs.tilewidth);
  const tileheight = int(node.attrs.tileheight);
  const margin = int(node.attrs.margin);
  const spacing = int(node.attrs.spacing);
  const imagewidth = int(image.attrs.width);
  const imageheight = int(image.attrs.height);
  const columns = Math.floor((imagewidth - margin + spacing) / (tilewidth + spacing));
  const rows = Math.floor((imageheight - margin + spacing) / (tileheight + spacing));

  const tileset = {
    firstgid: int(node.attrs.firstgid),
    name: node.attrs.name,
    // Paths are rewritten relative to the JSON location (phaser/maps/).
    image: path.posix.join("../..", "images", path.posix.basename(image.attrs.source)),
    imagewidth,
    imageheight,
    tilewidth,
    tileheight,
    margin,
    spacing,
    columns,
    tilecount: columns * rows,
  };

  const tiles = children(node, "tile")
    .map((t) => ({ id: int(t.attrs.id), properties: convertProperties(t) }))
    .filter((t) => t.properties);
  if (tiles.length) {
    tileset.tiles = tiles;
  }
  return tileset;
}

function decodeLayerData(dataNode, expectedLength) {
  const encoding = dataNode.attrs.encoding;
  if (dataNode.attrs.compression) {
    throw new Error("Compressed layer data is not supported");
  }
  let data;
  if (encoding === "base64") {
    const buf = Buffer.from(dataNode.text.trim(), "base64");
    data = [];
    for (let i = 0; i < buf.length; i += 4) {
      data.push(buf.readUInt32LE(i));
    }
  } else if (encoding === "csv") {
    data = dataNode.text.trim().split(/\s*,\s*/).map(Number);
  } else {
    data = children(dataNode, "tile").map((t) => int(t.attrs.gid));
  }
  if (data.length !== expectedLength) {
    throw new Error(`Layer data has ${data.length} tiles, expected ${expectedLength}`);
  }
  return data;
}

function convertMap(xml) {
  const map = parseXml(xml);
  if (map.tag !== "map") {
    throw new Error("Not a TMX map");
  }

  let nextId = 1;
  const json = {
    type: "map",
    version: "1.10",
    tiledversion: "1.10.2",
    orientation: map.attrs.orientation,
    renderorder: map.attrs.renderorder || "right-down",
    width: int(map.attrs.width),
    height: int(map.attrs.height),
    tilewidth: int(map.attrs.tilewidth),
    tileheight: int(map.attrs.tileheight),
    infinite: false,
    properties: convertProperties(map),
    tilesets: [],
    layers: [],
  };

  for (const node of map.children) {
    if (node.tag === "tileset") {
      json.tilesets.push(convertTileset(node));
    } else if (node.tag === "layer") {
      const width = int(node.attrs.width);
      const height = int(node.attrs.height);
      json.layers.push({
        id: nextId++,
        type: "tilelayer",
        name: node.attrs.name,
        x: 0,
        y: 0,
        width,
        height,
        opacity: node.attrs.opacity !== undefined ? parseFloat(node.attrs.opacity) : 1,
        visible: int(node.attrs.visible, 1) === 1,
        properties: convertProperties(node),
        data: decodeLayerData(child(node, "data"), width * height),
      });
    } else if (node.tag === "objectgroup") {
      json.layers.push({
        id: nextId++,
        type: "objectgroup",
        name: node.attrs.name,
        x: 0,
        y: 0,
        opacity: 1,
        visible: int(node.attrs.visible, 1) === 1,
        draworder: "topdown",
        properties: convertProperties(node),
        objects: children(node, "object").map((o) => {
          const object = {
            id: nextId++,
            name: o.attrs.name || "",
            type: o.attrs.type || "",
            x: int(o.attrs.x),
            y: int(o.attrs.y),
            width: int(o.attrs.width),
            height: int(o.attrs.height),
            rotation: 0,
            visible: true,
            properties: convertProperties(o),
          };
          if (o.attrs.gid !== undefined) {
            object.gid = int(o.attrs.gid);
          }
          return object;
        }),
      });
    }
  }

  json.nextlayerid = nextId;
  json.nextobjectid = nextId;
  return JSON.parse(JSON.stringify(json)); // drop undefined properties
}

fs.mkdirSync(outputDir, { recursive: true });
const files = fs.readdirSync(inputDir).filter((f) => f.endsWith(".tmx")).sort();
for (const file of files) {
  const json = convertMap(fs.readFileSync(path.join(inputDir, file), "utf8"));
  const out = path.join(outputDir, file.replace(/\.tmx$/, ".json"));
  fs.writeFileSync(out, JSON.stringify(json) + "\n");
}
console.log(`Converted ${files.length} maps from ${inputDir}/ to ${outputDir}/`);
