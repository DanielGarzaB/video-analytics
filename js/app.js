import {
  nFmt,
  fmtViews,
  fmtDur,
  fmtDurClock,
  fmtAxisViews,
  fmtAxisDuration,
  fmtDateShort,
  formatDurFilterVal,
  formatViewsShort,
  escapeHtml,
} from "./utils_formatters.js";
import {
  parseNumberInput,
  parseDurationText,
  parseDateInputText,
  parseCSVString,
  fileNameToCreator,
  readFileAsRows,
} from "./utils_parsers.js";
import {
  normalizeRows,
  normalizeDateLocal,
  localKey,
  groupData,
  getSortValue,
} from "./data_normalize.js";
import { createDurSlider, createViewSlider } from "./filters_sliders.js";
import { createToggleController } from "./filters_toggles.js";
import { renderCharts } from "./charts_render.js";
import { timeScatterOpt } from "./charts_config.js";
import { renderTopVideos } from "./ui_topVideos.js";

const appConfig = typeof window !== "undefined" ? window.CONFIG || {} : {};
const appState = typeof window !== "undefined" ? window.State : null;
const CHART_COLORS = appConfig.CHART_COLORS || {};
const VIEW_STEP = appConfig.VIEW_STEP || 100000;
const DUR_STEP = appConfig.DUR_STEP || 1;
const PILL_ACTIVE =
  "bg-white text-primary-darker shadow-sm border border-primary-soft";
const PILL_INACTIVE = "text-primary-dark hover:text-primary-darker";
const MS_PER_DAY = appConfig.MS_PER_DAY || 86400000;
const MAX_RANGE_DAYS = appConfig.MAX_RANGE_DAYS || 31;

const PLATFORM_COLUMNS = [
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" },
  { key: "youtube", label: "YouTube" },
  { key: "instagram", label: "Instagram" },
];

let viewMaxCap = appConfig.VIEW_MAX_CAP || 50_000_000;
let viewMinFloor = appConfig.VIEW_MIN_FLOOR || 0;
let durMaxCap = appConfig.DUR_MAX_CAP || 360;
let durMinFloor = appConfig.DUR_MIN_FLOOR || 0;
const defaultDurationRanges = Array.isArray(appConfig.DURATION_RANGES)
  ? appConfig.DURATION_RANGES
  : [];
const durationRangeStart =
  Number.isFinite(defaultDurationRanges[0]?.min) &&
  defaultDurationRanges[0].min >= 0
    ? defaultDurationRanges[0].min
    : Math.max(0, durMinFloor);
const defaultDurationCuts = defaultDurationRanges
  .map((range) => range.max)
  .filter((value) => Number.isFinite(value));
const durationCutSlots =
  defaultDurationCuts.length > 0 ? defaultDurationCuts.length : 5;
let durationCuts = [];

const formatViewsShortWithCap = (value, isMax) =>
  formatViewsShort(value, isMax, viewMaxCap);

const byId = (id) =>
  typeof document !== "undefined" ? document.getElementById(id) : null;

if (typeof window !== "undefined" && window.Chart) {
  Chart.defaults.animation = false;
  Chart.defaults.transitions.active.animation.duration = 0;
  Chart.defaults.responsiveAnimationDuration = 0;
  Chart.defaults.font.family = "Inter, sans-serif";
  Chart.defaults.scales.linear.ticks.font = {
    size: 12,
    family: "Inter, sans-serif",
  };
  Chart.defaults.scales.linear.ticks.padding = 20;
}

let dropZone;
let fileInput;

let chart1ToggleController;
let chart1MetricToggleController;
let chart1LegendPrimaryLabel;
let chart1LegendPrimarySwatch;
let chart6ToggleController;
let summaryToggleController;
let dayRangeToggleController;
let chart2ToggleController;
let chart3ToggleController;
let durationPresetToggleController;
let chart4V30Button;
let rangeBarsV30Button;
let chart6Note;

let viewSlider;
let durSlider;

let timeGroupUserOverride = false;

const durationPresets = {
  shorts: [20, 30, 40, 60, 90],
  facebook: [],
  youtube: [300, 600, 900, 1200, 1800],
  ultralong: [600, 1200, 1800, 2700, 3600],
};
const durationPresetRequirements = {
  facebook: 4 * 60,
  youtube: 30 * 60,
  ultralong: 60 * 60,
};

const normalizePlatformValue = (value) =>
  String(value || "").trim().toLowerCase();

function fmtVideoCount(value) {
  const val = Math.round(Number(value) || 0);
  const withCommas = nFmt(val);
  if (withCommas.length <= 5) return withCommas;
  if (val >= 1_000_000) {
    const millions = (val / 1_000_000).toFixed(1);
    return (millions.endsWith(".0") ? millions.slice(0, -2) : millions) + "M";
  }
  const thousands = (val / 1_000).toFixed(1);
  const compact = thousands.endsWith(".0") ? thousands.slice(0, -2) : thousands;
  return `${compact}K`;
}

function fmtDateInput(date) {
  return fmtDateShort(date);
}

function normalizeDateInputEl(el) {
  if (!el) return null;
  const parsed = parseDateInputText(el.value);
  if (parsed && !Number.isNaN(parsed.getTime())) {
    el.value = fmtDateInput(parsed);
    return parsed;
  }
  return null;
}

function setDateInputValue(id, date) {
  const visible = byId(id);
  const native = byId(`${id}Native`);
  const parsed = date instanceof Date ? date : new Date(date);
  if (!parsed || Number.isNaN(parsed.getTime())) return null;
  if (visible) visible.value = fmtDateInput(parsed);
  if (native) native.valueAsDate = parsed;
  return parsed;
}

function syncNativeDateFromVisible(id) {
  const visible = byId(id);
  const native = byId(`${id}Native`);
  const parsed = normalizeDateInputEl(visible);
  if (native && parsed) native.valueAsDate = parsed;
  return parsed;
}

function getActivePlatforms() {
  const chips = Array.from(
    document.querySelectorAll("[data-platform-chip].is-active"),
  );
  return chips
    .map((chip) => normalizePlatformValue(chip.dataset.platform))
    .filter(Boolean);
}

