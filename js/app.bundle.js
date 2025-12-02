(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // js/config.js
  var CONFIG, CHART_COLORS;
  var init_config = __esm({
    "js/config.js"() {
      CONFIG = {
        Y_AXIS_WIDTH: 75,
        VIEW_STEP: 1e5,
        DUR_STEP: 1,
        VIEW_MAX_CAP: 5e7,
        VIEW_MIN_FLOOR: 0,
        DUR_MAX_CAP: 100000,
        DUR_MIN_FLOOR: 0,
        MA_WINDOW: 7,
        TOP_VIDEOS_LIMIT: 100,
        DURATION_RANGES: [
          { label: "0-20s", min: 0, max: 20 },
          { label: "20-30s", min: 20, max: 30 },
          { label: "30s-1:00", min: 30, max: 60 },
          { label: "1:00-2:55", min: 60, max: 175 },
          { label: "3:00-3:59", min: 180, max: 240 },
          { label: "4:00+", min: 240, max: Infinity }
        ],
        CHART_COLORS: {
          primary: "#6366f1",
          primarySoft: "rgba(99, 102, 241, 0.7)",
          success: "#10b981",
          successAlt: "#16c964",
          purple: "#5b0cd3",
          v30: "#22c55e",
          scatter: "#ef4444",
          scatterBg: "rgba(239, 68, 68, 0.65)",
          orange: "#f59e0b",
          grid: "#e2e8f0"
        }
      };
      CHART_COLORS = CONFIG.CHART_COLORS;
      if (typeof window !== "undefined") {
        window.CONFIG = CONFIG;
      }
    }
  });

  // js/state.js
  var require_state = __commonJS({
    "js/state.js"() {
      var State = /* @__PURE__ */ (() => {
        let fullData = [];
        let filteredData = [];
        const charts = {};
        const chartTypes = {};
        let durationRanges = [];
        const chartModes = {
          chart1: "bar",
          chart1Metric: "videos",
          chart2: "bar",
          chart3: "bar",
          chart4: "views",
          chart6: "perDay",
          rangeBars: "views",
          summaryMode: "period"
        };
        let applyTimer = null;
        const clearChartInstance = (key) => {
          if (charts[key]) {
            charts[key].destroy?.();
            delete charts[key];
          }
          delete chartTypes[key];
        };
        const assignArray = (data = []) => Array.isArray(data) ? data : [];
        return {
          getFullData: () => fullData,
          setFullData: (data) => {
            fullData = assignArray(data);
          },
          getFilteredData: () => filteredData,
          setFilteredData: (data) => {
            filteredData = assignArray(data);
          },
          getChart: (key) => charts[key],
          getCharts: () => charts,
          setChart: (key, chartInstance, type) => {
            charts[key] = chartInstance;
            if (type) chartTypes[key] = type;
          },
          clearChart: clearChartInstance,
          clearCharts: () => Object.keys(charts).forEach(clearChartInstance),
          getChartType: (key) => chartTypes[key],
          setChartType: (key, type) => {
            chartTypes[key] = type;
          },
          getMode: (key) => chartModes[key],
          setMode: (key, value) => {
            chartModes[key] = value;
          },
          getDurationRanges: () => durationRanges,
          setDurationRanges: (ranges) => {
            durationRanges = assignArray(ranges);
          },
          getApplyTimer: () => applyTimer,
          setApplyTimer: (timer) => {
            applyTimer = timer;
          },
          clearApplyTimer: () => {
            if (applyTimer) {
              clearTimeout(applyTimer);
            }
            applyTimer = null;
          }
        };
      })();
      window.State = State;
    }
  });

  // js/utils_formatters.js
  function fmtViews(value) {
    const num = Number(value) || 0;
    const millions = num / 1e6;
    if (millions >= 100) return `${nFmt(Math.round(millions))}M`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)} mil millones`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${Math.round(num / 1e3)}K`;
    return nFmt(num);
  }
  function fmtDurationLabel(rawSeconds) {
    const total = Math.max(0, Math.round(Number(rawSeconds) || 0));
    if (total < 60) return `${total}s`;
    if (total < 3600) {
      const minutes = Math.floor(total / 60);
      const sec = total % 60;
      return `${minutes}:${sec.toString().padStart(2, "0")}m`;
    }
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, "0")}h`;
  }
  function fmtDur(seconds) {
    return fmtDurationLabel(seconds);
  }
  function fmtDurClock(seconds) {
    return fmtDurationLabel(seconds);
  }
  function fmtAxisViews(value) {
    const val = Number(value) || 0;
    const millions = val / 1e6;
    if (millions >= 100) return `${nFmt(Math.round(millions))}M`;
    if (val >= 1e9) {
      const b = val / 1e9;
      const rounded = Number(b.toFixed(1));
      const display = rounded % 1 === 0 ? Math.round(b) : rounded;
      return `${display} mil millones`;
    }
    if (val >= 1e6) {
      const m = val / 1e6;
      const rounded = Number(m.toFixed(1));
      return rounded % 1 === 0 ? `${Math.round(m)}M` : `${rounded}M`;
    }
    if (val >= 1e3) return `${Math.round(val / 1e3)}K`;
    return Math.round(val).toString();
  }
  function fmtAxisDuration(seconds) {
    return fmtDurationLabel(seconds);
  }
  function fmtDateShort(date) {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, "0");
    const mon = MONTH_ABBR[d.getMonth()] || "";
    const yr = (d.getFullYear() % 100).toString().padStart(2, "0");
    return `${day}-${mon}-${yr}`;
  }
  function formatDurFilterVal(value) {
    return fmtDurationLabel(value);
  }
  function formatViewsShort(value, isMax, viewMaxCap = 5e7) {
    const num = Number(value) || 0;
    if (num <= 0) return "0";
    const isCap = num >= viewMaxCap;
    if (isCap) return isMax ? `${fmtViews(viewMaxCap)}+` : fmtViews(viewMaxCap);
    const millions = num / 1e6;
    if (millions >= 100) return `${nFmt(Math.round(millions))}M`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${Math.round(num / 1e3)}K`;
    return Math.round(num).toString();
  }
  function escapeHtml(text) {
    return String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  var MONTH_ABBR, nFmt;
  var init_utils_formatters = __esm({
    "js/utils_formatters.js"() {
      MONTH_ABBR = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
      ];
      nFmt = (n) => new Intl.NumberFormat("en-US").format(Math.round(n));
    }
  });

  // js/utils_parsers.js
  function parseNumberInput(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value !== "string") return 0;
    const clean = value.replace(/,/g, "").trim().replace(/\+$/, "");
    const match = clean.match(/^(-?\d+(?:\.\d+)?)([kKmM])?$/);
    if (match) {
      const num2 = Number(match[1]);
      if (!Number.isFinite(num2)) return 0;
      const suffix = match[2]?.toLowerCase();
      if (suffix === "k") return num2 * 1e3;
      if (suffix === "m") return num2 * 1e6;
      return num2;
    }
    const num = Number(clean);
    return Number.isFinite(num) ? num : 0;
  }
  function parseDurationText(value) {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return 0;
    const clean = value.trim().toLowerCase().replace(/s$/, "");
    const normalized = clean.includes(":") ? clean.replace(/m$/, "") : clean;
    if (normalized.includes(":")) {
      const parts = normalized.split(":").map((part) => part.trim()).filter(Boolean);
      if (parts.length === 3) {
        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);
        const seconds = Number(parts[2]);
        if (Number.isFinite(hours) && Number.isFinite(minutes) && Number.isFinite(seconds)) {
          return Math.max(0, hours * 3600 + minutes * 60 + seconds);
        }
      } else if (parts.length === 2) {
        const minutes = Number(parts[0]);
        const seconds = Number(parts[1]);
        if (Number.isFinite(minutes) && Number.isFinite(seconds))
          return Math.max(0, minutes * 60 + seconds);
      }
    }
    const num = Number(clean.replace(/,/g, ""));
    return Number.isNaN(num) ? 0 : num;
  }
  function parseDateInputText(value) {
    if (!value || typeof value !== "string") return null;
    const match = value.trim().match(/^(\d{2})-([A-Za-z]{3})-(\d{2})$/);
    if (!match) return null;
    const [, dd, monTxt, yy] = match;
    const monthIdx = MONTH_ABBR.findIndex(
      (m) => m.toLowerCase() === monTxt.toLowerCase()
    );
    if (monthIdx === -1) return null;
    const fullYear = 2e3 + Number(yy);
    const dateObj = new Date(fullYear, monthIdx, Number(dd));
    if (Number.isNaN(dateObj.getTime())) return null;
    return dateObj;
  }
  function parseMetricValue(raw) {
    if (raw === void 0 || raw === null || raw === "") return 0;
    return parseNumberInput(raw);
  }
  function parseCSVString(csvText, fallbackCreator = "") {
    const lines = csvText.split("\n");
    let textToParse = csvText;
    if (lines.length > 1 && !lines[0].includes("Published_Date") && lines[1] && lines[1].includes("Published_Date")) {
      lines.shift();
      textToParse = lines.join("\n");
    }
    return new Promise((resolve, reject) => {
      Papa.parse(textToParse, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const withSource = results.data.map((row) => ({
            ...row,
            __creatorFallback: fallbackCreator
          }));
          resolve(withSource);
        },
        error: (err) => reject(err)
      });
    });
  }
  function fileNameToCreator(name = "") {
    const trimmed = name.trim();
    if (!trimmed) return "";
    const withoutExt = trimmed.replace(/\.[^/.]+$/, "");
    return withoutExt || trimmed;
  }
  function readFileAsRows(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const rows = await parseCSVString(
            event.target.result,
            fileNameToCreator(file.name)
          );
          resolve(rows);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
  var init_utils_parsers = __esm({
    "js/utils_parsers.js"() {
      init_utils_formatters();
    }
  });

  // js/data_normalize.js
  function pickValue(row, keys = []) {
    if (!row || !Array.isArray(keys)) return void 0;
    for (const rawKey of keys) {
      if (!rawKey) continue;
      if (!Object.prototype.hasOwnProperty.call(row, rawKey)) continue;
      const value = row[rawKey];
      if (value === void 0 || value === null) continue;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) continue;
        if (INVALID_VALUE_TOKENS.has(trimmed.toLowerCase())) continue;
        return trimmed;
      }
      return value;
    }
    return void 0;
  }
  function normalizeRows(data = []) {
    if (data.length > 0) {
      const unknownKeys = Object.keys(data[0]).filter(
        (key) => !NORMALIZE_KNOWN_KEYS.has(key) && !key.startsWith("__")
      );
      if (unknownKeys.length) {
        console.warn("[normalizeRows] Columnas no reconocidas:", unknownKeys);
      }
    }
    return data.map((row) => {
      const views = parseMetricValue(
        pickValue(row, [
          "Views_num",
          "views_num",
          "viewsNum",
          "Views",
          "views",
          "Views "
        ])
      );
      let eng = parseMetricValue(
        pickValue(row, ["Total_Engagements", "total_engagements"])
      );
      if (!eng) {
        const likes = parseMetricValue(pickValue(row, ["Likes", "likes"]));
        const comments = parseMetricValue(
          pickValue(row, ["Comments", "comments"])
        );
        const shares = parseMetricValue(
          pickValue(row, ["Shares", "shares", "Compartidos"])
        );
        eng = likes + comments + shares;
      }
      const er = views > 0 ? eng / views * 100 : 0;
      const dateStr = pickValue(row, [
        "Published_Date",
        "Published Date",
        "Published",
        "upload_date",
        "Upload Date",
        "Date",
        "Fecha"
      ]) || "";
      const date = (() => {
        if (!dateStr) return new Date(NaN);
        const direct = new Date(dateStr);
        if (!Number.isNaN(direct.getTime())) return direct;
        const parsed = parseDateInputText(dateStr);
        if (parsed && !Number.isNaN(parsed.getTime())) return parsed;
        const safe = new Date(String(dateStr).replace(/-/g, "/"));
        return safe;
      })();
      const url = pickValue(row, [
        "Video_URL",
        "Video URL",
        "video_url",
        "Video Link",
        "Link",
        "Enlace",
        "URL"
      ]) || "#";
      const thumb = pickValue(row, [
        "image_url",
        "Image_URL",
        "Thumbnail",
        "thumbnail",
        "Thumb",
        "thumb",
        "Imagen",
        "Imagen_URL"
      ]) || "";
      const platform = pickValue(row, ["platform", "Platform", "Plataforma", "Origen"]) || "";
      const creatorFromFile = row.__creatorFallback || "";
      const rawCreator = pickValue(row, [
        "Creator",
        "creator",
        "Creador",
        "creador",
        "creator_name",
        "Creator Name"
      ]) || "";
      const creator = rawCreator && String(rawCreator).trim() ? String(rawCreator).trim() : creatorFromFile || "Desconocido";
      return {
        title: pickValue(row, [
          "Video_Title",
          "Video Title",
          "video",
          "Video",
          "Title",
          "Titulo"
        ]) || "Sin Titulo",
        url,
        date,
        views,
        v30: parseMetricValue(
          pickValue(row, ["V30", "v30", "V30_num", "v30_num"])
        ),
        dur: (() => {
          const durationSeconds = parseMetricValue(
            pickValue(row, [
              "Duration (seconds)",
              "Duration_seconds",
              "duration_sec",
              "durationSeconds"
            ])
          );
          if (durationSeconds) return durationSeconds;
          const durText = pickValue(row, ["Duration", "duration"]);
          if (durText) return parseDurationText(durText);
          return 0;
        })(),
        er,
        creator,
        thumb,
        platform
      };
    }).filter((dataPoint) => !Number.isNaN(dataPoint.date.getTime()));
  }
  function normalizeDateLocal(dateObj) {
    const d = new Date(dateObj);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function localKey(dateObj) {
    const d = normalizeDateLocal(dateObj);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function getSortValue(key, period) {
    if (period === "day" || period === "week") return new Date(key).getTime();
    if (period === "month") {
      const [year, month] = key.split("-").map(Number);
      return new Date(year, month || 0, 1).getTime();
    }
    if (period === "quarter") {
      const [yearStr, quarterStr] = key.split("-Q");
      const quarter = Number(quarterStr) || 1;
      const month = (quarter - 1) * 3;
      return new Date(Number(yearStr), month, 1).getTime();
    }
    if (period === "year") {
      return new Date(Number(key), 0, 1).getTime();
    }
    return 0;
  }
  function groupData(data, period) {
    const groups = {};
    data.forEach((dataPoint) => {
      let key;
      let label;
      if (period === "day") {
        const dayDate = normalizeDateLocal(dataPoint.date);
        key = localKey(dayDate);
        label = dayDate.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short"
        });
      } else if (period === "week") {
        const monday = normalizeDateLocal(dataPoint.date);
        const day = monday.getDay();
        monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1));
        key = localKey(monday);
        label = monday.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short"
        });
      } else if (period === "month") {
        const dt = normalizeDateLocal(dataPoint.date);
        key = `${dt.getFullYear()}-${dt.getMonth()}`;
        label = dt.toLocaleDateString("es-ES", {
          month: "short",
          year: "2-digit"
        });
      } else if (period === "quarter") {
        const dt = normalizeDateLocal(dataPoint.date);
        const quarter = Math.floor(dt.getMonth() / 3) + 1;
        key = `${dt.getFullYear()}-Q${quarter}`;
        label = `Q${quarter} ${dt.getFullYear().toString().substring(2)}`;
      } else if (period === "year") {
        const dt = normalizeDateLocal(dataPoint.date);
        key = `${dt.getFullYear()}`;
        label = `${dt.getFullYear()}`;
      }
      if (!groups[key]) {
        groups[key] = { label, count: 0, vSum: 0, v30Sum: 0, durSum: 0 };
      }
      groups[key].count += 1;
      groups[key].vSum += dataPoint.views;
      groups[key].v30Sum += dataPoint.v30;
      groups[key].durSum += dataPoint.dur;
    });
    return groups;
  }
  var INVALID_VALUE_TOKENS, NORMALIZE_KNOWN_KEYS;
  var init_data_normalize = __esm({
    "js/data_normalize.js"() {
      init_utils_parsers();
      INVALID_VALUE_TOKENS = /* @__PURE__ */ new Set(["--", "-", "n/a", "na", "null", "undefined"]);
      NORMALIZE_KNOWN_KEYS = /* @__PURE__ */ new Set([
        "Views_num",
        "views_num",
        "viewsNum",
        "Views",
        "views",
        "Views ",
        "Total_Engagements",
        "total_engagements",
        "Likes",
        "likes",
        "Comments",
        "comments",
        "Shares",
        "shares",
        "Compartidos",
        "Published_Date",
        "Published Date",
        "Published",
        "upload_date",
        "Upload Date",
        "Date",
        "Fecha",
        "Video_URL",
        "Video URL",
        "video_url",
        "Video Link",
        "Link",
        "Enlace",
        "URL",
        "image_url",
        "Image_URL",
        "Thumbnail",
        "thumbnail",
        "Thumb",
        "thumb",
        "Imagen",
        "Imagen_URL",
        "platform",
        "Platform",
        "Plataforma",
        "Origen",
        "Creator",
        "creator",
        "Creador",
        "creador",
        "creator_name",
        "Creator Name",
        "Video_Title",
        "Video Title",
        "video",
        "Video",
        "Title",
        "Titulo",
        "V30",
        "v30",
        "V30_num",
        "v30_num",
        "Duration (seconds)",
        "Duration_seconds",
        "duration_sec",
        "durationSeconds",
        "Duration",
        "duration"
      ]);
    }
  });

  // js/filters_sliders.js
  function createRangeController(config) {
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
      const safeMin = Number.isFinite(min) ? Math.max(minFloor, Math.min(min, maxCap)) : minFloor;
      const safeMax = Number.isFinite(max) ? Math.max(safeMin, Math.min(maxCap, max)) : maxCap;
      return [safeMin, safeMax];
    };
    const setFocus = (which) => {
      if (!minRange || !maxRange) return;
      if (which === "min") {
        minRange.style.zIndex = 40;
        maxRange.style.zIndex = 20;
      } else {
        maxRange.style.zIndex = 40;
        minRange.style.zIndex = 20;
      }
    };
    const updateUI = (minVal, maxVal) => {
      if (!minRange || !maxRange) return;
      const [min, max] = clampPair(
        typeof minVal === "number" ? minVal : parseFloat(minRange.value),
        typeof maxVal === "number" ? maxVal : parseFloat(maxRange.value)
      );
      if (minInput) minInput.value = config.formatInput(min, false);
      if (maxInput) maxInput.value = config.formatInput(max, true);
      const { minFloor, maxCap } = config.getBounds();
      const rangeSpan = Math.max(1, maxCap - minFloor);
      const pctMin = (min - minFloor) / rangeSpan * 100;
      const pctMax = (max - minFloor) / rangeSpan * 100;
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
        parseFloat(maxRange.value)
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
        parseFloat(maxRange.value)
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
        parseFloat(maxRange?.value)
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
      getValues
    };
  }
  function createViewSlider(configOrOnChange) {
    const config = typeof configOrOnChange === "function" ? { onChange: configOrOnChange } : configOrOnChange || {};
    return createRangeController({
      minInputId: "viewMinInput",
      maxInputId: "viewMaxInput",
      rangeMinId: "viewRangeMin",
      rangeMaxId: "viewRangeMax",
      trackId: "viewTrack",
      ...config
    });
  }
  function createDurSlider(configOrOnChange) {
    const config = typeof configOrOnChange === "function" ? { onChange: configOrOnChange } : configOrOnChange || {};
    return createRangeController({
      minInputId: "minDur",
      maxInputId: "maxDur",
      rangeMinId: "durRangeMin",
      rangeMaxId: "durRangeMax",
      trackId: "durTrack",
      ...config
    });
  }
  var byId;
  var init_filters_sliders = __esm({
    "js/filters_sliders.js"() {
      init_config();
      byId = (id) => document.getElementById(id);
    }
  });

  // js/filters_toggles.js
  function createToggleController(config) {
    const buttons = config.buttons || [];
    const states = (config.states || []).map((value) => String(value));
    const getValue = config.getValue || ((button) => button.dataset?.value ?? button.value);
    const baseClasses = /* @__PURE__ */ new Map();
    buttons.forEach((button) => baseClasses.set(button, button.className));
    let current = config.initialState !== void 0 ? String(config.initialState) : states[0] || "";
    const updateUI = () => {
      buttons.forEach((button) => {
        const value = String(getValue(button));
        const isActive = value === current;
        const base = baseClasses.get(button) || "";
        const modifier = isActive ? config.activeClass : config.inactiveClass;
        button.className = [base, modifier].filter(Boolean).join(" ").trim();
        if (config.useAria !== false)
          button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    };
    const setState = (next, options = {}) => {
      const normalized = String(next ?? "");
      if (!options.allowUnknown && states.length && !states.includes(normalized))
        return;
      current = normalized;
      updateUI();
      if (!options.silent && typeof config.onChange === "function") {
        config.onChange(normalized);
      }
    };
    buttons.forEach(
      (button) => button.addEventListener("click", () => setState(getValue(button)))
    );
    updateUI();
    return { setState, getState: () => current, updateUI };
  }
  var init_filters_toggles = __esm({
    "js/filters_toggles.js"() {
    }
  });

  // js/charts_config.js
  function commonOpt(scaleX, scaleY) {
    const yConfig = scaleY || {};
    yConfig.afterFit = (scale) => {
      scale.width = Y_AXIS_WIDTH;
    };
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      resizeDelay: 0,
      layout: { padding: { right: 18 } },
      plugins: { legend: { display: false } },
      scales: {
        x: scaleX || {},
        y: yConfig
      }
    };
  }
  function timeScatterOpt(yLabel) {
    const yAxis = {
      title: { display: true, text: yLabel },
      afterFit: (scale) => {
        scale.width = Y_AXIS_WIDTH;
      }
    };
    if (typeof yLabel === "string" && yLabel.toLowerCase().includes("duraci")) {
      yAxis.ticks = { callback: (value) => fmtAxisDuration(value) };
    }
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      responsiveAnimationDuration: 0,
      layout: { padding: { right: 18 } },
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: (context) => {
              const raw = context.raw || {};
              const fullTitle = raw.title || context.dataset?.label || "Dato";
              const title = fullTitle.length > 30 ? `${fullTitle.substring(0, 27)}...` : fullTitle;
              const yVal = raw.y ?? context.parsed?.y ?? 0;
              return `${title} (${fmtDur(yVal)})`;
            }
          }
        }
      },
      scales: {
        x: {
          type: "time",
          time: { unit: "day", displayFormats: { day: "dd MMM" } }
        },
        y: yAxis
      }
    };
  }
  var appConfig, Y_AXIS_WIDTH;
  var init_charts_config = __esm({
    "js/charts_config.js"() {
      init_utils_formatters();
      appConfig = typeof window !== "undefined" ? window.CONFIG || {} : {};
      Y_AXIS_WIDTH = appConfig.Y_AXIS_WIDTH || 75;
    }
  });

  // js/charts_plugins.js
  var appConfig2, CHART_COLORS2, cViewsRangeLineOnTop, cViewsRangeLabels, cViewsRangeV30Ticks;
  var init_charts_plugins = __esm({
    "js/charts_plugins.js"() {
      init_utils_formatters();
      appConfig2 = typeof window !== "undefined" ? window.CONFIG || {} : {};
      CHART_COLORS2 = appConfig2.CHART_COLORS || {
        primary: "#6366f1",
        primarySoft: "rgba(99, 102, 241, 0.7)",
        success: "#10b981",
        successAlt: "#16c964",
        purple: "#5b0cd3",
        v30: "#22c55e",
        scatter: "#ef4444",
        scatterBg: "rgba(239, 68, 68, 0.65)",
        orange: "#f59e0b",
        grid: "#e2e8f0"
      };
      cViewsRangeLineOnTop = {
        id: "cViewsRangeLineOnTop",
        afterDatasetsDraw(chart) {
          const lineEntry = chart.data.datasets.map((dataset, index) => ({
            dataset,
            index,
            meta: chart.getDatasetMeta(index)
          })).find(
            (entry) => entry.meta && entry.meta.type === "line" && chart.isDatasetVisible(entry.index)
          );
          if (!lineEntry) return;
          chart.ctx.save();
          lineEntry.meta.controller.draw();
          chart.ctx.restore();
        }
      };
      cViewsRangeLabels = {
        id: "cViewsRangeLabels",
        afterDatasetsDraw(chart) {
          const { ctx: chartCtx } = chart;
          chartCtx.save();
          chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            if (!chart.isDatasetVisible(datasetIndex)) return;
            if (meta.type !== "line") return;
            meta.data.forEach((elem, index) => {
              const rawVal = dataset.data[index];
              if (rawVal === null || rawVal === void 0) return;
              const pos = elem.tooltipPosition();
              const label = dataset.yAxisID === "y" ? fmtViews(rawVal) : rawVal;
              chartCtx.font = '600 11px "Inter", sans-serif';
              chartCtx.fillStyle = CHART_COLORS2.purple || "#5b0cd3";
              let x = pos.x + 12;
              const area = chart.chartArea;
              x = Math.min(area.right - 8, Math.max(area.left + 8, x));
              const y = pos.y - 4;
              chartCtx.textAlign = "left";
              chartCtx.textBaseline = "middle";
              chartCtx.fillText(label, x, y);
            });
          });
          chartCtx.restore();
        }
      };
      cViewsRangeV30Ticks = (rangeBarMetric, rangeStats = []) => ({
        id: "cViewsRangeV30Ticks",
        afterDraw(chart) {
          const scaleX = chart.scales.x;
          const activeScale = chart.scales.y;
          if (!scaleX || !activeScale) return;
          const area = chart.chartArea;
          const chartCtx = chart.ctx;
          chartCtx.save();
          chartCtx.font = '700 11px "Inter", sans-serif';
          chartCtx.fillStyle = "#0f172a";
          chartCtx.textAlign = "center";
          chartCtx.textBaseline = "top";
          const topY = area.top + 10;
          scaleX.ticks.forEach((_, index) => {
            const value = rangeBarMetric === "views" ? rangeStats[index]?.avgViews : rangeStats[index]?.avgV30;
            if (value === null || value === void 0) return;
            const x = scaleX.getPixelForTick(index);
            const xClamped = Math.min(area.right - 8, Math.max(area.left + 8, x));
            chartCtx.fillText(fmtViews(value), xClamped, topY);
          });
          chartCtx.restore();
        }
      });
    }
  });

  // js/charts_render.js
  function updateChartData(chartKey, config) {
    if (!appState || typeof Chart === "undefined") return null;
    const current = appState.getChart(chartKey);
    const currentType = appState.getChartType(chartKey);
    const nextType = config.type;
    if (!current || currentType !== nextType) {
      appState.clearChart(chartKey);
      const canvas = byId2(chartKey);
      if (!canvas) return null;
      canvas.width = canvas.width;
      const context = canvas.getContext("2d");
      if (!context) return null;
      const chart = new Chart(context, config);
      appState.setChart(chartKey, chart, nextType);
      return chart;
    }
    current.config.type = nextType;
    current.config.data = config.data;
    current.config.options = config.options;
    current.config.plugins = config.plugins || [];
    current.data = config.data;
    current.options = config.options;
    current.update();
    appState.setChartType(chartKey, nextType);
    return current;
  }
  function renderCharts() {
    if (!appState) return;
    const filteredData = appState.getFilteredData();
    const period = document.querySelector('input[name="timeGroup"]:checked')?.value || "week";
    const grouped = groupData(filteredData, period);
    const keys = Object.keys(grouped).sort(
      (a, b) => getSortValue(a, period) - getSortValue(b, period)
    );
    const labels = keys.map((key) => grouped[key].label);
    const durationRanges = typeof appState.getDurationRanges === "function" ? appState.getDurationRanges() : [];
    const rangesForChart = Array.isArray(durationRanges) && durationRanges.length > 0 ? durationRanges : CONFIG_DURATION_RANGES;
    const safeRanges = rangesForChart.map((range) => {
      const min = Number.isFinite(range.min) ? range.min : 0;
      const max = Number.isFinite(range.max) ? range.max : Infinity;
      const label = range.label ? range.label : `${fmtDurClock(min)}${Number.isFinite(max) ? `-${fmtDurClock(max)}` : "+"}`;
      return { ...range, min, max, label };
    });
    const chart1Mode = appState.getMode("chart1");
    const chart1Metric = appState.getMode("chart1Metric") || "videos";
    const chart1IsLine = chart1Mode === "line";
    const chart1IsMinutes = chart1Metric === "minutes";
    const chart1DatasetLabel = chart1IsMinutes ? "Minutos totales" : "Videos";
    const chart1Series = chart1IsMinutes ? keys.map((key) => Math.round((grouped[key].durSum || 0) / 60)) : keys.map((key) => grouped[key].count);
    const chart1IsStacked = chart1Metric === "minutes";
    const chart1Options = commonOpt(void 0, {
      ticks: {
        precision: 0,
        callback: (value) => {
          const num = Number(value);
          if (!Number.isFinite(num)) return value;
          const rounded = Number.isInteger(num) ? num : Math.round(num * 10) / 10;
          return Math.abs(rounded) >= 1e3 ? rounded.toLocaleString("en-US") : rounded;
        }
      },
      beginAtZero: true
    });
    if (chart1IsLine && !chart1IsStacked) {
      chart1Options.elements = {
        line: { tension: 0, borderWidth: 3 },
        point: { radius: 4, hoverRadius: 6 }
      };
      chart1Options.interaction = { mode: "index", intersect: false };
    }
    chart1Options.plugins = chart1Options.plugins || {};
    chart1Options.plugins.legend = chart1Options.plugins.legend || {};
    chart1Options.plugins.legend.display = chart1IsStacked;
    if (chart1IsStacked) {
      chart1Options.plugins.legend.labels = {
        usePointStyle: true,
        boxWidth: 12
      };
      chart1Options.scales = chart1Options.scales || {};
      chart1Options.scales.x = { ...chart1Options.scales.x || {}, stacked: true };
      chart1Options.scales.y = { ...chart1Options.scales.y || {}, stacked: true };
    } else if (chart1Options.scales?.x && chart1Options.scales?.y) {
      chart1Options.scales.x.stacked = false;
      chart1Options.scales.y.stacked = false;
    }
    const keyIndex = new Map(keys.map((key, idx) => [key, idx]));
    const chart1Datasets = chart1IsStacked ? safeRanges.map((range, index) => ({
      type: "bar",
      label: range.label,
      data: keys.map(() => 0),
      backgroundColor: DURATION_STACK_COLORS[index % DURATION_STACK_COLORS.length],
      borderColor: DURATION_STACK_COLORS[index % DURATION_STACK_COLORS.length],
      borderWidth: 1,
      stack: "minutes",
      barPercentage: 0.86,
      categoryPercentage: 0.82
    })) : [
      {
        label: chart1DatasetLabel,
        data: chart1Series,
        backgroundColor: CHART_COLORS3.primary,
        borderColor: CHART_COLORS3.primary,
        borderRadius: chart1IsLine ? 0 : 3,
        borderWidth: chart1IsLine ? 3 : 0,
        fill: false,
        pointBackgroundColor: CHART_COLORS3.primary,
        pointBorderColor: "#ffffff",
        pointBorderWidth: chart1IsLine ? 2 : 0,
        pointRadius: chart1IsLine ? 5 : 0,
        pointHoverRadius: chart1IsLine ? 7 : 0,
        tension: 0,
        order: 1
      }
    ];
    if (chart1IsStacked) {
      filteredData.forEach((dataPoint) => {
        const key = periodKeyForDate(dataPoint.date, period);
        const keyPos = keyIndex.get(key);
        if (keyPos === void 0) return;
        const rangeIndex = safeRanges.findIndex(
          (range) => dataPoint.dur >= range.min && dataPoint.dur < range.max
        );
        if (rangeIndex === -1) return;
        const target = chart1Datasets[rangeIndex];
        target.data[keyPos] += dataPoint.dur / 60;
      });
    }
    updateChartData("c1", {
      type: chart1IsStacked ? "bar" : chart1IsLine ? "line" : "bar",
      data: {
        labels,
        datasets: chart1Datasets
      },
      options: chart1Options
    });
    const rangeStats = safeRanges.map((range) => {
      const { min: safeMin, max: safeMax, label } = range;
      const videos = filteredData.filter(
        (dataPoint) => dataPoint.dur >= safeMin && dataPoint.dur < safeMax
      );
      const count = videos.length;
      const avgV30 = count ? videos.reduce((sum, dataPoint) => sum + dataPoint.v30, 0) / count : 0;
      const avgViews = count ? videos.reduce((sum, dataPoint) => sum + dataPoint.views, 0) / count : 0;
      return { ...range, min: safeMin, max: safeMax, label, count, avgV30, avgViews };
    });
    const maxCount = Math.max(...rangeStats.map((range) => range.count), 0) || 1;
    const maxV30 = Math.max(...rangeStats.map((range) => range.avgV30), 0) || 1;
    const maxViewsAvg = Math.max(...rangeStats.map((range) => range.avgViews), 0) || 1;
    const rangeBarMetric = appState.getMode("rangeBars") || "views";
    updateChartData("cViewsRange", {
      type: "bar",
      data: {
        labels: rangeStats.map((range) => range.label),
        datasets: [
          {
            type: "bar",
            label: rangeBarMetric === "views" ? "Views Promedio" : V30_LABEL_PROMEDIO,
            data: rangeBarMetric === "views" ? rangeStats.map((range) => range.avgViews) : rangeStats.map((range) => range.avgV30),
            backgroundColor: rangeBarMetric === "views" ? CHART_COLORS3.success : "rgba(59, 130, 246, 0.65)",
            borderColor: rangeBarMetric === "views" ? CHART_COLORS3.successAlt : "rgba(37, 99, 235, 0.9)",
            borderRadius: 6,
            barPercentage: 0.82,
            categoryPercentage: 0.78,
            yAxisID: "y",
            order: 1
          },
          {
            type: "line",
            label: "Videos",
            data: rangeStats.map((range) => range.count),
            borderColor: CHART_COLORS3.purple,
            backgroundColor: CHART_COLORS3.purple,
            borderWidth: 3,
            tension: 0,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBorderWidth: 2.4,
            pointBorderColor: "#ffffff",
            pointBackgroundColor: CHART_COLORS3.purple,
            pointHitRadius: 10,
            order: 99,
            z: 10,
            clip: false,
            segment: { borderJoinStyle: "round" },
            yAxisID: "yCount"
          }
        ]
      },
      options: {
        responsive: true,
        animation: false,
        responsiveAnimationDuration: 0,
        maintainAspectRatio: false,
        layout: { padding: { top: 12, bottom: 32, right: 18 } },
        plugins: {
          legend: { display: true, position: "top" },
          tooltip: {
            callbacks: {
              label: (context) => {
                if (context.dataset.yAxisID === "y") {
                  const metricLabel = rangeBarMetric === "views" ? "Views Prom" : V30_LABEL_PROM;
                  return `${metricLabel}: ${fmtViews(context.parsed.y)}`;
                }
                return `Videos: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: false },
            grid: { color: CHART_COLORS3.grid }
          },
          y: {
            position: "left",
            title: {
              display: true,
              text: rangeBarMetric === "views" ? "Views promedio" : V30_LABEL_PROM_LOWER
            },
            ticks: { callback: (value) => fmtAxisViews(value) },
            suggestedMax: rangeBarMetric === "views" ? maxViewsAvg * 1.3 : maxV30 * 1.3,
            grace: "20%",
            afterFit: (scale) => {
              scale.width = appConfig3.Y_AXIS_WIDTH || 75;
            }
          },
          yCount: {
            position: "right",
            title: { display: true, text: "Cantidad de videos" },
            grid: { drawOnChartArea: false },
            ticks: {
              precision: 0,
              callback: (value) => Number.isInteger(value) ? value : ""
            },
            suggestedMax: maxCount * 1.15,
            grace: "15%",
            afterFit: (scale) => {
              scale.width = appConfig3.Y_AXIS_WIDTH || 75;
            }
          }
        }
      },
      plugins: [
        cViewsRangeLineOnTop,
        cViewsRangeLabels,
        cViewsRangeV30Ticks(rangeBarMetric, rangeStats)
      ]
    });
    const chart2Mode = appState.getMode("chart2");
    const chart2IsLine = chart2Mode === "line";
    const chart2Options = commonOpt(void 0, {
      ticks: { callback: (value) => fmtAxisViews(value) },
      beginAtZero: true
    });
    if (chart2IsLine) {
      chart2Options.elements = {
        line: { tension: 0, borderWidth: 3 },
        point: { radius: 4, hoverRadius: 6 }
      };
      chart2Options.interaction = { mode: "index", intersect: false };
    }
    updateChartData("c2", {
      type: chart2IsLine ? "line" : "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Views Totales",
            data: keys.map((key) => grouped[key].vSum),
            backgroundColor: CHART_COLORS3.success,
            borderColor: CHART_COLORS3.successAlt,
            borderRadius: chart2IsLine ? 0 : 3,
            borderWidth: chart2IsLine ? 3 : 0,
            pointBackgroundColor: CHART_COLORS3.success,
            pointBorderColor: "#ffffff",
            pointRadius: chart2IsLine ? 5 : 0,
            pointHoverRadius: chart2IsLine ? 7 : 0,
            fill: false,
            tension: 0
          }
        ]
      },
      options: chart2Options
    });
    const durationPoints = filteredData.filter(
      (dataPoint) => Number.isFinite(dataPoint.dur) && dataPoint.dur > 0
    );
    const scatterDur = durationPoints.map((dataPoint) => ({
      x: dataPoint.date,
      y: dataPoint.dur,
      title: dataPoint.title
    }));
    const dailyDurations = /* @__PURE__ */ new Map();
    durationPoints.forEach((dataPoint) => {
      const dayDate = normalizeDateLocal(dataPoint.date);
      const dayKey = dayDate.getTime();
      const bucket = dailyDurations.get(dayKey);
      if (!bucket) {
        dailyDurations.set(dayKey, {
          date: dayDate,
          durSum: dataPoint.dur,
          count: 1
        });
      } else {
        bucket.durSum += dataPoint.dur;
        bucket.count += 1;
      }
    });
    const dailySeries = Array.from(dailyDurations.values()).sort((a, b) => a.date - b.date);
    const lineDur = dailySeries.map((dataPoint, index, arr) => {
      if (index < MA_WINDOW - 1) return null;
      let durSum = 0;
      let totalCount = 0;
      for (let j = 0; j < MA_WINDOW; j += 1) {
        durSum += arr[index - j].durSum;
        totalCount += arr[index - j].count;
      }
      if (!totalCount) return null;
      return {
        x: dataPoint.date,
        y: durSum / totalCount,
        title: `Media movil (${MA_WINDOW}d)`
      };
    }).filter((point) => point !== null);
    updateChartData("cTrendDur", {
      type: "line",
      data: {
        datasets: [
          {
            label: "Video",
            data: scatterDur,
            type: "scatter",
            backgroundColor: "rgba(99, 102, 241, 0.35)",
            borderColor: CHART_COLORS3.primary,
            borderWidth: 0.6,
            hoverBorderWidth: 1,
            radius: 3.5,
          order: 1
        },
        {
          label: `Media Movil (${MA_WINDOW}d)`,
          data: lineDur,
          borderColor: CHART_COLORS3.orange,
          borderWidth: 3.2,
            pointRadius: 0,
            tension: 0.3,
            order: 99,
            z: 10
          }
        ]
      },
      options: timeScatterOpt("Duracion")
    });
    const chart4Metric = appState.getMode("chart4");
    const chart3Mode = appState.getMode("chart3");
    const chart3IsLine = chart3Mode === "line";
    const chart3Options = commonOpt(void 0, {
      ticks: { callback: (value) => fmtAxisViews(value) }
    });
    if (chart3Options.scales?.y) {
      chart3Options.scales.y.beginAtZero = true;
    }
    if (chart3IsLine) {
      chart3Options.elements = {
        line: { tension: 0, borderWidth: 3 },
        point: { radius: 4, hoverRadius: 6 }
      };
      chart3Options.interaction = { mode: "index", intersect: false };
    }
    updateChartData("cWeeklyViews", {
      type: chart3IsLine ? "line" : "bar",
      data: {
        labels,
        datasets: [
          {
            label: chart4Metric === "views" ? "Views Prom" : V30_LABEL_PROM,
            data: keys.map((key) => {
              const group = grouped[key];
              const divisor = group.count || 1;
              return chart4Metric === "views" ? group.vSum / divisor : group.v30Sum / divisor;
            }),
            backgroundColor: chart4Metric === "views" ? CHART_COLORS3.primarySoft : CHART_COLORS3.v30,
            borderColor: chart4Metric === "views" ? CHART_COLORS3.primary : CHART_COLORS3.v30,
            borderRadius: chart3IsLine ? 0 : 4,
            borderWidth: chart3IsLine ? 3 : 0,
            pointBorderWidth: chart3IsLine ? 2 : 0,
            pointBackgroundColor: chart4Metric === "views" ? CHART_COLORS3.primary : CHART_COLORS3.v30,
            pointBorderColor: "#ffffff",
            pointRadius: chart3IsLine ? 5 : 0,
            pointHoverRadius: chart3IsLine ? 7 : 0,
            fill: false,
            tension: 0,
            yAxisID: "y",
            order: 1
          }
        ]
      },
      options: chart3Options
    });
    const scatterViewsDur = filteredData.filter((dataPoint) => dataPoint.dur > 0).map((dataPoint) => ({
      x: dataPoint.dur,
      y: dataPoint.views,
      title: dataPoint.title,
      views: dataPoint.views
    }));
    const now = /* @__PURE__ */ new Date();
    const scatterPerDay = filteredData.filter(
      (dataPoint) => dataPoint.dur > 0 && dataPoint.date instanceof Date && dataPoint.date.getTime() <= now.getTime() - RECENT_DAYS_IGNORE * MS_PER_DAY
    ).map((dataPoint) => {
      const daysLive = Math.max(1, (now - dataPoint.date) / MS_PER_DAY);
      const viewsPerDay = dataPoint.views / daysLive;
      return {
        x: dataPoint.dur,
        y: viewsPerDay,
        title: dataPoint.title,
        views: dataPoint.views
      };
    });
    const chart6Mode = appState.getMode("chart6");
    const isPerDay = chart6Mode === "perDay";
    const scatterDataset = isPerDay ? scatterPerDay : scatterViewsDur;
    updateChartData("cScatterDurViews", {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Video",
            data: scatterDataset,
            backgroundColor: CHART_COLORS3.scatterBg,
            borderColor: CHART_COLORS3.scatter,
            borderWidth: 0.9,
            hoverBorderWidth: 1.2,
            radius: 4,
            hoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        responsiveAnimationDuration: 0,
        layout: { padding: { right: 18 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const raw = context.raw || {};
                const title = raw.title ? raw.title.length > 45 ? `${raw.title.substring(0, 42)}...` : raw.title : "Video";
                const value = context.parsed?.y || 0;
                const yLabel = isPerDay ? `Views/Dia: ${fmtViews(value)}` : `Views Totales: ${fmtViews(value)}`;
                return `${title} | Dur: ${fmtDurClock(context.parsed.x)} | ${yLabel}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: "Duracion" },
            ticks: { callback: (value) => fmtDurClock(value) }
          },
          y: {
            title: {
              display: true,
              text: isPerDay ? "Views / Dia" : "Views Totales"
            },
            ticks: { callback: (value) => fmtAxisViews(value) },
            afterFit: (scale) => {
              scale.width = appConfig3.Y_AXIS_WIDTH || 75;
            }
          }
        }
      }
    });
  }
  var appConfig3, CHART_COLORS3, MA_WINDOW, V30_LABEL, V30_LABEL_PROM, V30_LABEL_PROMEDIO, V30_LABEL_PROM_LOWER, DURATION_STACK_COLORS, CONFIG_DURATION_RANGES, MS_PER_DAY, RECENT_DAYS_IGNORE, appState, byId2, periodKeyForDate;
  var init_charts_render = __esm({
    "js/charts_render.js"() {
      init_utils_formatters();
      init_data_normalize();
      init_charts_config();
      init_charts_plugins();
      appConfig3 = typeof window !== "undefined" ? window.CONFIG || {} : {};
      ({
        CHART_COLORS: CHART_COLORS3 = {
          primary: "#6366f1",
          primarySoft: "rgba(99, 102, 241, 0.7)",
          success: "#10b981",
          successAlt: "#16c964",
          purple: "#5b0cd3",
          v30: "#22c55e",
          scatter: "#ef4444",
          scatterBg: "rgba(239, 68, 68, 0.65)",
          orange: "#f59e0b",
          grid: "#e2e8f0"
        },
        MA_WINDOW = 10
      } = appConfig3);
      V30_LABEL = "Views a 30 dias";
      V30_LABEL_PROM = `${V30_LABEL} Prom`;
      V30_LABEL_PROMEDIO = `${V30_LABEL} Promedio`;
      V30_LABEL_PROM_LOWER = `${V30_LABEL} promedio`;
      DURATION_STACK_COLORS = [
        "#0ea5e9",
        "#22c55e",
        "#ef4444",
        "#f97316",
        "#a855f7",
        "#14b8a6",
        "#eab308",
        "#6366f1"
      ];
      CONFIG_DURATION_RANGES = appConfig3.DURATION_RANGES || [];
      MS_PER_DAY = 1e3 * 60 * 60 * 24;
      RECENT_DAYS_IGNORE = 14;
      appState = typeof window !== "undefined" ? window.State : null;
      byId2 = (id) => typeof document !== "undefined" ? document.getElementById(id) : null;
      periodKeyForDate = (dateObj, period) => {
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
        if (period === "year") return `${date.getFullYear()}`;
        return "";
      };
    }
  });

  // js/ui_topVideos.js
  function resetThumbObserver() {
    if (thumbObserver) thumbObserver.disconnect();
    thumbObserver = null;
    thumbObserverRoot = null;
  }
  function loadThumbImage(imgEl) {
    if (!imgEl) return;
    const realSrc = imgEl.dataset.thumbSrc;
    if (!realSrc) return;
    imgEl.src = realSrc;
    imgEl.dataset.thumbLoaded = "1";
    if (thumbObserver) thumbObserver.unobserve(imgEl);
  }
  function ensureThumbObserver(rootEl) {
    if (typeof window === "undefined" || !("IntersectionObserver" in window))
      return null;
    if (thumbObserver && thumbObserverRoot === rootEl) return thumbObserver;
    resetThumbObserver();
    thumbObserverRoot = rootEl || null;
    thumbObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            loadThumbImage(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: thumbObserverRoot,
        rootMargin: "48px 0px",
        threshold: 0.01
      }
    );
    return thumbObserver;
  }
  function hydrateLazyThumbs(tbody) {
    if (!tbody) return;
    const lazyImgs = tbody.querySelectorAll("img[data-thumb-src]");
    if (!lazyImgs.length) return;
    const scrollContainer = tbody.closest(".table-shell");
    const observer = ensureThumbObserver(scrollContainer);
    lazyImgs.forEach((imgEl) => {
      if (imgEl.dataset.thumbLoaded === "1") return;
      if (observer) {
        observer.observe(imgEl);
      } else {
        loadThumbImage(imgEl);
      }
    });
  }
  function renderPlatformBadge(platformRaw) {
    const key = String(platformRaw || "").trim().toLowerCase();
    const meta = PLATFORM_META[key] || {
      label: platformRaw ? String(platformRaw).trim() : "Otro",
      className: "platform-chip--default",
      iconClass: "fa-solid fa-video"
    };
    const label = escapeHtml(meta.label || "Otro");
    const classes = [
      "platform-chip",
      "platform-chip--static",
      "is-active",
      meta.className || "platform-chip--default"
    ].filter(Boolean).join(" ");
    const iconHtml = meta.iconClass ? `<i class="${meta.iconClass}" aria-hidden="true"></i>` : "";
    return `<span class="${classes}" title="${label}">${iconHtml}<span>${label}</span></span>`;
  }
  function renderTopVideos() {
    if (!appState2) return;
    const filteredData = appState2.getFilteredData();
    const limit = appConfig4.TOP_VIDEOS_LIMIT ?? filteredData.length;
    const sorted = [...filteredData].sort((a, b) => b.views - a.views).slice(0, limit);
    const tbody = byId3("topVideosBody");
    if (!tbody) return;
    resetThumbObserver();
    const rows = sorted.map(
      (dataPoint, index) => `
        <tr class="hover:bg-slate-50">
          <td class="p-3 text-center text-slate-500 font-semibold">${index + 1}</td>
          <td class="p-3 text-center text-slate-500 whitespace-nowrap">${fmtDateShort(dataPoint.date)}</td>
          <td class="p-3 text-right font-bold text-primary">${fmtViews(dataPoint.views)}</td>
          <td class="p-3 text-right text-slate-600 font-medium">${fmtViews(dataPoint.v30)}</td>
          <td class="p-3 text-center text-slate-500 whitespace-nowrap">${fmtDur(dataPoint.dur)}</td>
          <td class="p-3 text-slate-700 font-medium align-top max-w-[760px]">
            <a href="${dataPoint.url}" target="_blank" class="video-link video-entry">
              <div class="video-thumb${dataPoint.thumb ? "" : " video-thumb--empty"}">
                ${dataPoint.thumb ? `<img src="${THUMB_PLACEHOLDER}" data-thumb-src="${escapeHtml(
        dataPoint.thumb
      )}" alt="Miniatura de ${escapeHtml(
        dataPoint.title
      )}" loading="lazy" decoding="async" />` : '<span class="video-thumb__placeholder">Sin imagen</span>'}
              </div>
              <div class="video-meta">
                <div class="video-title" title="${escapeHtml(dataPoint.title)}">
                  ${escapeHtml(dataPoint.title)}
                </div>
                <div class="video-creator">${escapeHtml(dataPoint.creator)}</div>
              </div>
            </a>
          </td>
          <td class="p-3 text-center">${renderPlatformBadge(dataPoint.platform)}</td>
        </tr>`
    ).join("");
    tbody.innerHTML = rows;
    hydrateLazyThumbs(tbody);
  }
  var appConfig4, appState2, THUMB_PLACEHOLDER, thumbObserver, thumbObserverRoot, PLATFORM_META, byId3;
  var init_ui_topVideos = __esm({
    "js/ui_topVideos.js"() {
      init_utils_formatters();
      appConfig4 = typeof window !== "undefined" ? window.CONFIG || {} : {};
      appState2 = typeof window !== "undefined" ? window.State : null;
      THUMB_PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
      thumbObserver = null;
      thumbObserverRoot = null;
      PLATFORM_META = {
        facebook: {
          label: "Facebook",
          className: "platform-chip--facebook",
          iconClass: "fa-brands fa-facebook"
        },
        tiktok: {
          label: "TikTok",
          className: "platform-chip--tiktok",
          iconClass: "fa-brands fa-tiktok"
        },
        instagram: {
          label: "Instagram",
          className: "platform-chip--instagram",
          iconClass: "fa-brands fa-instagram"
        },
        youtube: {
          label: "YouTube",
          className: "platform-chip--youtube",
          iconClass: "fa-brands fa-youtube"
        }
      };
      byId3 = (id) => typeof document !== "undefined" ? document.getElementById(id) : null;
    }
  });

  // js/app.js
  var require_app = __commonJS({
    "js/app.js"(exports, module) {
      init_utils_formatters();
      init_utils_parsers();
      init_data_normalize();
      init_filters_sliders();
      init_filters_toggles();
      init_charts_render();
      init_charts_config();
      init_ui_topVideos();
      var appConfig5 = typeof window !== "undefined" ? window.CONFIG || {} : {};
      var appState3 = typeof window !== "undefined" ? window.State : null;
      var CHART_COLORS4 = appConfig5.CHART_COLORS || {};
      var VIEW_STEP = appConfig5.VIEW_STEP || 1e5;
      var DUR_STEP = appConfig5.DUR_STEP || 1;
      var PILL_ACTIVE = "bg-white text-primary-darker shadow-sm border border-primary-soft";
      var PILL_INACTIVE = "text-primary-dark hover:text-primary-darker";
      var MS_PER_DAY2 = 1e3 * 60 * 60 * 24;
      var MAX_RANGE_DAYS = 0;
      var PLATFORM_COLUMNS = [
        { key: "facebook", label: "Facebook" },
        { key: "tiktok", label: "TikTok" },
        { key: "youtube", label: "YouTube" },
        { key: "instagram", label: "Instagram" }
      ];
      var viewMaxCap = appConfig5.VIEW_MAX_CAP || 5e7;
      var viewMinFloor = appConfig5.VIEW_MIN_FLOOR || 0;
      var durMaxCap = appConfig5.DUR_MAX_CAP || 360;
      var durMinFloor = appConfig5.DUR_MIN_FLOOR || 0;
      var defaultDurationRanges = Array.isArray(appConfig5.DURATION_RANGES) ? appConfig5.DURATION_RANGES : [];
      var durationRangeStart = Number.isFinite(defaultDurationRanges[0]?.min) && defaultDurationRanges[0].min >= 0 ? defaultDurationRanges[0].min : Math.max(0, durMinFloor);
      var defaultDurationCuts = defaultDurationRanges.map((range) => range.max).filter((value) => Number.isFinite(value));
      var durationCutSlots = Math.max(defaultDurationCuts.length > 0 ? defaultDurationCuts.length : 5, 5);
      var durationCuts = [];
      var formatViewsShortWithCap = (value, isMax) => formatViewsShort(value, isMax, viewMaxCap);
      var byId4 = (id) => typeof document !== "undefined" ? document.getElementById(id) : null;
      if (typeof window !== "undefined" && window.Chart) {
        Chart.defaults.animation = false;
        Chart.defaults.transitions.active.animation.duration = 0;
        Chart.defaults.responsiveAnimationDuration = 0;
        Chart.defaults.font.family = "Inter, sans-serif";
        Chart.defaults.scales.linear.ticks.font = {
          size: 12,
          family: "Inter, sans-serif"
        };
        Chart.defaults.scales.linear.ticks.padding = 20;
      }
      var dropZone;
      var fileInput;
      var chart1ToggleController;
      var chart1MetricToggleController;
      var chart1LegendPrimaryLabel;
      var chart1LegendPrimarySwatch;
      var chart6ToggleController;
      var summaryToggleController;
      var dayRangeToggleController;
      var chart2ToggleController;
      var chart3ToggleController;
      var durationPresetToggleController;
      var chart4V30Button;
      var rangeBarsV30Button;
      var chart6Note;
      var viewSlider;
      var durSlider;
      var timeGroupUserOverride = false;
      var durationPresets = {
        shorts: [20, 30, 40, 60, 90],
        facebook: [],
        youtube: [300, 600, 900, 1200, 1800],
        ultralong: [600, 1200, 1800, 2700, 3600]
      };
      var durationPresetRequirements = {
        facebook: 4 * 60,
        youtube: 30 * 60,
        ultralong: 60 * 60
      };
      var normalizePlatformValue = (value) => String(value || "").trim().toLowerCase();
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
        const visible = byId4(id);
        const native = byId4(`${id}Native`);
        const parsed = date instanceof Date ? date : new Date(date);
        if (!parsed || Number.isNaN(parsed.getTime())) return null;
        if (visible) visible.value = fmtDateInput(parsed);
        if (native) native.valueAsDate = parsed;
        return parsed;
      }
      function syncNativeDateFromVisible(id) {
        const visible = byId4(id);
        const native = byId4(`${id}Native`);
        const parsed = normalizeDateInputEl(visible);
        if (native && parsed) native.valueAsDate = parsed;
        return parsed;
      }
      function getActivePlatforms() {
        const chips = Array.from(
          document.querySelectorAll("[data-platform-chip].is-active")
        );
        return chips.map((chip) => normalizePlatformValue(chip.dataset.platform)).filter(Boolean);
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
        if (period === "year") return `${date.getFullYear()}`;
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
        const padded = Math.ceil((maxDurVal || durMaxCap) * 1.1 / DUR_STEP) * DUR_STEP;
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
        const padded = Math.ceil((maxViewsVal || 0) * 1.1 / VIEW_STEP) * VIEW_STEP;
        const cap = Math.max(VIEW_STEP, padded);
        viewSlider.applyBounds({ maxCap: cap });
      }
      function setViewMinFromData(minViewsVal) {
        const safeFloor = Math.max(
          0,
          Math.floor((minViewsVal || 0) / VIEW_STEP) * VIEW_STEP
        );
        viewSlider.applyBounds({ minFloor: safeFloor });
        const { min, max } = viewSlider.getValues();
        viewSlider.setDefaults(
          Math.max(safeFloor, min),
          Math.max(Math.max(safeFloor, min), max)
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
          const source = rawCuts && i < rawCuts.length ? rawCuts[i] : prev + DUR_STEP;
          let candidate = parseDurationText(source);
          if (!Number.isFinite(candidate)) candidate = prev + DUR_STEP;
          candidate = Math.round(candidate);
          if (candidate <= prev) candidate = prev + DUR_STEP;
          normalized.push(candidate);
        }
        return normalized;
      }
      var defaultDurationCutsNormalized = normalizeDurationCuts(defaultDurationCuts);
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
            label: formatDurationRangeLabel(min, max)
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
        if (appState3 && typeof appState3.setDurationRanges === "function") {
          appState3.setDurationRanges(ranges);
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
        const preview = byId4("durationRangePreview");
        if (!preview) return;
        preview.textContent = "";
      }
      var scheduleRangeChartRender = /* @__PURE__ */ (() => {
        let timer = null;
        return (delay = 320) => {
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
          return `${hours}:${minsRemainder.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
        }
        return `${minutes}:${sec.toString().padStart(2, "0")}`;
      }
      function syncDurationInputValues(cutsArray = durationCuts) {
        const container = byId4("durationRangeInputs");
        if (!container) return;
        container.querySelectorAll("[data-duration-cut]").forEach((input) => {
          const idx = Number(input.dataset.durationCut);
          if (Number.isNaN(idx) || cutsArray[idx] === void 0) return;
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
          skipRender: true
        });
        syncDurationInputValues(cuts);
        scheduleRangeChartRender();
      }
      function renderDurationRangeInputs() {
        const container = byId4("durationRangeInputs");
        if (!container || !Array.isArray(durationCuts)) return;
        const ensureStyle = () => {
          const existing = document.getElementById("dur-slider-style");
          const style = existing || document.createElement("style");
          style.id = "dur-slider-style";
          style.textContent = `
      .dur-slider{position:relative;width:100%;height:52px;margin:0;padding:20px 10px 8px;box-sizing:border-box;overflow:visible;}
      .dur-track{position:absolute;top:50%;left:10%;right:10%;height:3px;transform:translateY(-50%);background:linear-gradient(90deg,#7c8bff,#6366f1);border-radius:999px;box-shadow:0 2px 6px rgba(99,102,241,0.12);}
      .dur-seg{position:absolute;top:50%;height:3px;transform:translateY(-50%);background:linear-gradient(90deg,rgba(99,102,241,0.9),rgba(124,139,255,0.85));border-radius:999px;}
      .dur-handle{position:absolute;top:50%;width:20px;height:20px;margin-left:-10px;transform:translateY(-50%);border-radius:999px;background:#ffffff;border:2px solid #6366f1;box-shadow:0 2px 8px rgba(99,102,241,0.22);cursor:grab;z-index:2;}
      .dur-handle:active{cursor:grabbing;transform:translateY(-50%) scale(1.08);}
      .dur-label{position:absolute;top:2px;padding:2px 6px;border-radius:6px;background:#fff;border:1px solid rgba(99,102,241,0.18);color:#1e293b;font-size:10px;font-weight:600;white-space:nowrap;transform:translateX(-50%);box-shadow:0 1px 4px rgba(0,0,0,0.08);z-index:3;}
    `;
          if (!existing) document.head.appendChild(style);
        };
        ensureStyle();
        const minSec = Math.max(durationRangeStart, 10);
        const maxSec = Math.max(minSec + DUR_STEP * 2, durMaxCap || 0);
        const firstCutMin = Math.max(minSec + DUR_STEP, 10);
        const lastCutCap = Math.max(minSec + DUR_STEP * 2, maxSec);
        const getSafeCuts = () => durationCuts.map((val, idx) => {
          if (idx === 0) return Math.max(firstCutMin, val || 0);
          if (idx === durationCuts.length - 1) return Math.min(lastCutCap, val || 0);
          return Math.max(minSec + DUR_STEP, Math.min(lastCutCap, val || 0));
        });
        const clampPct2 = (p) => Math.min(100, Math.max(0, p));
        const edgePadPct = 10;
        const sliderSpanPct = Math.max(1, 100 - edgePadPct * 2);
        const valueToPct = (value, minVal, maxVal, cutsArr = []) => {
          const cutsSafe = Array.isArray(cutsArr) ? cutsArr : [];
          const startPad = edgePadPct;
          const inner = sliderSpanPct;
          if (!cutsSafe.length) return clampPct2(startPad + inner / 2);
          const segmentWidth = cutsSafe.length > 1 ? inner / (cutsSafe.length - 1) : inner;
          const idx = cutsSafe.indexOf(value);
          if (idx >= 0) return clampPct2(startPad + idx * segmentWidth);
          return clampPct2(startPad + ((value - minVal) / Math.max(1, maxVal - minVal)) * inner);
        };
        const pctToValue = (pct, minVal, maxVal, cutsArr = []) => {
          const cutsSafe = Array.isArray(cutsArr) ? cutsArr : [];
          const startPad = edgePadPct;
          const endPad = 100 - edgePadPct;
          const inner = sliderSpanPct;
          const safe = clampPct2(pct);
          if (!cutsSafe.length) return minVal + (safe / 100) * (maxVal - minVal);
          const segmentWidth = cutsSafe.length > 1 ? inner / (cutsSafe.length - 1) : inner;
          const positions = cutsSafe.map((_, idx) => startPad + idx * segmentWidth);
          const edgesPct = [0, ...positions, 100];
          const allPoints = [minVal, ...cutsSafe, maxVal];
          let segIndex = edgesPct.findIndex((edge, i) => i < edgesPct.length - 1 && safe >= edge && safe <= edgesPct[i + 1]);
          if (segIndex === -1) segIndex = edgesPct.length - 2;
          const segStart = edgesPct[segIndex];
          const segEnd = edgesPct[segIndex + 1];
          const local = segEnd === segStart ? 0 : (safe - segStart) / (segEnd - segStart);
          return allPoints[segIndex] + local * (allPoints[segIndex + 1] - allPoints[segIndex]);
        };
        function spreadPositions(pcts, sliderEl, minPx = 12) {
          const rect = sliderEl?.getBoundingClientRect();
          const width = rect?.width || 1;
          const minPct = Math.max(2, Math.min(6, (minPx / Math.max(width, 1)) * 100));
          if (!pcts.length) return [];
          const adjusted = [...pcts];
          for (let i = 1; i < adjusted.length; i += 1) {
            if (adjusted[i] < adjusted[i - 1] + minPct) adjusted[i] = adjusted[i - 1] + minPct;
          }
          for (let i = adjusted.length - 2; i >= 0; i -= 1) {
            if (adjusted[i] > adjusted[i + 1] - minPct) adjusted[i] = adjusted[i + 1] - minPct;
          }
          const offset = adjusted[0] < 0 ? -adjusted[0] : 0;
          for (let i = 0; i < adjusted.length; i += 1) adjusted[i] += offset;
          const overflow = adjusted[adjusted.length - 1] - 100;
          if (overflow > 0) {
            for (let i = adjusted.length - 1; i >= 0; i -= 1) adjusted[i] -= overflow;
          }
          return adjusted.map((v) => clampPct2(v));
        }
        const blendPositions = (pcts, blend = 0.6) => {
          if (!pcts.length) return [];
          const step = 100 / (pcts.length + 1);
          return pcts.map((p, i) => clampPct2(p * blend + step * (i + 1) * (1 - blend)));
        };
        const sliderPieces = [];
        sliderPieces.push('<div class="dur-slider" data-dur-slider><div class="dur-track"></div><div class="dur-segments"></div><div class="dur-handles"></div></div>');
        container.innerHTML = sliderPieces.join("");
        const sliderEl = container.querySelector("[data-dur-slider]");
        const segWrap = container.querySelector(".dur-segments");
        const handleWrap = container.querySelector(".dur-handles");
        const getPositions = () => {
          const cutsNow = getSafeCuts();
          const baseMin = minSec;
          const baseMax = Math.max(minSec + DUR_STEP, maxSec);
          const rawHandlePcts = cutsNow.map((val) => valueToPct(val, baseMin, baseMax, cutsNow));
          const handlePcts = rawHandlePcts;
          const startPct = edgePadPct;
          const endPct = 100 - edgePadPct;
          const edgesPct = [startPct, ...handlePcts, endPct];
          return { handlePcts, edgesPct, baseMin, baseMax };
        };
        const { handlePcts, edgesPct } = getPositions();
        segWrap.innerHTML = "";
        handleWrap.innerHTML = "";
        const segments = [];
        for (let i = 0; i < edgesPct.length - 1; i += 1) {
          const seg = document.createElement("div");
          seg.className = "dur-seg";
          seg.style.left = `${edgesPct[i]}%`;
          seg.style.width = `${edgesPct[i + 1] - edgesPct[i]}%`;
          segWrap.appendChild(seg);
          segments.push(seg);
        }
        const handles = [];
        const labels = [];
        getSafeCuts().forEach((val, idx) => {
          const handle = document.createElement("div");
          handle.className = "dur-handle";
          handle.dataset.handleIndex = String(idx);
          handle.style.left = `${handlePcts[idx]}%`;
          const label = document.createElement("div");
          label.className = "dur-label";
          label.textContent = fmtDurClock(val);
          label.style.left = `${handlePcts[idx]}%`;
          handleWrap.appendChild(handle);
          handleWrap.appendChild(label);
          handles.push(handle);
          labels.push(label);
        });
        const updateVisual = () => {
          const nextPositions = getPositions();
          nextPositions.handlePcts.forEach((pct, i) => {
            if (handles[i]) handles[i].style.left = `${pct}%`;
            if (labels[i]) {
              labels[i].style.left = `${pct}%`;
              labels[i].textContent = fmtDurClock(durationCuts[i]);
            }
          });
          for (let i = 0; i < segments.length; i += 1) {
            const startPct = nextPositions.edgesPct[i];
            const endPct = nextPositions.edgesPct[i + 1];
            segments[i].style.left = `${startPct}%`;
            segments[i].style.width = `${endPct - startPct}%`;
          }
        };
        let draggingIndex = null;
        const onMove = (evt) => {
          if (draggingIndex === null) return;
          evt.preventDefault();
          const rect = sliderEl.getBoundingClientRect();
          const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
          const pct = clampPct2(((clientX - rect.left) / rect.width) * 100);
          const baseMin = minSec;
          const baseMax = Math.max(minSec + DUR_STEP, maxSec);
          const candidate = Math.round(pctToValue(pct, baseMin, baseMax, durationCuts));
          const prev = draggingIndex === 0 ? Math.max(firstCutMin, minSec + DUR_STEP) : durationCuts[draggingIndex - 1] + DUR_STEP;
          const nextLimit = draggingIndex === durationCuts.length - 1 ? Math.max(minSec + DUR_STEP * 2, maxSec) : durationCuts[draggingIndex + 1] - DUR_STEP;
          const nextVal = Math.max(prev, Math.min(candidate, nextLimit));
          const nextCuts = [...durationCuts];
          nextCuts[draggingIndex] = nextVal;
          durationPresetToggleController?.setState("", { allowUnknown: true });
          applyDurationCuts(nextCuts, { skipInputs: true, skipRender: true });
          updateVisual();
        };
        const endDrag = () => {
          if (draggingIndex === null) return;
          draggingIndex = null;
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", endDrag);
          document.removeEventListener("touchmove", onMove);
          document.removeEventListener("touchend", endDrag);
          scheduleRangeChartRender();
          renderDurationRangeInputs();
        };
        handles.forEach((handle, idx) => {
          const startDrag = () => {
            draggingIndex = Number(handle.dataset.handleIndex);
            handles.forEach((h, i) => {
              if (!h) return;
              h.style.zIndex = i === idx ? "5" : "1";
            });
            labels.forEach((l, i) => {
              if (!l) return;
              l.style.zIndex = i === idx ? "6" : "2";
            });
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", endDrag);
          };
          const startTouch = (evt) => {
            draggingIndex = Number(handle.dataset.handleIndex);
            handles.forEach((h, i) => {
              if (!h) return;
              h.style.zIndex = i === idx ? "5" : "1";
            });
            labels.forEach((l, i) => {
              if (!l) return;
              l.style.zIndex = i === idx ? "6" : "2";
            });
            document.addEventListener("touchmove", onMove, { passive: false });
            document.addEventListener("touchend", endDrag);
          };
          handle.addEventListener("mousedown", startDrag);
          handle.addEventListener("touchstart", startTouch, { passive: false });
        });
      }
      async function handleFiles(fileList) {
        const files = Array.from(fileList).filter(
          (file) => file && file.name && (file.type && file.type.includes("csv") || file.name.toLowerCase().endsWith(".csv"))
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
        const txt = byId4("csvText")?.value;
        if (!txt) return;
        try {
          const rows = await parseCSVString(txt, "Pegado");
          initData(rows);
        } catch (error) {
          console.error(error);
          alert(
            "Error al procesar el texto pegado. Revisa la consola para mas detalles."
          );
        }
      }
      function initData(data) {
        const normalized = normalizeRows(data);
        if (normalized.length === 0) {
          alert("No se encontraron datos validos. Verifica el CSV.");
          return;
        }
        appState3.setFullData(normalized);
        const fullData = appState3.getFullData();
        const creators = [
          ...new Set(fullData.map((dataPoint) => dataPoint.creator))
        ].sort();
        const select = byId4("creatorSelect");
        if (select) {
          select.innerHTML = '<option value="all">Todos los creadores</option>';
          creators.forEach((creator) => {
            const safe = escapeHtml(creator);
            select.innerHTML += `<option value="${safe}">${safe}</option>`;
          });
        }
        const maxViewsVal = Math.max(
          ...fullData.map((dataPoint) => dataPoint.views),
          0
        );
        const minViewsVal = fullData.length ? Math.min(...fullData.map((dataPoint) => dataPoint.views)) : 0;
        setViewCapFromData(maxViewsVal);
        setViewMinFromData(minViewsVal);
        const maxDurVal = Math.max(...fullData.map((dataPoint) => dataPoint.dur), 0);
        setDurCapFromData(maxDurVal);
        setViewDefaults(viewMinFloor, viewMaxCap);
        const defaultDurMax = Math.round(
          Math.min(
            durMaxCap,
            Math.max(durMinFloor, maxDurVal ? maxDurVal * 1.1 : durMaxCap)
          )
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
            allowUnknown: true
          });
        }
        byId4("uploadSection")?.classList.add("hidden");
        byId4("appShell")?.classList.remove("hidden");
        const filterSidebarEl = byId4("filterSidebar");
        filterSidebarEl?.classList.remove("hidden");
        filterSidebarEl?.removeAttribute("hidden");
        const reportAreaEl = byId4("reportArea");
        reportAreaEl?.classList.remove("hidden");
        reportAreaEl?.removeAttribute("hidden");
        const summaryBarEl = byId4("summaryBar");
        summaryBarEl?.classList.remove("hidden");
        summaryBarEl?.removeAttribute("hidden");
        requestAnimationFrame(() => {
          byId4("creatorSelect")?.focus();
        });
        timeGroupUserOverride = false;
        applyFilters();
      }
      var hasMaxRange = Number.isFinite(MAX_RANGE_DAYS) && MAX_RANGE_DAYS > 0;
      function setDaysRange(days, options = {}) {
        const fullData = appState3.getFullData();
        const dates = fullData.map((dataPoint) => dataPoint.date);
        if (!dates.length) return;
        const safeDaysRaw = Number.isFinite(days) ? Math.max(0, days) : 0;
        const maxDate = new Date(Math.max(...dates));
        const minDate = new Date(Math.min(...dates));
        const safeDays = safeDaysRaw === 0 ? 0 : hasMaxRange ? Math.min(safeDaysRaw, MAX_RANGE_DAYS - 1) : safeDaysRaw;
        const startDate = safeDaysRaw === 0 ? minDate : (() => {
          const d = new Date(maxDate);
          d.setDate(d.getDate() - safeDays);
          return d;
        })();
        setDateInputValue("dateStart", startDate);
        setDateInputValue("dateEnd", maxDate);
        applyFilters();
        if (!options.skipToggle) {
          dayRangeToggleController?.setState(String(safeDaysRaw), {
            silent: true,
            allowUnknown: true
          });
        }
      }
      var recommendTimeGroup = (start, end) => {
        if (!(start instanceof Date) || !(end instanceof Date)) return null;
        const rangeDays = Math.max(0, (end.getTime() - start.getTime()) / MS_PER_DAY2);
        const approxMonths = rangeDays / 30;
        if (approxMonths > 24) return "year";
        if (approxMonths > 12) return "quarter";
        if (approxMonths > 4) return "month";
        return "week";
      };
      var setTimeGroupSelection = (value) => {
        if (typeof document === "undefined") return;
        const target = document.querySelector(`input[name="timeGroup"][value="${value}"]`);
        if (target && !target.checked) {
          target.checked = true;
        }
      };
      var maybeAutoSetTimeGroup = (start, end) => {
        if (timeGroupUserOverride) return;
        if (typeof document === "undefined") return;
        const next = recommendTimeGroup(start, end);
        const current = document.querySelector('input[name="timeGroup"]:checked')?.value || null;
        if (next && current !== next) {
          setTimeGroupSelection(next);
        }
      };
      function applyFilters() {
        const fullData = appState3.getFullData();
        const creatorSel = byId4("creatorSelect");
        const startInput = byId4("dateStart");
        const endInput = byId4("dateEnd");
        const startNative = byId4("dateStartNative");
        const endNative = byId4("dateEndNative");
        const activePlatforms = getActivePlatforms();
        const creator = creatorSel ? creatorSel.value : "all";
        const startParsed = startNative?.valueAsDate || parseDateInputText(startInput?.value) || new Date(startInput?.value || "");
        const endParsed = endNative?.valueAsDate || parseDateInputText(endInput?.value) || new Date(endInput?.value || "");
        const start = Number.isNaN(startParsed?.getTime?.()) || !startParsed ? /* @__PURE__ */ new Date(0) : startParsed;
        const end = Number.isNaN(endParsed?.getTime?.()) || !endParsed ? /* @__PURE__ */ new Date(864e13) : endParsed;
        if (end < start) {
          start.setTime(end.getTime());
          setDateInputValue("dateStart", start);
        }
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59);
        if (hasMaxRange) {
          const maxRangeMs = (MAX_RANGE_DAYS - 1) * MS_PER_DAY2;
          if (end.getTime() - start.getTime() > maxRangeMs) {
            const newStart = new Date(end.getTime() - maxRangeMs);
            newStart.setHours(0, 0, 0, 0);
            start.setTime(newStart.getTime());
            setDateInputValue("dateStart", newStart);
          }
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
          const platformOk = activePlatforms.length === 0 || !platformKey || activePlatforms.includes(platformKey);
          return dateOk && creatorOk && durOk && viewsOk && platformOk;
        });
        appState3.setFilteredData(filtered);
        updateUI();
      }
      var scheduleApplyFilters = /* @__PURE__ */ (() => {
        let pending = null;
        return (delay = 300) => {
          if (pending) clearTimeout(pending);
          pending = setTimeout(() => {
            pending = null;
            applyFilters();
          }, delay);
        };
      })();
      function updateFilteredCount() {
        const videosEl = byId4("videosDisplay");
        const percentEl = byId4("videosPercentDisplay");
        const avgEl = byId4("avgViewsDisplay");
            const summaryTableBody = byId4("summaryTableBody");
            if (!videosEl && !avgEl && !percentEl && !summaryTableBody)
              return;
            const filteredData = appState3.getFilteredData();
            const count = filteredData.length;
        const totalVideos = appState3.getFullData().length;
        const totalViews = filteredData.reduce(
          (sum, dataPoint) => sum + dataPoint.views,
          0
        );
        const totalDuration = filteredData.reduce(
          (sum, dataPoint) => sum + (Number(dataPoint.dur) || 0),
          0
        );
        const avgViews = count ? totalViews / count : 0;
        const pctRaw = totalVideos > 0 ? Math.min(100, Math.max(0, count / totalVideos * 100)) : 0;
        const pctRounded = Math.round(pctRaw * 10) / 10;
        const fmtPct = pctRounded % 1 === 0 ? `${pctRounded.toFixed(0)}%` : `${pctRounded.toFixed(1)}%`;
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
            const summaryMode = appState3.getMode("summaryMode") || "period";
            const activePlatforms = getActivePlatforms();
            const activePlatformSet = new Set(activePlatforms);
            const hasActivePlatforms = activePlatformSet.size > 0;
            const platformColumnsToRender = hasActivePlatforms ? PLATFORM_COLUMNS.filter(
              ({ key }) => activePlatformSet.has(key)
            ) : PLATFORM_COLUMNS;
            const showPlatformCols = platformColumnsToRender.length > 0;
            const platformHeaders = document.querySelectorAll("[data-summary-platform-col]");
            platformHeaders.forEach((cell) => {
              const platformKey = normalizePlatformValue(cell.dataset.platformKey);
              const shouldShow = showPlatformCols && (!hasActivePlatforms || (platformKey && activePlatformSet.has(platformKey)));
              cell.hidden = !shouldShow;
              cell.style.display = shouldShow ? "" : "none";
            });
            const viewsByPlatformTotals = {};
            if (showPlatformCols) {
              filteredData.forEach((dataPoint) => {
                const platformKey = normalizePlatformValue(dataPoint.platform);
                if (!platformKey) return;
                viewsByPlatformTotals[platformKey] = (viewsByPlatformTotals[platformKey] || 0) + (dataPoint.views || 0);
              });
            }
          const totalPlatformCells = platformColumnsToRender.map(({ key: platformKey }) => {
            const platViews = viewsByPlatformTotals[platformKey] || 0;
            return `<td class="p-3 text-right font-semibold text-slate-800">${platViews ? fmtViews(platViews) : "-"}</td>`;
          }).join("");
          const totalRow = `
        <tr class="bg-slate-100 font-semibold">
          <td class="p-3 text-slate-800">Totales</td>
          <td class="p-3 text-right text-slate-800">${nFmt(count)}</td>
          <td class="p-3 text-right text-primary">${fmtViews(totalViews)}</td>
          ${totalPlatformCells}
          <td class="p-3 text-right text-slate-800">${count ? fmtDur(totalDuration / count) : "\u2014"}</td>
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
                  viewsByPlatform: {}
                };
              }
              const bucket = byCreator[label];
              const views = dataPoint.views || 0;
              bucket.count += 1;
              bucket.vSum += views;
              bucket.durSum += dataPoint.dur || 0;
              const platformKey = normalizePlatformValue(dataPoint.platform);
              if (platformKey) {
                bucket.viewsByPlatform[platformKey] = (bucket.viewsByPlatform[platformKey] || 0) + views;
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
                viewsByPlatform = {}
              } = byCreator[key];
              const avgDur = groupCount ? durSum / groupCount : 0;
              const platformCells = platformColumnsToRender.map(({ key: platformKey }) => {
                const platViews = viewsByPlatform[platformKey] || 0;
                return `<td class="p-3 text-right font-semibold text-slate-700">${platViews ? fmtViews(platViews) : "-"}</td>`;
              }).join("");
              return `
        <tr>
          <td class="p-3 text-slate-700">${escapeHtml(label || "-")}</td>
          <td class="p-3 text-right font-semibold text-slate-800">${nFmt(groupCount)}</td>
          <td class="p-3 text-right font-semibold text-primary">${fmtViews(vSum)}</td>
          ${platformCells}
          <td class="p-3 text-right text-slate-700">${groupCount ? fmtDur(avgDur) : "\u2014"}</td>
        </tr>`;
            });
          } else {
            const timeGroup = document.querySelector('input[name="timeGroup"]:checked')?.value || "week";
            const period = timeGroup === "day" || timeGroup === "week" ? "month" : timeGroup;
            const grouped = groupData(filteredData, period);
            const platformViewsByKey = {};
            filteredData.forEach((dataPoint) => {
              const key = periodKeyForSummary(dataPoint.date, period);
              if (!key) return;
              const platformKey = normalizePlatformValue(dataPoint.platform);
              if (!platformKey) return;
              if (!platformViewsByKey[key]) platformViewsByKey[key] = {};
              platformViewsByKey[key][platformKey] = (platformViewsByKey[key][platformKey] || 0) + (dataPoint.views || 0);
            });
            const keys = Object.keys(grouped).sort(
              (a, b) => getSortValue(a, period) - getSortValue(b, period)
            );
            rows = keys.map((key) => {
              const { label, count: groupCount = 0, vSum = 0, durSum = 0 } = grouped[key];
              const avgDur = groupCount ? durSum / groupCount : 0;
              const viewsByPlatform = platformViewsByKey[key] || {};
              const platformCells = platformColumnsToRender.map(({ key: platformKey }) => {
                const platViews = viewsByPlatform[platformKey] || 0;
                return `<td class="p-3 text-right font-semibold text-slate-700">${platViews ? fmtViews(platViews) : "-"}</td>`;
              }).join("");
              return `
        <tr>
          <td class="p-3 text-slate-700">${label || "-"}</td>
          <td class="p-3 text-right font-semibold text-slate-800">${nFmt(groupCount)}</td>
          <td class="p-3 text-right font-semibold text-primary">${fmtViews(vSum)}</td>
          ${platformCells}
          <td class="p-3 text-right text-slate-700">${groupCount ? fmtDur(avgDur) : "\u2014"}</td>
        </tr>`;
            });
          }
          rows = [totalRow, ...rows];
          const totalColumns = 4 + platformColumnsToRender.length;
          summaryTableBody.innerHTML = rows.length > 0 ? rows.join("") : `<tr><td class="p-3 text-slate-500" colspan="${totalColumns}">Sin datos</td></tr>`;
        }
      }
      function setChart1Mode(mode, options = {}) {
        if (mode !== "bar" && mode !== "line") return;
        appState3.setMode("chart1", mode);
        chart1ToggleController?.setState(mode, { silent: !!options.fromToggle });
        updateUI();
      }
      function setChart1Metric(metric, options = {}) {
        if (metric !== "videos" && metric !== "minutes") return;
        appState3.setMode("chart1Metric", metric);
        chart1MetricToggleController?.setState(metric, {
          silent: !!options.fromToggle
        });
        updateChart1Legend(metric);
        updateUI();
      }
      function updateChart1Legend(metric = appState3.getMode("chart1Metric")) {
        if (!chart1LegendPrimaryLabel || !chart1LegendPrimarySwatch) return;
        const isMinutes = metric === "minutes";
        chart1LegendPrimaryLabel.textContent = isMinutes ? "Minutos" : "Videos";
        const baseColor = CHART_COLORS4.primary || "#6366f1";
        chart1LegendPrimarySwatch.style.backgroundColor = "#c7d2fe";
        chart1LegendPrimarySwatch.style.borderColor = baseColor;
      }
      function updateSingleMetricButton(button, isActive) {
        if (!button) return;
        const base = button.dataset.baseClass || "";
        const activeClass = button.dataset.activeClass || PILL_ACTIVE;
        const inactiveClass = button.dataset.inactiveClass || PILL_INACTIVE;
        button.className = [base, isActive ? activeClass : inactiveClass].filter(Boolean).join(" ").trim();
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      }
      function updateChart4MetricButton(state = appState3.getMode("chart4")) {
        updateSingleMetricButton(chart4V30Button, state === "v30");
      }
      function updateRangeBarsMetricButton(state = appState3.getMode("rangeBars")) {
        updateSingleMetricButton(rangeBarsV30Button, state === "v30");
      }
      function updateChart6Note(mode = appState3.getMode("chart6")) {
        if (!chart6Note) return;
        const shouldShow = mode === "perDay";
        chart6Note.classList.toggle("hidden", !shouldShow);
      }
      function setChart4Metric(metric, options = {}) {
        if (metric !== "views" && metric !== "v30") return;
        appState3.setMode("chart4", metric);
        updateChart4MetricButton(metric);
        updateUI();
      }
      function setChart6Mode(mode, options = {}) {
        if (mode !== "total" && mode !== "perDay") return;
        appState3.setMode("chart6", mode);
        chart6ToggleController?.setState(mode, { silent: !!options.fromToggle });
        updateChart6Note(mode);
        updateUI();
      }
      function setChart2Mode(mode, options = {}) {
        if (mode !== "line" && mode !== "bar") return;
        appState3.setMode("chart2", mode);
        chart2ToggleController?.setState(mode, { silent: !!options.fromToggle });
        renderCharts();
      }
      function setChart3Mode(mode, options = {}) {
        if (mode !== "line" && mode !== "bar") return;
        appState3.setMode("chart3", mode);
        chart3ToggleController?.setState(mode, { silent: !!options.fromToggle });
        renderCharts();
      }
      function setRangeBarMetric(metric, options = {}) {
        if (metric !== "views" && metric !== "v30") return;
        appState3.setMode("rangeBars", metric);
        updateRangeBarsMetricButton(metric);
        renderCharts();
      }
      function setSummaryMode(mode, options = {}) {
        if (mode !== "period" && mode !== "creator") return;
        appState3.setMode("summaryMode", mode);
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
        dropZone = byId4("dropZone");
        fileInput = byId4("fileInput");
        if (!dropZone || !fileInput) {
          console.warn("No se encontr\xF3 el \xE1rea de carga de archivos en el DOM.");
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
        dropZone.addEventListener(
          "dragleave",
          () => dropZone.classList.remove("dragover")
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
          allowUnknown: true
        });
        applyFilters();
      }
      function bindDateInputs() {
        ["dateStart", "dateEnd"].forEach((id) => {
          const input = byId4(id);
          const native = byId4(`${id}Native`);
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
              const selected = native.valueAsDate || (native.value ? new Date(native.value) : null);
              if (!selected || Number.isNaN(selected.getTime())) return;
              setDateInputValue(id, selected);
              handleDateChange(id);
            });
          }
        });
      }
      function bindFilterControls() {
        byId4("creatorSelect")?.addEventListener("change", applyFilters);
        bindDateInputs();
        document.querySelectorAll('input[name="timeGroup"]').forEach((input) => {
          input.addEventListener("change", () => {
            timeGroupUserOverride = true;
            updateUI();
          });
        });
        byId4("pasteToggleBtn")?.addEventListener(
          "click",
          () => byId4("pasteArea")?.classList.toggle("hidden")
        );
        byId4("processPasteBtn")?.addEventListener("click", processPasted);
      }
      function updateDurationPresetAvailability() {
        const buttons = Array.from(
          document.querySelectorAll("[data-duration-preset]")
        );
        if (!buttons.length) return;
        const fullData = appState3.getFullData();
        const hasMinDuration = (threshold) => Array.isArray(fullData) && fullData.some(
          (dataPoint) => Number.isFinite(dataPoint?.dur) && dataPoint.dur >= threshold
        );
        const availability = {
          ultralong: hasMinDuration(durationPresetRequirements.ultralong),
          youtube: hasMinDuration(durationPresetRequirements.youtube),
          facebook: hasMinDuration(durationPresetRequirements.facebook)
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
            silent: true
          });
        }
      }
      function applyDurationPreset(key) {
        const preset = durationPresets[key];
        const targetBtn = typeof document !== "undefined" ? document.querySelector(`[data-duration-preset="${key}"]`) : null;
        if (!preset || !preset.length || (targetBtn == null ? void 0 : targetBtn.disabled)) return;
        durationPresetToggleController?.setState(key, {
          allowUnknown: true,
          silent: true
        });
        const { cuts } = applyDurationCuts(preset, { skipRender: true });
        syncDurationInputValues(cuts);
        scheduleRangeChartRender();
      }
      function bindDurationPresets() {
        const buttons = Array.from(
          document.querySelectorAll("[data-duration-preset]")
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
          onChange: (value) => applyDurationPreset(value)
        });
      }
      function bindDurationRangeControls() {
        const resetBtn = byId4("resetDurationRanges");
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
              "[data-platform-chip].is-active"
            ).length;
            if (isActive && activeCount <= 1) {
              chip.classList.add("pulse-once");
              setTimeout(() => chip.classList.remove("pulse-once"), 220);
              return;
            }
            chip.classList.toggle("is-active");
            chip.setAttribute("aria-pressed", chip.classList.contains("is-active"));
            scheduleApplyFilters(120);
          });
        });
      }
      function bindSliderFocus() {
        byId4("viewRangeMin")?.addEventListener(
          "pointerdown",
          () => setHandleFocus("min")
        );
        byId4("viewRangeMax")?.addEventListener(
          "pointerdown",
          () => setHandleFocus("max")
        );
        byId4("durRangeMin")?.addEventListener(
          "pointerdown",
          () => setDurHandleFocus("min")
        );
        byId4("durRangeMax")?.addEventListener(
          "pointerdown",
          () => setDurHandleFocus("max")
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
          initialState: appState3.getMode("chart1"),
          getValue: (button) => button.getAttribute("data-chart1-mode"),
          onChange: (mode) => setChart1Mode(mode, { fromToggle: true })
        });
        chart1MetricToggleController = createToggleController({
          buttons: Array.from(document.querySelectorAll("[data-chart1-metric]")),
          states: ["videos", "minutes"],
          activeClass: PILL_ACTIVE,
          inactiveClass: PILL_INACTIVE,
          initialState: appState3.getMode("chart1Metric"),
          getValue: (button) => button.getAttribute("data-chart1-metric"),
          onChange: (metric) => setChart1Metric(metric, { fromToggle: true })
        });
        chart1LegendPrimaryLabel = byId4("chart1LegendPrimaryLabel");
        chart1LegendPrimarySwatch = byId4("chart1LegendPrimarySwatch");
        updateChart1Legend();
        chart4V30Button = byId4("chart4ToggleV30");
        if (chart4V30Button) {
          chart4V30Button.dataset.baseClass = chart4V30Button.className;
          chart4V30Button.addEventListener("click", () => {
            const next = appState3.getMode("chart4") === "v30" ? "views" : "v30";
            setChart4Metric(next, { fromToggle: true });
          });
          updateChart4MetricButton();
        }
        chart2ToggleController = createToggleController({
          buttons: Array.from(document.querySelectorAll("[data-chart2-mode]")),
          states: ["line", "bar"],
          activeClass: PILL_ACTIVE,
          inactiveClass: PILL_INACTIVE,
          initialState: appState3.getMode("chart2"),
          getValue: (button) => button.getAttribute("data-chart2-mode"),
          onChange: (mode) => setChart2Mode(mode, { fromToggle: true })
        });
        chart3ToggleController = createToggleController({
          buttons: Array.from(document.querySelectorAll("[data-chart3-mode]")),
          states: ["line", "bar"],
          activeClass: PILL_ACTIVE,
          inactiveClass: PILL_INACTIVE,
          initialState: appState3.getMode("chart3"),
          getValue: (button) => button.getAttribute("data-chart3-mode"),
          onChange: (mode) => setChart3Mode(mode, { fromToggle: true })
        });
        summaryToggleController = createToggleController({
          buttons: Array.from(document.querySelectorAll("[data-summary-mode]")),
          states: ["period", "creator"],
          activeClass: PILL_ACTIVE,
          inactiveClass: PILL_INACTIVE,
          initialState: appState3.getMode("summaryMode"),
          getValue: (button) => button.getAttribute("data-summary-mode"),
          onChange: (mode) => setSummaryMode(mode, { fromToggle: true })
        });
        chart6Note = byId4("chart6Note");
        chart6ToggleController = createToggleController({
          buttons: Array.from(document.querySelectorAll("[data-chart6-mode]")),
          states: ["perDay", "total"],
          activeClass: PILL_ACTIVE,
          inactiveClass: PILL_INACTIVE,
          initialState: appState3.getMode("chart6"),
          getValue: (button) => button.getAttribute("data-chart6-mode"),
          onChange: (mode) => setChart6Mode(mode, { fromToggle: true })
        });
        updateChart6Note(appState3.getMode("chart6"));
        rangeBarsV30Button = byId4("rangeBarsV30");
        if (rangeBarsV30Button) {
          rangeBarsV30Button.dataset.baseClass = rangeBarsV30Button.className;
          rangeBarsV30Button.addEventListener("click", () => {
            const next = appState3.getMode("rangeBars") === "v30" ? "views" : "v30";
            setRangeBarMetric(next, { fromToggle: true });
          });
          updateRangeBarsMetricButton();
        }
        const dayButtons = Array.from(document.querySelectorAll("[data-days-range]"));
        const dayStates = dayButtons.map(
          (button) => button.getAttribute("data-days-range")
        );
        dayRangeToggleController = createToggleController({
          buttons: dayButtons,
          states: dayStates,
          activeClass: "bg-white text-primary-dark shadow-sm border border-primary-soft",
          inactiveClass: "bg-slate-100 hover:bg-slate-200 text-slate-700",
          initialState: "",
          getValue: (button) => button.getAttribute("data-days-range"),
          onChange: (value) => setDaysRange(Number(value || "0"), { skipToggle: true })
        });
      }
      function syncToggleUI() {
        chart1ToggleController?.setState(appState3.getMode("chart1"), {
          silent: true,
          allowUnknown: true
        });
        updateChart1Legend();
        chart1MetricToggleController?.setState(
          appState3.getMode("chart1Metric"),
          {
            silent: true,
            allowUnknown: true
          }
        );
        updateChart4MetricButton(appState3.getMode("chart4"));
        chart2ToggleController?.setState(appState3.getMode("chart2"), {
          silent: true,
          allowUnknown: true
        });
        chart3ToggleController?.setState(appState3.getMode("chart3"), {
          silent: true,
          allowUnknown: true
        });
        summaryToggleController?.setState(appState3.getMode("summaryMode"), {
          silent: true,
          allowUnknown: true
        });
        chart6ToggleController?.setState(appState3.getMode("chart6"), {
          silent: true,
          allowUnknown: true
        });
        updateChart6Note(appState3.getMode("chart6"));
        updateRangeBarsMetricButton(appState3.getMode("rangeBars"));
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
          onChange: scheduleApplyFilters
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
          onChange: scheduleApplyFilters
        });
        dropZone = byId4("dropZone");
        fileInput = byId4("fileInput");
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
        if (durationPresets.facebook?.length) {
          applyDurationPreset("facebook");
        } else if (durationCuts.length === 0 && defaultDurationCutsNormalized.length) {
          applyDurationCuts(defaultDurationCutsNormalized, { skipRender: true, skipInputs: true });
        }
      }
      var App = {
        init: initApp,
        state: {
          get fullData() {
            return appState3.getFullData();
          },
          get filteredData() {
            return appState3.getFilteredData();
          },
          get charts() {
            return appState3.getCharts();
          }
        },
        config: appConfig5,
        data: {
          parseCSVString,
          fileNameToCreator,
          readFileAsRows,
          initData,
          normalizeDateLocal,
          localKey,
          groupData,
          handleFiles
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
          handleDurRange
        },
        charts: {
          renderCharts,
          timeScatterOpt
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
          setRangeBarMetric
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
          formatViewsShort: formatViewsShortWithCap
        }
      };
      if (typeof window !== "undefined") {
        window.App = App;
        const boot = () => {
          try {
            initApp();
          } catch (error) {
            console.error("VideoAnalytics init error:", error);
            alert(
              "Hubo un error al iniciar la app. Revisa la consola (F12) y comparte el mensaje para poder ayudarte."
            );
          }
        };
        if (typeof document !== "undefined" && document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", boot);
        } else if (typeof document !== "undefined") {
          boot();
        }
      }
      if (typeof module !== "undefined") {
        module.exports = {
          parseDurationText,
          formatViewsShort: (value, isMax) => formatViewsShortWithCap(value, isMax),
          normalizeRows
        };
      }
    }
  });

  // js/bundle-entry.js
  var require_bundle_entry = __commonJS({
    "js/bundle-entry.js"() {
      init_config();
      var import_state = __toESM(require_state());
      var import_app = __toESM(require_app());
    }
  });
  require_bundle_entry();
})();
