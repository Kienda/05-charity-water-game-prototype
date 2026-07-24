"use strict";

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 900;
let INTERACTION_DISTANCE = 125;

const DIFFICULTY_SETTINGS = {
  easy: {
    label: "Easy",
    energyDrainRate: 0.28,
    energyRegenRate: 1.6,
    interactionDistance: 150,
    missionTimeLimit: null,
    missionPoints: [10, 20, 25, 35, 60, 100],
    discoveryBonus: 5,
    targetScore: 200
  },
  normal: {
    label: "Normal",
    energyDrainRate: 0.42,
    energyRegenRate: 1.2,
    interactionDistance: 125,
    missionTimeLimit: null,
    missionPoints: [10, 20, 25, 35, 60, 100],
    discoveryBonus: 5,
    targetScore: 260
  },
  hard: {
    label: "Hard",
    energyDrainRate: 0.62,
    energyRegenRate: 0.85,
    interactionDistance: 95,
    missionTimeLimit: 40,
    missionPoints: [15, 25, 30, 45, 75, 120],
    discoveryBonus: 8,
    targetScore: 330
  }
};

const missionData = [
  {
    title: "Find the clean spring",
    description: "Follow the old riverbed east and look for signs of clean groundwater.",
    target: "spring",
    action: "discover",
    prompt: "Explore the clean spring",
    fact: "Clean water improves health, education, and economic opportunity.",
    feedback: "Clean spring discovered"
  },
  {
    title: "Collect clean water",
    description: "Fill your water container at the spring so you can carry hope back to Kumbala.",
    target: "spring",
    action: "interact",
    prompt: "Collect clean water",
    fact: "A safe water source can give families more time for school and work.",
    feedback: "Water collected"
  },
  {
    title: "Find the repair kit",
    description: "Search near the old trail sign for the tools Amina left behind.",
    target: "repair-kit",
    action: "interact",
    prompt: "Pick up the repair kit",
    fact: "Water systems need local maintenance to keep serving communities.",
    feedback: "Repair kit found"
  },
  {
    title: "Repair the broken pump",
    description: "Return to the village pump and use the repair kit to restore its mechanism.",
    target: "pump",
    action: "interact",
    prompt: "Repair the hand pump",
    fact: "Reliable water access supports healthier homes, schools, and clinics.",
    feedback: "Pump repaired"
  },
  {
    title: "Deliver water to Kumbala",
    description: "Pour your clean spring water into the village tank to prime the repaired pump.",
    target: "water-tank",
    action: "interact",
    prompt: "Deliver clean water",
    fact: "Nearby water can reduce the time children spend walking to collect it.",
    feedback: "Clean water delivered"
  },
  {
    title: "Celebrate with the village",
    description: "Meet Amina by the pump. The village is ready to welcome the water home.",
    target: "volunteer",
    action: "interact",
    prompt: "Celebrate with Amina",
    fact: "Lasting change grows when communities lead and care for their water systems.",
    feedback: "Village saved"
  }
];

const objectPositions = {
  spring: { x: 1320, y: 680 },
  "repair-kit": { x: 730, y: 390 },
  pump: { x: 1035, y: 525 },
  "water-tank": { x: 1190, y: 430 },
  sign: { x: 460, y: 495 },
  volunteer: { x: 930, y: 430 },
  villager: { x: 1160, y: 570 },
  wildlife: { x: 560, y: 300 }
};

const missionTips = [
  "The spring is in the southeast, beyond the dry riverbed.",
  "Stand close to the spring and press E, Enter, Space, or Interact.",
  "Look northwest of the village, near the old trail sign.",
  "The broken pump stands between Amina and the water tank.",
  "The village tank is northeast of the repaired hand pump.",
  "Amina is waiting beside the village pump."
];

function clamp(number, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, number));
}

class Mission {
  constructor(data, index) {
    this.index = index;
    this.title = data.title;
    this.description = data.description;
    this.target = data.target;
    this.action = data.action;
    this.prompt = data.prompt;
    this.fact = data.fact;
    this.feedback = data.feedback;
    this.status = index === 0 ? "current" : "locked";
  }
}

class Player {
  constructor(element) {
    this.element = element;
    this.x = 285;
    this.y = 565;
    this.speed = 220;
    this.health = 100;
    this.energy = 100;
    this.hasWater = false;
    this.hasRepairKit = false;
    this.isMoving = false;
    this.energyDrainRate = 0.42;
    this.energyRegenRate = 1.2;
  }

  reset() {
    this.x = 285;
    this.y = 565;
    this.health = 100;
    this.energy = 100;
    this.hasWater = false;
    this.hasRepairKit = false;
    this.render();
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.render();
  }

