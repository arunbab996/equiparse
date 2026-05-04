import { useState, useCallback } from 'react'
import UploadZone from './components/UploadZone'
import ParseButton from './components/ParseButton'
import DataCard from './components/DataCard'
import LoadingPanel from './components/LoadingPanel'
import ErrorBanner from './components/ErrorBanner'
import CompliancePanel from './components/CompliancePanel'
import VestingTimeline from './components/VestingTimeline'
import TaxEstimator from './components/TaxEstimator'
import CapTableValidator from './components/CapTableValidator'
import { extractTextFromPDF } from './utils/pdfExtract'
import { parseGrantLetter } from './utils/openaiParse'
import './App.css'

const TOP_TABS = [
  { id: 'grant',    label: 'Grant Parser',        icon: '📄' },
  { id: 'captable', label: 'Cap Table Validator',  icon: '📊' },
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

export default function App() {
  const [topTab, setTopTab] = useState('grant')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadStep, setLoadStep] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('data')

  const handleFile = (f) => {
    setFile(f)
    setResult(null)
    setError(null)
    setActiveTab('data')
  }

  const handleParse = async () => {
    if (!file) return
    setError(null)
    setResult(null)
    setLoading(true)
    setLoadStep(0)

    try {
      setLoadStep(1)
      const text = await extractTextFromPDF(file)
      setLoadStep(2)
      setLoadStep(3)
      const parsed = await parseGrantLetter(text)
      setLoadStep(4)
      setResult(parsed)
      setActiveTab('data')
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
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Failed to copy to clipboard.')
    }
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
    a.href = url
    a.download = `equiparse-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const TABS = [
    { id: 'data',       label: 'Grant Data' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'vesting',    label: 'Vesting Timeline' },
    { id: 'tax',        label: 'Tax Estimator' },
  ]

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <svg className="brand-mark" viewBox="0 0 32 32" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="5.5" fill="#6B62C9"/>
              <rect x="11" y="11" width="14" height="14" rx="4" fill="#9B95DF"/>
              <circle cx="9" cy="27" r="4" fill="#6B62C9"/>
            </svg>
            <span className="brand-wordmark">EquityList</span>
            <div className="header-divider" />
            <span className="brand-product">EquiParse</span>
          </div>
          <div className="header-right">
            <span className="header-pill">India · Beta</span>
          </div>
        </div>
        {/* Top-level tool switcher */}
        <div className="top-nav">
          <div className="top-nav-inner">
            {TOP_TABS.map(t => (
              <button
                key={t.id}
                className={`top-nav-tab ${topTab === t.id ? 'top-nav-tab--active' : ''}`}
                onClick={() => setTopTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="app-body">
        <div className="container">

          {topTab === 'captable' ? (
            <CapTableValidator />
          ) : (
          <>
          <div className="page-hero">
            <h1 className="page-hero-title">ESOP Grant Letter Parser</h1>
            <p className="page-hero-sub">
              Upload an ESOP / ESOS grant letter PDF. Extract structured data, check SEBI & Companies Act compliance,
              visualise the vesting schedule, and estimate Indian tax impact — all in one place.
            </p>
          </div>

          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

          <div className="workflow">
            {/* Step 1 — Upload */}
            <div className={`workflow-step ${!file ? 'workflow-step--active' : ''}`}>
              <div className="step-header">
                <div className="step-num">1</div>
                <div>
                  <div className="step-title">Upload Grant Letter</div>
                  <div className="step-subtitle">PDF format · Max 20 MB · ESOS / ESPS / SAR / RSU</div>
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
                <UploadZone onFile={handleFile} file={file} disabled={loading} />
              </div>
            </div>

            {/* Step 2 — Parse */}
            <div className={`workflow-step ${file && !result ? 'workflow-step--active' : ''}`}>
              <div className="step-header">
                <div className="step-num">2</div>
                <div>
                  <div className="step-title">Extract & Analyse</div>
                  <div className="step-subtitle">GPT-4o extracts 19 structured fields from your document</div>
                </div>
              </div>
              <div className="step-body">
                <ParseButton onClick={handleParse} loading={loading} disabled={!file || loading} />
                {!file && <p className="parse-hint">Upload a document above to continue</p>}
                <button className="demo-btn" onClick={() => { setResult(DEMO_DATA); setActiveTab('data') }} type="button">
                  No PDF? Try with sample Indian ESOP data →
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div style={{ marginTop: 24 }}>
              <LoadingPanel step={loadStep} />
            </div>
          )}

          {result && !loading && (
            <div className="results-section">
              <div className="results-tabs">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    className={`results-tab ${activeTab === tab.id ? 'results-tab--active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="results-panel">
                {activeTab === 'data' && (
                  <DataCard
                    data={result}
                    onUpdate={handleUpdate}
                    onCopyJSON={handleCopyJSON}
                    onExportCSV={handleExportCSV}
                  />
                )}
                {activeTab === 'compliance' && <CompliancePanel data={result} />}
                {activeTab === 'vesting'    && <VestingTimeline data={result} />}
                {activeTab === 'tax'        && <TaxEstimator data={result} />}
              </div>
            </div>
          )}
          </>
          )}

        </div>
      </div>

      {copied && <div className="toast">Copied to clipboard</div>}

      <footer className="app-footer">
        <div className="footer-inner">
          <span>EquiParse · Prototype v0.2</span>
          <span className="footer-sep">·</span>
          <span>Built for Indian Startups</span>
          <span className="footer-sep">·</span>
          <span>SEBI SBEB 2021 · Companies Act 2013</span>
          <span className="footer-sep">·</span>
          <span>No data stored server-side</span>
        </div>
      </footer>
    </div>
  )
}
