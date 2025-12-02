import { fmtViews } from "./utils_formatters.js";

const appConfig = typeof window !== "undefined" ? window.CONFIG || {} : {};
const CHART_COLORS = appConfig.CHART_COLORS || {
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
};

export const cViewsRangeLineOnTop = {
  id: "cViewsRangeLineOnTop",
  afterDatasetsDraw(chart) {
    const lineEntry = chart.data.datasets
      .map((dataset, index) => ({
        dataset,
        index,
        meta: chart.getDatasetMeta(index),
      }))
      .find(
        (entry) =>
          entry.meta &&
          entry.meta.type === "line" &&
          chart.isDatasetVisible(entry.index),
      );
    if (!lineEntry) return;
    chart.ctx.save();
    lineEntry.meta.controller.draw();
    chart.ctx.restore();
  },
};

export const cViewsRangeLabels = {
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
        if (rawVal === null || rawVal === undefined) return;
        const pos = elem.tooltipPosition();
        const label =
          dataset.yAxisID === "y"
            ? fmtViews(rawVal)
            : rawVal;
        chartCtx.font = '600 11px "Inter", sans-serif';
        chartCtx.fillStyle = CHART_COLORS.purple || "#5b0cd3";
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
  },
};

export const cViewsRangeV30Ticks = (rangeBarMetric, rangeStats = []) => ({
  id: "cViewsRangeV30Ticks",
  afterDraw(chart) {
    const scaleX = chart.scales.x;
    const activeScale = chart.scales.y;
    if (!scaleX || !activeScale) return;
    const barDataset = chart.data.datasets.find(
      (dataset) => dataset?.yAxisID === "y" && Array.isArray(dataset.data),
    );
    const getValueForIndex = (index) => {
      const fromDataset = barDataset?.data?.[index];
      if (Number.isFinite(fromDataset)) return fromDataset;
      const fromStats =
        rangeBarMetric === "views"
          ? rangeStats[index]?.avgViews
          : rangeStats[index]?.avgV30;
      return Number.isFinite(fromStats) ? fromStats : null;
    };
    const area = chart.chartArea;
    const chartCtx = chart.ctx;
    chartCtx.save();
    chartCtx.font = '700 11px "Inter", sans-serif';
    chartCtx.fillStyle = "#0f172a";
    chartCtx.textAlign = "center";
    chartCtx.textBaseline = "top";
    const bottomY = (scaleX.bottom || area.bottom) + 8;
    scaleX.ticks.forEach((_, index) => {
      const value = getValueForIndex(index);
      if (value === null || value === undefined) return;
      const x = scaleX.getPixelForTick(index);
      const xClamped = Math.min(area.right - 8, Math.max(area.left + 8, x));
      chartCtx.fillText(fmtViews(value), xClamped, bottomY);
    });
    chartCtx.restore();
  },
});
