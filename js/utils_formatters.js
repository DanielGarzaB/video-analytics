export const MONTH_ABBR = [
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
  "Dec",
];

export const nFmt = (n) =>
  new Intl.NumberFormat("en-US").format(Math.round(n));

export function fmtViews(value) {
  const num = Number(value) || 0;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)} mil millones`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${Math.round(num / 1_000)}K`;
  return nFmt(num);
}

const formatDurationClock = (rawSeconds) => {
  const total = Math.max(0, Math.round(Number(rawSeconds) || 0));
  if (total < 60) return `${total}s`;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  }
  const minsOnly = Math.floor(total / 60);
  return `${minsOnly}:${sec.toString().padStart(2, "0")}`;
};

export const fmtDur = (seconds) => formatDurationClock(seconds);

export const fmtDurClock = (seconds) => formatDurationClock(seconds);

export function fmtAxisViews(value) {
  const val = Number(value) || 0;
  if (val >= 1_000_000_000) {
    const b = val / 1_000_000_000;
    const rounded = Number(b.toFixed(1));
    const display = rounded % 1 === 0 ? Math.round(b) : rounded;
    return `${display} mil millones`;
  }
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    const rounded = Number(m.toFixed(1));
    return rounded % 1 === 0 ? `${Math.round(m)}M` : `${rounded}M`;
  }
  if (val >= 1_000) return `${Math.round(val / 1_000)}K`;
  return Math.round(val).toString();
}

export function fmtAxisDuration(seconds) {
  return formatDurationClock(seconds);
}

export function fmtDateShort(date) {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const mon = MONTH_ABBR[d.getMonth()] || "";
  const yr = (d.getFullYear() % 100).toString().padStart(2, "0");
  return `${day}-${mon}-${yr}`;
}

export function formatDurFilterVal(value) {
  return formatDurationClock(value);
}

export function formatViewsShort(value, isMax, viewMaxCap = 50_000_000) {
  const num = Number(value) || 0;
  if (num <= 0) return "0";
  const isCap = num >= viewMaxCap;
  if (isCap) return isMax ? `${fmtViews(viewMaxCap)}+` : fmtViews(viewMaxCap);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${Math.round(num / 1_000)}K`;
  return Math.round(num).toString();
}

export function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
