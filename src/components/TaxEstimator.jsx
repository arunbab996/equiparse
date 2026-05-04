import { useState } from 'react'
import { Calculator, Info } from 'lucide-react'

const TAX_SLABS_NEW = [
  { limit: 300000,  rate: 0,    label: 'Up to ₹3L' },
  { limit: 700000,  rate: 0.05, label: '₹3L – ₹7L' },
  { limit: 1000000, rate: 0.10, label: '₹7L – ₹10L' },
  { limit: 1200000, rate: 0.15, label: '₹10L – ₹12L' },
  { limit: 1500000, rate: 0.20, label: '₹12L – ₹15L' },
  { limit: Infinity, rate: 0.30, label: 'Above ₹15L' },
]

function calcSlabTax(income) {
  let tax = 0
  let prev = 0
  for (const slab of TAX_SLABS_NEW) {
    if (income <= prev) break
    const taxable = Math.min(income, slab.limit) - prev
    tax += taxable * slab.rate
    prev = slab.limit
  }
  return tax
}

function calcPerquisiteTax(fmvAtExercise, exercisePrice, options, otherIncome) {
  const perquisite = Math.max(0, (fmvAtExercise - exercisePrice) * options)
  const totalIncome = otherIncome + perquisite
  const taxOnTotal = calcSlabTax(totalIncome)
  const taxWithout  = calcSlabTax(otherIncome)
  const taxOnPerquisite = taxOnTotal - taxWithout
  return { perquisite, taxOnPerquisite, effectiveRate: perquisite > 0 ? taxOnPerquisite / perquisite : 0 }
}

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

export default function TaxEstimator({ data }) {
  const ep = Number(data.exercisePrice) || 0
  const opts = Number(data.numberOfOptions) || 0

  const [fmvAtExercise, setFmvAtExercise]     = useState(ep ? String(ep * 3) : '')
  const [fmvAtSale, setFmvAtSale]             = useState(ep ? String(ep * 5) : '')
  const [otherIncome, setOtherIncome]         = useState('2000000')
  const [holdingMonths, setHoldingMonths]     = useState('18')
  const [optionsToExercise, setOptionsToExercise] = useState(String(opts))

  const fmvEx  = Number(fmvAtExercise)  || 0
  const fmvSale = Number(fmvAtSale)     || 0
  const oInc   = Number(otherIncome)    || 0
  const hMonths = Number(holdingMonths) || 0
  const optsEx = Number(optionsToExercise) || 0

  const perq = optsEx && ep && fmvEx ? calcPerquisiteTax(fmvEx, ep, optsEx, oInc) : null
  const capg = optsEx && fmvEx && fmvSale ? calcCapGains(fmvSale, fmvEx, optsEx, hMonths) : null

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
          {/* Inputs */}
          <div className="tax-inputs">
            <div className="tax-input-group">
              <label className="tax-input-label">Options to exercise</label>
              <div className="tax-input-wrap">
                <input className="tax-input" type="number" value={optionsToExercise} onChange={e => setOptionsToExercise(e.target.value)} />
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
              <label className="tax-input-label">FMV at exercise date (₹)</label>
              <div className="tax-input-wrap tax-input-wrap--prefix">
                <span className="tax-input-prefix">₹</span>
                <input className="tax-input" type="number" value={fmvAtExercise} onChange={e => setFmvAtExercise(e.target.value)} placeholder="e.g. 500" />
              </div>
            </div>
            <div className="tax-input-group">
              <label className="tax-input-label">FMV at sale date (₹)</label>
              <div className="tax-input-wrap tax-input-wrap--prefix">
                <span className="tax-input-prefix">₹</span>
                <input className="tax-input" type="number" value={fmvAtSale} onChange={e => setFmvAtSale(e.target.value)} placeholder="e.g. 800" />
              </div>
            </div>
            <div className="tax-input-group">
              <label className="tax-input-label">Other annual income (₹)</label>
              <div className="tax-input-wrap tax-input-wrap--prefix">
                <span className="tax-input-prefix">₹</span>
                <input className="tax-input" type="number" value={otherIncome} onChange={e => setOtherIncome(e.target.value)} />
              </div>
            </div>
            <div className="tax-input-group">
              <label className="tax-input-label">Holding period after exercise</label>
              <div className="tax-input-wrap tax-input-wrap--suffix">
                <input className="tax-input" type="number" value={holdingMonths} onChange={e => setHoldingMonths(e.target.value)} />
                <span className="tax-input-suffix">months</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="tax-results">
            {/* Perquisite tax */}
            <div className="tax-result-block">
              <div className="tax-result-title">
                On Exercise — Perquisite Tax
                <span className="tax-result-tag">Income Tax Act, Sec 17(2)</span>
              </div>
              {perq ? (
                <>
                  <div className="tax-result-row">
                    <span>Perquisite value</span>
                    <span className="mono">{fmt(perq.perquisite)}</span>
                  </div>
                  <div className="tax-result-row">
                    <span>Effective tax rate</span>
                    <span className="mono">{fmtPct(perq.effectiveRate)}</span>
                  </div>
                  <div className="tax-result-row tax-result-row--total">
                    <span>Tax payable at exercise</span>
                    <span className="mono">{fmt(perq.taxOnPerquisite)}</span>
                  </div>
                  <div className="tax-result-note">
                    Added to salary income; TDS deducted by employer on exercise date
                  </div>
                </>
              ) : (
                <div className="tax-result-empty">Fill in FMV at exercise to calculate</div>
              )}
            </div>

            {/* Capital gains */}
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
                <div className="tax-result-empty">Fill in sale FMV to calculate</div>
              )}
            </div>

            {/* Total */}
            {perq && capg && (
              <div className="tax-result-block tax-result-block--total">
                <div className="tax-result-title">Total Tax Outflow</div>
                <div className="tax-result-row tax-result-row--grand">
                  <span>Exercise + Sale tax</span>
                  <span className="mono">{fmt(perq.taxOnPerquisite + capg.tax)}</span>
                </div>
                <div className="tax-result-row">
                  <span>Net gain after all taxes</span>
                  <span className="mono net-gain">
                    {fmt((fmvSale - ep) * optsEx - perq.taxOnPerquisite - capg.tax)}
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