function periodKeyForSummary(dateObj, period) {
  const date = normalizeDateLocal(dateObj);
  if (period === "day") return localKey(date);
  if (period === "week") {
    const monday = normalizeDateLocal(date);
    const day = monday.getDay();
    monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1));
    return localKey(monday);
  }
  if (period === "month") return `${date.getFullYear()}-${date.getMonth()}`;
  if (period === "quarter") {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `${date.getFullYear()}-Q${quarter}`;
  }
  return "";
}

function handleDurRange(which) {
  durSlider.handleRange(which);
}

function updateDurSliderUI(minVal, maxVal) {
  durSlider.updateUI(minVal, maxVal);
}

function commitDurText(which) {
  durSlider.commitText(which);
}

function durTextKey(event, which) {
  durSlider.handleKey(event, which);
}

function setDurHandleFocus(which) {
  durSlider.setFocus(which);
}

function setDurCapFromData(maxDurVal) {
  const padded =
    Math.ceil(((maxDurVal || durMaxCap) * 1.1) / DUR_STEP) * DUR_STEP;
  durSlider.applyBounds({ maxCap: Math.max(120, padded || durMaxCap) });
}

function setDurDefaults(minVal = 0, maxVal = 360) {
  durSlider.setDefaults(minVal, maxVal);
}

function handleViewRange(which) {
  viewSlider.handleRange(which);
}

function updateViewSliderUI(minVal, maxVal) {
  viewSlider.updateUI(minVal, maxVal);
}

function commitViewText(which) {
  viewSlider.commitText(which);
}

function viewTextKey(event, which) {
  viewSlider.handleKey(event, which);
}

function setHandleFocus(which) {
  viewSlider.setFocus(which);
}

function setViewCapFromData(maxViewsVal) {
  const padded = Math.ceil(((maxViewsVal || 0) * 1.1) / VIEW_STEP) * VIEW_STEP;
  const cap = Math.max(VIEW_STEP, padded);
  viewSlider.applyBounds({ maxCap: cap });
}

function setViewMinFromData(minViewsVal) {
  const safeFloor = Math.max(
    0,
    Math.floor((minViewsVal || 0) / VIEW_STEP) * VIEW_STEP,
  );
  viewSlider.applyBounds({ minFloor: safeFloor });
  const { min, max } = viewSlider.getValues();
  viewSlider.setDefaults(
    Math.max(safeFloor, min),
    Math.max(Math.max(safeFloor, min), max),
  );
}

function setViewDefaults(minVal = viewMinFloor, maxVal = viewMaxCap) {
  viewSlider.setDefaults(minVal, maxVal);
}

function formatDurationRangeLabel(min, max) {
  const safeMin = Math.max(0, Math.round(Number(min) || 0));
  const safeMax = Number(max);
  const minLabel = fmtDurClock(safeMin);
  if (!Number.isFinite(safeMax) || safeMax === Infinity) {
    return `${minLabel}+`;
  }
  return `${minLabel}-${fmtDurClock(Math.max(0, Math.round(safeMax)))}`;
}

function normalizeDurationCuts(rawCuts = defaultDurationCuts) {
  const normalized = [];
  for (let i = 0; i < durationCutSlots; i += 1) {
    const prev = i === 0 ? durationRangeStart : normalized[i - 1];
    const source =
      rawCuts && i < rawCuts.length ? rawCuts[i] : prev + DUR_STEP;
    let candidate = parseDurationText(source);
    if (!Number.isFinite(candidate)) candidate = prev + DUR_STEP;
    candidate = Math.round(candidate);
    if (candidate <= prev) candidate = prev + DUR_STEP;
    normalized.push(candidate);
  }
  return normalized;
}

const defaultDurationCutsNormalized = normalizeDurationCuts(defaultDurationCuts);

function buildDurationRanges(cuts = durationCuts) {
  const sanitizedCuts = normalizeDurationCuts(cuts && cuts.length ? cuts : durationCuts);
  const edges = [durationRangeStart, ...sanitizedCuts, Infinity];
  const ranges = [];
  for (let i = 0; i < edges.length - 1; i += 1) {
    const min = edges[i];
    const max = edges[i + 1];
    ranges.push({
      min,
      max,
      label: formatDurationRangeLabel(min, max),
    });
  }
  return { ranges, cuts: sanitizedCuts };
}

function applyDurationCuts(nextCuts, options = {}) {
  const { ranges, cuts } = buildDurationRanges(nextCuts);
  durationCuts = cuts;
  if (!durationPresets.facebook.length) {
    durationPresets.facebook = [...defaultDurationCutsNormalized];
  }
  if (appState && typeof appState.setDurationRanges === "function") {
    appState.setDurationRanges(ranges);
  }
  if (!options.skipInputs) renderDurationRangeInputs();
  updateDurationRangePreview();
  if (!options.skipRender) renderCharts();
  return { ranges, cuts };
}

function resetDurationCuts(options = {}) {
  applyDurationCuts(defaultDurationCutsNormalized, options);
}

function updateDurationRangePreview() {
  const preview = byId("durationRangePreview");
  if (!preview) return;
  preview.textContent = "";
}

const scheduleRangeChartRender = (() => {
  let timer = null;
  return (delay = appConfig.DEBOUNCE_DELAY_CHART_RENDER || 320) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      renderCharts();
    }, delay);
  };
})();

function formatDurationInputValue(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  if (total < 60) return `${total}`;
  const minutes = Math.floor(total / 60);
  const sec = total % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const minsRemainder = minutes % 60;
    return `${hours}:${minsRemainder.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${sec.toString().padStart(2, "0")}`;
}

function syncDurationInputValues(cutsArray = durationCuts) {
  const container = byId("durationRangeInputs");
  if (!container) return;
  container.querySelectorAll("[data-duration-cut]").forEach((input) => {
    const idx = Number(input.dataset.durationCut);
    if (Number.isNaN(idx) || cutsArray[idx] === undefined) return;
    input.value = formatDurationInputValue(cutsArray[idx]);
  });
}

