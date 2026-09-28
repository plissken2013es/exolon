/**
 * Reads and writes the Tiled TMX maps of the game (maps/*.tmx).
 *
 * `parseTmx` turns a TMX map into the Tiled JSON format that Phaser loads
 * (phaser/maps/*.json), and `writeTmx` turns it back into TMX, in exactly the
 * format of the original maps, so maps saved by the level editor stay
 * readable by Tiled and by the original melonJS version.
 *
 * Only the TMX features used by the Exolon maps are supported: orthogonal
 * maps, embedded tilesets with a single image, uncompressed base64 (or CSV)
 * layer data, object groups and custom properties.
 *
 * Works both in the browser and in Node.
 */

// --- reading -----------------------------------------------------------------

// a tiny XML parser, enough for TMX
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
const basename = (path) => path.slice(path.lastIndexOf("/") + 1);

function parseProperties(node) {
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

function parseTileset(node) {
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
    // relative to the JSON maps (phaser/maps/)
    image: "../../images/" + basename(image.attrs.source),
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
    .map((t) => ({ id: int(t.attrs.id), properties: parseProperties(t) }))
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
    const bytes = atob(dataNode.text.trim());
    data = [];
    for (let i = 0; i < bytes.length; i += 4) {
      data.push(
        (bytes.charCodeAt(i) |
          (bytes.charCodeAt(i + 1) << 8) |
          (bytes.charCodeAt(i + 2) << 16) |
          (bytes.charCodeAt(i + 3) << 24)) >>>
          0
      );
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

/**
 * Converts a TMX map (XML text) to a Tiled JSON map.
 */
export function parseTmx(xml) {
  const map = parseXml(xml);
  if (!map || map.tag !== "map") {
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
    properties: parseProperties(map),
    tilesets: [],
    layers: [],
  };

  for (const node of map.children) {
    if (node.tag === "tileset") {
      json.tilesets.push(parseTileset(node));
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
        properties: parseProperties(node),
        data: decodeLayerData(child(node, "data"), width * height),
      });
    } else if (node.tag === "objectgroup") {
      json.layers.push({
        id: nextId++,
        type: "objectgroup",
        name: node.attrs.name,
        color: node.attrs.color,
        x: 0,
        y: 0,
        width: int(node.attrs.width, undefined),
        height: int(node.attrs.height, undefined),
        opacity: 1,
        visible: int(node.attrs.visible, 1) === 1,
        draworder: "topdown",
        properties: parseProperties(node),
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
            properties: parseProperties(o),
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

// --- writing -----------------------------------------------------------------

function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function attributes(attrs) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([name, value]) => ` ${name}="${escapeXml(value)}"`)
    .join("");
}

function writeProperties(properties, indent) {
  if (!properties || !properties.length) {
    return [];
  }
  return [
    `${indent}<properties>`,
    ...properties.map((p) => `${indent} <property${attributes({ name: p.name, value: String(p.value) })}/>`),
    `${indent}</properties>`,
  ];
}

function encodeLayerData(data) {
  let bytes = "";
  for (const gid of data) {
    bytes += String.fromCharCode(gid & 0xff, (gid >>> 8) & 0xff, (gid >>> 16) & 0xff, (gid >>> 24) & 0xff);
  }
  return btoa(bytes);
}

/**
 * Converts a Tiled JSON map (as produced by `parseTmx`) to TMX (XML text),
 * formatted like the original maps.
 */
export function writeTmx(json) {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>'];
  lines.push(
    `<map${attributes({
      version: "1.0",
      orientation: json.orientation,
      width: json.width,
      height: json.height,
      tilewidth: json.tilewidth,
      tileheight: json.tileheight,
    })}>`
  );
  lines.push(...writeProperties(json.properties, " "));

  for (const tileset of json.tilesets) {
    lines.push(
      ` <tileset${attributes({
        firstgid: tileset.firstgid,
        name: tileset.name,
        tilewidth: tileset.tilewidth,
        tileheight: tileset.tileheight,
        spacing: tileset.spacing || undefined,
        margin: tileset.margin || undefined,
      })}>`
    );
    lines.push(
      `  <image${attributes({
        source: "../images/" + basename(tileset.image),
        width: tileset.imagewidth,
        height: tileset.imageheight,
      })}/>`
    );
    for (const tile of tileset.tiles || []) {
      if (tile.properties && tile.properties.length) {
        lines.push(`  <tile id="${tile.id}">`, ...writeProperties(tile.properties, "   "), "  </tile>");
      }
    }
    lines.push(" </tileset>");
  }

  for (const layer of json.layers) {
    if (layer.type === "tilelayer") {
      lines.push(
        ` <layer${attributes({
          name: layer.name,
          width: layer.width,
          height: layer.height,
          opacity: layer.opacity !== undefined && layer.opacity !== 1 ? layer.opacity : undefined,
          visible: layer.visible === false ? 0 : undefined,
        })}>`
      );
      lines.push(...writeProperties(layer.properties, "  "));
      lines.push('  <data encoding="base64">', "   " + encodeLayerData(layer.data), "  </data>", " </layer>");
    } else if (layer.type === "objectgroup") {
      const open = ` <objectgroup${attributes({
        color: layer.color,
        name: layer.name,
        width: layer.width,
        height: layer.height,
        visible: layer.visible === false ? 0 : undefined,
      })}`;
      const body = [...writeProperties(layer.properties, "  ")];
      for (const object of layer.objects) {
        const attrs = attributes({
          name: object.name || undefined,
          type: object.type || undefined,
          gid: object.gid,
          x: object.x,
          y: object.y,
          width: object.gid === undefined && object.width ? object.width : undefined,
          height: object.gid === undefined && object.height ? object.height : undefined,
        });
        if (object.properties && object.properties.length) {
          body.push(`  <object${attrs}>`, ...writeProperties(object.properties, "   "), "  </object>");
        } else {
          body.push(`  <object${attrs}/>`);
        }
      }
      if (body.length) {
        lines.push(open + ">", ...body, " </objectgroup>");
      } else {
        lines.push(open + "/>");
      }
    }
  }

  lines.push("</map>");
  return lines.join("\n") + "\n";
}
