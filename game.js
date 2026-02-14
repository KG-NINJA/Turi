const cursorEl = document.getElementById("cursor");
const zoneEl = document.getElementById("fish-zone");
const tapButton = document.getElementById("tap-button");
const comboEl = document.getElementById("combo");
const bestEl = document.getElementById("best");
const messageEl = document.getElementById("message");

const state = {
  cursorX: 0,
  direction: 1,
  speed: 0.42,
  zoneLeft: 35,
  zoneWidth: 22,
  combo: 0,
  best: 0,
};

const meterWidth = () => zoneEl.parentElement.clientWidth;

function randomizeZone() {
  const minLeft = 3;
  const maxLeft = 97 - state.zoneWidth;
  state.zoneLeft = minLeft + Math.random() * (maxLeft - minLeft);
  zoneEl.style.left = `${state.zoneLeft}%`;
  zoneEl.style.width = `${state.zoneWidth}%`;
}

function gameLoop() {
  const width = meterWidth();
  const cursorWidth = cursorEl.clientWidth;
  state.cursorX += state.direction * state.speed;

  if (state.cursorX <= 0) {
    state.cursorX = 0;
    state.direction = 1;
  }

  if (state.cursorX >= width - cursorWidth) {
    state.cursorX = width - cursorWidth;
    state.direction = -1;
  }

  cursorEl.style.left = `${state.cursorX}px`;
  requestAnimationFrame(gameLoop);
}

function evaluateTap() {
  const width = meterWidth();
  const cursorCenter = (state.cursorX + cursorEl.clientWidth / 2) / width;
  const zoneStart = state.zoneLeft / 100;
  const zoneEnd = (state.zoneLeft + state.zoneWidth) / 100;

  const success = cursorCenter >= zoneStart && cursorCenter <= zoneEnd;

  if (success) {
    state.combo += 1;
    state.best = Math.max(state.best, state.combo);
    state.speed = Math.min(2.4, state.speed + 0.08);
    state.zoneWidth = Math.max(5, state.zoneWidth - 0.9);
    messageEl.textContent = `ヒット！ 連続 ${state.combo}。さらに速く、さらに狭く…`; 
    tapButton.classList.add("flash-success");
  } else {
    state.combo = 0;
    state.speed = Math.max(0.42, state.speed - 0.12);
    state.zoneWidth = Math.min(24, state.zoneWidth + 1.1);
    messageEl.textContent = "逃げられた…タイミングを見極めて！";
    tapButton.classList.add("flash-fail");
  }

  comboEl.textContent = String(state.combo);
  bestEl.textContent = String(state.best);

  randomizeZone();
  window.setTimeout(() => {
    tapButton.classList.remove("flash-success", "flash-fail");
  }, 180);
}

window.addEventListener("resize", () => {
  state.cursorX = Math.min(state.cursorX, meterWidth() - cursorEl.clientWidth);
});

tapButton.addEventListener("click", evaluateTap);

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "Enter") {
    event.preventDefault();
    evaluateTap();
  }
});

randomizeZone();
requestAnimationFrame(gameLoop);
