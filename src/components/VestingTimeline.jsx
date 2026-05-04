import { useState } from 'react'
import { Calendar, TrendingUp } from 'lucide-react'

function parseVestingData(data) {
  const total = Number(data.numberOfOptions) || 0
  if (!total) return null

  const cliff = parseCliff(data.cliffPeriod)
  const totalYears = parseTotalYears(data.vestingSchedule)
  const commencement = data.vestingCommencement ? new Date(data.vestingCommencement) : null

  if (!totalYears) return null

  const periods = []
  const remainingYears = totalYears - (cliff || 1)
  const cliffPct = 1 / totalYears
  const annualPct = remainingYears > 0 ? (1 - cliffPct) / remainingYears : 0

  let cumulative = 0

  for (let y = 1; y <= totalYears; y++) {
    const isCliff = y === (cliff || 1)
    const pct = isCliff ? cliffPct : y > (cliff || 1) ? annualPct : 0
    cumulative += pct
    const options = Math.round(total * pct)
    const cumulativeOptions = Math.round(total * cumulative)

    const vestDate = commencement
      ? new Date(commencement.getFullYear() + y, commencement.getMonth(), commencement.getDate())
      : null

    periods.push({
      year: y,
      label: `Year ${y}`,
      isCliff,
      pct,
      options,
      cumulative,
      cumulativeOptions,
      vestDate,
    })
  }

  return { periods, total, totalYears }
}

function parseCliff(str) {
  if (!str) return 1
  const m = String(str).match(/(\d+)\s*(year|yr|month)/i)
  if (!m) return 1
  return m[2].toLowerCase().startsWith('month') ? Math.round(Number(m[1]) / 12) : Number(m[1])
}

function parseTotalYears(str) {
  if (!str) return null
  const m = String(str).match(/(\d+)\s*(year|yr)/i)
  return m ? Number(m[1]) : null
}

function formatDate(d) {
  if (!d) return null
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatINR(n) {
  return n.toLocaleString('en-IN')
}

export default function VestingTimeline({ data }) {
  const parsed = parseVestingData(data)
  const [hoveredYear, setHoveredYear] = useState(null)

  if (!parsed) {
    return (
      <div className="panel">
        <div className="panel-header">
          <div className="panel-header-left">
            <h3 className="panel-title">Vesting Timeline</h3>
            <p className="panel-subtitle">Visual breakdown of option vesting over time</p>
          </div>
        </div>
        <div className="panel-body panel-body--empty">
          <Calendar size={28} className="panel-empty-icon" />
          <p>Vesting schedule or option count not available — edit the fields above to generate this chart.</p>
        </div>
      </div>
    )
  }

  const { periods, total } = parsed

  return (
    <div className="panel vesting-panel">
      <div className="panel-header">
        <div className="panel-header-left">
          <h3 className="panel-title">Vesting Timeline</h3>
          <p className="panel-subtitle">
            {formatINR(total)} options over {parsed.totalYears} years
          </p>
        </div>
        <div className="vesting-total-badge">
          <TrendingUp size={13} />
          100% vests {data.expiryDate ? `by ${data.expiryDate.slice(0,4)}` : `in Year ${parsed.totalYears}`}
        </div>
      </div>

      <div className="panel-body">
        {/* Bar chart */}
        <div className="vesting-bars">
          {periods.map(p => (
            <div
              key={p.year}
              className={`vesting-bar-col ${hoveredYear === p.year ? 'vesting-bar-col--hovered' : ''}`}
              onMouseEnter={() => setHoveredYear(p.year)}
              onMouseLeave={() => setHoveredYear(null)}
            >
              <div className="vesting-bar-label-top">
                {hoveredYear === p.year ? formatINR(p.options) : ''}
              </div>
              <div className="vesting-bar-track">
                <div
                  className={`vesting-bar-fill ${p.isCliff ? 'vesting-bar-fill--cliff' : ''}`}
                  style={{ height: `${p.pct * 100}%` }}
                />
              </div>
              <div className="vesting-bar-pct">{Math.round(p.pct * 100)}%</div>
              <div className="vesting-bar-year">{p.label}</div>
              {p.vestDate && (
                <div className="vesting-bar-date">{formatDate(p.vestDate)}</div>
              )}
            </div>
          ))}
        </div>

        {/* Cumulative table */}
        <div className="vesting-table">
          <div className="vesting-table-head">
            <span>Period</span>
            <span>Vesting Date</span>
            <span>Options Vesting</span>
            <span>Cumulative</span>
            <span>% Vested</span>
          </div>
          {periods.map(p => (
            <div
              key={p.year}
              className={`vesting-table-row ${p.isCliff ? 'vesting-table-row--cliff' : ''}`}
            >
              <span>
                {p.label}
                {p.isCliff && <span className="vesting-cliff-tag">Cliff</span>}
              </span>
              <span>{p.vestDate ? formatDate(p.vestDate) : '—'}</span>
              <span className="mono">{formatINR(p.options)}</span>
              <span className="mono">{formatINR(p.cumulativeOptions)}</span>
              <span>
                <span className="vesting-pct-pill" style={{ '--pct': p.cumulative }}>
                  {Math.round(p.cumulative * 100)}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
