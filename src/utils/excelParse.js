import * as XLSX from 'xlsx'

/**
 * Parse a CSV or Excel file and return:
 *  - headers: string[]
 *  - rows: object[] (first 200 for preview/AI)
 *  - csvText: string (for sending to OpenAI, capped at 200 rows)
 *  - totalRows: number
 */
export async function parseCapTable(file) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })

  // Use first sheet
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]

  // Convert to array of arrays
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  if (!aoa || aoa.length < 2) {
    throw new Error('The file appears empty or has no data rows.')
  }

  const [headerRow, ...dataRows] = aoa
  const headers = headerRow.map(h => String(h).trim())

  // Convert to objects
  const rows = dataRows
    .filter(row => row.some(cell => cell !== ''))
    .map((row, i) => {
      const obj = { _row: i + 2 } // 1-indexed, row 1 = headers
      headers.forEach((h, j) => { obj[h] = row[j] ?? '' })
      return obj
    })

  const totalRows = rows.length

  // CSV text for OpenAI (cap at 200 rows)
  const csvRows = [headers.join(',')]
  rows.slice(0, 200).forEach(r => {
    csvRows.push(headers.map(h => {
      const val = String(r[h] ?? '')
      return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
    }).join(','))
  })
  const csvText = csvRows.join('\n')

  return { headers, rows, csvText, totalRows }
}
