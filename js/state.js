const State = (() => {
  let fullData = [];
  let filteredData = [];
  const charts = {};
  const chartTypes = {};
  let durationRanges = [];
  const chartModes = {
    chart1: "bar",
    chart1Metric: "videos",
    chart2: "line",
    chart3: "line",
    chart4: "views",
    chart6: "perDay",
    rangeBars: "views",
    summaryMode: "period",
  };
  let applyTimer = null;

  const clearChartInstance = (key) => {
    if (charts[key]) {
      charts[key].destroy?.();
      delete charts[key];
    }
    delete chartTypes[key];
  };

  const assignArray = (data = []) => (Array.isArray(data) ? data : []);

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
    },
  };
})();

window.State = State;
