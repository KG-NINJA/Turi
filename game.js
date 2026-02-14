const cursorEl = document.getElementById("cursor");
const zoneEl = document.getElementById("fish-zone");
const tapButton = document.getElementById("tap-button");
const comboEl = document.getElementById("combo");
const bestEl = document.getElementById("best");
const messageEl = document.getElementById("message");
const splashEl = document.getElementById("splash");
const tensionPanelEl = document.getElementById("tension-panel");
const tensionFillEl = document.getElementById("tension-fill");

const GAME_PHASE = {
  AIM: "aim",
  BATTLE: "battle",
};

const state = {
  phase: GAME_PHASE.AIM,
  cursorX: 0,
  direction: 1,
  speed: 0.42,
  zoneLeft: 35,
  zoneWidth: 22,
  combo: 0,
  best: 0,
  isReeling: false,
  tension: 50,
  battleTimeLeft: 0,
  overTensionTime: 0,
  slackTime: 0,
  fishPhase: 0,
  lastFrameTime: performance.now(),
};

const meterWidth = () => zoneEl.parentElement.clientWidth;

function randomizeZone() {
  const minLeft = 3;
  const maxLeft = 97 - state.zoneWidth;
  state.zoneLeft = minLeft + Math.random() * (maxLeft - minLeft);
  zoneEl.style.left = `${state.zoneLeft}%`;
  zoneEl.style.width = `${state.zoneWidth}%`;
}

function setTensionUI() {
  tensionFillEl.style.width = `${Math.max(0, Math.min(100, state.tension))}%`;
}

function resetButtonFlash() {
  window.setTimeout(() => {
    tapButton.classList.remove("flash-success", "flash-fail");
  }, 180);
}

function splash() {
  splashEl.classList.remove("active");
  void splashEl.offsetWidth;
  splashEl.classList.add("active");
  window.setTimeout(() => splashEl.classList.remove("active"), 560);
}

function startBattlePhase() {
  state.phase = GAME_PHASE.BATTLE;
  state.tension = 50;
  state.overTensionTime = 0;
  state.slackTime = 0;
  state.fishPhase = Math.random() * Math.PI * 2;
  state.battleTimeLeft = Math.max(2.7, 4.3 - state.combo * 0.08);
  tensionPanelEl.classList.add("active");
  tapButton.textContent = "長押しで巻く（緩める時は離す）";
  messageEl.textContent = "ヒット！ 糸のテンションを保って魚をいなせ！";
  splash();
  setTensionUI();
}

function endBattlePhase(caught) {
  tensionPanelEl.classList.remove("active");
  tapButton.classList.remove("reeling");
  state.isReeling = false;
  state.phase = GAME_PHASE.AIM;

  if (caught) {
    state.combo += 1;
    state.best = Math.max(state.best, state.combo);
    state.speed = Math.min(2.6, state.speed + 0.1);
    state.zoneWidth = Math.max(4, state.zoneWidth - 1.0);
    messageEl.textContent = `釣り上げ成功！ 連続 ${state.combo}。次はさらにシビア。`;
    tapButton.classList.add("flash-success");
  } else {
    state.combo = 0;
    state.speed = Math.max(0.42, state.speed - 0.14);
    state.zoneWidth = Math.min(24, state.zoneWidth + 1.3);
    messageEl.textContent = "バラした…テンション管理に失敗！";
    tapButton.classList.add("flash-fail");
  }

  comboEl.textContent = String(state.combo);
  bestEl.textContent = String(state.best);
  tapButton.textContent = "タップして合わせる";
  randomizeZone();
  resetButtonFlash();
}

function updateBattle(dt) {
  state.fishPhase += dt * (2.4 + state.combo * 0.08);
  const fishPull = Math.sin(state.fishPhase) * 15 + (Math.random() - 0.5) * 16;
  const reelForce = state.isReeling ? 44 : -26;
  state.tension += (fishPull + reelForce) * dt;
  state.tension = Math.max(0, Math.min(100, state.tension));

  if (state.tension > 84) {
    state.overTensionTime += dt;
  } else {
    state.overTensionTime = Math.max(0, state.overTensionTime - dt * 1.2);
  }

  if (state.tension < 16) {
    state.slackTime += dt;
  } else {
    state.slackTime = Math.max(0, state.slackTime - dt * 1.2);
  }

  state.battleTimeLeft -= dt;
  setTensionUI();

  if (state.overTensionTime >= 0.85 || state.slackTime >= 0.85) {
    endBattlePhase(false);
    return;
  }

  if (state.battleTimeLeft <= 0) {
    endBattlePhase(true);
  }
}

function gameLoop(now) {
  const dt = Math.min(0.05, (now - state.lastFrameTime) / 1000);
  state.lastFrameTime = now;

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

  if (state.phase === GAME_PHASE.BATTLE) {
    updateBattle(dt);
  }

  requestAnimationFrame(gameLoop);
}

function tryHook() {
  if (state.phase !== GAME_PHASE.AIM) {
    return;
  }

  const width = meterWidth();
  const cursorCenter = (state.cursorX + cursorEl.clientWidth / 2) / width;
  const zoneStart = state.zoneLeft / 100;
  const zoneEnd = (state.zoneLeft + state.zoneWidth) / 100;
  const success = cursorCenter >= zoneStart && cursorCenter <= zoneEnd;

  if (success) {
    startBattlePhase();
    return;
  }

  state.combo = 0;
  state.speed = Math.max(0.42, state.speed - 0.12);
  state.zoneWidth = Math.min(24, state.zoneWidth + 1.1);
  messageEl.textContent = "合わせ失敗…タイミングを見極めて！";
  tapButton.classList.add("flash-fail");
  comboEl.textContent = String(state.combo);
  bestEl.textContent = String(state.best);
  randomizeZone();
  resetButtonFlash();
}

function setReeling(value) {
  if (state.phase !== GAME_PHASE.BATTLE) {
    return;
  }
  state.isReeling = value;
  tapButton.classList.toggle("reeling", value);
}

window.addEventListener("resize", () => {
  state.cursorX = Math.min(state.cursorX, meterWidth() - cursorEl.clientWidth);
});

tapButton.addEventListener("click", () => {
  if (state.phase === GAME_PHASE.AIM) {
    tryHook();
  }
});

tapButton.addEventListener("pointerdown", () => setReeling(true));
tapButton.addEventListener("pointerup", () => setReeling(false));
tapButton.addEventListener("pointerleave", () => setReeling(false));
tapButton.addEventListener("pointercancel", () => setReeling(false));

const reelKeys = new Set(["Space", "Enter"]);
document.addEventListener("keydown", (event) => {
  if (!reelKeys.has(event.code)) {
    return;
  }
  event.preventDefault();
  if (event.repeat && state.phase === GAME_PHASE.AIM) {
    return;
  }
  if (state.phase === GAME_PHASE.AIM) {
    tryHook();
  } else {
    setReeling(true);
  }
});

document.addEventListener("keyup", (event) => {
  if (reelKeys.has(event.code)) {
    event.preventDefault();
    setReeling(false);
  }
});

randomizeZone();
setTensionUI();
requestAnimationFrame((t) => {
  state.lastFrameTime = t;
  gameLoop(t);
});
