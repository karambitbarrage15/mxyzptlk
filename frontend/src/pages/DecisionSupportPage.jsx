import { useState, useMemo } from 'react'
import { useLatestForecasts, useMetrics, useErrorDistribution } from '../hooks/useApi'
import LatestForecastPanel from '../components/DecisionSupport/LatestForecastPanel'
import ConfidenceBands from '../components/DecisionSupport/ConfidenceBands'
import { formatMW } from '../utils/formatters'

export default function DecisionSupportPage() {
  const { data: latestRaw, isLoading: latestLoading } = useLatestForecasts()
  const { data: metricsRaw, isLoading: metricsLoading } = useMetrics()
  const { data: distRaw, isLoading: distLoading } = useErrorDistribution()

  // Interactive Day-Ahead Purchase Calculator state
  const [demandForecast, setDemandForecast] = useState(28000) // Default 28 GW typical UK winter demand
  const [targetPeriodIndex, setTargetPeriodIndex] = useState(0)
  const [riskTolerance, setRiskTolerance] = useState('p10') // 'p10' (conservative) or 'p50' (neutral)

  const forecasts = latestRaw?.data || []
  const metrics = metricsRaw?.metrics
  const errorStats = distRaw?.stats

  // Selected period forecast
  const selectedPeriod = forecasts[targetPeriodIndex] || forecasts[0]
  const windForecastMW = selectedPeriod ? selectedPeriod.generation : 8000
  const stdError = errorStats?.std || metrics?.rmse || 850

  // Decision Calculations
  const calculations = useMemo(() => {
    // If trader relies on P50:
    const netShortfallP50 = Math.max(0, demandForecast - windForecastMW)

    // If trader relies on P10 conservative floor (Wind is lower by 1.282 * sigma):
    const conservativeWind = Math.max(0, windForecastMW - 1.282 * stdError)
    const netShortfallP10 = Math.max(0, demandForecast - conservativeWind)

    // Recommended buffer
    const recommendedBuffer = netShortfallP10 - netShortfallP50

    return {
      netShortfallP50,
      conservativeWind,
      netShortfallP10,
      recommendedBuffer,
    }
  }, [demandForecast, windForecastMW, stdError])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Day-Ahead Decision Support</h1>
        <p className="text-sm text-gray-400 mt-1">
          Bridge forecast intelligence into procurement action &bull; Calculate thermal purchase requirements with quantified wind volatility buffers
        </p>
      </div>

      {/* Day-Ahead Auction Simulator Widget */}
      <div className="card bg-gradient-to-br from-gray-900 to-gray-950 border-blue-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-800">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Interactive Decision Tool
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Day-Ahead Thermal Procurement Sizing (11:00 AM Gate Closure)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Risk Profile:</span>
            <button
              onClick={() => setRiskTolerance('p10')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                riskTolerance === 'p10'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              P10 Conservative (Buffer Hedged)
            </button>
            <button
              onClick={() => setRiskTolerance('p50')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                riskTolerance === 'p50'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              P50 Point Forecast (Zero Buffer)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Input: Consumer Demand */}
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-2">
              Expected Consumer Demand (MW)
            </label>
            <input
              type="number"
              step="500"
              value={demandForecast}
              onChange={(e) => setDemandForecast(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
            />
            <span className="text-[11px] text-gray-500 mt-1 block">
              Average UK winter peak: 30,000 - 38,000 MW
            </span>
          </div>

          {/* Wind Forecast Input/Selector */}
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-2">
              Wind Generation Expected (P50)
            </label>
            <div className="bg-gray-800/80 border border-gray-700 rounded-lg px-3 py-2 text-blue-400 font-mono text-sm font-semibold">
              {formatMW(windForecastMW)}
            </div>
            <span className="text-[11px] text-gray-500 mt-1 block">
              P10 Conservative Floor: {formatMW(calculations.conservativeWind)}
            </span>
          </div>

          {/* Net Shortfall Calculation */}
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-2">
              Net Thermal Needed (Unbuffered)
            </label>
            <div className="bg-gray-800/80 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 font-mono text-sm font-semibold">
              {formatMW(calculations.netShortfallP50)}
            </div>
            <span className="text-[11px] text-gray-500 mt-1 block">
              Demand minus expected wind (P50)
            </span>
          </div>

          {/* Final Procurement Recommendation */}
          <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Recommended Auction Bid
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-400 my-1">
              {formatMW(
                riskTolerance === 'p10'
                  ? calculations.netShortfallP10
                  : calculations.netShortfallP50
              )}
            </div>
            <span className="text-[11px] text-gray-400">
              {riskTolerance === 'p10' ? (
                <span className="text-amber-400 font-medium">
                  Includes +{formatMW(calculations.recommendedBuffer)} wind error buffer
                </span>
              ) : (
                'Exposes desk to balancing market penalties on wind deficit'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Probabilistic Confidence Bands Chart */}
      <ConfidenceBands
        forecasts={forecasts.slice(0, 48 * 7)} // First week for clear settlement view
        metrics={metrics}
        errorStats={errorStats}
        isLoading={latestLoading || metricsLoading || distLoading}
      />

      {/* Latest Forecasts Table */}
      <LatestForecastPanel forecasts={forecasts} isLoading={latestLoading} />
    </div>
  )
}
