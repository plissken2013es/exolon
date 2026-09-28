import { writeTmx } from "../maps/tmx.js";
import { maps as MAP_LIST } from "../resources.js";
import { buildCatalogue, DESCRIPTIONS, LIGHT_TILES, PROPERTIES } from "./catalogue.js";
import {
  TILE,
  basename,
  cloneMap,
  ensureTileset,
  getProperty,
  isCollisionLayer,
  objectBounds,
  setProperty,
  solidGid,
  tilesetForGid,
  tilesetKey,
} from "./mapUtils.js";
import { drawTile, loadImages, renderMap, renderPalette, renderThumbnail } from "./render.js";
import PlayTest from "./PlayTest.js";

const $ = (id) => document.getElementById(id);

// keyboard shortcuts to the layers of the maps
const LAYER_KEYS = { Digit1: "Tile Layer 1", Digit2: "Tile Layer 2", Digit3: "Stars", Digit4: "Collision" };

const snap = (v) => Math.round(v / TILE) * TILE;

/**
 * The level editor (editor.html).
 */
class Editor {
  async start() {
    this.message("LOADING THE MAPS...");

    // the maps as saved (name -> map, and as TMX to tell unsaved changes)
    this.saved = new Map();
    this.savedTmx = new Map();
    await Promise.all(
      MAP_LIST.map(async ({ name, src }) => {
        const map = await (await fetch(src)).json();
        this.saved.set(name, map);
        this.savedTmx.set(name, writeTmx(map));
      })
    );
    // the maps being edited
    this.edited = new Map();
    this.history = new Map(); // name -> {undo: [], redo: []}

    this.catalogue = buildCatalogue([...this.saved.values()]);
    await loadImages([...this.saved.values()].flatMap((map) => map.tilesets));

    this.hidden = new Set();
    this.grid = true;
    this.zoom = window.innerWidth >= 1660 ? 2 : 1;
    this.activeLayer = "Tile Layer 1";
    this.brush = null;
    this.armed = null; // kind of object to place
    this.selected = null;
    this.hover = null; // map coordinates of the pointer
    this.stroke = null; // painting in progress
    this.drag = null; // object being moved
    this.pendingSnapshot = null;

    this.canvas = $("map");
    this.ctx = this.canvas.getContext("2d");
    this.playTest = new PlayTest($("game"), () => this.stopPlaying());

    this.initToolbar();
    this.initMapEvents();
    this.initPalette();
    this.initObjectTypes();
    this.initKeyboard();
    this.initHotReload();

    window.addEventListener("beforeunload", (event) => {
      if (this.dirtyNames().length) {
        event.preventDefault();
      }
    });

    const level = (new URLSearchParams(location.search).get("level") || "").toUpperCase();
    this.open(this.saved.has(level) ? level : MAP_LIST[0].name);
    this.message("READY. PRESS P TO PLAY THE SCREEN, ? FOR HELP");
  }

  // --- maps ------------------------------------------------------------------

  open(name) {
    this.stroke = this.drag = null;
    this.endChange();
    this.name = name;
    if (!this.edited.has(name)) {
      this.edited.set(name, cloneMap(this.saved.get(name)));
    }
    this.map = this.edited.get(name);
    if (!this.map.layers.some((l) => l.name === this.activeLayer)) {
      this.activeLayer = this.map.layers.find((l) => l.type === "tilelayer").name;
    }
    this.selected = null;
    history.replaceState(null, "", `?level=${name}`);
    $("screen").value = name;
    this.refreshAll();
  }

  isDirty(name) {
    return this.edited.has(name) && writeTmx(this.edited.get(name)) !== this.savedTmx.get(name);
  }

  dirtyNames() {
    return [...this.edited.keys()].filter((name) => this.isDirty(name));
  }

  get layer() {
    return this.map.layers.find((l) => l.name === this.activeLayer);
  }

  get mode() {
    const layer = this.layer;
    if (layer.type === "objectgroup") {
      return "objects";
    }
    return isCollisionLayer(layer) ? "collision" : "tiles";
  }

