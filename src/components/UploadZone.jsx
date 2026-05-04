import { useRef, useState } from 'react'
import { FileText, Upload, X } from 'lucide-react'

export default function UploadZone({ onFile, file, disabled }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type === 'application/pdf') onFile(dropped)
  }

  const handleChange = (e) => {
    const picked = e.target.files[0]
    if (picked) onFile(picked)
  }

  if (file) {
    return (
      <div className="upload-zone upload-zone--filled">
        <FileText size={22} className="upload-file-icon" />
        <div className="upload-file-info">
          <span className="upload-file-name">{file.name}</span>
          <span className="upload-file-size">{(file.size / 1024).toFixed(1)} KB</span>
        </div>
        {!disabled && (
          <button
            className="upload-clear"
            onClick={() => onFile(null)}
            aria-label="Remove file"
          >
            <X size={15} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={`upload-zone ${dragging ? 'upload-zone--dragging' : ''} ${disabled ? 'upload-zone--disabled' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
      aria-label="Upload PDF grant letter"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <div className="upload-zone-content">
        <div className="upload-icon-wrap">
          <Upload size={22} strokeWidth={1.5} />
        </div>
        <div className="upload-text">
          <p className="upload-primary">Drop your grant letter PDF here</p>
          <p className="upload-secondary">or <span className="upload-link">click to browse</span></p>
        </div>
        <p className="upload-hint">PDF files only · Max 20 MB</p>
      </div>
    </div>
  )
}
