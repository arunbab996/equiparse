import { Sparkles, Loader2 } from 'lucide-react'

export default function ParseButton({ onClick, loading, disabled }) {
  return (
    <button
      className={`parse-btn ${loading ? 'parse-btn--loading' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="spin" />
          Parsing grant letter…
        </>
      ) : (
        <>
          <Sparkles size={16} />
          Parse with AI
        </>
      )}
    </button>
  )
}