  historyFor(name) {
    if (!this.history.has(name)) {
      this.history.set(name, { undo: [], redo: [] });
    }
    return this.history.get(name);
  }

  // Changes are recorded for undo as snapshots of the map, taken before
  // each change (a whole paint stroke or object drag is one change).

  beginChange() {
    if (this.pendingSnapshot === null) {
      this.pendingSnapshot = JSON.stringify(this.map);
    }
  }

  endChange() {
    if (this.pendingSnapshot === null) {
      return;
    }
    if (JSON.stringify(this.map) !== this.pendingSnapshot) {
      const h = this.historyFor(this.name);
      h.undo.push(this.pendingSnapshot);
      if (h.undo.length > 200) {
        h.undo.shift();
      }
      h.redo = [];
      this.refreshScreenList();
    }
    this.pendingSnapshot = null;
  }

  change(fn) {
    this.beginChange();
    fn();
    this.endChange();
    this.refreshAll();
  }

  undo() {
    this.restore("undo", "redo");
  }

  redo() {
    this.restore("redo", "undo");
  }

  restore(from, to) {
    this.endChange();
    const h = this.historyFor(this.name);
    if (!h[from].length) {
      return;
    }
    h[to].push(JSON.stringify(this.map));
    this.map = JSON.parse(h[from].pop());
    this.edited.set(this.name, this.map);
    this.selected = null;
    this.refreshAll();
  }

