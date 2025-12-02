export const CONFIG = {
  Y_AXIS_WIDTH: 75,
  VIEW_STEP: 100000,
  DUR_STEP: 1,
  VIEW_MAX_CAP: 50000000,
  VIEW_MIN_FLOOR: 0,
  DUR_MAX_CAP: 360,
  DUR_MIN_FLOOR: 0,
  MA_WINDOW: 7,
  TOP_VIDEOS_LIMIT: 100,
  DURATION_RANGES: [
    { label: "0-20s", min: 0, max: 20 },
    { label: "20-30s", min: 20, max: 30 },
    { label: "30s-1:00", min: 30, max: 60 },
    { label: "1:00-2:55", min: 60, max: 175 },
    { label: "3:00-3:59", min: 180, max: 240 },
    { label: "4:00+", min: 240, max: Infinity },
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
    grid: "#e2e8f0",
  },
};

export const CHART_COLORS = CONFIG.CHART_COLORS;

if (typeof window !== "undefined") {
  window.CONFIG = CONFIG;
}

export default CONFIG;