function handleDurationCutChange(event) {
  durationPresetToggleController?.setState("", { allowUnknown: true });
  const input = event.target;
  const idx = Number(input.dataset.durationCut);
  if (Number.isNaN(idx)) return;
  const prev = idx === 0 ? durationRangeStart : durationCuts[idx - 1];
  const next = durationCuts[idx + 1] ?? Infinity;
  let value = parseDurationText(input.value);
  if (!Number.isFinite(value)) value = prev + DUR_STEP;
  value = Math.round(value);
  value = Math.max(prev + DUR_STEP, value);
  if (Number.isFinite(next)) value = Math.min(value, next - DUR_STEP);
  const nextCuts = [...durationCuts];
  nextCuts[idx] = value;
  for (let i = idx + 1; i < nextCuts.length; i += 1) {
    const guardPrev = i === 0 ? durationRangeStart : nextCuts[i - 1];
    if (nextCuts[i] <= guardPrev) nextCuts[i] = guardPrev + DUR_STEP;
  }
  const { cuts } = applyDurationCuts(nextCuts, {
    skipInputs: true,
    skipRender: true,
  });
  syncDurationInputValues(cuts);
  scheduleRangeChartRender();
}

function renderDurationRangeInputs() {
  const container = byId("durationRangeInputs");
  if (!container || !Array.isArray(durationCuts)) return;
  const currentRanges =
    appState && typeof appState.getDurationRanges === "function"
      ? appState.getDurationRanges()
      : [];
  const pieces = [];
  durationCuts.forEach((cut, index) => {
    const prev = index === 0 ? durationRangeStart : durationCuts[index - 1];
    const labelText =
      currentRanges[index]?.label || formatDurationRangeLabel(prev, cut);
    const displayValue = formatDurationInputValue(cut);
    pieces.push(`
      <input
        type="text"
        inputmode="numeric"
        class="duration-cut-input text-right text-sm border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
        value="${displayValue}"
        data-duration-cut="${index}"
        aria-label="${labelText}"
        title="${labelText}"
      />
    `);
  });
  container.innerHTML = pieces.join("");
  container.querySelectorAll("[data-duration-cut]").forEach((input) => {
    input.addEventListener("input", handleDurationCutChange);
    input.addEventListener("change", handleDurationCutChange);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") handleDurationCutChange(event);
      if (event.key === "Escape") renderDurationRangeInputs();
    });
  });
}

async function handleFiles(fileList) {
  const files = Array.from(fileList).filter(
    (file) =>
      file &&
      file.name &&
      ((file.type && file.type.includes("csv")) ||
        file.name.toLowerCase().endsWith(".csv")),
  );
  if (!files.length) return;
  try {
    const parsedGroups = await Promise.all(files.map(readFileAsRows));
    const allRows = parsedGroups.flat();
    initData(allRows);
  } catch (error) {
    console.error(error);
    alert("Error al leer los archivos. Revisa la consola para detalles.");
  } finally {
    fileInput.value = "";
  }
}

async function processPasted() {
  const txt = byId("csvText")?.value;
  if (!txt) return;
  try {
    const rows = await parseCSVString(txt, "Pegado");
    initData(rows);
  } catch (error) {
    console.error(error);
    alert(
      "Error al procesar el texto pegado. Revisa la consola para mas detalles.",
    );
  }
}

function initData(data) {
  const normalized = normalizeRows(data);

  // Validate before mutating state or UI to avoid leaving the app in a bad state
  if (normalized.length === 0) {
    alert("No se encontraron datos validos. Verifica el CSV.");
    return;
  }

  appState.setFullData(normalized);
  const fullData = appState.getFullData();

  const creators = [
    ...new Set(fullData.map((dataPoint) => dataPoint.creator)),
  ].sort();
  const select = byId("creatorSelect");
  if (select) {
    select.innerHTML = '<option value="all">Todos los creadores</option>';
    creators.forEach((creator) => {
      const safe = escapeHtml(creator);
      select.innerHTML += `<option value="${safe}">${safe}</option>`;
    });
  }

  const maxViewsVal = Math.max(
    ...fullData.map((dataPoint) => dataPoint.views),
    0,
  );
  const minViewsVal = fullData.length
    ? Math.min(...fullData.map((dataPoint) => dataPoint.views))
    : 0;
  setViewCapFromData(maxViewsVal);
  setViewMinFromData(minViewsVal);
  const maxDurVal = Math.max(...fullData.map((dataPoint) => dataPoint.dur), 0);
  setDurCapFromData(maxDurVal);
  setViewDefaults(viewMinFloor, viewMaxCap);
  const defaultDurMax = Math.round(
    Math.min(
      durMaxCap,
      Math.max(durMinFloor, maxDurVal ? maxDurVal * 1.1 : durMaxCap),
    ),
  );
  setDurDefaults(0, defaultDurMax);
  updateDurationPresetAvailability();

  const dates = fullData.map((dataPoint) => dataPoint.date);
  if (dates.length > 0) {
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    setDateInputValue("dateStart", minDate);
    setDateInputValue("dateEnd", maxDate);
    dayRangeToggleController?.setState("0", {
      silent: true,
      allowUnknown: true,
    });
  }

  byId("uploadSection")?.classList.add("hidden");
  byId("appShell")?.classList.remove("hidden");
  const filterSidebarEl = byId("filterSidebar");
  filterSidebarEl?.classList.remove("hidden");
  filterSidebarEl?.removeAttribute("hidden");
  const reportAreaEl = byId("reportArea");
  reportAreaEl?.classList.remove("hidden");
  reportAreaEl?.removeAttribute("hidden");
  const summaryBarEl = byId("summaryBar");
  summaryBarEl?.classList.remove("hidden");
  summaryBarEl?.removeAttribute("hidden");

  requestAnimationFrame(() => {
    byId("creatorSelect")?.focus();
  });

  timeGroupUserOverride = false;
  applyFilters();
}

function setDaysRange(days, options = {}) {
  const fullData = appState.getFullData();
  const dates = fullData.map((dataPoint) => dataPoint.date);
  if (!dates.length) return;
  const safeDaysRaw = Number.isFinite(days) ? Math.max(0, days) : 0;
  const safeDays = Math.min(
    safeDaysRaw === 0 ? MAX_RANGE_DAYS - 1 : safeDaysRaw,
    MAX_RANGE_DAYS - 1,
  );
  const maxDate = new Date(Math.max(...dates));
  const startDate = new Date(maxDate);
  startDate.setDate(startDate.getDate() - safeDays);
  setDateInputValue("dateStart", startDate);
  setDateInputValue("dateEnd", maxDate);
  applyFilters();
  if (!options.skipToggle) {
    dayRangeToggleController?.setState(String(safeDaysRaw), {
      silent: true,
      allowUnknown: true,
    });
  }
}

