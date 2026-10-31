/**
 * Format a number as MW with appropriate precision
 */
export function formatMW(value, decimals = 0) {
  if (value == null || isNaN(value)) return '—'
  return `${Number(value).toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} MW`
}

/**
 * Format a number as a percentage
 */
export function formatPercent(value, decimals = 1) {
  if (value == null || isNaN(value)) return '—'
  return `${Number(value).toFixed(decimals)}%`
}

/**
 * Format a number with commas and specified decimal places
 */
export function formatNumber(value, decimals = 2) {
  if (value == null || isNaN(value)) return '—'
  return Number(value).toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format a datetime string for display
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a time string (HH:MM)
 */
export function formatTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get color class based on metric value thresholds (Supabase Theme)
 */
export function getMetricColor(metricName, value) {
  if (value == null) return 'text-zinc-500'

  const thresholds = {
    mae: { good: 200, warn: 500 },
    rmse: { good: 300, warn: 600 },
    mape: { good: 5, warn: 15 },
    bias: { good: 50, warn: 150 },
    max_error: { good: 500, warn: 1000 },
    correlation: { good: 0.95, warn: 0.85 },
  }

  const t = thresholds[metricName]
  if (!t) return 'text-zinc-100'

  if (metricName === 'correlation') {
    if (value >= t.good) return 'text-[#3ECF8E]'
    if (value >= t.warn) return 'text-amber-400'
    return 'text-rose-400'
  }

  if (metricName === 'bias') {
    const absVal = Math.abs(value)
    if (absVal <= t.good) return 'text-[#3ECF8E]'
    if (absVal <= t.warn) return 'text-amber-400'
    return 'text-rose-400'
  }

  if (value <= t.good) return 'text-[#3ECF8E]'
  if (value <= t.warn) return 'text-amber-400'
  return 'text-rose-400'
}

/**
 * Standard Plotly dark theme layout defaults (Supabase Theme)
 */
export const plotlyDarkLayout = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: {
    color: '#8b949e',
    family: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    size: 11,
  },
  xaxis: {
    gridcolor: '#222222',
    linecolor: '#282828',
    zerolinecolor: '#282828',
    tickfont: { color: '#8b949e', size: 10 },
  },
  yaxis: {
    gridcolor: '#222222',
    linecolor: '#282828',
    zerolinecolor: '#282828',
    tickfont: { color: '#8b949e', size: 10 },
  },
  margin: { l: 55, r: 25, t: 40, b: 45 },
  legend: {
    bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#ededed', size: 11 },
  },
  hoverlabel: {
    bgcolor: '#171717',
    bordercolor: '#333333',
    font: { color: '#ededed', size: 11 },
  },
}

/**
 * Standard Plotly config
 */
export const plotlyConfig = {
  displayModeBar: true,
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
}
