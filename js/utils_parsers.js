import { MONTH_ABBR } from "./utils_formatters.js";

export function parseNumberInput(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const clean = value.replace(/,/g, "").trim().replace(/\+$/, "");
  const match = clean.match(/^(-?\d+(?:\.\d+)?)([kKmM])?$/);
  if (match) {
    const num = Number(match[1]);
    if (!Number.isFinite(num)) return 0;
    const suffix = match[2]?.toLowerCase();
    if (suffix === "k") return num * 1_000;
    if (suffix === "m") return num * 1_000_000;
    return num;
  }
  const num = Number(clean);
  return Number.isFinite(num) ? num : 0;
}

export function parseDurationText(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const clean = value.trim().toLowerCase().replace(/s$/, "");
  const normalized = clean.includes(":") ? clean.replace(/m$/, "") : clean;
  if (normalized.includes(":")) {
    const parts = normalized
      .split(":")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 3) {
      const hours = Number(parts[0]);
      const minutes = Number(parts[1]);
      const seconds = Number(parts[2]);
      if (
        Number.isFinite(hours) &&
        Number.isFinite(minutes) &&
        Number.isFinite(seconds)
      ) {
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

export function parseDateInputText(value) {
  if (!value || typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{2})-([A-Za-z]{3})-(\d{2})$/);
  if (!match) return null;
  const [, dd, monTxt, yy] = match;
  const monthIdx = MONTH_ABBR.findIndex(
    (m) => m.toLowerCase() === monTxt.toLowerCase(),
  );
  if (monthIdx === -1) return null;
  const fullYear = 2000 + Number(yy);
  const dateObj = new Date(fullYear, monthIdx, Number(dd));
  if (Number.isNaN(dateObj.getTime())) return null;
  return dateObj;
}

export function parseMetricValue(raw) {
  if (raw === undefined || raw === null || raw === "") return 0;
  return parseNumberInput(raw);
}

export function parseCSVString(csvText, fallbackCreator = "") {
  const lines = csvText.split("\n");
  let textToParse = csvText;
  if (
    lines.length > 1 &&
    !lines[0].includes("Published_Date") &&
    lines[1] &&
    lines[1].includes("Published_Date")
  ) {
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
          __creatorFallback: fallbackCreator,
        }));
        resolve(withSource);
      },
      error: (err) => reject(err),
    });
  });
}

export function fileNameToCreator(name = "") {
  const trimmed = name.trim();
  if (!trimmed) return "";
  const withoutExt = trimmed.replace(/\.[^/.]+$/, "");
  return withoutExt || trimmed;
}

export function readFileAsRows(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rows = await parseCSVString(
          event.target.result,
          fileNameToCreator(file.name),
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