const recommendTimeGroup = (start, end) => {
  if (!(start instanceof Date) || !(end instanceof Date)) return null;
  const rangeDays = Math.max(
    0,
    (end.getTime() - start.getTime()) / MS_PER_DAY,
  );
  const approxMonths = rangeDays / 30;
  if (approxMonths > 24) return "year";
  if (approxMonths > 12) return "quarter";
  if (approxMonths > 4) return "month";
  return "week";
};

const setTimeGroupSelection = (value) => {
  if (typeof document === "undefined") return;
  const target = document.querySelector(
    `input[name="timeGroup"][value="${value}"]`,
  );
  if (target && !target.checked) {
    target.checked = true;
  }
};

const maybeAutoSetTimeGroup = (start, end) => {
  if (timeGroupUserOverride) return;
  if (typeof document === "undefined") return;
  const next = recommendTimeGroup(start, end);
  const current =
    document.querySelector('input[name="timeGroup"]:checked')?.value || null;
  if (next && current !== next) {
    setTimeGroupSelection(next);
  }
};

function applyFilters() {
  const fullData = appState.getFullData();
  const creatorSel = byId("creatorSelect");
  const startInput = byId("dateStart");
  const endInput = byId("dateEnd");
  const startNative = byId("dateStartNative");
  const endNative = byId("dateEndNative");
  const activePlatforms = getActivePlatforms();
  const creator = creatorSel ? creatorSel.value : "all";
  const startParsed =
    startNative?.valueAsDate ||
    parseDateInputText(startInput?.value) ||
    new Date(startInput?.value || "");
  const endParsed =
    endNative?.valueAsDate ||
    parseDateInputText(endInput?.value) ||
    new Date(endInput?.value || "");
  const start =
    Number.isNaN(startParsed?.getTime?.()) || !startParsed
      ? new Date(0)
      : startParsed;
  const end =
    Number.isNaN(endParsed?.getTime?.()) || !endParsed
      ? new Date(8640000000000000)
      : endParsed;
  if (end < start) {
    start.setTime(end.getTime());
    setDateInputValue("dateStart", start);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59);
  const maxRangeMs = (MAX_RANGE_DAYS - 1) * MS_PER_DAY;
  if (end.getTime() - start.getTime() > maxRangeMs) {
    const newStart = new Date(end.getTime() - maxRangeMs);
    newStart.setHours(0, 0, 0, 0);
    start.setTime(newStart.getTime());
    setDateInputValue("dateStart", newStart);
  }

  maybeAutoSetTimeGroup(start, end);

  const { min: minDur, max: maxDur } = durSlider.getValues();
  const { min: minViews, max: maxViewsRaw } = viewSlider.getValues();
  const maxViews = maxViewsRaw === viewMaxCap ? Infinity : maxViewsRaw;

  const filtered = fullData.filter((dataPoint) => {
    const dateOk = dataPoint.date >= start && dataPoint.date <= end;
    const creatorOk = creator === "all" || dataPoint.creator === creator;
    const durOk = dataPoint.dur >= minDur && dataPoint.dur <= maxDur;
    const viewsOk = dataPoint.views >= minViews && dataPoint.views <= maxViews;
    const platformKey = normalizePlatformValue(dataPoint.platform);
    const platformOk =
      activePlatforms.length === 0 ||
      !platformKey ||
      activePlatforms.includes(platformKey);
    return dateOk && creatorOk && durOk && viewsOk && platformOk;
  });

  appState.setFilteredData(filtered);
  updateUI();
}

const scheduleApplyFilters = (() => {
  let pending = null;
  return (delay = appConfig.DEBOUNCE_DELAY_DEFAULT || 300) => {
    if (pending) clearTimeout(pending);
    pending = setTimeout(() => {
      pending = null;
      applyFilters();
    }, delay);
  };
})();

