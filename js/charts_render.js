import { fmtViews, fmtDurClock, fmtAxisViews } from "./utils_formatters.js";
import {
  groupData,
  getSortValue,
  localKey,
  normalizeDateLocal,
} from "./data_normalize.js";
import { commonOpt, timeScatterOpt } from "./charts_config.js";
import * as plugins from "./charts_plugins.js";

const appConfig = typeof window !== "undefined" ? window.CONFIG || {} : {};
const {
  CHART_COLORS = {
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
  MA_WINDOW = 10,
} = appConfig;
const V30_LABEL = "Views a 30 dias";
const V30_LABEL_PROM = `${V30_LABEL} Prom`;
const V30_LABEL_PROMEDIO = `${V30_LABEL} Promedio`;
const V30_LABEL_PROM_LOWER = `${V30_LABEL} promedio`;
const DURATION_STACK_COLORS = [
  "#3b82f6", // azul
  "#10b981", // verde
  "#facc15", // amarillo
  "#f97316", // naranja
  "#ef4444", // rojo
  "#8b5cf6", // violeta
];
const CONFIG_DURATION_RANGES = appConfig.DURATION_RANGES || [];
const MS_PER_DAY = appConfig.MS_PER_DAY || 86400000;
const RECENT_DAYS_IGNORE = appConfig.RECENT_DAYS_IGNORE || 14;

const appState = typeof window !== "undefined" ? window.State : null;
const byId = (id) =>
  typeof document !== "undefined" ? document.getElementById(id) : null;
const periodKeyForDate = (dateObj, period) => {
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
};

export function updateChartData(chartKey, config) {
  if (!appState || typeof Chart === "undefined") return null;
  const current = appState.getChart(chartKey);
  const currentType = appState.getChartType(chartKey);
  const nextType = config.type;
  if (!current || currentType !== nextType) {
    appState.clearChart(chartKey);
    const canvas = byId(chartKey);
    if (!canvas) return null;
    canvas.width = canvas.width; // Force canvas reset so Chart.js drops internal refs
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

export function renderCharts() {
  if (!appState) return;
  const filteredData = appState.getFilteredData();
  const period =
    document.querySelector('input[name="timeGroup"]:checked')?.value || "week";
  const grouped = groupData(filteredData, period);
  const keys = Object.keys(grouped).sort(
    (a, b) => getSortValue(a, period) - getSortValue(b, period),
  );
  const labels = keys.map((key) => grouped[key].label);
  const durationRanges =
    typeof appState.getDurationRanges === "function"
      ? appState.getDurationRanges()
      : [];
  const rangesForChart =
    Array.isArray(durationRanges) && durationRanges.length > 0
      ? durationRanges
      : CONFIG_DURATION_RANGES;
  const safeRanges = rangesForChart.map((range) => {
    const min = Number.isFinite(range.min) ? range.min : 0;
    const max = Number.isFinite(range.max) ? range.max : Infinity;
    const label = range.label
      ? range.label
      : `${fmtDurClock(min)}${Number.isFinite(max) ? `-${fmtDurClock(max)}` : "+"}`;
    return { ...range, min, max, label };
  });
  const chart1Mode = appState.getMode("chart1");
  const chart1Metric = appState.getMode("chart1Metric") || "videos";
  const chart1IsLine = chart1Mode === "line";
  const chart1IsMinutes = chart1Metric === "minutes";
  const chart1DatasetLabel = chart1IsMinutes ? "Minutos totales" : "Videos";
  const chart1Series = chart1IsMinutes
    ? keys.map((key) => Math.round((grouped[key].durSum || 0) / 60))
    : keys.map((key) => grouped[key].count);
  const chart1IsStacked = chart1Metric === "minutes";
  const chart1Options = commonOpt(undefined, {
    ticks: {
      precision: 0,
      callback: (value) => {
        const num = Number(value);
        if (Number.isInteger(num)) return num;
        return Math.round(num * 10) / 10;
      },
    },
    beginAtZero: true,
  });
  if (chart1IsLine && !chart1IsStacked) {
    chart1Options.elements = {
      line: {
        tension: appConfig.CHART_LINE_TENSION || 0,
        borderWidth: appConfig.CHART_LINE_BORDER_WIDTH || 3
      },
      point: {
        radius: appConfig.CHART_POINT_RADIUS_SMALL || 4,
        hoverRadius: appConfig.CHART_POINT_HOVER_RADIUS_SMALL || 6
      },
    };
    chart1Options.interaction = { mode: "index", intersect: false };
  }
  chart1Options.plugins = chart1Options.plugins || {};
  chart1Options.plugins.legend = chart1Options.plugins.legend || {};
  chart1Options.plugins.legend.display = chart1IsStacked;
  if (chart1IsStacked) {
    chart1Options.plugins.legend.position = "bottom";
    chart1Options.plugins.legend.align = "center";
    chart1Options.plugins.legend.labels = {
      usePointStyle: true,
      boxWidth: appConfig.CHART_LEGEND_BOX_WIDTH || 12,
      padding: appConfig.CHART_LEGEND_PADDING || 12,
    };
    chart1Options.layout = chart1Options.layout || {};
    const basePadding = chart1Options.layout.padding || {};
    chart1Options.layout.padding = {
      ...basePadding,
      bottom: Math.max(basePadding.bottom || 0, appConfig.CHART_PADDING_BOTTOM || 16),
    };
    chart1Options.scales = chart1Options.scales || {};
    chart1Options.scales.x = { ...(chart1Options.scales.x || {}), stacked: true };
    chart1Options.scales.y = { ...(chart1Options.scales.y || {}), stacked: true };
  } else if (chart1Options.scales?.x && chart1Options.scales?.y) {
    chart1Options.scales.x.stacked = false;
    chart1Options.scales.y.stacked = false;
  }
  const keyIndex = new Map(keys.map((key, idx) => [key, idx]));
  const chart1Datasets = chart1IsStacked
    ? safeRanges.map((range, index) => ({
        type: "bar",
        label: range.label,
        data: keys.map(() => 0),
        backgroundColor:
          DURATION_STACK_COLORS[index % DURATION_STACK_COLORS.length],
        borderColor:
          DURATION_STACK_COLORS[index % DURATION_STACK_COLORS.length],
        borderWidth: appConfig.CHART_BAR_BORDER_WIDTH || 1,
        stack: "minutes",
        barPercentage: appConfig.CHART_BAR_PERCENTAGE || 0.86,
        categoryPercentage: appConfig.CHART_CATEGORY_PERCENTAGE || 0.82,
      }))
    : [
        {
          label: chart1DatasetLabel,
          data: chart1Series,
          backgroundColor: CHART_COLORS.primary,
          borderColor: CHART_COLORS.primary,
          borderRadius: chart1IsLine ? 0 : (appConfig.CHART_BAR_BORDER_RADIUS || 3),
          borderWidth: chart1IsLine ? (appConfig.CHART_LINE_BORDER_WIDTH || 3) : 0,
          fill: false,
          pointBackgroundColor: CHART_COLORS.primary,
          pointBorderColor: "#ffffff",
          pointBorderWidth: chart1IsLine ? (appConfig.CHART_POINT_BORDER_WIDTH || 2) : 0,
          pointRadius: chart1IsLine ? (appConfig.CHART_POINT_RADIUS || 5) : 0,
          pointHoverRadius: chart1IsLine ? (appConfig.CHART_POINT_HOVER_RADIUS || 7) : 0,
          tension: appConfig.CHART_LINE_TENSION || 0,
          order: appConfig.CHART_ORDER_BACKGROUND || 1,
        },
      ];

  if (chart1IsStacked) {
    filteredData.forEach((dataPoint) => {
      const key = periodKeyForDate(dataPoint.date, period);
      const keyPos = keyIndex.get(key);
      if (keyPos === undefined) return;
      const rangeIndex = safeRanges.findIndex(
        (range) => dataPoint.dur >= range.min && dataPoint.dur < range.max,
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
      datasets: chart1Datasets,
    },
    options: chart1Options,
  });

  const rangeStats = safeRanges.map((range) => {
    const { min: safeMin, max: safeMax, label } = range;
    const videos = filteredData.filter(
      (dataPoint) => dataPoint.dur >= safeMin && dataPoint.dur < safeMax,
    );
    const count = videos.length;
    const avgV30 = count
      ? videos.reduce((sum, dataPoint) => sum + dataPoint.v30, 0) / count
      : 0;
    const avgViews = count
      ? videos.reduce((sum, dataPoint) => sum + dataPoint.views, 0) / count
      : 0;
    return { ...range, min: safeMin, max: safeMax, label, count, avgV30, avgViews };
  });
  const maxCount = Math.max(...rangeStats.map((range) => range.count), 0) || 1;
  const maxV30 =
    Math.max(...rangeStats.map((range) => range.avgV30), 0) || 1;
  const maxViewsAvg =
    Math.max(...rangeStats.map((range) => range.avgViews), 0) || 1;
  const rangeBarMetric = appState.getMode("rangeBars") || "views";

  updateChartData("cViewsRange", {
    type: "bar",
    data: {
      labels: rangeStats.map((range) => range.label),
      datasets: [
        {
          type: "bar",
          label: rangeBarMetric === "views" ? "Views Promedio" : V30_LABEL_PROMEDIO,
          data:
            rangeBarMetric === "views"
              ? rangeStats.map((range) => range.avgViews)
              : rangeStats.map((range) => range.avgV30),
          backgroundColor:
            rangeBarMetric === "views"
              ? CHART_COLORS.success
              : "rgba(59, 130, 246, 0.65)",
          borderColor:
            rangeBarMetric === "views"
              ? CHART_COLORS.successAlt
              : "rgba(37, 99, 235, 0.9)",
          borderRadius: appConfig.CHART_BAR_BORDER_RADIUS_XLARGE || 6,
          barPercentage: appConfig.CHART_BAR_PERCENTAGE_NARROW || 0.82,
          categoryPercentage: appConfig.CHART_CATEGORY_PERCENTAGE_NARROW || 0.78,
          yAxisID: "y",
          order: 1,
        },
        {
          type: "line",
          label: "Videos",
          data: rangeStats.map((range) => range.count),
          borderColor: CHART_COLORS.purple,
          backgroundColor: CHART_COLORS.purple,
          borderWidth: appConfig.CHART_LINE_BORDER_WIDTH || 3,
          tension: appConfig.CHART_LINE_TENSION || 0,
          pointRadius: appConfig.CHART_SCATTER_HOVER_RADIUS || 6,
          pointHoverRadius: appConfig.CHART_POINT_HOVER_RADIUS_SMALL || 8,
          pointBorderWidth: appConfig.CHART_POINT_BORDER_WIDTH_THICK || 2.4,
          pointBorderColor: "#ffffff",
          pointBackgroundColor: CHART_COLORS.purple,
          pointHitRadius: appConfig.CHART_POINT_HIT_RADIUS || 10,
          order: appConfig.CHART_ORDER_FOREGROUND || 99,
          z: appConfig.Z_INDEX_CHART_TOP || 10,
          clip: false,
          segment: { borderJoinStyle: "round" },
          yAxisID: "yCount",
        },
      ],
    },
    options: {
      responsive: true,
      animation: false,
      responsiveAnimationDuration: 0,
      maintainAspectRatio: false,
    layout: {
      padding: {
        top: appConfig.CHART_PADDING_TOP || 12,
        bottom: appConfig.CHART_PADDING_BOTTOM_LARGE || 42,
        right: appConfig.CHART_PADDING_RIGHT || 18
      }
    },
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
              if (context.dataset.yAxisID === "y") {
                const metricLabel =
                  rangeBarMetric === "views" ? "Views Prom" : V30_LABEL_PROM;
                return `${metricLabel}: ${fmtViews(context.parsed.y)}`;
              }
              return `Videos: ${context.parsed.y}`;
            },
          },
        },
      },
      scales: {
        x: {
          title: { display: false },
          grid: { color: CHART_COLORS.grid },
        },
        y: {
          position: "left",
          title: {
            display: true,
            text:
              rangeBarMetric === "views"
                ? "Views promedio"
                : V30_LABEL_PROM_LOWER,
          },
          ticks: { callback: (value) => fmtAxisViews(value) },
          beginAtZero: true,
          afterFit: (scale) => {
            scale.width = appConfig.Y_AXIS_WIDTH || 75;
          },
        },
        yCount: {
          position: "right",
          title: { display: true, text: "Cantidad de videos" },
          grid: { drawOnChartArea: false },
          ticks: {
            precision: 0,
            callback: (value) => (Number.isInteger(value) ? value : ""),
          },
          beginAtZero: true,
          afterFit: (scale) => {
            scale.width = appConfig.Y_AXIS_WIDTH || 75;
          },
        },
      },
    },
    plugins: [
      plugins.cViewsRangeLineOnTop,
      plugins.cViewsRangeLabels,
    ],
  });

  const chart2Mode = appState.getMode("chart2");
  const chart2IsLine = chart2Mode === "line";
  const chart2Options = commonOpt(undefined, {
    ticks: { callback: (value) => fmtAxisViews(value) },
    beginAtZero: true,
  });
  if (chart2IsLine) {
    chart2Options.elements = {
      line: {
        tension: appConfig.CHART_LINE_TENSION || 0,
        borderWidth: appConfig.CHART_LINE_BORDER_WIDTH || 3
      },
      point: {
        radius: appConfig.CHART_POINT_RADIUS_SMALL || 4,
        hoverRadius: appConfig.CHART_POINT_HOVER_RADIUS_SMALL || 6
      },
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
          backgroundColor: CHART_COLORS.success,
          borderColor: CHART_COLORS.successAlt,
          borderRadius: chart2IsLine ? 0 : (appConfig.CHART_BAR_BORDER_RADIUS || 3),
          borderWidth: chart2IsLine ? (appConfig.CHART_LINE_BORDER_WIDTH || 3) : 0,
          pointBackgroundColor: CHART_COLORS.success,
          pointBorderColor: "#ffffff",
          pointRadius: chart2IsLine ? (appConfig.CHART_POINT_RADIUS || 5) : 0,
          pointHoverRadius: chart2IsLine ? (appConfig.CHART_POINT_HOVER_RADIUS || 7) : 0,
          fill: false,
          tension: appConfig.CHART_LINE_TENSION || 0,
        },
      ],
    },
    options: chart2Options,
  });

  const durationPoints = filteredData.filter(
    (dataPoint) => Number.isFinite(dataPoint.dur) && dataPoint.dur > 0,
  );
  const scatterDur = durationPoints.map((dataPoint) => ({
    x: dataPoint.date,
    y: dataPoint.dur,
    title: dataPoint.title,
  }));
  const dailyDurations = new Map();
  durationPoints.forEach((dataPoint) => {
    const dayDate = normalizeDateLocal(dataPoint.date);
    const dayKey = dayDate.getTime();
    const bucket = dailyDurations.get(dayKey);
    if (!bucket) {
      dailyDurations.set(dayKey, {
        date: dayDate,
        durSum: dataPoint.dur,
        count: 1,
      });
    } else {
      bucket.durSum += dataPoint.dur;
      bucket.count += 1;
    }
  });
  const dailySeries = Array.from(dailyDurations.values()).sort(
    (a, b) => a.date - b.date,
  );
  const lineDur = dailySeries
    .map((dataPoint, index, arr) => {
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
        title: `Media movil (${MA_WINDOW}d)`,
      };
    })
    .filter((point) => point !== null);

  updateChartData("cTrendDur", {
    type: "line",
    data: {
      datasets: [
        {
          label: "Video",
          data: scatterDur,
          type: "scatter",
          backgroundColor: "rgba(99, 102, 241, 0.35)",
          borderColor: CHART_COLORS.primary,
          borderWidth: appConfig.CHART_SCATTER_DUR_BORDER_WIDTH || 0.6,
          hoverBorderWidth: appConfig.CHART_SCATTER_DUR_HOVER_BORDER_WIDTH || 1,
          radius: appConfig.CHART_SCATTER_DUR_RADIUS || 3.5,
          order: appConfig.CHART_ORDER_BACKGROUND || 1,
        },
        {
          label: `Media Movil (${MA_WINDOW}d)`,
          data: lineDur,
          borderColor: CHART_COLORS.orange,
          borderWidth: appConfig.CHART_LINE_BORDER_WIDTH_THICK || 3.2,
          pointRadius: 0,
          tension: appConfig.CHART_LINE_TENSION_SMOOTH || 0.3,
          order: appConfig.CHART_ORDER_FOREGROUND || 99,
          z: appConfig.Z_INDEX_CHART_TOP || 10,
        },
      ],
    },
    options: timeScatterOpt("Duracion"),
  });

  const chart4Metric = appState.getMode("chart4");
  const chart3Mode = appState.getMode("chart3");
  const chart3IsLine = chart3Mode === "line";
  const chart3Options = commonOpt(undefined, {
    ticks: { callback: (value) => fmtAxisViews(value) },
  });
  if (chart3Options.scales?.y) {
    chart3Options.scales.y.beginAtZero = true;
  }
  if (chart3IsLine) {
    chart3Options.elements = {
      line: {
        tension: appConfig.CHART_LINE_TENSION || 0,
        borderWidth: appConfig.CHART_LINE_BORDER_WIDTH || 3
      },
      point: {
        radius: appConfig.CHART_POINT_RADIUS_SMALL || 4,
        hoverRadius: appConfig.CHART_POINT_HOVER_RADIUS_SMALL || 6
      },
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
            return chart4Metric === "views"
              ? group.vSum / divisor
              : group.v30Sum / divisor;
          }),
          backgroundColor:
            chart4Metric === "views"
              ? CHART_COLORS.primarySoft
              : CHART_COLORS.v30,
          borderColor:
            chart4Metric === "views"
              ? CHART_COLORS.primary
              : CHART_COLORS.v30,
          borderRadius: chart3IsLine ? 0 : (appConfig.CHART_BAR_BORDER_RADIUS_LARGE || 4),
          borderWidth: chart3IsLine ? (appConfig.CHART_LINE_BORDER_WIDTH || 3) : 0,
          pointBorderWidth: chart3IsLine ? (appConfig.CHART_POINT_BORDER_WIDTH || 2) : 0,
          pointBackgroundColor:
            chart4Metric === "views"
              ? CHART_COLORS.primary
              : CHART_COLORS.v30,
          pointBorderColor: "#ffffff",
          pointRadius: chart3IsLine ? (appConfig.CHART_POINT_RADIUS || 5) : 0,
          pointHoverRadius: chart3IsLine ? (appConfig.CHART_POINT_HOVER_RADIUS || 7) : 0,
          fill: false,
          tension: appConfig.CHART_LINE_TENSION || 0,
          yAxisID: "y",
          order: appConfig.CHART_ORDER_BACKGROUND || 1,
        },
      ],
    },
    options: chart3Options,
  });
  const scatterViewsDur = filteredData
    .filter((dataPoint) => dataPoint.dur > 0)
    .map((dataPoint) => ({
      x: dataPoint.dur,
      y: dataPoint.views,
      title: dataPoint.title,
      views: dataPoint.views,
    }));
  const now = new Date();
  const scatterPerDay = filteredData
    .filter(
      (dataPoint) =>
        dataPoint.dur > 0 &&
        dataPoint.date instanceof Date &&
        dataPoint.date.getTime() <= now.getTime() - RECENT_DAYS_IGNORE * MS_PER_DAY,
    )
    .map((dataPoint) => {
      const daysLive = Math.max(
        1,
        (now - dataPoint.date) / MS_PER_DAY,
      );
      const viewsPerDay = dataPoint.views / daysLive;
      return {
        x: dataPoint.dur,
        y: viewsPerDay,
        title: dataPoint.title,
        views: dataPoint.views,
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
          backgroundColor: CHART_COLORS.scatterBg,
          borderColor: CHART_COLORS.scatter,
          borderWidth: appConfig.CHART_SCATTER_BORDER_WIDTH || 0.9,
          hoverBorderWidth: appConfig.CHART_SCATTER_HOVER_BORDER_WIDTH || 1.2,
          radius: appConfig.CHART_SCATTER_RADIUS || 4,
          hoverRadius: appConfig.CHART_SCATTER_HOVER_RADIUS || 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      responsiveAnimationDuration: 0,
      layout: { padding: { right: appConfig.CHART_PADDING_RIGHT || 18 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const raw = context.raw || {};
              const maxLength = appConfig.TOOLTIP_TITLE_MAX_LENGTH || 45;
              const truncateAt = appConfig.TOOLTIP_TITLE_TRUNCATE_AT || 42;
              const title = raw.title
                ? raw.title.length > maxLength
                  ? `${raw.title.substring(0, truncateAt)}...`
                  : raw.title
                : "Video";
              const value = context.parsed?.y || 0;
              const yLabel = isPerDay
                ? `Views/Dia: ${fmtViews(value)}`
                : `Views Totales: ${fmtViews(value)}`;
              return `${title} | Dur: ${fmtDurClock(context.parsed.x)} | ${yLabel}`;
            },
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Duracion" },
          ticks: { callback: (value) => fmtDurClock(value) },
        },
        y: {
          title: {
            display: true,
            text: isPerDay ? "Views / Dia" : "Views Totales",
          },
          ticks: { callback: (value) => fmtAxisViews(value) },
          afterFit: (scale) => {
            scale.width = appConfig.Y_AXIS_WIDTH || 75;
          },
        },
      },
    },
  });
}