  update(deltaSeconds, pressedKeys) {
    let horizontal = 0;
    let vertical = 0;

    if (pressedKeys.has("arrowleft") || pressedKeys.has("a") || pressedKeys.has("left")) horizontal -= 1;
    if (pressedKeys.has("arrowright") || pressedKeys.has("d") || pressedKeys.has("right")) horizontal += 1;
    if (pressedKeys.has("arrowup") || pressedKeys.has("w") || pressedKeys.has("up")) vertical -= 1;
    if (pressedKeys.has("arrowdown") || pressedKeys.has("s") || pressedKeys.has("down")) vertical += 1;

    const isTryingToMove = horizontal !== 0 || vertical !== 0;
    this.isMoving = isTryingToMove && this.energy > 0;

    if (this.isMoving) {
      // Normalizing diagonal movement prevents it from being faster than horizontal movement.
      const length = Math.hypot(horizontal, vertical);
      horizontal /= length;
      vertical /= length;
      this.x = clamp(this.x + horizontal * this.speed * deltaSeconds, 45, WORLD_WIDTH - 45);
      this.y = clamp(this.y + vertical * this.speed * deltaSeconds, 115, WORLD_HEIGHT - 35);
      this.energy = clamp(this.energy - deltaSeconds * this.energyDrainRate, 0, 100);
      if (horizontal < 0) this.element.classList.add("is-facing-left");
      if (horizontal > 0) this.element.classList.remove("is-facing-left");
    } else {
      this.energy = clamp(this.energy + deltaSeconds * this.energyRegenRate, 0, 100);
    }

    this.element.classList.toggle("is-moving", this.isMoving);
    this.render();
  }

  render() {
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
  }
}

class Village {
  constructor() {
    this.reset();
  }

  reset() {
    this.hope = 18;
    this.peopleHelped = 0;
    this.waterDelivered = 0;
    this.health = "Critical";
    this.childrenInSchool = 0;
    this.pumpStatus = "Broken";
    this.isRestored = false;
  }

  applyMissionImpact(completedMissionIndex) {
    const hopeLevels = [28, 42, 55, 72, 92, 100];
    this.hope = hopeLevels[completedMissionIndex];

    if (completedMissionIndex >= 1) this.health = "Fragile";
    if (completedMissionIndex >= 3) this.pumpStatus = "Repaired";
    if (completedMissionIndex >= 4) {
      this.peopleHelped = 186;
      this.waterDelivered = 20;
      this.health = "Recovering";
      this.childrenInSchool = 42;
    }
    if (completedMissionIndex >= 5) {
      this.health = "Thriving";
      this.pumpStatus = "Flowing";
      this.isRestored = true;
    }
  }
}

class AudioManager {
  constructor() {
    this.context = null;
    this.isMuted = false;
    this.ambientGain = null;
    this.lastFootstep = 0;
    this.birdTimer = null;
  }

  ensureContext() {
    if (this.context) {
      if (this.context.state === "suspended") this.context.resume();
      return true;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    this.context = new AudioContext();
    return true;
  }

  startAmbience() {
    if (this.isMuted || !this.ensureContext() || this.ambientGain) return;

    const buffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * 0.12;

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    this.ambientGain = this.context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = 420;
    this.ambientGain.gain.value = 0.045;
    source.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.context.destination);
    source.start();

    this.birdTimer = setInterval(() => {
      if (!this.isMuted && Math.random() > 0.35) this.tone(1200 + Math.random() * 450, 0.08, "sine", 0.018);
    }, 4200);
  }

  tone(frequency, duration = 0.1, type = "sine", volume = 0.035, delay = 0) {
    if (this.isMuted || !this.ensureContext()) return;
    const startAt = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration);
  }

  footstep() {
    const now = performance.now();
    if (now - this.lastFootstep < 330) return;
    this.lastFootstep = now;
    this.tone(95, 0.055, "triangle", 0.018);
  }

  water() {
    [520, 680, 820].forEach((frequency, index) => this.tone(frequency, 0.18, "sine", 0.03, index * 0.07));
  }

  repair() {
    this.tone(155, 0.09, "square", 0.025);
    this.tone(235, 0.12, "square", 0.025, 0.12);
    this.tone(420, 0.2, "triangle", 0.035, 0.27);
  }

  celebration() {
    [392, 523, 659, 784].forEach((frequency, index) => this.tone(frequency, 0.45, "triangle", 0.04, index * 0.14));
  }

  setMuted(isMuted) {
    this.isMuted = isMuted;
    if (this.ambientGain && this.context) {
      this.ambientGain.gain.setTargetAtTime(isMuted ? 0 : 0.045, this.context.currentTime, 0.05);
    }
  }
}

