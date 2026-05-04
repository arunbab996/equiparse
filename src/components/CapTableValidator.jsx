import { useState, useRef } from 'react'
import {
  Upload, FileSpreadsheet, X, Sparkles, Loader2,
  AlertCircle, AlertTriangle, Info, CheckCircle2,
  Download, Users, Hash, Layers, CheckSquare, XSquare,
} from 'lucide-react'
import { parseCapTable } from '../utils/excelParse'
import { auditCapTable } from '../utils/capTableAudit'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/* ─── Upload zone ─────────────────────────────────────────── */
function CapUploadZone({ file, onFile, disabled }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const accept = '.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  if (file) return (
    <div className="upload-zone upload-zone--filled">
      <FileSpreadsheet size={22} className="upload-file-icon" />
      <div className="upload-file-info">
        <span className="upload-file-name">{file.name}</span>
        <span className="upload-file-size">{(file.size / 1024).toFixed(1)} KB</span>
      </div>
      {!disabled && (
        <button className="upload-clear" onClick={() => onFile(null)}><X size={15} /></button>
      )}
    </div>
  )

  return (
    <div
      className={`upload-zone ${dragging ? 'upload-zone--dragging' : ''} ${disabled ? 'upload-zone--disabled' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button" tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept={accept} onChange={e => onFile(e.target.files[0])} style={{ display: 'none' }} />
      <div className="upload-zone-content">
        <div className="upload-icon-wrap"><Upload size={22} strokeWidth={1.5} /></div>
        <div className="upload-text">
          <p className="upload-primary">Drop your cap table file here</p>
          <p className="upload-secondary">or <span className="upload-link">click to browse</span></p>
        </div>
        <p className="upload-hint">CSV · XLSX · XLS · Max 10 MB</p>
      </div>
    </div>
  )
}

/* ─── Table preview ───────────────────────────────────────── */
function TablePreview({ headers, rows, auditResult }) {
  const preview = rows.slice(0, 20)

  // Build a set of error rows for highlighting
  const errorRows = new Set()
  const warnRows  = new Set()
  if (auditResult) {
    auditResult.errors?.forEach(e => e.row && errorRows.add(e.row))
    auditResult.warnings?.forEach(w => w.row && warnRows.add(w.row))
  }

  return (
    <div className="ct-preview">
      <div className="ct-preview-header">
        <span className="ct-preview-title">Table Preview</span>
        <span className="ct-preview-meta">
          Showing {Math.min(20, rows.length)} of {rows.length} rows
          {rows.length > 20 && ' — full file sent to AI for analysis'}
        </span>
      </div>
      <div className="ct-table-wrap">
        <table className="ct-table">
          <thead>
            <tr>
              <th className="ct-th ct-th--row">#</th>
              {headers.map(h => <th key={h} className="ct-th">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {preview.map((row) => {
              const rowNum = row._row
              const hasError = errorRows.has(rowNum)
              const hasWarn  = warnRows.has(rowNum)
              return (
                <tr key={rowNum} className={`ct-tr ${hasError ? 'ct-tr--error' : hasWarn ? 'ct-tr--warn' : ''}`}>
                  <td className="ct-td ct-td--row">
                    {rowNum}
                    {hasError && <span className="ct-row-dot ct-row-dot--error" title="Has errors" />}
                    {!hasError && hasWarn && <span className="ct-row-dot ct-row-dot--warn" title="Has warnings" />}
                  </td>
                  {headers.map(h => (
                    <td key={h} className={`ct-td ${!row[h] && row[h] !== 0 ? 'ct-td--empty' : ''}`}>
                      {row[h] === '' || row[h] == null ? <span className="ct-empty-cell">—</span> : String(row[h])}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Summary card ────────────────────────────────────────── */
function SummaryCard({ summary }) {
  const { total_shareholders, total_shares, share_classes, is_math_correct, fully_diluted_shares } = summary

  return (
    <div className="ct-summary">
      <div className="ct-summary-stat">
        <Users size={16} className="ct-summary-icon" />
        <div>
          <div className="ct-summary-val">{Number(total_shareholders || 0).toLocaleString('en-IN')}</div>
          <div className="ct-summary-label">Shareholders</div>
        </div>
      </div>
      <div className="ct-summary-divider" />
      <div className="ct-summary-stat">
        <Hash size={16} className="ct-summary-icon" />
        <div>
          <div className="ct-summary-val">{Number(total_shares || 0).toLocaleString('en-IN')}</div>
          <div className="ct-summary-label">Total Shares</div>
        </div>
      </div>
      {fully_diluted_shares && (
        <>
          <div className="ct-summary-divider" />
          <div className="ct-summary-stat">
            <Hash size={16} className="ct-summary-icon" />
            <div>
              <div className="ct-summary-val">{Number(fully_diluted_shares).toLocaleString('en-IN')}</div>
              <div className="ct-summary-label">Fully Diluted</div>
            </div>
          </div>
        </>
      )}
      <div className="ct-summary-divider" />
      <div className="ct-summary-stat">
        <Layers size={16} className="ct-summary-icon" />
        <div>
          <div className="ct-summary-val ct-summary-val--sm">
            {(share_classes || []).join(' · ') || '—'}
          </div>
          <div className="ct-summary-label">Share Classes</div>
        </div>
      </div>
      <div className="ct-summary-divider" />
      <div className="ct-summary-stat">
        {is_math_correct
          ? <CheckSquare size={16} className="ct-summary-icon ct-summary-icon--pass" />
          : <XSquare    size={16} className="ct-summary-icon ct-summary-icon--fail" />}
        <div>
          <div className={`ct-summary-val ${is_math_correct ? 'ct-summary-val--pass' : 'ct-summary-val--fail'}`}>
            {is_math_correct ? 'Pass' : 'Fail'}
          </div>
          <div className="ct-summary-label">Math Check</div>
        </div>
      </div>
    </div>
  )
}

/* ─── Validation report ───────────────────────────────────── */
function ValidationReport({ result, onDownloadPDF, fileName }) {
  const { errors = [], warnings = [], info = [] } = result
  const clean = errors.length === 0 && warnings.length === 0

  const Section = ({ items, type }) => {
    const cfg = {
      error: { icon: AlertCircle,   cls: 'ct-issue--error', label: 'Errors',   badge: 'badge-error' },
      warn:  { icon: AlertTriangle, cls: 'ct-issue--warn',  label: 'Warnings', badge: 'badge-warn'  },
      info:  { icon: Info,          cls: 'ct-issue--info',  label: 'Info',     badge: 'badge-info'  },
    }[type]
    const Icon = cfg.icon
    if (items.length === 0) return null
    return (
      <div className="ct-section">
        <div className="ct-section-header">
          <Icon size={14} />
          <span>{cfg.label}</span>
          <span className={`ct-section-count ${cfg.badge}`}>{items.length}</span>
        </div>
        <div className="ct-issue-list">
          {items.map((item, i) => (
            <div key={i} className={`ct-issue ${cfg.cls}`}>
              {item.row != null && (
                <span className="ct-issue-row">Row {item.row}</span>
              )}
              {item.field && (
                <span className="ct-issue-field">{item.field}</span>
              )}
              <span className="ct-issue-text">{item.issue || item.message}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="ct-report">
      <div className="ct-report-header">
        <div>
          <h3 className="ct-report-title">Validation Report</h3>
          <p className="ct-report-sub">
            {clean
              ? 'No issues detected'
              : `${errors.length} error${errors.length !== 1 ? 's' : ''} · ${warnings.length} warning${warnings.length !== 1 ? 's' : ''} · ${info.length} info`}
          </p>
        </div>
        <button className="action-btn action-btn--secondary ct-pdf-btn" onClick={onDownloadPDF}>
          <Download size={14} /> Download Report PDF
        </button>
      </div>

      {clean ? (
        <div className="ct-clean">
          <CheckCircle2 size={28} className="ct-clean-icon" />
          <p className="ct-clean-title">Cap table looks clean</p>
          <p className="ct-clean-sub">No errors or warnings were found in the uploaded file.</p>
        </div>
      ) : (
        <div className="ct-report-body">
          <Section items={errors}   type="error" />
          <Section items={warnings} type="warn"  />
          <Section items={info}     type="info"  />
        </div>
      )}
    </div>
  )
}

/* ─── Main component ──────────────────────────────────────── */
export default function CapTableValidator() {
  const [file, setFile]               = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [parsed, setParsed]           = useState(null)   // { headers, rows, csvText, totalRows }
  const [auditResult, setAuditResult] = useState(null)

  const handleFile = (f) => {
    setFile(f)
    setParsed(null)
    setAuditResult(null)
    setError(null)
  }

  const handleAnalyse = async () => {
    if (!file) return
    setError(null)
    setAuditResult(null)
    setLoading(true)

    try {
      const data = await parseCapTable(file)
      setParsed(data)
      const result = await auditCapTable(data.csvText)
      setAuditResult(result)
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!auditResult) return
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const { errors = [], warnings = [], info = [], summary = {} } = auditResult
    const purple = [107, 98, 201]
    const pageW = doc.internal.pageSize.getWidth()

    // Header bar
    doc.setFillColor(...purple)
    doc.rect(0, 0, pageW, 22, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14); doc.setFont('helvetica', 'bold')
    doc.text('EquiParse — Cap Table Validation Report', 14, 14)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal')
    doc.text(`Generated ${new Date().toLocaleString('en-IN')}  ·  File: ${file?.name || 'N/A'}`, pageW - 14, 14, { align: 'right' })

    // Summary
    doc.setTextColor(30, 30, 40)
    doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text('Summary', 14, 34)
    const summaryData = [
      ['Shareholders', String(summary.total_shareholders || '—')],
      ['Total Shares', Number(summary.total_shares || 0).toLocaleString('en-IN')],
      ['Share Classes', (summary.share_classes || []).join(', ') || '—'],
      ['Math Check', summary.is_math_correct ? '✓ Pass' : '✗ Fail'],
    ]
    autoTable(doc, {
      startY: 38, head: [['Field', 'Value']], body: summaryData,
      headStyles: { fillColor: purple, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    })

    let y = doc.lastAutoTable.finalY + 8

    // Errors
    if (errors.length > 0) {
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(220, 38, 38)
      doc.text(`Errors (${errors.length})`, 14, y + 6); y += 10
      autoTable(doc, {
        startY: y, head: [['Row', 'Field', 'Issue']],
        body: errors.map(e => [e.row ?? '—', e.field, e.issue]),
        headStyles: { fillColor: [220, 38, 38], fontSize: 9 },
        bodyStyles: { fontSize: 8.5 },
        columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 40 } },
        margin: { left: 14, right: 14 },
      })
      y = doc.lastAutoTable.finalY + 8
    }

    // Warnings
    if (warnings.length > 0) {
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(217, 119, 6)
      doc.text(`Warnings (${warnings.length})`, 14, y + 6); y += 10
      autoTable(doc, {
        startY: y, head: [['Row', 'Field', 'Issue']],
        body: warnings.map(w => [w.row ?? '—', w.field, w.issue]),
        headStyles: { fillColor: [217, 119, 6], fontSize: 9 },
        bodyStyles: { fontSize: 8.5 },
        columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 40 } },
        margin: { left: 14, right: 14 },
      })
      y = doc.lastAutoTable.finalY + 8
    }

    // Info
    if (info.length > 0) {
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(37, 99, 235)
      doc.text(`Info (${info.length})`, 14, y + 6); y += 10
      autoTable(doc, {
        startY: y, head: [['Message']],
        body: info.map(i => [i.message]),
        headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
        bodyStyles: { fontSize: 8.5 },
        margin: { left: 14, right: 14 },
      })
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 160)
      doc.text('This report is indicative only and does not constitute legal or financial advice.  EquiParse · EquityList', 14, 290)
      doc.text(`Page ${i} of ${pageCount}`, pageW - 14, 290, { align: 'right' })
    }

    doc.save(`cap-table-report-${Date.now()}.pdf`)
  }

  const DEMO_CSV = `Shareholder Name,PAN,Share Class,Number of Shares,% Holding,Investment Date,Share Certificate No,Email
Arjun Kapoor,ABCPK1234F,Equity,500000,25.00%,15-Jan-2020,SC-001,arjun@techventure.in
Priya Sharma,DEFPS5678G,Equity,500000,25.00%,15-Jan-2020,SC-002,priya@techventure.in
Sequoia India Fund,GHISF9012H,CCPS,400000,20.00%,10-Mar-2021,SC-003,deals@sequoiacap.com
Peak XV Partners,,Preference,300000,15.00%,22-Jul-2022,SC-004,
ESOP Pool,,ESOP,200000,10.00%,,SC-005,
Arjun Kapoor,ABCPK1234F,Equity,100000,5.00%,15-Jan-2020,SC-006,arjun@techventure.in`

  const loadDemo = async () => {
    const blob = new Blob([DEMO_CSV], { type: 'text/csv' })
    const demoFile = new File([blob], 'demo-cap-table.csv', { type: 'text/csv' })
    setFile(demoFile)
    setError(null)
    setAuditResult(null)

    setLoading(true)
    try {
      const data = await parseCapTable(demoFile)
      setParsed(data)
      const result = await auditCapTable(data.csvText)
      setAuditResult(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ct-root">
      <div className="page-hero">
        <h1 className="page-hero-title">Cap Table Validator</h1>
        <p className="page-hero-sub">
          Upload a cap table CSV or Excel file. GPT-4o audits it for errors, missing data,
          duplicate entries, math discrepancies, and Indian regulatory fields — then generates a downloadable PDF report.
        </p>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} className="error-banner-icon" />
          <span className="error-banner-text">{error}</span>
          <button className="error-banner-close" onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      <div className="workflow">
        {/* Upload */}
        <div className={`workflow-step ${!file ? 'workflow-step--active' : ''}`}>
          <div className="step-header">
            <div className="step-num">1</div>
            <div>
              <div className="step-title">Upload Cap Table</div>
              <div className="step-subtitle">CSV · XLSX · XLS · Max 10 MB</div>
            </div>
            {file && (
              <span className="step-badge step-badge--ready">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Ready
              </span>
            )}
          </div>
          <div className="step-body">
            <CapUploadZone file={file} onFile={handleFile} disabled={loading} />
          </div>
        </div>

        {/* Analyse */}
        <div className={`workflow-step ${file && !auditResult ? 'workflow-step--active' : ''}`}>
          <div className="step-header">
            <div className="step-num">2</div>
            <div>
              <div className="step-title">Audit with AI</div>
              <div className="step-subtitle">GPT-4o checks for 12+ types of cap table errors</div>
            </div>
          </div>
          <div className="step-body">
            <button
              className={`parse-btn ${loading ? 'parse-btn--loading' : ''}`}
              onClick={handleAnalyse}
              disabled={!file || loading}
            >
              {loading
                ? <><Loader2 size={16} className="spin" /> Analysing cap table…</>
                : <><Sparkles size={16} /> Audit with AI</>}
            </button>
            {!file && <p className="parse-hint">Upload a file above to continue</p>}
            <button className="demo-btn" onClick={loadDemo} disabled={loading} type="button">
              No file? Try with sample cap table data →
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {parsed && auditResult && !loading && (
        <div className="ct-results">
          {auditResult.summary && <SummaryCard summary={auditResult.summary} />}
          <TablePreview headers={parsed.headers} rows={parsed.rows} auditResult={auditResult} />
          <ValidationReport result={auditResult} onDownloadPDF={handleDownloadPDF} fileName={file?.name} />
        </div>
      )}
    </div>
  )
}
