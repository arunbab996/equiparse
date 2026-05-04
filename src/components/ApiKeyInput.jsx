import { useState } from 'react'
import { KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function ApiKeyInput({ apiKey, onChange }) {
  const [show, setShow] = useState(false)
  const valid = apiKey.startsWith('sk-') && apiKey.length > 20

  return (
    <div className="api-key-inner">
      <KeyRound size={15} className="api-key-icon" />
      <span className="api-key-label">API Key</span>
      <div className="api-key-field-wrap">
        <input
          type={show ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => onChange(e.target.value)}
          placeholder="sk-..."
          className="api-key-input"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="api-key-toggle"
          aria-label={show ? 'Hide key' : 'Show key'}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {valid && (
        <span className="api-key-valid">
          <CheckCircle2 size={13} /> Active
        </span>
      )}
    </div>
  )
}
