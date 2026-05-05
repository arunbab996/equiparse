import { useState, useCallback } from 'react'
import {
  FileText, Play, RotateCcw, Copy, Download,
  Lock, LayoutGrid, ClipboardList, TrendingUp,
  BookOpen, Users, Sparkles, ShieldCheck, Calculator,
} from 'lucide-react'
import UploadZone from './components/UploadZone'
import ParseButton from './components/ParseButton'
import DataCard from './components/DataCard'
import LoadingPanel from './components/LoadingPanel'
import ErrorBanner from './components/ErrorBanner'
import CompliancePanel from './components/CompliancePanel'
import VestingTimeline from './components/VestingTimeline'
import TaxEstimator from './components/TaxEstimator'
import { extractTextFromPDF } from './utils/pdfExtract'
import { parseGrantLetter } from './utils/openaiParse'
import './App.css'

/* ── Sidebar config ──────────────────────────────── */
const ACTIVE_TOOLS = [
  { id: 'grant', label: 'Grant Parser', Icon: FileText },
]

const LOCKED_TOOLS = [
  { label: 'Cap Table Manager',   Icon: LayoutGrid   },
  { label: 'Compliance Tracker',  Icon: ClipboardList },
  { label: 'Valuation Engine',    Icon: TrendingUp   },
  { label: 'Board Reports',       Icon: BookOpen     },
  { label: 'Employee ESOP Portal',Icon: Users        },
]

const DEMO_DATA = {
  employeeName: 'Priya Sharma',
  employeeId: 'EMP-2847',
  companyName: 'TechVenture India Pvt. Ltd.',
  schemeName: 'TechVenture ESOP Scheme 2021',
  grantType: 'ESOS',
  boardResolutionDate: '2023-02-28',
  grantDate: '2023-03-15',
  numberOfOptions: 25000,
  faceValue: 1,
  exercisePrice: 10,
  fairMarketValue: 85,
  currency: 'INR',
  vestingCommencement: '2023-03-15',
  vestingSchedule: '4 years',
  cliffPeriod: '1 year',
  vestingPercentages: '25% Year 1 (cliff), 25% Year 2, 25% Year 3, 25% Year 4',
  exerciseWindow: '5 years post-vesting',
  expiryDate: '2032-03-14',
  lockInPeriod: null,
  notes: null,
}

const GRANT_TABS = [
  { id: 'data',       label: 'Grant Data' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'vesting',    label: 'Vesting Timeline' },
  { id: 'tax',        label: 'Tax Estimator' },
]

