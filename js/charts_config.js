import { fmtDur, fmtAxisDuration } from "./utils_formatters.js";

const appConfig = typeof window !== "undefined" ? window.CONFIG || {} : {};
const Y_AXIS_WIDTH = appConfig.Y_AXIS_WIDTH || 75;

export function commonOpt(scaleX, scaleY) {
  const yConfig = scaleY || {};
  yConfig.afterFit = (scale) => {
    scale.width = Y_AXIS_WIDTH;
  };

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    resizeDelay: 0,
    layout: { padding: { right: appConfig.CHART_PADDING_RIGHT || 18 } },
    plugins: { legend: { display: false } },
    scales: {
      x: scaleX || {},
      y: yConfig,
    },
  };
}

export function timeScatterOpt(yLabel) {
  const yAxis = {
    title: { display: true, text: yLabel },
    afterFit: (scale) => {
      scale.width = Y_AXIS_WIDTH;
    },
  };
  if (typeof yLabel === "string" && yLabel.toLowerCase().includes("duraci")) {
    yAxis.ticks = { callback: (value) => fmtAxisDuration(value) };
  }
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    responsiveAnimationDuration: 0,
    layout: { padding: { right: appConfig.CHART_PADDING_RIGHT || 18 } },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        align: "center",
        labels: {
          usePointStyle: true,
          boxWidth: appConfig.CHART_LEGEND_BOX_WIDTH || 12,
          padding: appConfig.CHART_LEGEND_PADDING || 12
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const raw = context.raw || {};
            const fullTitle = raw.title || context.dataset?.label || "Dato";
            const maxLength = appConfig.TOOLTIP_LABEL_MAX_LENGTH || 30;
            const truncateAt = appConfig.TOOLTIP_LABEL_TRUNCATE_AT || 27;
            const title =
              fullTitle.length > maxLength
                ? `${fullTitle.substring(0, truncateAt)}...`
                : fullTitle;
            const yVal = raw.y ?? context.parsed?.y ?? 0;
            return `${title} (${fmtDur(yVal)})`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: { unit: "day", displayFormats: { day: "dd MMM" } },
      },
      y: yAxis,
    },
  };
}