class UIManager {
  constructor() {
    this.screens = {
      intro: document.querySelector("#intro-screen"),
      game: document.querySelector("#game-screen"),
      win: document.querySelector("#win-screen"),
      encouragement: document.querySelector("#encouragement-screen")
    };
    this.world = document.querySelector("#game-world");
    this.viewport = document.querySelector("#world-viewport");
    this.playerElement = document.querySelector("#player");
    this.prompt = document.querySelector("#interaction-prompt");
    this.interactionText = document.querySelector("#interaction-text");
    this.factToast = document.querySelector("#fact-toast");
    this.factText = document.querySelector("#fact-text");
    this.feedbackToast = document.querySelector("#feedback-toast");
    this.feedbackTitle = document.querySelector("#feedback-title");
    this.feedbackText = document.querySelector("#feedback-text");
    this.announcements = document.querySelector("#game-announcements");
    this.factTimeout = null;
    this.feedbackTimeout = null;
  }

  showScreen(screenName) {
    Object.entries(this.screens).forEach(([name, screen]) => {
      screen.hidden = name !== screenName;
      screen.classList.toggle("is-active", name === screenName);
    });
  }

  updatePlayer(player) {
    const roundedEnergy = Math.round(player.energy);
    document.querySelector("#health-value").textContent = String(Math.round(player.health));
    document.querySelector("#energy-value").textContent = String(roundedEnergy);
    document.querySelector("#health-fill").style.width = `${player.health}%`;
    document.querySelector("#energy-fill").style.width = `${roundedEnergy}%`;
    document.querySelector("#hud-water").textContent = player.hasWater ? "20 L" : "0 L";
    document.querySelector("#water-slot").classList.toggle("is-filled", player.hasWater);
    document.querySelector("#kit-slot").classList.toggle("is-filled", player.hasRepairKit);
  }

  updateVillage(village, impactScore) {
    const state = village.hope >= 80 ? "Thriving" : village.hope >= 40 ? "Recovering" : "Dry";
    const hopeTrack = document.querySelector("#hope-track");
    document.querySelector("#hope-value").textContent = String(village.hope);
    document.querySelector("#hope-fill").style.width = `${village.hope}%`;
    hopeTrack.className = `hope-track ${state.toLowerCase()}`;
    hopeTrack.setAttribute("aria-valuenow", String(village.hope));
    hopeTrack.setAttribute("aria-valuetext", `${village.hope} percent, ${state}`);
    document.querySelector("#people-helped").textContent = `${village.peopleHelped} / 186`;
    document.querySelector("#water-delivered").textContent = `${village.waterDelivered} L`;
    document.querySelector("#village-health").textContent = village.health;
    document.querySelector("#children-school").textContent = `${village.childrenInSchool} / 42`;
    document.querySelector("#pump-status").textContent = village.pumpStatus;
    document.querySelector("#hud-helped").textContent = String(village.peopleHelped);
    document.querySelector("#hud-score").textContent = String(impactScore);

    this.world.classList.toggle("is-dry", village.hope < 40);
    this.world.classList.toggle("is-recovering", village.hope >= 40 && !village.isRestored);
    this.world.classList.toggle("is-restored", village.isRestored);
    document.querySelector("[data-object='pump']").classList.toggle("is-repaired", village.pumpStatus !== "Broken");
    document.querySelector("[data-object='pump'] .object-name").textContent = village.pumpStatus === "Broken" ? "Broken pump" : "Working pump";
  }

  updateMission(missions, currentIndex) {
    const current = missions[currentIndex];
    if (current) {
      document.querySelector("#mission-number").textContent = String(currentIndex + 1).padStart(2, "0");
      document.querySelector("#mission-title").textContent = current.title;
      document.querySelector("#mission-description").textContent = current.description;
    }
    const completedCount = missions.filter((mission) => mission.status === "complete").length;
    document.querySelector("#mission-progress-label").textContent = `Mission ${Math.min(currentIndex + 1, missions.length)} of ${missions.length}`;
    document.querySelector("#journey-fill").style.width = `${(completedCount / missions.length) * 100}%`;
    document.querySelector(".journey-track").setAttribute("aria-valuenow", String(completedCount));

    const list = document.querySelector("#mission-list");
    list.replaceChildren();
    missions.forEach((mission, index) => {
      const item = document.createElement("li");
      const marker = document.createElement("span");
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      const status = document.createElement("small");
      item.className = mission.status === "complete" ? "is-complete" : mission.status === "current" ? "is-current" : "";
      marker.textContent = mission.status === "complete" ? "✓" : String(index + 1);
      title.textContent = mission.title;
      status.textContent = mission.status === "complete" ? "Complete" : mission.status === "current" ? "Current mission" : "Locked";
      copy.append(title, status);
      item.append(marker, copy);
      list.append(item);
    });
  }

