import { AlertCircle, X } from 'lucide-react'

export default function ErrorBanner({ message, onDismiss }) {
  return (
    <div className="error-banner" role="alert">
      <AlertCircle size={16} className="error-banner-icon" />
      <span className="error-banner-text">{message}</span>
      <button className="error-banner-close" onClick={onDismiss} aria-label="Dismiss error">
        <X size={14} />
      </button>
    </div>
  )
}
