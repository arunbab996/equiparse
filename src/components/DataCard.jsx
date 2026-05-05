import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Edit3, Check, X } from 'lucide-react'

const FIELD_META = [
  { key: 'employeeName',       label: 'Employee Name',            group: 'Identity' },
  { key: 'employeeId',         label: 'Employee ID',              group: 'Identity' },
  { key: 'companyName',        label: 'Company Name',             group: 'Identity' },
  { key: 'schemeName',         label: 'Scheme Name',              group: 'Identity' },
  { key: 'grantType',          label: 'Grant Type',               group: 'Grant Details' },
  { key: 'boardResolutionDate',label: 'Board Resolution Date',    group: 'Grant Details' },
  { key: 'grantDate',          label: 'Grant Date',               group: 'Grant Details' },
  { key: 'numberOfOptions',    label: 'Options Granted',          group: 'Grant Details', format: 'number' },
  { key: 'faceValue',          label: 'Face Value per Share (₹)', group: 'Grant Details', format: 'inr' },
  { key: 'exercisePrice',      label: 'Exercise Price (₹)',       group: 'Grant Details', format: 'inr' },
  { key: 'fairMarketValue',    label: 'FMV at Grant Date (₹)',   group: 'Grant Details', format: 'inr' },
  { key: 'vestingCommencement',label: 'Vesting Commencement',    group: 'Vesting' },
  { key: 'vestingSchedule',    label: 'Vesting Schedule',         group: 'Vesting' },
  { key: 'cliffPeriod',        label: 'Cliff Period',             group: 'Vesting' },
  { key: 'vestingPercentages', label: 'Vesting Breakdown',        group: 'Vesting', wide: true },
  { key: 'exerciseWindow',     label: 'Exercise Window',          group: 'Vesting' },
  { key: 'expiryDate',         label: 'Option Expiry Date',       group: 'Vesting' },
  { key: 'lockInPeriod',       label: 'Lock-in Period (Post-IPO)',group: 'Vesting' },
  { key: 'notes',              label: 'Notes / Caveats',          group: 'Notes', wide: true },
]

const GROUPS = ['Identity', 'Grant Details', 'Vesting', 'Notes']

function formatValue(value, format) {
  if (value === null || value === undefined || value === '') return null
  if (format === 'number') return Number(value).toLocaleString('en-IN')
  if (format === 'inr') return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return String(value)
}

function FieldRow({ meta, value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const isMissing = value === null || value === undefined || value === ''
  const displayVal = formatValue(value, meta.format)

  const startEdit = () => { setDraft(value ?? ''); setEditing(true) }
  const cancel = () => setEditing(false)
  const save = () => { onSave(meta.key, draft === '' ? null : draft); setEditing(false) }

  return (
    <div className={`field-row ${meta.wide ? 'field-row--wide' : ''}`}>
      <div className="field-label">{meta.label}</div>
      <div className={`field-value-wrap ${isMissing ? 'field-value-wrap--missing' : ''}`}>
        {editing ? (
          <div className="field-edit">
            <input
              autoFocus
              className="field-edit-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
            />
            <button className="field-edit-btn field-edit-btn--save" onClick={save}><Check size={13} /></button>
            <button className="field-edit-btn field-edit-btn--cancel" onClick={cancel}><X size={13} /></button>
          </div>
        ) : (
          <div className="field-display" onClick={startEdit}>
            {isMissing ? (
              <span className="field-missing"><AlertTriangle size={12} /> Needs review</span>
            ) : (
              <span className="field-val">{displayVal}</span>
            )}
            <button className="field-edit-trigger" aria-label="Edit"><Edit3 size={12} /></button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DataCard({ data, onUpdate, onCopyJSON, onExportCSV }) {
  const filledCount = FIELD_META.filter(m => {
    const v = data[m.key]
    return v !== null && v !== undefined && v !== ''
  }).length
  const totalCount = FIELD_META.length
  const allGood = filledCount === totalCount
  const missingCount = totalCount - filledCount

  const grouped = GROUPS.map(g => ({
    name: g,
    fields: FIELD_META.filter(m => m.group === g),
  }))

  return (
    <div className="data-card">
      <div className="data-card-header">
        <div className="data-card-header-left">
          <h2 className="data-card-title">Extracted Grant Data</h2>
          <p className="data-card-subtitle">
            {filledCount} of {totalCount} fields extracted · Click any field to edit inline
          </p>
        </div>
        <div className={`data-card-badge ${allGood ? 'badge--success' : 'badge--warning'}`}>
          {allGood ? (
            <><CheckCircle2 size={13} /> All fields complete</>
          ) : (
            <><AlertTriangle size={13} /> {missingCount} field{missingCount !== 1 ? 's' : ''} need{missingCount === 1 ? 's' : ''} review</>
          )}
        </div>
      </div>

      <div className="data-card-body">
        {grouped.map(group => (
          <div key={group.name} className="field-group">
            <div className="field-group-label">{group.name}</div>
            <div className="field-grid">
              {group.fields.map(meta => (
                <FieldRow key={meta.key} meta={meta} value={data[meta.key]} onSave={onUpdate} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="data-card-footer">
        <span className="footer-hint">All edits are local — nothing is saved to a server</span>
      </div>
    </div>
  )
}