  updateCompass(player, mission) {
    if (!mission) return;
    const target = objectPositions[mission.target];
    const deltaX = target.x - player.x;
    const deltaY = target.y - player.y;
    const distance = Math.hypot(deltaX, deltaY);
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI + 90;
    document.querySelector("#compass-arrow").style.transform = `rotate(${angle}deg)`;
    document.querySelector("#compass-distance").textContent = distance < INTERACTION_DISTANCE ? "You’re here — interact!" : distance < 280 ? "Very close" : distance < 560 ? "Getting warmer" : "Follow the arrow";
  }

  updateTimer(remaining, total) {
    const meter = document.querySelector("#timer-meter");
    if (!total) {
      meter.hidden = true;
      return;
    }
    meter.hidden = false;
    const percentage = clamp((remaining / total) * 100, 0, 100);
    document.querySelector("#timer-fill").style.width = `${percentage}%`;
    document.querySelector("#timer-value").textContent = String(Math.max(0, Math.ceil(remaining)));
    meter.classList.toggle("is-low", remaining <= 10);
  }

  setDifficultyLabel(label) {
    document.querySelector("#hud-difficulty").textContent = label;
  }

  addBadge(label) {
    const row = document.querySelector("#badge-row");
    row.querySelector(".empty-badges")?.remove();
    const badge = document.createElement("span");
    badge.className = "explorer-badge";
    badge.textContent = `★ ${label}`;
    row.append(badge);
  }

  showPrompt(message) {
    this.interactionText.textContent = message;
    this.prompt.hidden = false;
  }

  hidePrompt() {
    this.prompt.hidden = true;
  }

  showFact(message) {
    clearTimeout(this.factTimeout);
    this.factText.textContent = message;
    this.factToast.hidden = false;
    this.factTimeout = setTimeout(() => { this.factToast.hidden = true; }, 4800);
  }

  showFeedback(title, message) {
    clearTimeout(this.feedbackTimeout);
    this.feedbackTitle.textContent = title;
    this.feedbackText.textContent = message;
    this.feedbackToast.hidden = false;
    this.announcements.textContent = `${title}. ${message}`;
    this.feedbackTimeout = setTimeout(() => { this.feedbackToast.hidden = true; }, 3000);
  }

  spawnPointsPopup(x, y, points) {
    const popup = document.createElement("span");
    popup.className = "points-popup";
    popup.textContent = `+${points} Impact`;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    this.world.append(popup);
    popup.addEventListener("animationend", () => popup.remove());
  }

  updateCamera(player) {
    const viewportWidth = this.viewport.clientWidth;
    const viewportHeight = this.viewport.clientHeight;
    const desiredX = viewportWidth / 2 - player.x;
    const desiredY = viewportHeight / 2 - player.y;
    const minimumX = Math.min(0, viewportWidth - WORLD_WIDTH);
    const minimumY = Math.min(0, viewportHeight - WORLD_HEIGHT);
    const cameraX = clamp(desiredX, minimumX, 0);
    const cameraY = clamp(desiredY, minimumY, 0);
    this.world.style.transform = `translate3d(${cameraX}px, ${cameraY}px, 0)`;
  }
}

class ObjectManager {
  constructor(game) {
    this.game = game;
    this.world = document.querySelector("#game-world");
    this.templates = new Map();
    this.elements = new Map();
    document.querySelectorAll("[data-object]").forEach((element) => {
      const id = element.dataset.object;
      this.templates.set(id, element.cloneNode(true));
      this.registerElement(id, element);
    });
    this.nearestObjectId = null;
  }

  registerElement(id, element) {
    element.addEventListener("click", () => this.game.interactWith(id));
    this.elements.set(id, element);
  }

  removeObject(id) {
    const element = this.elements.get(id);
    if (!element) return;
    element.remove();
    this.elements.delete(id);
    if (this.nearestObjectId === id) this.nearestObjectId = null;
  }

  restoreObject(id) {
    if (this.elements.has(id)) return;
    const template = this.templates.get(id);
    if (!template) return;
    const clone = template.cloneNode(true);
    this.world.append(clone);
    this.registerElement(id, clone);
  }

  updateProximity(player) {
    let closestId = null;
    let closestDistance = Infinity;

    this.elements.forEach((element, id) => {
      const position = objectPositions[id];
      const distance = Math.hypot(player.x - position.x, player.y - position.y);
      const isNear = distance <= INTERACTION_DISTANCE;
      element.classList.toggle("is-near", isNear);
      if (isNear && distance < closestDistance) {
        closestDistance = distance;
        closestId = id;
      }
    });

    this.nearestObjectId = closestId;
    this.game.updateInteractionPrompt(closestId);
    return closestId;
  }

