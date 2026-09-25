/**
 * Keyboard state by action name, like melonJS's `me.input`: an action is
 * "pressed" for as long as one of its keys is held down.
 */
const bindings = {}; // KeyboardEvent.code -> action
const pressed = {}; // action -> number of keys held

const held = new Set();

const input = {
  KEY: {
    LEFT: "ArrowLeft",
    RIGHT: "ArrowRight",
    UP: "ArrowUp",
    DOWN: "ArrowDown",
    SPACE: "Space",
  },

  bindKey(code, action) {
    bindings[code] = action;
    pressed[action] = pressed[action] || 0;
  },

  isKeyPressed(action) {
    return pressed[action] > 0;
  },
};

window.addEventListener("keydown", (event) => {
  const action = bindings[event.code];
  if (!action) {
    return;
  }
  event.preventDefault();
  if (!held.has(event.code)) {
    held.add(event.code);
    pressed[action]++;
  }
});

window.addEventListener("keyup", (event) => {
  const action = bindings[event.code];
  if (!action) {
    return;
  }
  event.preventDefault();
  if (held.delete(event.code)) {
    pressed[action]--;
  }
});

// don't keep keys stuck down when the page loses focus
window.addEventListener("blur", () => {
  held.clear();
  for (const action in pressed) {
    pressed[action] = 0;
  }
});

export default input;
