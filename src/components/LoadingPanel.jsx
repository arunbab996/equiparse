import { Loader2 } from 'lucide-react'

const STEPS = [
  'Reading PDF document…',
  'Extracting text content…',
  'Sending to GPT-4o…',
  'Parsing equity fields…',
  'Validating output…',
]

export default function LoadingPanel({ step = 0 }) {
  return (
    <div className="loading-panel">
      <div className="loading-spinner-wrap">
        <Loader2 size={28} className="spin" strokeWidth={1.5} />
      </div>
      <p className="loading-status">{STEPS[Math.min(step, STEPS.length - 1)]}</p>
      <div className="loading-steps">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`loading-step ${i < step ? 'loading-step--done' : ''} ${i === step ? 'loading-step--active' : ''}`}
          >
            <div className="loading-step-dot" />
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