function updateFilteredCount() {
  const videosEl = byId("videosDisplay");
  const percentEl = byId("videosPercentDisplay");
  const avgEl = byId("avgViewsDisplay");
  const summaryTableBody = byId("summaryTableBody");
  if (!videosEl && !avgEl && !percentEl && !summaryTableBody)
    return;
  const filteredData = appState.getFilteredData();
  const count = filteredData.length;
  const totalVideos = appState.getFullData().length;
  const totalViews = filteredData.reduce(
    (sum, dataPoint) => sum + dataPoint.views,
    0,
  );
  const avgViews = count ? totalViews / count : 0;
  const totalDuration = filteredData.reduce(
    (sum, dataPoint) => sum + (Number(dataPoint.dur) || 0),
    0,
  );
  const avgDuration = count ? totalDuration / count : 0;
  const pct =
    totalVideos > 0 ? Math.min(100, Math.max(0, (count / totalVideos) * 100)) : 0;
  const fmtPct =
    pct % 1 === 0 ? `${pct.toFixed(0)}%` : `${pct.toFixed(1)}%`;

  if (videosEl) {
    videosEl.textContent = nFmt(count);
    videosEl.title = nFmt(count);
  }

  if (percentEl) {
    percentEl.textContent = fmtPct;
    percentEl.title = `${nFmt(count)} / ${nFmt(totalVideos)} videos`;
  }

  if (avgEl) {
    avgEl.textContent = fmtViews(avgViews);
    avgEl.title = nFmt(avgViews);
  }

  if (summaryTableBody) {
    const summaryMode = appState.getMode("summaryMode") || "period";
    const activePlatforms = getActivePlatforms();
    const showPlatformCols = activePlatforms.length !== 1;
    const platformColumnsToRender = showPlatformCols ? PLATFORM_COLUMNS : [];
    const platformHeaders = document.querySelectorAll(
      "[data-summary-platform-col]",
    );
    platformHeaders.forEach((cell) => {
      const shouldShow = showPlatformCols;
      cell.hidden = !shouldShow;
      cell.style.display = shouldShow ? "" : "none";
    });

    const viewsByPlatformTotals = {};
    if (showPlatformCols) {
      filteredData.forEach((dataPoint) => {
        const platformKey = normalizePlatformValue(dataPoint.platform);
        if (!platformKey) return;
        viewsByPlatformTotals[platformKey] =
          (viewsByPlatformTotals[platformKey] || 0) +
          (dataPoint.views || 0);
      });
    }

    const totalPlatformCells = platformColumnsToRender
      .map(({ key: platformKey }) => {
        const platViews = viewsByPlatformTotals[platformKey] || 0;
        return `<td class="p-3 text-right font-semibold text-slate-800">${platViews ? fmtViews(platViews) : "-"}</td>`;
      })
      .join("");

    const totalRow = `
        <tr class="bg-slate-50 font-semibold">
          <td class="p-3 text-slate-800">Totales</td>
          <td class="p-3 text-slate-800">${nFmt(count)}</td>
          <td class="p-3 text-primary">${fmtViews(totalViews)}</td>
          ${totalPlatformCells}
          <td class="p-3 text-slate-800">${count ? fmtDur(totalDuration / count) : "-"}</td>
        </tr>`;

    let rows = [];
    if (summaryMode === "creator") {
      const byCreator = {};
      filteredData.forEach((dataPoint) => {
        const label = dataPoint.creator || "Desconocido";
        if (!byCreator[label]) {
          byCreator[label] = {
            label,
            count: 0,
            vSum: 0,
            durSum: 0,
            viewsByPlatform: {},
          };
        }
        const bucket = byCreator[label];
        const views = dataPoint.views || 0;
        bucket.count += 1;
        bucket.vSum += views;
        bucket.durSum += dataPoint.dur || 0;
        const platformKey = normalizePlatformValue(dataPoint.platform);
        if (platformKey) {
          bucket.viewsByPlatform[platformKey] =
            (bucket.viewsByPlatform[platformKey] || 0) + views;
        }
      });
      const keys = Object.keys(byCreator).sort((a, b) => {
        const diff = byCreator[b].vSum - byCreator[a].vSum;
        if (diff !== 0) return diff;
        return a.localeCompare(b);
      });
      rows = keys.map((key) => {
        const {
          label,
          count: groupCount = 0,
          vSum = 0,
          durSum = 0,
          viewsByPlatform = {},
        } = byCreator[key];
        const avgDur = groupCount ? durSum / groupCount : 0;
        const platformCells = platformColumnsToRender
          .map(({ key: platformKey }) => {
            const platViews = viewsByPlatform[platformKey] || 0;
            return `<td class="p-3 text-right font-semibold text-slate-700">${platViews ? fmtViews(platViews) : "-"}</td>`;
          })
          .join("");
        return `
        <tr>
          <td class="p-3 text-slate-700">${escapeHtml(label || "-")}</td>
          <td class="p-3 font-semibold text-slate-800">${nFmt(groupCount)}</td>
          <td class="p-3 font-semibold text-primary">${fmtViews(vSum)}</td>
          ${platformCells}
          <td class="p-3 text-slate-700">${groupCount ? fmtDur(avgDur) : "-"}</td>
        </tr>`;
      });
    } else {
      const timeGroup =
        document.querySelector('input[name="timeGroup"]:checked')?.value || "week";
      const period =
        timeGroup === "day" || timeGroup === "week" ? "month" : timeGroup;
      const grouped = groupData(filteredData, period);
      const platformViewsByKey = {};
      filteredData.forEach((dataPoint) => {
        const key = periodKeyForSummary(dataPoint.date, period);
        if (!key) return;
        const platformKey = normalizePlatformValue(dataPoint.platform);
        if (!platformKey) return;
        if (!platformViewsByKey[key]) platformViewsByKey[key] = {};
        platformViewsByKey[key][platformKey] =
          (platformViewsByKey[key][platformKey] || 0) +
          (dataPoint.views || 0);
      });
      const keys = Object.keys(grouped).sort(
        (a, b) => getSortValue(a, period) - getSortValue(b, period),
      );
      rows = keys.map((key) => {
        const { label, count: groupCount = 0, vSum = 0, durSum = 0 } =
          grouped[key];
        const viewsByPlatform = platformViewsByKey[key] || {};
        const platformCells = platformColumnsToRender
          .map(({ key: platformKey }) => {
            const platViews = viewsByPlatform[platformKey] || 0;
            return `<td class="p-3 text-right font-semibold text-slate-700">${platViews ? fmtViews(platViews) : "-"}</td>`;
          })
          .join("");
        const avgDur = groupCount ? durSum / groupCount : 0;
        return `
        <tr>
          <td class="p-3 text-slate-700">${label || "-"}</td>
          <td class="p-3 font-semibold text-slate-800">${nFmt(groupCount)}</td>
          <td class="p-3 font-semibold text-primary">${fmtViews(vSum)}</td>
          ${platformCells}
          <td class="p-3 text-slate-700">${groupCount ? fmtDur(avgDur) : "-"}</td>
        </tr>`;
      });
    }
    rows = [totalRow, ...rows];
    const totalColumns = 4 + platformColumnsToRender.length;
    summaryTableBody.innerHTML =
      rows.length > 0
        ? rows.join("")
        : `<tr><td class="p-3 text-slate-500" colspan="${totalColumns}">Sin datos</td></tr>`;
  }
}

function setChart1Mode(mode, options = {}) {
  if (mode !== "bar" && mode !== "line") return;
  appState.setMode("chart1", mode);
  chart1ToggleController?.setState(mode, { silent: !!options.fromToggle });
  updateUI();
}

function setChart1Metric(metric, options = {}) {
  if (metric !== "videos" && metric !== "minutes") return;
  appState.setMode("chart1Metric", metric);
  chart1MetricToggleController?.setState(metric, {
    silent: !!options.fromToggle,
  });
  updateChart1Legend(metric);
  updateUI();
}

