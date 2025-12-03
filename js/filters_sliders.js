import { CHART_COLORS, CONFIG } from "./config.js";

const byId = (id) => document.getElementById(id);

export function createRangeController(config) {
  const minRange = byId(config.rangeMinId);
  const maxRange = byId(config.rangeMaxId);
  const minInput = byId(config.minInputId);
  const maxInput = byId(config.maxInputId);
  const track = byId(config.trackId);
  const gradientColor = config.gradientColor || CHART_COLORS.primary;

  const clampValue = (value) => {
    const { minFloor, maxCap } = config.getBounds();
    const safeVal = Number.isFinite(value) ? value : minFloor;
    return Math.max(minFloor, Math.min(maxCap, safeVal));
  };

  const clampPair = (min, max) => {
    const { minFloor, maxCap } = config.getBounds();
    const safeMin = Number.isFinite(min)
      ? Math.max(minFloor, Math.min(min, maxCap))
      : minFloor;
    const safeMax = Number.isFinite(max)
      ? Math.max(safeMin, Math.min(maxCap, max))
      : maxCap;
    return [safeMin, safeMax];
  };

  const setFocus = (which) => {
    if (!minRange || !maxRange) return;
    if (which === "min") {
      minRange.style.zIndex = CONFIG.Z_INDEX_SLIDER_FOCUS;
      maxRange.style.zIndex = CONFIG.Z_INDEX_SLIDER_INACTIVE;
    } else {
      maxRange.style.zIndex = CONFIG.Z_INDEX_SLIDER_FOCUS;
      minRange.style.zIndex = CONFIG.Z_INDEX_SLIDER_INACTIVE;
    }
  };

  const updateUI = (minVal, maxVal) => {
    if (!minRange || !maxRange) return;
    const [min, max] = clampPair(
      typeof minVal === "number" ? minVal : parseFloat(minRange.value),
      typeof maxVal === "number" ? maxVal : parseFloat(maxRange.value),
    );
    if (minInput) minInput.value = config.formatInput(min, false);
    if (maxInput) maxInput.value = config.formatInput(max, true);
    const { minFloor, maxCap } = config.getBounds();
    const rangeSpan = Math.max(1, maxCap - minFloor);
    const pctMin = ((min - minFloor) / rangeSpan) * 100;
    const pctMax = ((max - minFloor) / rangeSpan) * 100;
    if (track) {
      track.style.background = `linear-gradient(90deg, #e5e7eb ${pctMin}%, ${gradientColor} ${pctMin}%, ${gradientColor} ${pctMax}%, #e5e7eb ${pctMax}%)`;
    }
  };

  const applyBounds = (nextBounds) => {
    const current = config.getBounds();
    const merged = { ...current, ...nextBounds };
    config.setBounds?.(merged);
    if (minRange) {
      minRange.min = merged.minFloor;
      minRange.max = merged.maxCap;
      if (config.step) minRange.step = config.step;
    }
    if (maxRange) {
      maxRange.min = merged.minFloor;
      maxRange.max = merged.maxCap;
      if (config.step) maxRange.step = config.step;
    }
    updateUI();
  };

  const setDefaults = (minVal, maxVal) => {
    if (!minRange || !maxRange) return;
    const [safeMin, safeMax] = clampPair(minVal, maxVal);
    minRange.value = safeMin;
    maxRange.value = safeMax;
    updateUI(safeMin, safeMax);
  };

  const handleRange = (which) => {
    if (!minRange || !maxRange) return;
    let [min, max] = clampPair(
      parseFloat(minRange.value),
      parseFloat(maxRange.value),
    );
    if (which === "min" && min > max) min = max;
    if (which === "max" && max < min) max = min;
    minRange.value = min;
    maxRange.value = max;
    setFocus(which);
    updateUI(min, max);
    config.onChange?.();
  };

  const commitText = (which) => {
    if (!minRange || !maxRange) return;
    const raw = which === "min" ? minInput?.value : maxInput?.value;
    let value = clampValue(config.parseInput(raw));
    const [currentMin, currentMax] = clampPair(
      parseFloat(minRange.value),
      parseFloat(maxRange.value),
    );
    if (which === "min" && value > currentMax) value = currentMax;
    if (which === "max" && value < currentMin) value = currentMin;
    if (which === "min") {
      minRange.value = value;
    } else {
      maxRange.value = value;
    }
    setFocus(which);
    updateUI();
    config.onChange?.();
  };

  const handleKey = (event, which) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitText(which);
    } else if (event.key === "Escape") {
      updateUI();
      setFocus(which);
    }
  };

  const getValues = () => {
    const [min, max] = clampPair(
      parseFloat(minRange?.value),
      parseFloat(maxRange?.value),
    );
    return { min, max };
  };

  const bindInputEvents = () => {
    if (minInput) {
      minInput.addEventListener("focus", () => minInput.select());
      minInput.addEventListener("blur", () => commitText("min"));
      minInput.addEventListener("keydown", (event) => handleKey(event, "min"));
    }
    if (maxInput) {
      maxInput.addEventListener("focus", () => maxInput.select());
      maxInput.addEventListener("blur", () => commitText("max"));
      maxInput.addEventListener("keydown", (event) => handleKey(event, "max"));
    }
    if (minRange) minRange.addEventListener("input", () => handleRange("min"));
    if (maxRange) maxRange.addEventListener("input", () => handleRange("max"));
  };

  bindInputEvents();

  return {
    handleRange,
    commitText,
    handleKey,
    setFocus,
    setDefaults,
    applyBounds,
    updateUI,
    getValues,
  };
}

export function createViewSlider(configOrOnChange) {
  const config =
    typeof configOrOnChange === "function"
      ? { onChange: configOrOnChange }
      : configOrOnChange || {};
  return createRangeController({
    minInputId: "viewMinInput",
    maxInputId: "viewMaxInput",
    rangeMinId: "viewRangeMin",
    rangeMaxId: "viewRangeMax",
    trackId: "viewTrack",
    ...config,
  });
}

export function createDurSlider(configOrOnChange) {
  const config =
    typeof configOrOnChange === "function"
      ? { onChange: configOrOnChange }
      : configOrOnChange || {};
  return createRangeController({
    minInputId: "minDur",
    maxInputId: "maxDur",
    rangeMinId: "durRangeMin",
    rangeMaxId: "durRangeMax",
    trackId: "durTrack",
    ...config,
  });
}