export default function App() {
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadStep, setLoadStep] = useState(0)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)
  const [copied, setCopied]   = useState(false)
  const [activeTab, setActiveTab] = useState('data')

  const handleFile = (f) => {
    setFile(f); setResult(null); setError(null); setActiveTab('data')
  }

  const handleReset = () => {
    setFile(null); setResult(null); setError(null); setActiveTab('data')
  }

  const handleParse = async () => {
    if (!file) return
    setError(null); setResult(null); setLoading(true); setLoadStep(0)
    try {
      setLoadStep(1)
      const text = await extractTextFromPDF(file)
      setLoadStep(2); setLoadStep(3)
      const parsed = await parseGrantLetter(text)
      setLoadStep(4)
      setResult(parsed); setActiveTab('data')
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = useCallback((key, value) => {
    setResult(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch { setError('Failed to copy to clipboard.') }
  }

  const handleExportCSV = () => {
    const headers = Object.keys(result)
    const values = headers.map(k => {
      const v = result[k]
      if (v === null || v === undefined) return ''
      const str = String(v)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    })
    const csv = [headers.join(','), values.join(',')].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `grant-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const showResults = result && !loading

  return (
    <div className="app-shell">

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <a href="https://equiparse.vercel.app/" target="_blank" rel="noopener noreferrer" className="brand-logo-link">
            <img src="/equitylist-brand.png" alt="EquityList" className="brand-logo-img" />
          </a>
        </div>

        <nav className="sidebar-nav">
          {/* Active tools */}
          <div className="sidebar-section-label">Tools</div>
          {ACTIVE_TOOLS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className="sidebar-item sidebar-item--active"
            >
              <Icon size={15} className="sidebar-item-icon" strokeWidth={2.2} />
              {label}
            </button>
          ))}

          {/* Locked internal tools */}
          <div className="sidebar-section-label" style={{ marginTop: 20 }}>Internal Tools</div>
          {LOCKED_TOOLS.map(({ label, Icon }) => (
            <div key={label} className="sidebar-item sidebar-item--locked" title="Coming soon">
              <Icon size={15} className="sidebar-item-icon" strokeWidth={1.6} />
              <span className="sidebar-item-locked-label">{label}</span>
              <Lock size={11} className="sidebar-lock-icon" />
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-badges">
            <span className="sidebar-footer-tag">India</span>
            <span className="sidebar-footer-tag sidebar-footer-tag--purple">Beta</span>
          </div>
          <p className="sidebar-footer-note">SEBI SBEB 2021 · Companies Act 2013</p>
          <p className="sidebar-footer-note" style={{ marginTop: 4 }}>No data stored server-side</p>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────── */}
      <div className="app-main">

        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-breadcrumb">
            <span className="topbar-home">EquityList</span>
            <span className="topbar-sep">›</span>
            <span className="topbar-current">Grant Parser</span>
          </div>
          <div className="topbar-right">
            <span className="topbar-version">Prototype v0.2</span>
          </div>
        </header>

        {/* Content */}
        <main className="app-content">

          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

          {/* ── Stepper: only shown before results ── */}
          {!showResults && (
            <div className="upload-flow">
              <div className="page-header">
                <h1 className="page-title">ESOP Grant Letter Parser</h1>
                <p className="page-subtitle">
                  Upload any ESOP / ESOS grant letter PDF — GPT-4o extracts 19 structured fields,
                  checks SEBI &amp; Companies Act compliance, and estimates Indian tax impact.
                </p>
              </div>

              <div className="wf-panel">
                {/* Step 1 */}
                <div className="wf-step">
                  <div className="wf-indicator">
                    <div className={`wf-circle ${file ? 'wf-circle--done' : 'wf-circle--active'}`}>
                      {file
                        ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : '1'}
                    </div>
                    <div className="wf-line" />
                  </div>
                  <div className="wf-content">
                    <div className="wf-step-head">
                      <span className="wf-step-title">Upload Grant Letter</span>
                      <span className="wf-step-sub">PDF · ESOS / ESPS / SAR / RSU · Max 20 MB</span>
                    </div>
                    <UploadZone onFile={handleFile} file={file} disabled={loading} />
                  </div>
                </div>

                {/* Step 2 — only turns active once a file is chosen */}
                <div className="wf-step wf-step--last">
                  <div className="wf-indicator">
                    <div className={`wf-circle ${file ? 'wf-circle--active' : ''}`}>2</div>
                  </div>
                  <div className="wf-content wf-content--last">
                    <div className="wf-step-head">
                      <span className="wf-step-title">Extract &amp; Analyse</span>
                      <span className="wf-step-sub">GPT-4o · 19 structured fields</span>
                    </div>
                    <ParseButton onClick={handleParse} loading={loading} disabled={!file || loading} />
                    {!file && <p className="parse-hint">Upload a document first</p>}
                    <button
                      className="demo-pill-btn"
                      onClick={() => { setResult(DEMO_DATA); setActiveTab('data') }}
                      type="button"
                    >
                      <Play size={11} fill="currentColor" />
                      Try sample Indian ESOP data
                    </button>
                  </div>
                </div>
              </div>

              {loading && (
                <div style={{ marginTop: 20 }}>
                  <LoadingPanel step={loadStep} />
                </div>
              )}

              {/* Feature strip — visible only when not loading */}
              {!loading && (
                <div className="feature-strip">
                  <div className="feature-strip-item">
                    <div className="feature-strip-icon"><Sparkles size={18} /></div>
                    <div className="feature-strip-text">
                      <span className="feature-strip-title">19 Fields, AI-Extracted</span>
                      <span className="feature-strip-sub">Grant dates, exercise price, vesting schedule, expiry — all in one click</span>
                    </div>
                  </div>
                  <div className="feature-strip-item">
                    <div className="feature-strip-icon"><ShieldCheck size={18} /></div>
                    <div className="feature-strip-text">
                      <span className="feature-strip-title">Regulatory Compliance</span>
                      <span className="feature-strip-sub">SEBI SBEB 2021 &amp; Companies Act 2013 checks, auto-flagged</span>
                    </div>
                  </div>
                  <div className="feature-strip-item">
                    <div className="feature-strip-icon"><Calculator size={18} /></div>
                    <div className="feature-strip-text">
                      <span className="feature-strip-title">Indian Tax Estimator</span>
                      <span className="feature-strip-sub">Perquisite tax at exercise + LTCG / STCG at sale, regime-aware</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Results ─────────────────────────────── */}
          {showResults && (
            <div className="results-section results-section--full">
              {/* Tab bar + action buttons in one row */}
              <div className="results-topbar">
                <div className="results-tabs">
                  {GRANT_TABS.map(tab => (
                    <button
                      key={tab.id}
                      className={`results-tab ${activeTab === tab.id ? 'results-tab--active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="results-actions">
                  <button className="action-btn action-btn--secondary" onClick={handleCopyJSON}>
                    <Copy size={13} /> Copy JSON
                  </button>
                  <button className="action-btn action-btn--secondary" onClick={handleExportCSV}>
                    <Download size={13} /> Export CSV
                  </button>
                  <button className="action-btn action-btn--ghost" onClick={handleReset} title="Parse another grant">
                    <RotateCcw size={13} /> Parse another
                  </button>
                </div>
              </div>

              <div className="results-panel">
                {activeTab === 'data'       && <DataCard data={result} onUpdate={handleUpdate} onCopyJSON={handleCopyJSON} onExportCSV={handleExportCSV} />}
                {activeTab === 'compliance' && <CompliancePanel data={result} />}
                {activeTab === 'vesting'    && <VestingTimeline data={result} />}
                {activeTab === 'tax'        && <TaxEstimator data={result} />}
              </div>
            </div>
          )}

        </main>
      </div>

      {copied && <div className="toast">Copied to clipboard</div>}
    </div>
  )
}