function updateChart1Legend(metric = appState.getMode("chart1Metric")) {
  if (!chart1LegendPrimaryLabel || !chart1LegendPrimarySwatch) return;
  const isMinutes = metric === "minutes";
  chart1LegendPrimaryLabel.textContent = isMinutes ? "Minutos" : "Videos";
  const baseColor = CHART_COLORS.primary || "#6366f1";
  chart1LegendPrimarySwatch.style.backgroundColor = "#c7d2fe";
  chart1LegendPrimarySwatch.style.borderColor = baseColor;
}

function updateSingleMetricButton(button, isActive) {
  if (!button) return;
  const base = button.dataset.baseClass || "";
  const activeClass = button.dataset.activeClass || PILL_ACTIVE;
  const inactiveClass = button.dataset.inactiveClass || PILL_INACTIVE;
  button.className = [base, isActive ? activeClass : inactiveClass]
    .filter(Boolean)
    .join(" ")
    .trim();
  button.setAttribute("aria-pressed", isActive ? "true" : "false");
}

function updateChart4MetricButton(state = appState.getMode("chart4")) {
  updateSingleMetricButton(chart4V30Button, state === "v30");
}

function updateRangeBarsMetricButton(state = appState.getMode("rangeBars")) {
  updateSingleMetricButton(rangeBarsV30Button, state === "v30");
}

function updateChart6Note(mode = appState.getMode("chart6")) {
  if (!chart6Note) return;
  const shouldShow = mode === "perDay";
  chart6Note.classList.toggle("hidden", !shouldShow);
}

function setChart4Metric(metric, options = {}) {
  if (metric !== "views" && metric !== "v30") return;
  appState.setMode("chart4", metric);
  updateChart4MetricButton(metric);
  updateUI();
}

function setChart6Mode(mode, options = {}) {
  if (mode !== "total" && mode !== "perDay") return;
  appState.setMode("chart6", mode);
  chart6ToggleController?.setState(mode, { silent: !!options.fromToggle });
  updateChart6Note(mode);
  updateUI();
}

function setChart2Mode(mode, options = {}) {
  if (mode !== "line" && mode !== "bar") return;
  appState.setMode("chart2", mode);
  chart2ToggleController?.setState(mode, { silent: !!options.fromToggle });
  renderCharts();
}

function setChart3Mode(mode, options = {}) {
  if (mode !== "line" && mode !== "bar") return;
  appState.setMode("chart3", mode);
  chart3ToggleController?.setState(mode, { silent: !!options.fromToggle });
  renderCharts();
}

function setRangeBarMetric(metric, options = {}) {
  if (metric !== "views" && metric !== "v30") return;
  appState.setMode("rangeBars", metric);
  updateRangeBarsMetricButton(metric);
  renderCharts();
}

function setSummaryMode(mode, options = {}) {
  if (mode !== "period" && mode !== "creator") return;
  appState.setMode("summaryMode", mode);
  summaryToggleController?.setState(mode, { silent: !!options.fromToggle });
  updateFilteredCount();
}

function updateUI() {
  syncToggleUI();
  renderTopVideos();
  renderCharts();
  updateFilteredCount();
}

function bindUploadArea() {
  dropZone = byId("dropZone");
  fileInput = byId("fileInput");
  if (!dropZone || !fileInput) {
    console.warn("No se encontró el área de carga de archivos en el DOM.");
    return;
  }
  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });
  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone.addEventListener("dragleave", () =>
    dropZone.classList.remove("dragover"),
  );
  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragover");
    if (event.dataTransfer.files.length) handleFiles(event.dataTransfer.files);
  });
  fileInput.addEventListener("change", (event) => {
    if (event.target.files.length) handleFiles(event.target.files);
  });
}

function handleDateChange(id) {
  syncNativeDateFromVisible(id);
  dayRangeToggleController?.setState("", {
    silent: true,
    allowUnknown: true,
  });
  applyFilters();
}

function bindDateInputs() {
  ["dateStart", "dateEnd"].forEach((id) => {
    const input = byId(id);
    const native = byId(`${id}Native`);
    const container = input?.closest(".date-input");
    const trigger = container?.querySelector(".date-input__btn");

    const openPicker = () => {
      if (!native) return;
      if (typeof native.showPicker === "function") {
        native.showPicker();
      } else {
        native.focus();
      }
      input?.focus({ preventScroll: true });
    };

    if (container && native) {
      container.addEventListener("click", (event) => {
        event.preventDefault();
        openPicker();
      });
    }

    if (trigger) {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openPicker();
      });
    }

    if (input) {
      input.addEventListener("change", () => handleDateChange(id));
    }

    if (native) {
      native.addEventListener("change", () => {
        const selected =
          native.valueAsDate || (native.value ? new Date(native.value) : null);
        if (!selected || Number.isNaN(selected.getTime())) return;
        setDateInputValue(id, selected);
        handleDateChange(id);
      });
    }
  });
}

function bindFilterControls() {
  byId("creatorSelect")?.addEventListener("change", applyFilters);
  bindDateInputs();
  document.querySelectorAll('input[name="timeGroup"]').forEach((input) => {
    input.addEventListener("change", () => {
      timeGroupUserOverride = true;
      updateUI();
    });
  });
  byId("pasteToggleBtn")?.addEventListener("click", () =>
    byId("pasteArea")?.classList.toggle("hidden"),
  );
  byId("processPasteBtn")?.addEventListener("click", processPasted);
}

function updateDurationPresetAvailability() {
  const buttons = Array.from(
    document.querySelectorAll("[data-duration-preset]"),
  );
  if (!buttons.length) return;
  const fullData = appState.getFullData();
  const hasMinDuration = (threshold) =>
    Array.isArray(fullData) &&
    fullData.some(
      (dataPoint) =>
        Number.isFinite(dataPoint?.dur) && dataPoint.dur >= threshold,
    );
  const availability = {
    ultralong: hasMinDuration(durationPresetRequirements.ultralong),
    youtube: hasMinDuration(durationPresetRequirements.youtube),
    facebook: hasMinDuration(durationPresetRequirements.facebook),
  };
  let activeState = durationPresetToggleController?.getState?.() || "";
  let shouldClearActive = false;
  Object.entries(availability).forEach(([key, enabled]) => {
    const btn = document.querySelector(`[data-duration-preset="${key}"]`);
    if (!btn) return;
    btn.disabled = !enabled;
    btn.classList.toggle("duration-preset-btn--disabled", !enabled);
    btn.setAttribute("aria-disabled", enabled ? "false" : "true");
    if (!enabled && activeState === key) {
      shouldClearActive = true;
    }
  });
  if (shouldClearActive) {
    durationPresetToggleController?.setState("", {
      allowUnknown: true,
      silent: true,
    });
  }
}

