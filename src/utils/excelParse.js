import * as XLSX from 'xlsx'

/**
 * Parse a CSV or Excel file and return:
 *  - headers: string[]
 *  - rows: object[] (first 200 for preview/AI)
 *  - csvText: string (for sending to OpenAI, capped at 200 rows, includes Row_Number column)
 *  - totalRows: number
 */
export async function parseCapTable(file) {
  const buffer = await file.arrayBuffer()
  // No cellDates — we want raw strings for CSV so dates stay as typed
  const wb = XLSX.read(buffer, { type: 'array', cellNF: true })

  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]

  // raw: false → get the display/formatted value (keeps "25.00%" as "25.00%",
  // keeps date strings as strings rather than converting to JS Date objects)
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false })

  if (!aoa || aoa.length < 2) {
    throw new Error('The file appears empty or has no data rows.')
  }

  // Smart header detection: scan first 15 rows and pick the one with the
  // most non-empty cells. Complex Indian cap tables often have merged company-
  // name / date rows above the real column headers, which have far fewer cells.
  let headerIdx = 0
  let maxNonEmpty = 0
  const scanLimit = Math.min(15, aoa.length - 1)
  for (let i = 0; i < scanLimit; i++) {
    const count = aoa[i].filter(c => c !== '' && c != null && String(c).trim() !== '').length
    if (count > maxNonEmpty) { maxNonEmpty = count; headerIdx = i }
  }

  const headerRow = aoa[headerIdx]
  const dataRows  = aoa.slice(headerIdx + 1)
  const headers = headerRow.map(h => String(h).trim()).filter(Boolean)

  // Convert to objects, attaching a 1-based row number
  const rows = dataRows
    .filter(row => row.some(cell => cell !== '' && cell != null))
    .map((row, i) => {
      const obj = { _row: i + 2 }  // row 1 = headers, data starts at row 2
      headers.forEach((h, j) => {
        let val = row[j] ?? ''
        // If SheetJS still returned a Date object (xlsx date cells), format it
        if (val instanceof Date) {
          val = formatDate(val)
        }
        obj[h] = val
      })
      return obj
    })

  const totalRows = rows.length

  // Build CSV for OpenAI — prepend "Row_Number" column so AI never miscounts rows
  const csvHeaders = ['Row_Number', ...headers]
  const csvRows = [csvHeaders.join(',')]
  rows.slice(0, 200).forEach(r => {
    const cells = [
      r._row,
      ...headers.map(h => {
        const val = String(r[h] ?? '')
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val
      }),
    ]
    csvRows.push(cells.join(','))
  })
  const csvText = csvRows.join('\n')

  return { headers, rows, csvText, totalRows }
}

/** Format a JS Date as DD-MMM-YYYY */
function formatDate(d) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${String(d.getDate()).padStart(2,'0')}-${months[d.getMonth()]}-${d.getFullYear()}`
}
