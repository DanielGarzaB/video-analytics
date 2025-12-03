export const CONFIG = {
  // Data boundaries and steps
  Y_AXIS_WIDTH: 75,
  VIEW_STEP: 100000,
  DUR_STEP: 1,
  VIEW_MAX_CAP: 50000000,
  VIEW_MIN_FLOOR: 0,
  DUR_MAX_CAP: 360,
  DUR_MIN_FLOOR: 0,
  MA_WINDOW: 7, // Moving average window in days
  TOP_VIDEOS_LIMIT: 100,

  // Timing & Delays (in milliseconds)
  DEBOUNCE_DELAY_DEFAULT: 300, // Default debounce for filter changes
  DEBOUNCE_DELAY_FAST: 120, // Faster debounce for platform chips
  DEBOUNCE_DELAY_CHART_RENDER: 320, // Delay for duration range chart rendering
  PULSE_ANIMATION_DURATION: 220, // Duration of pulse animation on platform chips
  THUMB_LOAD_TIMEOUT: 1200, // Max wait time for thumbnail loading

  // Date & Time
  MS_PER_DAY: 86400000, // Milliseconds in a day (1000 * 60 * 60 * 24)
  MAX_RANGE_DAYS: 31, // Maximum date range allowed in days
  RECENT_DAYS_IGNORE: 14, // Days to ignore for recent videos in scatter plot

  // Z-index layers
  Z_INDEX_SLIDER_FOCUS: 40, // Active slider handle
  Z_INDEX_SLIDER_INACTIVE: 20, // Inactive slider handle
  Z_INDEX_CHART_TOP: 10, // Top layer for chart elements (lines, points)

  // Chart styling - Borders
  CHART_LINE_BORDER_WIDTH: 3, // Standard line chart border width
  CHART_BAR_BORDER_WIDTH: 1, // Standard bar chart border width
  CHART_SCATTER_BORDER_WIDTH: 0.9, // Scatter plot border width
  CHART_SCATTER_HOVER_BORDER_WIDTH: 1.2, // Scatter plot hover border
  CHART_SCATTER_DUR_BORDER_WIDTH: 0.6, // Duration scatter border
  CHART_SCATTER_DUR_HOVER_BORDER_WIDTH: 1, // Duration scatter hover border

  // Chart styling - Points
  CHART_POINT_RADIUS: 5, // Standard point radius
  CHART_POINT_HOVER_RADIUS: 7, // Standard point hover radius
  CHART_POINT_RADIUS_SMALL: 4, // Small point radius
  CHART_POINT_HOVER_RADIUS_SMALL: 6, // Small point hover radius
  CHART_POINT_BORDER_WIDTH: 2, // Point border width
  CHART_POINT_BORDER_WIDTH_THICK: 2.4, // Thicker point border
  CHART_POINT_HIT_RADIUS: 10, // Hit detection radius for points

  // Chart styling - Scatter points
  CHART_SCATTER_RADIUS: 4, // Scatter point radius
  CHART_SCATTER_HOVER_RADIUS: 6, // Scatter hover radius
  CHART_SCATTER_DUR_RADIUS: 3.5, // Duration scatter radius

  // Chart styling - Bars
  CHART_BAR_BORDER_RADIUS: 3, // Standard bar border radius
  CHART_BAR_BORDER_RADIUS_LARGE: 4, // Larger bar border radius
  CHART_BAR_BORDER_RADIUS_XLARGE: 6, // Extra large bar border radius
  CHART_BAR_PERCENTAGE: 0.86, // Bar width as percentage of category
  CHART_BAR_PERCENTAGE_NARROW: 0.82, // Narrower bar percentage
  CHART_CATEGORY_PERCENTAGE: 0.82, // Category width percentage
  CHART_CATEGORY_PERCENTAGE_NARROW: 0.78, // Narrower category percentage

  // Chart styling - Lines & Curves
  CHART_LINE_TENSION: 0, // No curve (straight lines)
  CHART_LINE_TENSION_SMOOTH: 0.3, // Smooth curve for moving average
  CHART_LINE_BORDER_WIDTH_THICK: 3.2, // Thicker line for moving average

  // Chart layout - Padding
  CHART_PADDING_RIGHT: 18, // Standard right padding
  CHART_PADDING_TOP: 12, // Top padding for stacked charts
  CHART_PADDING_BOTTOM: 16, // Bottom padding for legend
  CHART_PADDING_BOTTOM_LARGE: 42, // Large bottom padding for range bars

  // Chart layout - Legend
  CHART_LEGEND_BOX_WIDTH: 12, // Legend box width
  CHART_LEGEND_PADDING: 12, // Legend item padding

  // Chart order (higher = rendered on top)
  CHART_ORDER_FOREGROUND: 99, // Foreground elements (lines over bars)
  CHART_ORDER_BACKGROUND: 1, // Background elements (bars, scatter)

  // String truncation
  TOOLTIP_TITLE_MAX_LENGTH: 45, // Max chars in scatter tooltip title
  TOOLTIP_TITLE_TRUNCATE_AT: 42, // Truncate position for tooltip
  TOOLTIP_LABEL_MAX_LENGTH: 30, // Max chars in duration scatter tooltip
  TOOLTIP_LABEL_TRUNCATE_AT: 27, // Truncate position for label

  // Intersection Observer (lazy loading)
  OBSERVER_ROOT_MARGIN: "48px 0px", // Margin around viewport for lazy loading
  OBSERVER_THRESHOLD: 0.01, // Percentage of element visible to trigger load

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