function applyDurationPreset(key) {
  const preset = durationPresets[key];
  const targetBtn =
    typeof document !== "undefined"
      ? document.querySelector(`[data-duration-preset="${key}"]`)
      : null;
  if (!preset || !preset.length || targetBtn?.disabled) return;
  durationPresetToggleController?.setState(key, {
    allowUnknown: true,
    silent: true,
  });
  const { cuts } = applyDurationCuts(preset, { skipRender: true });
  syncDurationInputValues(cuts);
  scheduleRangeChartRender();
}

function bindDurationPresets() {
  const buttons = Array.from(
    document.querySelectorAll("[data-duration-preset]"),
  );
  if (!buttons.length) return;
  const states = buttons.map((btn) => btn.getAttribute("data-duration-preset"));
  durationPresetToggleController = createToggleController({
    buttons,
    states,
    activeClass: "bg-primary text-white shadow-sm border border-primary",
    inactiveClass: "bg-slate-100 hover:bg-slate-200 text-slate-700",
    initialState: "facebook",
    getValue: (btn) => btn.getAttribute("data-duration-preset"),
    onChange: (value) => applyDurationPreset(value),
  });
}

function bindDurationRangeControls() {
  const resetBtn = byId("resetDurationRanges");
  if (resetBtn) {
    resetBtn.addEventListener("click", (event) => {
      event.preventDefault();
      resetDurationCuts();
    });
  }
}

function bindPlatformChips() {
  const chips = Array.from(document.querySelectorAll("[data-platform-chip]"));
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const isActive = chip.classList.contains("is-active");
      const activeCount = document.querySelectorAll(
        "[data-platform-chip].is-active",
      ).length;
      if (isActive && activeCount <= 1) {
        chip.classList.add("pulse-once");
        setTimeout(() => chip.classList.remove("pulse-once"), appConfig.PULSE_ANIMATION_DURATION || 220);
        return;
      }
      chip.classList.toggle("is-active");
      chip.setAttribute("aria-pressed", chip.classList.contains("is-active"));
      scheduleApplyFilters(appConfig.DEBOUNCE_DELAY_FAST || 120);
    });
  });
}

function bindSliderFocus() {
  byId("viewRangeMin")?.addEventListener("pointerdown", () =>
    setHandleFocus("min"),
  );
  byId("viewRangeMax")?.addEventListener("pointerdown", () =>
    setHandleFocus("max"),
  );
  byId("durRangeMin")?.addEventListener("pointerdown", () =>
    setDurHandleFocus("min"),
  );
  byId("durRangeMax")?.addEventListener("pointerdown", () =>
    setDurHandleFocus("max"),
  );
}

function initSliders() {
  updateViewSliderUI();
  setHandleFocus("min");
  updateDurSliderUI();
  setDurHandleFocus("min");
}

function initToggles() {
  chart1ToggleController = createToggleController({
    buttons: Array.from(document.querySelectorAll("[data-chart1-mode]")),
    states: ["line", "bar"],
    activeClass: PILL_ACTIVE,
    inactiveClass: PILL_INACTIVE,
    initialState: appState.getMode("chart1"),
    getValue: (button) => button.getAttribute("data-chart1-mode"),
    onChange: (mode) => setChart1Mode(mode, { fromToggle: true }),
  });
  chart1MetricToggleController = createToggleController({
    buttons: Array.from(document.querySelectorAll("[data-chart1-metric]")),
    states: ["videos", "minutes"],
    activeClass: PILL_ACTIVE,
    inactiveClass: PILL_INACTIVE,
    initialState: appState.getMode("chart1Metric"),
    getValue: (button) => button.getAttribute("data-chart1-metric"),
    onChange: (metric) => setChart1Metric(metric, { fromToggle: true }),
  });
  chart1LegendPrimaryLabel = byId("chart1LegendPrimaryLabel");
  chart1LegendPrimarySwatch = byId("chart1LegendPrimarySwatch");
  updateChart1Legend();
  chart4V30Button = byId("chart4ToggleV30");
  if (chart4V30Button) {
    chart4V30Button.dataset.baseClass = chart4V30Button.className;
    chart4V30Button.addEventListener("click", () => {
      const next = appState.getMode("chart4") === "v30" ? "views" : "v30";
      setChart4Metric(next, { fromToggle: true });
    });
    updateChart4MetricButton();
  }
  chart2ToggleController = createToggleController({
    buttons: Array.from(document.querySelectorAll("[data-chart2-mode]")),
    states: ["line", "bar"],
    activeClass: PILL_ACTIVE,
    inactiveClass: PILL_INACTIVE,
    initialState: appState.getMode("chart2"),
    getValue: (button) => button.getAttribute("data-chart2-mode"),
    onChange: (mode) => setChart2Mode(mode, { fromToggle: true }),
  });
  chart3ToggleController = createToggleController({
    buttons: Array.from(document.querySelectorAll("[data-chart3-mode]")),
    states: ["line", "bar"],
    activeClass: PILL_ACTIVE,
    inactiveClass: PILL_INACTIVE,
    initialState: appState.getMode("chart3"),
    getValue: (button) => button.getAttribute("data-chart3-mode"),
    onChange: (mode) => setChart3Mode(mode, { fromToggle: true }),
  });
  summaryToggleController = createToggleController({
    buttons: Array.from(document.querySelectorAll("[data-summary-mode]")),
    states: ["period", "creator"],
    activeClass: PILL_ACTIVE,
    inactiveClass: PILL_INACTIVE,
    initialState: appState.getMode("summaryMode"),
    getValue: (button) => button.getAttribute("data-summary-mode"),
    onChange: (mode) => setSummaryMode(mode, { fromToggle: true }),
  });
  chart6Note = byId("chart6Note");
  chart6ToggleController = createToggleController({
    buttons: Array.from(document.querySelectorAll("[data-chart6-mode]")),
    states: ["perDay", "total"],
    activeClass: PILL_ACTIVE,
    inactiveClass: PILL_INACTIVE,
    initialState: appState.getMode("chart6"),
    getValue: (button) => button.getAttribute("data-chart6-mode"),
    onChange: (mode) => setChart6Mode(mode, { fromToggle: true }),
  });
  updateChart6Note(appState.getMode("chart6"));
  rangeBarsV30Button = byId("rangeBarsV30");
  if (rangeBarsV30Button) {
    rangeBarsV30Button.dataset.baseClass = rangeBarsV30Button.className;
    rangeBarsV30Button.addEventListener("click", () => {
      const next =
        appState.getMode("rangeBars") === "v30" ? "views" : "v30";
      setRangeBarMetric(next, { fromToggle: true });
    });
    updateRangeBarsMetricButton();
  }

  const dayButtons = Array.from(document.querySelectorAll("[data-days-range]"));
  const dayStates = dayButtons.map((button) =>
    button.getAttribute("data-days-range"),
  );
  dayRangeToggleController = createToggleController({
    buttons: dayButtons,
    states: dayStates,
    activeClass:
      "bg-white text-primary-dark shadow-sm border border-primary-soft",
    inactiveClass: "bg-slate-100 hover:bg-slate-200 text-slate-700",
    initialState: "",
    getValue: (button) => button.getAttribute("data-days-range"),
    onChange: (value) =>
      setDaysRange(Number(value || "0"), { skipToggle: true }),
  });
}