  async save() {
    const name = this.name;
    const tmx = writeTmx(this.map);
    if (import.meta.env.DEV) {
      try {
        const response = await fetch(`__exolon/maps/${name}`, { method: "PUT", body: tmx });
        if (!response.ok) {
          throw new Error(await response.text());
        }
      } catch (e) {
        this.message(`COULDN'T SAVE ${name}: ${e.message}`, true);
        return;
      }
      this.message(`SAVED maps/${name}.tmx`);
    } else {
      // no server to save to: download the map
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([tmx], { type: "application/xml" }));
      link.download = name + ".tmx";
      link.click();
      URL.revokeObjectURL(link.href);
      this.message(`DOWNLOADED ${name}.tmx (PUT IT IN maps/ TO USE IT)`);
    }
    this.saved.set(name, cloneMap(this.map));
    this.savedTmx.set(name, tmx);
    this.refreshScreenList();
    this.refreshStatus();
  }

  /**
   * In development, maps saved from Tiled (or another editor window) are
   * picked up here too.
   */
  initHotReload() {
    if (!import.meta.hot) {
      return;
    }
    import.meta.hot.on("exolon:map-updated", async ({ name }) => {
      const map = await (await fetch(`phaser/maps/${name}.json?t=${Date.now()}`)).json();
      const tmx = writeTmx(map);
      const edited = this.edited.get(name);
      const wasClean = !edited || writeTmx(edited) === this.savedTmx.get(name);
      this.saved.set(name, map);
      this.savedTmx.set(name, tmx);
      if (edited && writeTmx(edited) === tmx) {
        return; // saved from here
      }
      if (wasClean) {
        this.edited.delete(name);
        if (name === this.name) {
          this.open(name);
        }
        this.message(`${name} CHANGED ON DISK, RELOADED`);
      } else {
        this.message(`${name} CHANGED ON DISK, BUT HAS UNSAVED CHANGES HERE`, true);
        this.refreshScreenList();
      }
    });
  }

  // --- playing -----------------------------------------------------------------

  play() {
    this.stroke = this.drag = null;
    this.endChange();
    $("mapBox").hidden = true;
    this.playTest.play(this.name, cloneMap(this.map), { god: $("god").checked, zoom: this.zoom });
    $("play").textContent = "EDIT (ESC)";
  }

  stopPlaying() {
    this.playTest.stop();
    $("mapBox").hidden = false;
    $("play").textContent = "PLAY (P)";
    this.canvas.focus();
  }

  // --- toolbar -------------------------------------------------------------

  initToolbar() {
    const screen = $("screen");
    for (const { name } of MAP_LIST) {
      screen.add(new Option(name, name));
      $("nextLevel").add(new Option(name, name));
    }
    screen.addEventListener("change", () => this.open(screen.value));
    $("prev").addEventListener("click", () => this.step(-1));
    $("next").addEventListener("click", () => this.step(1));
    $("nextLevel").addEventListener("change", (event) =>
      this.change(() => setProperty(this.map, "nextLevel", event.target.value))
    );
    $("undo").addEventListener("click", () => this.undo());
    $("redo").addEventListener("click", () => this.redo());
    $("save").textContent = import.meta.env.DEV ? "SAVE (CTRL+S)" : "DOWNLOAD .TMX";
    $("save").addEventListener("click", () => this.save());
    $("play").addEventListener("click", () => (this.playTest.playing ? this.stopPlaying() : this.play()));
    $("grid").checked = this.grid;
    $("grid").addEventListener("change", (event) => {
      this.grid = event.target.checked;
      this.render();
    });
    $("zoom").value = String(this.zoom);
    $("zoom").addEventListener("change", (event) => {
      this.zoom = Number(event.target.value);
      this.render();
    });
    $("help").addEventListener("click", () => ($("helpBox").hidden = !$("helpBox").hidden));
  }

  step(delta) {
    const index = MAP_LIST.findIndex((m) => m.name === this.name);
    this.open(MAP_LIST[(index + delta + MAP_LIST.length) % MAP_LIST.length].name);
  }

  refreshScreenList() {
    const dirty = new Set(this.dirtyNames());
    for (const option of $("screen").options) {
      option.text = option.value + (dirty.has(option.value) ? " *" : "");
    }
  }

  // --- the map view ----------------------------------------------------------

  toMap(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: Math.floor(((event.clientX - rect.left) / rect.width) * this.map.width * TILE),
      y: Math.floor(((event.clientY - rect.top) / rect.height) * this.map.height * TILE),
    };
  }

  initMapEvents() {
    const canvas = this.canvas;
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    canvas.addEventListener("pointerdown", (event) => {
      canvas.setPointerCapture(event.pointerId);
      this.pointerDown(this.toMap(event), event);
    });
    canvas.addEventListener("pointermove", (event) => this.pointerMove(this.toMap(event), event));
    canvas.addEventListener("pointerup", () => this.pointerUp());
    canvas.addEventListener("pointercancel", () => this.pointerUp());
    canvas.addEventListener("pointerleave", () => {
      if (!this.stroke && !this.drag) {
        this.hover = null;
        this.render();
      }
    });
  }

  cellAt(p) {
    return {
      col: Math.max(0, Math.min(this.map.width - 1, Math.floor(p.x / TILE))),
      row: Math.max(0, Math.min(this.map.height - 1, Math.floor(p.y / TILE))),
    };
  }

  pointerDown(p, event) {
    this.hover = p;
    if (this.mode === "objects") {
      this.objectPointerDown(p, event);
      return;
    }
    const cell = this.cellAt(p);
    if (event.altKey || event.button === 1) {
      this.pick(cell);
      return;
    }
    this.beginChange();
    this.stroke = { erase: event.button === 2, start: cell, last: null };
    this.paint(cell);
  }

  pointerMove(p, event) {
    this.hover = p;
    if (this.stroke) {
      this.paint(this.cellAt(p));
    } else if (this.drag) {
      this.moveDragged(p, event.shiftKey);
    }
    this.render();
    this.refreshStatus();
  }

  pointerUp() {
    if (this.stroke || this.drag) {
      this.stroke = this.drag = null;
      this.endChange();
      this.refreshAll();
    }
  }

  // --- tiles -----------------------------------------------------------------

  setTile(layer, col, row, gid) {
    if (col >= 0 && row >= 0 && col < layer.width && row < layer.height) {
      layer.data[row * layer.width + col] = gid;
    }
  }

  paint(cell) {
    const stroke = this.stroke;
    if (stroke.last && stroke.last.col === cell.col && stroke.last.row === cell.row) {
      return;
    }
    stroke.last = cell;
    const layer = this.layer;

    if (this.mode === "collision") {
      this.setTile(layer, cell.col, cell.row, stroke.erase ? 0 : solidGid(this.map));
    } else if (stroke.erase) {
      this.setTile(layer, cell.col, cell.row, 0);
    } else if (this.brush) {
      // a block of tiles is stamped side by side along the stroke
      const { cols, rows, ids, tileset } = this.brush;
      const mod = (a, n) => ((a % n) + n) % n;
      if (mod(cell.col - stroke.start.col, cols) || mod(cell.row - stroke.start.row, rows)) {
        return;
      }
      const firstgid = ensureTileset(this.map, tileset).firstgid;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          this.setTile(layer, cell.col + c, cell.row + r, firstgid + ids[r][c]);
        }
      }
    }
    this.render();
  }

  /**
   * Takes the tile under the pointer as the brush.
   */
  pick(cell) {
    const gid = this.layer.data[cell.row * this.layer.width + cell.col];
    if (!gid || this.mode !== "tiles") {
      return;
    }
    const tileset = tilesetForGid(this.map, gid);
    const localId = gid - tileset.firstgid;
    const key = this.paletteKey(tileset);
    if ([...$("tileset").options].some((o) => o.value === key)) {
      $("tileset").value = key;
    }
    this.selectInPalette({ col: localId % tileset.columns, row: Math.floor(localId / tileset.columns), cols: 1, rows: 1 });
  }

  // --- the tile palette --------------------------------------------------------

  paletteKey(tileset) {
    return tilesetKey(tileset) + "|" + basename(tileset.image);
  }

  get paletteTileset() {
    return this.catalogue.tileTilesets.find((t) => this.paletteKey(t) === $("tileset").value);
  }

  get paletteScale() {
    const tileset = this.paletteTileset;
    if (tileset.tilewidth <= TILE) {
      return 2;
    }
    return tileset.imagewidth <= 460 ? 1 : 0.5;
  }

  initPalette() {
    const select = $("tileset");
    for (const tileset of this.catalogue.tileTilesets) {
      select.add(new Option(`${tileset.name} (${tileset.tilewidth}x${tileset.tileheight})`, this.paletteKey(tileset)));
    }
    select.addEventListener("change", () => this.selectInPalette({ col: 0, row: 0, cols: 1, rows: 1 }));

    const canvas = $("palette");
    const cellAt = (event) => {
      const tileset = this.paletteTileset;
      const rect = canvas.getBoundingClientRect();
      const scale = this.paletteScale;
      return {
        col: Math.max(0, Math.min(tileset.columns - 1, Math.floor((event.clientX - rect.left) / (tileset.tilewidth * scale)))),
        row: Math.max(
          0,
          Math.min(tileset.tilecount / tileset.columns - 1, Math.floor((event.clientY - rect.top) / (tileset.tileheight * scale)))
        ),
      };
    };
    let start = null;
    const selection = (a, b) => ({
      col: Math.min(a.col, b.col),
      row: Math.min(a.row, b.row),
      cols: Math.abs(a.col - b.col) + 1,
      rows: Math.abs(a.row - b.row) + 1,
    });
    canvas.addEventListener("pointerdown", (event) => {
      canvas.setPointerCapture(event.pointerId);
      start = cellAt(event);
      this.selectInPalette(selection(start, start));
    });
    canvas.addEventListener("pointermove", (event) => {
      if (start) {
        this.selectInPalette(selection(start, cellAt(event)));
      }
    });
    canvas.addEventListener("pointerup", () => (start = null));

    this.selectInPalette({ col: 0, row: 0, cols: 1, rows: 1 });
  }

  selectInPalette(selection) {
    const tileset = this.paletteTileset;
    const ids = [];
    for (let r = 0; r < selection.rows; r++) {
      ids.push([]);
      for (let c = 0; c < selection.cols; c++) {
        ids[r].push((selection.row + r) * tileset.columns + selection.col + c);
      }
    }
    this.brush = { tileset, selection, ids, cols: selection.cols, rows: selection.rows };
    renderPalette($("palette").getContext("2d"), tileset, this.paletteScale, selection);
    if (this.map && this.mode === "objects") {
      this.setActiveLayer("Tile Layer 1");
    }
  }

  // --- objects -----------------------------------------------------------------

  initObjectTypes() {
    const list = $("objectTypes");
    const button = (label, title, onClick) => {
      const b = document.createElement("button");
      b.className = "objectType";
      b.title = title;
      b.addEventListener("click", onClick);
      const caption = document.createElement("span");
      caption.textContent = label;
      b.append(caption);
      list.append(b);
      return b;
    };
    this.selectButton = button("SELECT", "Select and move objects", () => this.arm(null));
    this.typeButtons = new Map();
    for (const info of this.catalogue.objects) {
      const b = button(info.name.toUpperCase(), DESCRIPTIONS[info.name] || info.name, () => this.arm(info));
      const canvas = document.createElement("canvas");
      renderThumbnail(canvas, info, 40);
      b.prepend(canvas);
      this.typeButtons.set(info.name, b);
    }
  }

  arm(info) {
    this.armed = info;
    if (this.mode !== "objects") {
      const group =
        this.map.layers.find((l) => l.type === "objectgroup" && l.objects.length) ||
        this.map.layers.find((l) => l.type === "objectgroup");
      this.setActiveLayer(group.name);
    }
    this.refreshObjectTypes();
    this.message(info ? `CLICK ON THE MAP TO PLACE ${info.name.toUpperCase()} (ESC TO STOP)` : "");
  }

  refreshObjectTypes() {
    this.selectButton.classList.toggle("active", !this.armed);
    for (const [name, b] of this.typeButtons) {
      b.classList.toggle("active", this.armed !== null && this.armed.name === name);
    }
  }

  objectGroups() {
    return this.map.layers.filter((l) => l.type === "objectgroup");
  }

  groupOf(object) {
    return this.objectGroups().find((g) => g.objects.includes(object));
  }

  objectAt(p) {
    const groups = this.objectGroups().filter((g) => !this.hidden.has(g.name));
    for (let g = groups.length - 1; g >= 0; g--) {
      for (let i = groups[g].objects.length - 1; i >= 0; i--) {
        const object = groups[g].objects[i];
        const b = objectBounds(this.map, object);
        if (p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h) {
          return object;
        }
      }
    }
    return null;
  }

  objectPointerDown(p, event) {
    const hit = this.objectAt(p);
    if (event.button === 2) {
      if (hit) {
        this.select(hit);
        this.deleteSelected();
      }
      return;
    }
    if (hit && !this.armed) {
      this.select(hit);
      this.drag = { object: hit, dx: p.x - hit.x, dy: p.y - hit.y };
    } else if (this.armed) {
      this.place(this.armed, p);
    } else {
      this.select(null);
    }
  }

  moveDragged(p, free) {
    const { object, dx, dy } = this.drag;
    const x = free ? p.x - dx : snap(p.x - dx);
    const y = free ? p.y - dy : snap(p.y - dy);
    if (x !== object.x || y !== object.y) {
      this.beginChange();
      object.x = x;
      object.y = y;
      this.refreshProperties();
    }
  }

  /**
   * Where a new object of the given kind goes for the pointer at `p`.
   */
  placement(info, p) {
    const x = Math.floor(p.x / TILE) * TILE;
    const row = Math.floor(p.y / TILE);
    // tile objects stand on the bottom of the cell, rectangles hang from the top
    return info.tileset ? { x, y: (row + 1) * TILE } : { x, y: row * TILE };
  }

  place(info, p) {
    const group = this.layer;
    this.change(() => {
      const { x, y } = this.placement(info, p);
      const object = { id: this.map.nextobjectid++, name: info.name, type: "", x, y, width: 0, height: 0, rotation: 0, visible: true };
      if (info.tileset) {
        object.gid = ensureTileset(this.map, info.tileset).firstgid + info.localId;
      } else {
        object.width = info.width || 32;
        object.height = info.height || 32;
      }
      for (const property of PROPERTIES[info.name] || []) {
        if (property.required) {
          setProperty(object, property.name, property.default || property.options[0]);
        }
      }
      if (info.name === "light") {
        object.gid = tilesetForGid(this.map, object.gid).firstgid + LIGHT_TILES.floor;
        setProperty(object, "placement", "floor");
      }
      group.objects.push(object);
      this.selected = object;
    });
  }

  select(object) {
    this.selected = object;
    this.refreshProperties();
    this.render();
  }

  deleteSelected() {
    const object = this.selected;
    if (!object) {
      return;
    }
    this.change(() => {
      const group = this.groupOf(object);
      group.objects.splice(group.objects.indexOf(object), 1);
      this.selected = null;
    });
  }

  nudge(dx, dy) {
    const object = this.selected;
    if (object) {
      this.change(() => {
        object.x += dx;
        object.y += dy;
      });
    }
  }

  refreshProperties() {
    const box = $("props");
    box.replaceChildren();
    const object = this.selected;
    if (!object) {
      box.textContent = "CLICK AN OBJECT TO EDIT IT";
      return;
    }

    const row = (label, input, help) => {
      const div = document.createElement("div");
      div.className = "prop";
      const l = document.createElement("label");
      l.textContent = label;
      div.append(l, input);
      if (help) {
        const h = document.createElement("small");
        h.textContent = help;
        div.append(h);
      }
      box.append(div);
      return input;
    };
    const textInput = (value, placeholder, onChange) => {
      const input = document.createElement("input");
      input.value = value === undefined ? "" : String(value);
      input.placeholder = placeholder || "";
      input.addEventListener("change", () => onChange(input.value.trim()));
      return input;
    };
    const selectInput = (options, value, onChange, allowEmpty) => {
      const select = document.createElement("select");
      if (allowEmpty) {
        select.add(new Option("(default)", ""));
      }
      for (const option of options) {
        select.add(new Option(option, option));
      }
      select.value = value === undefined ? "" : String(value);
      select.addEventListener("change", () => onChange(select.value));
      return select;
    };

    const title = document.createElement("p");
    title.className = "objectTitle";
    title.textContent = object.name.toUpperCase() + (DESCRIPTIONS[object.name] ? ": " + DESCRIPTIONS[object.name] : "");
    box.append(title);

    const groups = this.objectGroups().map((g) => g.name);
    row(
      "LAYER",
      selectInput(groups, this.groupOf(object).name, (name) =>
        this.change(() => {
          const from = this.groupOf(object);
          from.objects.splice(from.objects.indexOf(object), 1);
          this.map.layers.find((l) => l.name === name).objects.push(object);
        })
      )
    );

    const number = (name) => (value) => {
      const n = Number(value);
      if (value !== "" && Number.isFinite(n)) {
        this.change(() => (object[name] = Math.round(n)));
      } else {
        this.refreshProperties();
      }
    };
    row("X", textInput(object.x, "", number("x")));
    row("Y", textInput(object.y, "", number("y")), object.gid ? "bottom of the object" : "top of the object");
    if (!object.gid) {
      row("WIDTH", textInput(object.width, "", number("width")));
      row("HEIGHT", textInput(object.height, "", number("height")));
    }

    const known = PROPERTIES[object.name] || [];
    for (const property of known) {
      const value = getProperty(object, property.name);
      const onChange = (v) =>
        this.change(() => {
          setProperty(object, property.name, v === "" ? undefined : v);
          if (object.name === "light" && property.name === "placement" && v in LIGHT_TILES) {
            object.gid = tilesetForGid(this.map, object.gid).firstgid + LIGHT_TILES[v];
          }
        });
      const input = property.options
        ? selectInput(property.options, value, onChange, !property.required)
        : textInput(value, property.placeholder, onChange);
      row(property.name.toUpperCase(), input, property.help);
    }

    // any other property
    for (const property of object.properties || []) {
      if (known.some((k) => k.name === property.name)) {
        continue;
      }
      const input = textInput(property.value, "", (v) =>
        this.change(() => setProperty(object, property.name, v === "" ? undefined : v))
      );
      row(property.name.toUpperCase(), input, "empty to remove");
    }
    const add = document.createElement("div");
    add.className = "prop";
    const newName = textInput("", "new property", () => {});
    const newValue = textInput("", "value", () => {});
    const addButton = document.createElement("button");
    addButton.textContent = "ADD";
    addButton.addEventListener("click", () => {
      if (newName.value.trim()) {
        this.change(() => setProperty(object, newName.value.trim(), newValue.value.trim() || true));
      }
    });
    add.append(newName, newValue, addButton);
    box.append(add);

    const remove = document.createElement("button");
    remove.textContent = "DELETE OBJECT (DEL)";
    remove.addEventListener("click", () => this.deleteSelected());
    box.append(remove);
  }

  // --- layers --------------------------------------------------------------------

  setActiveLayer(name) {
    this.activeLayer = name;
    if (this.mode !== "objects") {
      this.armed = null;
      this.refreshObjectTypes();
    }
    this.refreshAll();
  }

  refreshLayers() {
    const list = $("layers");
    list.replaceChildren();
    for (const layer of this.map.layers) {
      const li = document.createElement("li");
      li.classList.toggle("active", layer.name === this.activeLayer);
      const visible = document.createElement("input");
      visible.type = "checkbox";
      visible.checked = !this.hidden.has(layer.name);
      visible.title = "show / hide in the editor";
      visible.addEventListener("change", () => {
        visible.checked ? this.hidden.delete(layer.name) : this.hidden.add(layer.name);
        this.render();
      });
      const name = document.createElement("button");
      const count = layer.type === "objectgroup" ? ` (${layer.objects.length})` : "";
      const key = Object.entries(LAYER_KEYS).find(([, n]) => n === layer.name);
      name.textContent = layer.name.toUpperCase() + count + (key ? `  [${key[0].slice(-1)}]` : "");
      name.addEventListener("click", () => this.setActiveLayer(layer.name));
      li.append(visible, name);
      list.append(li);
    }
  }

  // --- display -----------------------------------------------------------------

  refreshAll() {
    this.refreshLayers();
    this.refreshScreenList();
    this.refreshProperties();
    const next = getProperty(this.map, "nextLevel");
    $("nextLevel").value = next || "";
    $("tilesSection").hidden = this.mode !== "tiles";
    $("collisionSection").hidden = this.mode !== "collision";
    $("objectsSection").hidden = this.mode !== "objects";
    this.render();
    this.refreshStatus();
  }

  render() {
    const w = this.map.width * TILE;
    const h = this.map.height * TILE;
    if (this.canvas.width !== w * this.zoom || this.canvas.height !== h * this.zoom) {
      this.canvas.width = w * this.zoom;
      this.canvas.height = h * this.zoom;
    }
    this.ctx.setTransform(this.zoom, 0, 0, this.zoom, 0, 0);
    renderMap(this.ctx, this.map, {
      hidden: this.hidden,
      grid: this.grid,
      selected: this.selected,
      hover: this.hoverBox(),
      ghost: this.ghost(),
    });
  }

  hoverBox() {
    if (!this.hover || this.drag) {
      return null;
    }
    if (this.mode === "objects") {
      const object = !this.armed && this.objectAt(this.hover);
      return object ? objectBounds(this.map, object) : null;
    }
    const cell = this.cellAt(this.hover);
    const size = this.mode === "tiles" && this.brush ? this.brush : { cols: 1, rows: 1 };
    return { x: cell.col * TILE, y: cell.row * TILE, w: size.cols * TILE, h: size.rows * TILE };
  }

  /**
   * A preview of what a click would add.
   */
  ghost() {
    if (!this.hover || this.stroke || this.drag) {
      return null;
    }
    if (this.mode === "objects" && this.armed) {
      const info = this.armed;
      const { x, y } = this.placement(info, this.hover);
      return (ctx) => {
        if (info.tileset) {
          drawTile(ctx, info.tileset, info.localId, x, y);
        } else {
          ctx.fillStyle = "#00dede";
          ctx.fillRect(x, y, info.width || 32, info.height || 32);
        }
      };
    }
    if (this.mode === "tiles" && this.brush) {
      const cell = this.cellAt(this.hover);
      const { cols, rows, ids, tileset } = this.brush;
      return (ctx) => {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            drawTile(ctx, tileset, ids[r][c], (cell.col + c) * TILE, (cell.row + r + 1) * TILE);
          }
        }
      };
    }
    return null;
  }

  refreshStatus() {
    const parts = [this.name + (this.isDirty(this.name) ? " (UNSAVED)" : "")];
    if (this.hover) {
      const cell = this.cellAt(this.hover);
      parts.push(`COL ${cell.col} ROW ${cell.row}  (${this.hover.x}, ${this.hover.y})`);
      if (this.mode !== "objects") {
        const gid = this.layer.data[cell.row * this.layer.width + cell.col];
        if (gid) {
          const tileset = tilesetForGid(this.map, gid);
          parts.push(`TILE ${tileset.name} #${gid - tileset.firstgid}`);
        }
      }
    }
    $("position").textContent = parts.join("  |  ");
    $("checks").textContent = this.checks().join("  |  ");
  }

  /**
   * Common mistakes in the screen.
   */
  checks() {
    const objects = this.objectGroups().flatMap((g) => g.objects);
    const count = (name) => objects.filter((o) => o.name === name).length;
    const warnings = [];
    if (count("vitorc") !== 1) {
      warnings.push(`THERE MUST BE ONE VITORC (THERE ARE ${count("vitorc")})`);
    }
    if (count("teleport") !== 0 && count("teleport") !== 2) {
      warnings.push(`TELEPORTS COME IN PAIRS (THERE ARE ${count("teleport")})`);
    }
    if (!getProperty(this.map, "nextLevel") && !count("exit")) {
      warnings.push("NO NEXT SCREEN AND NO EXIT");
    }
    return warnings;
  }

  message(text, error = false) {
    const box = $("message");
    box.textContent = text;
    box.classList.toggle("error", error);
  }

  // --- keyboard ------------------------------------------------------------------

  initKeyboard() {
    window.addEventListener("keydown", (event) => {
      const target = event.target;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) {
        return;
      }
      const ctrl = event.ctrlKey || event.metaKey;
      let handled = true;
      if (ctrl && event.code === "KeyZ") {
        event.shiftKey ? this.redo() : this.undo();
      } else if (ctrl && event.code === "KeyY") {
        this.redo();
      } else if (ctrl && event.code === "KeyS") {
        this.save();
      } else if (ctrl) {
        handled = false;
      } else if (event.code === "KeyP" || (event.code === "Escape" && this.playTest.playing)) {
        this.playTest.playing ? this.stopPlaying() : this.play();
      } else if (event.code === "Escape") {
        this.arm(null);
        this.select(null);
      } else if (LAYER_KEYS[event.code] && this.map.layers.some((l) => l.name === LAYER_KEYS[event.code])) {
        this.setActiveLayer(LAYER_KEYS[event.code]);
      } else if (event.code === "Digit5") {
        this.arm(this.armed);
      } else if (event.code === "KeyG") {
        $("grid").checked = this.grid = !this.grid;
        this.render();
      } else if (event.code === "BracketLeft" || event.code === "PageUp") {
        this.step(-1);
      } else if (event.code === "BracketRight" || event.code === "PageDown") {
        this.step(1);
      } else if ((event.code === "Delete" || event.code === "Backspace") && this.selected) {
        this.deleteSelected();
      } else if (event.code.startsWith("Arrow") && this.selected) {
        const d = event.shiftKey ? 1 : TILE;
        const [dx, dy] = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[event.code];
        this.nudge(dx, dy);
      } else if (event.key === "?") {
        $("helpBox").hidden = !$("helpBox").hidden;
      } else {
        handled = false;
      }
      if (handled) {
        event.preventDefault();
      }
    });
  }
}

const editor = new Editor();
if (import.meta.env.DEV) {
  // handy from the browser console, and used by automated tests
  window.exolonEditor = editor;
}
editor.start().catch((e) => {
  console.error(e);
  document.getElementById("message").textContent = "ERROR: " + e.message;
});