  isNear(id) {
    return this.nearestObjectId === id;
  }

  reset() {
    this.nearestObjectId = null;
    this.templates.forEach((template, id) => this.restoreObject(id));
    this.elements.forEach((element) => element.classList.remove("is-near", "is-complete"));
  }
}

class Game {
  constructor() {
    this.ui = new UIManager();
    this.player = new Player(this.ui.playerElement);
    this.village = new Village();
    this.audio = new AudioManager();
    this.missions = missionData.map((data, index) => new Mission(data, index));
    this.objects = new ObjectManager(this);
    this.currentMissionIndex = 0;
    this.impactScore = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.pressedKeys = new Set();
    this.lastFrameTime = 0;
    this.lastEnergyDisplay = 100;
    this.tipIndex = 0;
    this.rafId = null;
    this.outcomeTimeout = null;
    this.discoveries = new Set();
    this.difficultyKey = "normal";
    this.difficulty = DIFFICULTY_SETTINGS.normal;
    this.missionTimeRemaining = null;
    this.bindControls();
    this.resetJourney();
  }

  setDifficulty(key) {
    if (!DIFFICULTY_SETTINGS[key] || this.isRunning) return;
    this.difficultyKey = key;
    this.difficulty = DIFFICULTY_SETTINGS[key];
    document.querySelectorAll(".difficulty-option").forEach((button) => {
      const isSelected = button.dataset.difficulty === key;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  }

  applyDifficulty() {
    this.player.energyDrainRate = this.difficulty.energyDrainRate;
    this.player.energyRegenRate = this.difficulty.energyRegenRate;
    INTERACTION_DISTANCE = this.difficulty.interactionDistance;
    this.ui.setDifficultyLabel(this.difficulty.label);
    this.resetMissionTimer();
  }

  resetMissionTimer() {
    this.missionTimeRemaining = this.difficulty.missionTimeLimit;
    this.ui.updateTimer(this.missionTimeRemaining, this.difficulty.missionTimeLimit);
  }

  bindControls() {
    const movementKeys = new Set(["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"]);

    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (!this.isRunning || this.isPaused) return;

      if (movementKeys.has(key)) {
        event.preventDefault();
        this.pressedKeys.add(key);
      }

      if (key === "e") {
        event.preventDefault();
        this.interact();
      }

      if ((key === "enter" || key === " ") && document.activeElement === this.ui.viewport) {
        event.preventDefault();
        this.interact();
      }
    });

    window.addEventListener("keyup", (event) => this.pressedKeys.delete(event.key.toLowerCase()));
    window.addEventListener("blur", () => this.pressedKeys.clear());

    document.querySelectorAll(".move-button").forEach((button) => {
      const direction = button.dataset.direction;
      const press = (event) => {
        event.preventDefault();
        this.pressedKeys.add(direction);
        button.classList.add("is-pressed");
      };
      const release = () => {
        this.pressedKeys.delete(direction);
        button.classList.remove("is-pressed");
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    });

    document.querySelector("#mobile-interact-button").addEventListener("click", () => this.interact());
    document.querySelector("#begin-button").addEventListener("click", () => this.start(true));
    document.querySelector("#how-start-button").addEventListener("click", () => this.start(true));
    document.querySelector("#open-how-button").addEventListener("click", () => document.querySelector("#how-dialog").showModal());
    document.querySelector("#close-how-button").addEventListener("click", () => document.querySelector("#how-dialog").close());
    document.querySelector("#pause-button").addEventListener("click", () => this.pause());
    document.querySelector("#resume-button").addEventListener("click", () => this.resume());
    document.querySelector("#pause-restart-button").addEventListener("click", () => this.restartCurrentMission());
    document.querySelector("#pause-menu-button").addEventListener("click", () => this.showMainMenu());
    document.querySelector("#mission-log-button").addEventListener("click", () => this.toggleMissionLog());
    document.querySelector("#close-log-button").addEventListener("click", () => this.toggleMissionLog(false));
    document.querySelector("#play-again-button").addEventListener("click", () => this.start(true));
    document.querySelector("#win-menu-button").addEventListener("click", () => this.showMainMenu());
    document.querySelector("#continue-button").addEventListener("click", () => this.continueJourney());
    document.querySelector("#try-again-button").addEventListener("click", () => this.tryAgain());
    document.querySelector("#tips-button").addEventListener("click", () => this.showNextTip());
    document.querySelector("#restart-button").addEventListener("click", () => this.start(true));
    document.querySelectorAll("[data-sound-toggle]").forEach((button) => button.addEventListener("click", () => this.toggleSound()));
    document.querySelectorAll(".difficulty-option").forEach((button) => button.addEventListener("click", () => this.setDifficulty(button.dataset.difficulty)));

    document.querySelector("#pause-dialog").addEventListener("cancel", (event) => {
      event.preventDefault();
      this.resume();
    });
    window.addEventListener("resize", () => this.ui.updateCamera(this.player));
  }

  resetJourney() {
    clearTimeout(this.outcomeTimeout);
    this.outcomeTimeout = null;
    this.isRunning = false;
    this.isPaused = false;
    this.currentMissionIndex = 0;
    this.impactScore = 0;
    this.discoveries.clear();
    this.pressedKeys.clear();
    this.player.reset();
    this.village.reset();
    this.objects.reset();
    this.applyDifficulty();
    this.missions.forEach((mission, index) => { mission.status = index === 0 ? "current" : "locked"; });
    this.ui.updatePlayer(this.player);
    this.ui.updateVillage(this.village, this.impactScore);
    this.ui.updateMission(this.missions, this.currentMissionIndex);
    this.ui.hidePrompt();
    document.querySelector("#celebration").replaceChildren();
    document.querySelector("#badge-row").innerHTML = '<span class="empty-badges">Explore landmarks to earn badges</span>';
  }

  start(shouldReset = false) {
    if (shouldReset) this.resetJourney();
    const howDialog = document.querySelector("#how-dialog");
    if (howDialog.open) howDialog.close();
    this.ui.showScreen("game");
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.audio.startAmbience();
    this.ui.showFeedback("Mission 1", "Find the clean spring and begin Kumbala's journey.");
    this.ui.viewport.focus();
    if (!this.rafId) this.rafId = requestAnimationFrame((time) => this.loop(time));
  }

  loop(currentTime) {
    const deltaSeconds = Math.min((currentTime - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = currentTime;

    if (this.isRunning && !this.isPaused) {
      this.player.update(deltaSeconds, this.pressedKeys);
      this.ui.updateCamera(this.player);
      const nearest = this.objects.updateProximity(this.player);

      if (this.player.isMoving) this.audio.footstep();
      const roundedEnergy = Math.round(this.player.energy);
      if (roundedEnergy !== this.lastEnergyDisplay) {
        this.lastEnergyDisplay = roundedEnergy;
        this.ui.updatePlayer(this.player);
      }

      const mission = this.missions[this.currentMissionIndex];
      this.ui.updateCompass(this.player, mission);
      if (mission && mission.action === "discover" && nearest === mission.target) this.completeMission();
      if (this.player.energy <= 0) this.showEncouragement("energy");

      if (this.difficulty.missionTimeLimit && this.missionTimeRemaining !== null) {
        this.missionTimeRemaining = Math.max(0, this.missionTimeRemaining - deltaSeconds);
        this.ui.updateTimer(this.missionTimeRemaining, this.difficulty.missionTimeLimit);
        if (this.missionTimeRemaining <= 0) this.showEncouragement("time");
      }
    }

    this.rafId = requestAnimationFrame((time) => this.loop(time));
  }

  updateInteractionPrompt(objectId) {
    if (!objectId) {
      this.ui.hidePrompt();
      return;
    }

    const mission = this.missions[this.currentMissionIndex];
    if (mission && objectId === mission.target) {
      this.ui.showPrompt(mission.action === "discover" ? "Explore this place" : mission.prompt);
      return;
    }

    const genericPrompts = {
      spring: "Listen to the spring",
      "repair-kit": "Inspect the tool case",
      pump: this.village.pumpStatus === "Broken" ? "Inspect the broken pump" : "Pump clean water",
      "water-tank": "Inspect the village tank",
      sign: "Read the trail sign",
      volunteer: "Talk with Amina",
      villager: "Talk with a villager",
      wildlife: "Observe the gazelle"
    };
    this.ui.showPrompt(genericPrompts[objectId]);
  }

  interact() {
    if (!this.isRunning || this.isPaused) return;
    const objectId = this.objects.nearestObjectId;
    if (!objectId) {
      this.ui.showFeedback("Nothing nearby", "Move closer to a marked person or object.");
      return;
    }
    this.interactWith(objectId);
  }

  interactWith(objectId) {
    if (!this.isRunning || this.isPaused) return;
    if (!this.objects.isNear(objectId)) {
      this.ui.showFeedback("Walk closer", "Explore the savanna until the interaction marker appears.");
      this.ui.viewport.focus();
      return;
    }

    const mission = this.missions[this.currentMissionIndex];
    if (mission && mission.target === objectId && mission.action === "interact") {
      this.performMissionAction(objectId);
      return;
    }

    const discoveryLabels = { sign: "Trail reader", villager: "Good neighbor", wildlife: "Nature watcher" };
    if (discoveryLabels[objectId] && !this.discoveries.has(objectId)) {
      this.discoveries.add(objectId);
      const bonus = this.difficulty.discoveryBonus;
      this.impactScore += bonus;
      this.ui.addBadge(discoveryLabels[objectId]);
      this.ui.updateVillage(this.village, this.impactScore);
      this.audio.tone(740, 0.12, "triangle", 0.035);
      const position = objectPositions[objectId];
      this.ui.spawnPointsPopup(position.x, position.y, bonus);
    }

    const messages = {
      spring: ["Clean spring", "Cool groundwater rises naturally between the rocks."],
      "repair-kit": ["Tool case", "A locally maintained pump can serve a community more reliably."],
      pump: ["Village pump", this.village.pumpStatus === "Broken" ? "Its handle assembly needs the repair kit." : "The repaired mechanism is ready to move water."],
      "water-tank": ["Village tank", "It stores clean water close to Kumbala's homes."],
      sign: ["Old trail sign", "Spring → southeast · Village → east"],
      volunteer: ["Amina says", "Kumbala has the knowledge to care for its water. We just need your help today."],
      villager: ["A villager says", this.village.isRestored ? "Listen—the water is flowing again!" : "We are holding on. Please keep going."],
      wildlife: ["Startled gazelle", "It catches your scent and bounds away into the tall grass."]
    };
    this.ui.showFeedback(...messages[objectId]);

    if (objectId === "wildlife") this.objects.removeObject("wildlife");
  }

  performMissionAction(objectId) {
    if (objectId === "spring") {
      this.player.hasWater = true;
      this.audio.water();
    } else if (objectId === "repair-kit") {
      this.player.hasRepairKit = true;
      this.audio.tone(620, 0.16, "triangle", 0.035);
      this.objects.removeObject("repair-kit");
    } else if (objectId === "pump") {
      if (!this.player.hasRepairKit) {
        this.ui.showFeedback("Tools needed", "Find the repair kit near the old trail sign first.");
        return;
      }
      this.player.hasRepairKit = false;
      this.audio.repair();
    } else if (objectId === "water-tank") {
      if (!this.player.hasWater) {
        this.ui.showFeedback("Container empty", "Return to the clean spring and collect water first.");
        return;
      }
      this.player.hasWater = false;
      this.audio.water();
    } else if (objectId === "volunteer") {
      this.audio.celebration();
    }

    this.ui.updatePlayer(this.player);
    this.completeMission();
  }

  completeMission() {
    const mission = this.missions[this.currentMissionIndex];
    if (!mission || mission.status === "complete") return;

    mission.status = "complete";
    this.village.applyMissionImpact(this.currentMissionIndex);
    const points = this.difficulty.missionPoints[this.currentMissionIndex];
    this.impactScore += points;
    this.ui.updateVillage(this.village, this.impactScore);
    this.ui.showFeedback(mission.feedback, this.currentMissionIndex === 5 ? "Hope has returned to Kumbala." : "Hope increased. A new mission is ready.");
    this.ui.showFact(mission.fact);
    const targetPosition = objectPositions[mission.target];
    if (targetPosition) this.ui.spawnPointsPopup(targetPosition.x, targetPosition.y, points);
    document.querySelector("#journey-fill").style.width = `${((this.currentMissionIndex + 1) / this.missions.length) * 100}%`;
    document.querySelector(".journey-track").setAttribute("aria-valuenow", String(this.currentMissionIndex + 1));
    document.querySelector("#journey-fill").animate(
      [{ transform: "scaleY(1)" }, { transform: "scaleY(2.2)" }, { transform: "scaleY(1)" }],
      { duration: 480 }
    );

    if (this.currentMissionIndex === this.missions.length - 1) {
      this.isRunning = false;
      this.pressedKeys.clear();
      clearTimeout(this.outcomeTimeout);
      this.outcomeTimeout = setTimeout(() => this.showVictory(), 2300);
      return;
    }

    this.currentMissionIndex += 1;
    this.missions[this.currentMissionIndex].status = "current";
    this.ui.updateMission(this.missions, this.currentMissionIndex);
    this.resetMissionTimer();
  }

  restartCurrentMission() {
    const checkpoints = [
      { x: 285, y: 565, water: false, kit: false },
      { x: 1215, y: 660, water: false, kit: false },
      { x: 1215, y: 660, water: true, kit: false },
      { x: 780, y: 430, water: true, kit: true },
      { x: 990, y: 565, water: true, kit: false },
      { x: 1160, y: 475, water: false, kit: false }
    ];
    const checkpoint = checkpoints[this.currentMissionIndex];
    this.player.setPosition(checkpoint.x, checkpoint.y);
    this.player.hasWater = checkpoint.water;
    this.player.hasRepairKit = checkpoint.kit;
    this.player.energy = 100;
    this.ui.updatePlayer(this.player);
    document.querySelector("#pause-dialog").close();
    this.isPaused = false;
    this.isRunning = true;
    this.resetMissionTimer();
    this.ui.showFeedback("Mission restarted", this.missions[this.currentMissionIndex].title);
    this.ui.viewport.focus();
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this.pressedKeys.clear();
    document.querySelector("#pause-dialog").showModal();
  }

  resume() {
    document.querySelector("#pause-dialog").close();
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.ui.viewport.focus();
  }

  toggleMissionLog(forceState) {
    const drawer = document.querySelector("#mission-drawer");
    const button = document.querySelector("#mission-log-button");
    const shouldOpen = typeof forceState === "boolean" ? forceState : drawer.hidden;
    drawer.hidden = !shouldOpen;
    button.setAttribute("aria-expanded", String(shouldOpen));
    if (shouldOpen) document.querySelector("#close-log-button").focus();
    else this.ui.viewport.focus();
  }

  toggleSound() {
    this.audio.setMuted(!this.audio.isMuted);
    document.querySelectorAll("[data-sound-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", String(this.audio.isMuted));
      button.setAttribute("aria-label", this.audio.isMuted ? "Turn sound on" : "Mute sound");
      button.textContent = this.audio.isMuted ? "×" : "♪";
    });
    if (!this.audio.isMuted) {
      this.audio.startAmbience();
      this.audio.tone(520, 0.08);
    }
  }

  showEncouragement(reason = "energy") {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.pressedKeys.clear();
    const baseTip = missionTips[this.currentMissionIndex];
    document.querySelector("#mission-tip").textContent = reason === "time" ? `The mission clock ran out. ${baseTip}` : baseTip;
    this.ui.showScreen("encouragement");
    document.querySelector("#try-again-button").focus();
  }

  tryAgain() {
    this.player.energy = 100;
    this.ui.updatePlayer(this.player);
    this.ui.showScreen("game");
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.resetMissionTimer();
    this.ui.showFeedback("Ready again", "Kumbala still believes in you.");
    this.ui.viewport.focus();
  }

  showNextTip() {
    this.tipIndex = (this.tipIndex + 1) % missionTips.length;
    document.querySelector("#mission-tip").textContent = missionTips[this.tipIndex];
  }

  showVictory() {
    this.isRunning = false;
    this.pressedKeys.clear();
    this.ui.showScreen("win");
    const goalReached = this.impactScore >= this.difficulty.targetScore;
    const summary = document.querySelector("#win-score-summary");
    summary.textContent = goalReached
      ? `Impact score ${this.impactScore} / ${this.difficulty.targetScore} goal — Village Champion on ${this.difficulty.label}!`
      : `Impact score ${this.impactScore} / ${this.difficulty.targetScore} goal for ${this.difficulty.label}.`;
    summary.classList.toggle("is-champion", goalReached);
    this.createCelebration();
    document.querySelector("#continue-button").focus();
  }

  createCelebration() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const container = document.querySelector("#celebration");
    const colors = ["#ffc907", "#2e7fab", "#4c7a3b", "#ffffff"];
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 70; index += 1) {
      const piece = document.createElement("i");
      piece.className = "celebration-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.backgroundColor = colors[index % colors.length];
      piece.style.animationDelay = `${Math.random() * 1.2}s`;
      fragment.append(piece);
    }
    container.replaceChildren(fragment);
    setTimeout(() => container.replaceChildren(), 4500);
  }

  continueJourney() {
    this.showMainMenu();
    document.querySelector(".intro-story").textContent = "Kumbala is thriving. More villages may join the journey in a future chapter. For now, you can replay the mission or learn more about clean water.";
    document.querySelector("#begin-button").textContent = "Replay Kumbala →";
  }

  showMainMenu() {
    clearTimeout(this.outcomeTimeout);
    this.outcomeTimeout = null;
    const pauseDialog = document.querySelector("#pause-dialog");
    if (pauseDialog.open) pauseDialog.close();
    this.isRunning = false;
    this.isPaused = false;
    this.pressedKeys.clear();
    this.ui.showScreen("intro");
    document.querySelector("#begin-button").focus();
  }
}

const game = new Game();