function syncToggleUI() {
  chart1ToggleController?.setState(appState.getMode("chart1"), {
    silent: true,
    allowUnknown: true,
  });
  updateChart1Legend();
  chart1MetricToggleController?.setState(
    appState.getMode("chart1Metric"),
    {
      silent: true,
      allowUnknown: true,
    },
  );
  updateChart4MetricButton(appState.getMode("chart4"));
  chart2ToggleController?.setState(appState.getMode("chart2"), {
    silent: true,
    allowUnknown: true,
  });
  chart3ToggleController?.setState(appState.getMode("chart3"), {
    silent: true,
    allowUnknown: true,
  });
  summaryToggleController?.setState(appState.getMode("summaryMode"), {
    silent: true,
    allowUnknown: true,
  });
  chart6ToggleController?.setState(appState.getMode("chart6"), {
    silent: true,
    allowUnknown: true,
  });
  updateChart6Note(appState.getMode("chart6"));
  updateRangeBarsMetricButton(appState.getMode("rangeBars"));
}

function initApp() {
  viewSlider = createViewSlider({
    step: VIEW_STEP,
    formatInput: (value, isMax) => formatViewsShortWithCap(value, isMax),
    parseInput: parseNumberInput,
    getBounds: () => ({ minFloor: viewMinFloor, maxCap: viewMaxCap }),
    setBounds: ({ minFloor = viewMinFloor, maxCap = viewMaxCap }) => {
      viewMinFloor = minFloor;
      viewMaxCap = maxCap;
    },
    onChange: scheduleApplyFilters,
  });
  durSlider = createDurSlider({
    step: DUR_STEP,
    formatInput: (value) => formatDurFilterVal(value),
    parseInput: parseDurationText,
    getBounds: () => ({ minFloor: durMinFloor, maxCap: durMaxCap }),
    setBounds: ({ minFloor = durMinFloor, maxCap = durMaxCap }) => {
      durMinFloor = minFloor;
      durMaxCap = maxCap;
    },
    onChange: scheduleApplyFilters,
  });

  dropZone = byId("dropZone");
  fileInput = byId("fileInput");

  resetDurationCuts({ skipRender: true, skipInputs: true });
  renderDurationRangeInputs();
  updateDurationRangePreview();

  bindUploadArea();
  initToggles();
  bindSliderFocus();
  initSliders();
  bindFilterControls();
  bindPlatformChips();
  bindDurationRangeControls();
  bindDurationPresets();
}

const App = {
  init: initApp,
  state: {
    get fullData() {
      return appState.getFullData();
    },
    get filteredData() {
      return appState.getFilteredData();
    },
    get charts() {
      return appState.getCharts();
    },
  },
  config: appConfig,
  data: {
    parseCSVString,
    fileNameToCreator,
    readFileAsRows,
    initData,
    normalizeDateLocal,
    localKey,
    groupData,
    handleFiles,
  },
  filters: {
    applyFilters,
    scheduleApplyFilters,
    setDaysRange,
    setHandleFocus,
    setDurHandleFocus,
    setViewCapFromData,
    setDurCapFromData,
    setDurDefaults,
    setViewDefaults,
    updateFilteredCount,
    commitViewText,
    viewTextKey,
    handleViewRange,
    commitDurText,
    durTextKey,
    handleDurRange,
  },
  charts: {
    renderCharts,
    timeScatterOpt,
  },
  ui: {
    renderTopVideos,
    updateUI,
    setChart1Mode,
    setChart1Metric,
    setChart2Mode,
    setChart3Mode,
    setChart4Metric,
    setSummaryMode,
    setChart6Mode,
    setRangeBarMetric,
  },
  utils: {
    nFmt,
    fmtViews,
    fmtDur,
    fmtDurClock,
    fmtAxisDuration,
    fmtAxisViews,
    parseNumberInput,
    parseDurationText,
    fmtDateShort,
    formatViewsShort: formatViewsShortWithCap,
  },
};

if (typeof window !== "undefined") {
  window.App = App;
  const boot = () => {
    try {
      initApp();
    } catch (error) {
      console.error("VideoAnalytics init error:", error);
      alert(
        "Hubo un error al iniciar la app. Revisa la consola (F12) y comparte el mensaje para poder ayudarte.",
      );
    }
  };
  if (typeof document !== "undefined" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else if (typeof document !== "undefined") {
    boot();
  }
}

// Export helpers for tests (no effect in browser)
if (typeof module !== "undefined") {
  module.exports = {
    parseDurationText,
    formatViewsShort: (value, isMax) =>
      formatViewsShortWithCap(value, isMax),
    normalizeRows,
  };
}
