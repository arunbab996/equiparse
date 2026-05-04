import { CheckCircle2, XCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react'

function parseYears(str) {
  if (!str) return null
  const m = String(str).match(/(\d+)\s*(year|yr|month)/i)
  if (!m) return null
  return m[2].toLowerCase().startsWith('month') ? Number(m[1]) / 12 : Number(m[1])
}

function checkRules(data) {
  const rules = []

  // R1 — Cliff ≥ 1 year (SEBI SBEB 2021, Reg 18(1))
  const cliffYrs = parseYears(data.cliffPeriod)
  if (cliffYrs === null) {
    rules.push({ id: 'cliff-presence', status: 'warn', label: 'Cliff period not specified', detail: 'SEBI SBEB Regulations 2021 require a minimum vesting period of 1 year. Cliff period should be explicitly stated.', ref: 'SEBI SBEB 2021, Reg 18(1)' })
  } else if (cliffYrs < 1) {
    rules.push({ id: 'cliff-min', status: 'fail', label: `Cliff period too short (${data.cliffPeriod})`, detail: 'Minimum cliff period under SEBI SBEB Regulations 2021 is 1 year from the date of grant.', ref: 'SEBI SBEB 2021, Reg 18(1)' })
  } else {
    rules.push({ id: 'cliff-min', status: 'pass', label: `Cliff period compliant (${data.cliffPeriod})`, ref: 'SEBI SBEB 2021, Reg 18(1)' })
  }

  // R2 — Grant type is Indian terminology
  const indianTypes = ['esos', 'esps', 'sar', 'rsu', 'phantom', 'sweat equity']
  const usTypes = ['iso', 'nso', 'nqso', 'incentive stock option', 'non-qualified']
  const grantType = (data.grantType || '').toLowerCase()
  if (grantType && usTypes.some(t => grantType.includes(t))) {
    rules.push({ id: 'grant-type', status: 'warn', label: `US grant type detected: "${data.grantType}"`, detail: 'Indian companies should use ESOS (Employee Stock Option Scheme) as defined under Companies Act 2013, Sec 62(1)(b) and SEBI SBEB Regulations 2021. ISO/NSO are US-specific and not recognised under Indian law.', ref: 'Companies Act 2013, Sec 62(1)(b)' })
  } else if (!grantType) {
    rules.push({ id: 'grant-type', status: 'warn', label: 'Grant type not specified', detail: 'Confirm whether this is an ESOS, ESPS, SAR, or RSU grant.', ref: 'SEBI SBEB 2021' })
  } else {
    rules.push({ id: 'grant-type', status: 'pass', label: `Grant type: ${data.grantType}`, ref: 'Companies Act 2013, Sec 62(1)(b)' })
  }

  // R3 — Exercise price ≥ face value
  const ep = Number(data.exercisePrice)
  const fv = Number(data.faceValue)
  if (ep && fv) {
    if (ep < fv) {
      rules.push({ id: 'exercise-price', status: 'fail', label: `Exercise price (₹${ep}) below face value (₹${fv})`, detail: 'Under Companies Act 2013, shares cannot be issued at a price below face (par) value. The exercise price must be ≥ face value.', ref: 'Companies Act 2013, Sec 53' })
    } else {
      rules.push({ id: 'exercise-price', status: 'pass', label: `Exercise price ≥ face value (₹${ep} vs ₹${fv})`, ref: 'Companies Act 2013, Sec 53' })
    }
  } else if (ep && !fv) {
    rules.push({ id: 'exercise-price', status: 'warn', label: 'Face value not found — cannot verify exercise price floor', detail: 'Face value (par value) is needed to confirm the exercise price is not below par.', ref: 'Companies Act 2013, Sec 53' })
  }

  // R4 — Exercise window specified
  if (!data.exerciseWindow) {
    rules.push({ id: 'exercise-window', status: 'warn', label: 'Exercise window not specified', detail: 'The period within which vested options can be exercised should be stated. SEBI recommends a reasonable exercise window (typically 1–5 years post-vesting).', ref: 'SEBI SBEB 2021, Reg 18' })
  } else {
    rules.push({ id: 'exercise-window', status: 'pass', label: `Exercise window: ${data.exerciseWindow}`, ref: 'SEBI SBEB 2021, Reg 18' })
  }

  // R5 — Vesting schedule present
  if (!data.vestingSchedule) {
    rules.push({ id: 'vesting-schedule', status: 'fail', label: 'Vesting schedule missing', detail: 'A vesting schedule is mandatory. SEBI SBEB 2021 prohibits upfront vesting of all options on the grant date.', ref: 'SEBI SBEB 2021, Reg 18(1)' })
  } else {
    rules.push({ id: 'vesting-schedule', status: 'pass', label: `Vesting schedule present: ${data.vestingSchedule}`, ref: 'SEBI SBEB 2021, Reg 18(1)' })
  }

  // R6 — Expiry ≤ 10 years
  if (data.grantDate && data.expiryDate) {
    const grantMs = new Date(data.grantDate).getTime()
    const expiryMs = new Date(data.expiryDate).getTime()
    const years = (expiryMs - grantMs) / (1000 * 60 * 60 * 24 * 365.25)
    if (years > 10) {
      rules.push({ id: 'expiry', status: 'warn', label: `Option tenure unusually long (${years.toFixed(1)} years)`, detail: 'Most Indian ESOP schemes have a maximum option tenure of 7–10 years. Verify this is intentional.', ref: 'SEBI SBEB 2021' })
    } else {
      rules.push({ id: 'expiry', status: 'pass', label: `Option tenure: ${years.toFixed(1)} years`, ref: 'SEBI SBEB 2021' })
    }
  }

  // R7 — Board resolution date
  if (!data.boardResolutionDate) {
    rules.push({ id: 'board-res', status: 'warn', label: 'Board resolution date not found', detail: 'Under Companies Act 2013, ESOS grants must be authorised by a board/compensation committee resolution. The date should be documented.', ref: 'Companies Act 2013, Sec 62(1)(b)' })
  } else {
    rules.push({ id: 'board-res', status: 'pass', label: `Board resolution dated ${data.boardResolutionDate}`, ref: 'Companies Act 2013, Sec 62(1)(b)' })
  }

  return rules
}

const STATUS_CONFIG = {
  pass: { icon: CheckCircle2, className: 'rule--pass', iconClass: 'rule-icon--pass' },
  warn: { icon: AlertTriangle, className: 'rule--warn', iconClass: 'rule-icon--warn' },
  fail: { icon: XCircle,      className: 'rule--fail', iconClass: 'rule-icon--fail' },
}

export default function CompliancePanel({ data }) {
  const rules = checkRules(data)
  const passes = rules.filter(r => r.status === 'pass').length
  const warns  = rules.filter(r => r.status === 'warn').length
  const fails  = rules.filter(r => r.status === 'fail').length
  const score  = Math.round((passes / rules.length) * 100)

  const overallStatus = fails > 0 ? 'fail' : warns > 0 ? 'warn' : 'pass'

  return (
    <div className="panel compliance-panel">
      <div className="panel-header">
        <div className="panel-header-left">
          <h3 className="panel-title">India Compliance Check</h3>
          <p className="panel-subtitle">
            SEBI SBEB Regulations 2021 · Companies Act 2013 · Sec 62(1)(b)
          </p>
        </div>
        <div className={`compliance-score compliance-score--${overallStatus}`}>
          <span className="compliance-score-num">{score}%</span>
          <span className="compliance-score-label">Compliant</span>
        </div>
      </div>

      <div className="panel-body">
        <div className="compliance-summary">
          <div className="compliance-stat compliance-stat--pass">
            <CheckCircle2 size={14} /> {passes} passed
          </div>
          <div className="compliance-stat compliance-stat--warn">
            <AlertTriangle size={14} /> {warns} warnings
          </div>
          <div className="compliance-stat compliance-stat--fail">
            <XCircle size={14} /> {fails} failed
          </div>
        </div>

        <div className="rule-list">
          {rules.map(rule => {
            const cfg = STATUS_CONFIG[rule.status]
            const Icon = cfg.icon
            return (
              <div key={rule.id} className={`rule-item ${cfg.className}`}>
                <Icon size={15} className={`rule-icon ${cfg.iconClass}`} />
                <div className="rule-content">
                  <div className="rule-label">{rule.label}</div>
                  {rule.detail && <div className="rule-detail">{rule.detail}</div>}
                  {rule.ref && <div className="rule-ref"><Info size={10} /> {rule.ref}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="panel-footer">
        <span className="panel-footer-note">
          This is an automated check and does not constitute legal advice.
          Consult a qualified legal or CS professional for compliance decisions.
        </span>
      </div>
    </div>
  )
}
