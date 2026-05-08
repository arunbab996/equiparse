import { useState } from 'react'
import { Info } from 'lucide-react'

const SLAB_OPTIONS = [
  { label: '5%',  value: '0.05' },
  { label: '20%', value: '0.20' },
  { label: '30%', value: '0.30' },
]

function calcCapGains(saleFMV, exerciseFMV, options, holdingMonths) {
  const gain = Math.max(0, (saleFMV - exerciseFMV) * options)
  const isLTCG = holdingMonths >= 12
  const exemption = isLTCG ? 125000 : 0
  const taxableGain = Math.max(0, gain - exemption)
  const rate = isLTCG ? 0.125 : 0.20
  const tax = taxableGain * rate
  return { gain, tax, rate, isLTCG, exemption }
}

function fmt(n) { return '₹' + Math.round(n).toLocaleString('en-IN') }
function fmtPct(r) { return (r * 100).toFixed(1) + '%' }

function addFiveYears(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  d.setFullYear(d.getFullYear() + 5)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TaxEstimator({ data }) {
  const ep   = Number(data.exercisePrice)   || 0
  const opts = Number(data.numberOfOptions) || 0

  const [fmvAtExercise,    setFmvAtExercise]    = useState(ep ? String(ep * 3) : '')
  const [fmvAtSale,        setFmvAtSale]        = useState(ep ? String(ep * 5) : '')
  const [holdingMonths,    setHoldingMonths]    = useState('18')
  const [optionsToExercise,setOptionsToExercise]= useState(String(opts))
  const [isDpiit,          setIsDpiit]          = useState(false)
  const [taxSlab,          setTaxSlab]          = useState('0.30')
  const [exerciseDate,     setExerciseDate]     = useState('')

  const fmvEx    = Number(fmvAtExercise)    || 0
  const fmvSale  = Number(fmvAtSale)        || 0
  const hMonths  = Number(holdingMonths)    || 0
  const optsEx   = Number(optionsToExercise)|| 0
  const slabRate = Number(taxSlab)

  const perqValue   = (optsEx && ep && fmvEx) ? Math.max(0, (fmvEx - ep) * optsEx) : null
  const perqTax     = perqValue != null ? Math.round(perqValue * slabRate) : null
  const deferredDate = addFiveYears(exerciseDate)

  const capg = (optsEx && fmvEx && fmvSale) ? calcCapGains(fmvSale, fmvEx, optsEx, hMonths) : null

  return (
    <div className="panel tax-panel">
      <div className="panel-header">
        <div className="panel-header-left">
          <h3 className="panel-title">Tax Impact Estimator</h3>
          <p className="panel-subtitle">
            Indian tax treatment · Perquisite tax at exercise + Capital gains on sale
          </p>
        </div>
        <div className="tax-regime-badge">New Tax Regime FY 2025–26</div>
      </div>

      <div className="panel-body">
        <div className="tax-disclaimer">
          <Info size={13} />
          Indicative estimates only. Consult a CA for tax filing. Surcharge and cess (4%) not included.
        </div>

        <div className="tax-layout">
          {/* ── Inputs ── */}
          <div className="tax-inputs">

            <div className="tax-input-group">
              <label className="tax-input-label">DPIIT recognised startup?</label>
              <div className="dpiit-pill">
                <button
                  type="button"
                  className={`dpiit-btn${!isDpiit ? ' dpiit-btn--active' : ''}`}
                  onClick={() => setIsDpiit(false)}
                >No</button>
                <button
                  type="button"
                  className={`dpiit-btn${isDpiit ? ' dpiit-btn--active' : ''}`}
                  onClick={() => setIsDpiit(true)}
                >Yes</button>
              </div>
            </div>

            <div className="tax-input-group">
              <label className="tax-input-label">Options to exercise</label>
              <div className="tax-input-wrap">
                <input className="tax-input" type="number" value={optionsToExercise}
                  onChange={e => setOptionsToExercise(e.target.value)} />
              </div>
            </div>

            <div className="tax-input-group">
              <label className="tax-input-label">Exercise price (₹ / option)</label>
              <div className="tax-input-wrap tax-input-wrap--prefix">
                <span className="tax-input-prefix">₹</span>
                <input className="tax-input" type="number" value={ep || ''} readOnly />
              </div>
              <span className="tax-input-note">From grant letter</span>
            </div>

            <div className="tax-input-group">
              <label className="tax-input-label">Fair Market Value at Exercise (₹)</label>
              <div className="tax-input-wrap tax-input-wrap--prefix">
                <span className="tax-input-prefix">₹</span>
                <input className="tax-input" type="number" value={fmvAtExercise}
                  onChange={e => setFmvAtExercise(e.target.value)} placeholder="e.g. 500" />
              </div>
            </div>

            <div className="tax-input-group">
              <label className="tax-input-label">Income tax slab</label>
              <select className="tax-input tax-select" value={taxSlab}
                onChange={e => setTaxSlab(e.target.value)}>
                {SLAB_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {isDpiit && (
              <div className="tax-input-group">
                <label className="tax-input-label">Exercise date</label>
                <input className="tax-input" type="date" value={exerciseDate}
                  onChange={e => setExerciseDate(e.target.value)} />
                <span className="tax-input-note">Used to compute 5-year deferral deadline</span>
              </div>
            )}

            <div className="tax-input-divider" />

            <div className="tax-input-group">
              <label className="tax-input-label">FMV at sale date (₹)</label>
              <div className="tax-input-wrap tax-input-wrap--prefix">
                <span className="tax-input-prefix">₹</span>
                <input className="tax-input" type="number" value={fmvAtSale}
                  onChange={e => setFmvAtSale(e.target.value)} placeholder="e.g. 800" />
              </div>
            </div>

            <div className="tax-input-group">
              <label className="tax-input-label">Holding period after exercise</label>
              <div className="tax-input-wrap tax-input-wrap--suffix">
                <input className="tax-input" type="number" value={holdingMonths}
                  onChange={e => setHoldingMonths(e.target.value)} />
                <span className="tax-input-suffix">months</span>
              </div>
            </div>
          </div>

          {/* ── Results ── */}
          <div className="tax-results">

            {/* Perquisite Tax — DPIIT-aware */}
            <div className="tax-result-block">
              <div className="tax-result-title">
                On Exercise — Perquisite Tax
                <span className="tax-result-tag">
                  Sec 17(2){isDpiit ? ' · Sec 192(1C)' : ''}
                </span>
              </div>

              {perqValue != null ? (
                <>
                  {isDpiit ? (
                    <div className="dpiit-cards">
                      {/* Non-DPIIT card */}
                      <div className="dpiit-card">
                        <div className="dpiit-card-header">Without DPIIT</div>
                        <div className="tax-result-row">
                          <span>Perquisite value</span>
                          <span className="mono">{fmt(perqValue)}</span>
                        </div>
                        <div className="tax-result-row">
                          <span>Slab rate</span>
                          <span className="mono">{fmtPct(slabRate)}</span>
                        </div>
                        <div className="tax-result-row tax-result-row--total">
                          <span>Tax payable</span>
                          <span className="mono">{fmt(perqTax)}</span>
                        </div>
                        <div className="dpiit-timing dpiit-timing--immediate">
                          Due at exercise — payable this financial year
                        </div>
                      </div>

                      {/* DPIIT card */}
                      <div className="dpiit-card dpiit-card--deferred">
                        <div className="dpiit-card-header dpiit-card-header--deferred">With DPIIT</div>
                        <div className="tax-result-row">
                          <span>Perquisite value</span>
                          <span className="mono">{fmt(perqValue)}</span>
                        </div>
                        <div className="tax-result-row">
                          <span>Slab rate</span>
                          <span className="mono">{fmtPct(slabRate)}</span>
                        </div>
                        <div className="tax-result-row tax-result-row--total">
                          <span>Tax amount</span>
                          <span className="mono">{fmt(perqTax)}</span>
                        </div>
                        <div className="dpiit-timing dpiit-timing--deferred">
                          Tax deferred — due at earliest of: (a) sale of shares, (b) 5 years from exercise, (c) leaving the company
                        </div>
                        {deferredDate && (
                          <div className="dpiit-due-date">
                            If not sold, latest due by: <strong>{deferredDate}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="tax-result-row">
                        <span>Perquisite value</span>
                        <span className="mono">{fmt(perqValue)}</span>
                      </div>
                      <div className="tax-result-row">
                        <span>Slab rate</span>
                        <span className="mono">{fmtPct(slabRate)}</span>
                      </div>
                      <div className="tax-result-row tax-result-row--total">
                        <span>Tax payable at exercise</span>
                        <span className="mono">{fmt(perqTax)}</span>
                      </div>
                      <div className="tax-result-note">
                        Due at exercise — payable this financial year. TDS deducted by employer.
                      </div>
                    </>
                  )}

                  {isDpiit && perqTax != null && (
                    <div className="dpiit-summary-box">
                      Under DPIIT recognition, your <strong>{fmt(perqTax)}</strong> perquisite tax
                      is deferred. You only pay when you sell your shares
                      {deferredDate ? <>, or by <strong>{deferredDate}</strong>,</> : ','} whichever comes first.
                    </div>
                  )}
                </>
              ) : (
                <div className="tax-result-empty">Fill in FMV at exercise to calculate</div>
              )}
            </div>

            {/* Capital Gains */}
            <div className="tax-result-block">
              <div className="tax-result-title">
                On Sale — Capital Gains Tax
                <span className={`tax-result-tag ${capg?.isLTCG ? 'tag--success' : 'tag--warn'}`}>
                  {capg ? (capg.isLTCG ? 'LTCG 12.5%' : 'STCG 20%') : 'LTCG / STCG'}
                </span>
              </div>
              {capg ? (
                <>
                  <div className="tax-result-row">
                    <span>Capital gain</span>
                    <span className="mono">{fmt(capg.gain)}</span>
                  </div>
                  {capg.isLTCG && (
                    <div className="tax-result-row">
                      <span>LTCG exemption</span>
                      <span className="mono">– {fmt(capg.exemption)}</span>
                    </div>
                  )}
                  <div className="tax-result-row">
                    <span>Tax rate</span>
                    <span className="mono">{fmtPct(capg.rate)}</span>
                  </div>
                  <div className="tax-result-row tax-result-row--total">
                    <span>Tax payable on sale</span>
                    <span className="mono">{fmt(capg.tax)}</span>
                  </div>
                  <div className="tax-result-note">
                    {capg.isLTCG
                      ? 'Held > 12 months from exercise — LTCG with ₹1.25L annual exemption'
                      : 'Held < 12 months from exercise — STCG applies'}
                  </div>
                </>
              ) : (
                <div className="tax-result-empty">Fill in sale FMV and holding period to calculate</div>
              )}
            </div>

            {/* Capital Gains note — always visible */}
            <div className="tax-capgains-note">
              <Info size={12} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                When you sell your shares, Capital Gains Tax applies separately on (Sale Price − FMV at Exercise).
                Holding unlisted shares &gt;24 months qualifies for Long-Term Capital Gains at 20% with indexation.
              </span>
            </div>

            {/* Total */}
            {perqTax != null && capg && (
              <div className="tax-result-block tax-result-block--total">
                <div className="tax-result-title">Total Tax Outflow</div>
                <div className="tax-result-row tax-result-row--grand">
                  <span>Exercise + Sale tax</span>
                  <span className="mono">{fmt(perqTax + capg.tax)}</span>
                </div>
                <div className="tax-result-row">
                  <span>Net gain after all taxes</span>
                  <span className="mono net-gain">
                    {fmt((fmvSale - ep) * optsEx - perqTax - capg.tax)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
