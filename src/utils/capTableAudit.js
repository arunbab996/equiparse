const SYSTEM_PROMPT = `You are an expert at auditing Indian startup cap tables.

The CSV you receive includes a "Row_Number" column. This is the authoritative row number for each entry (row 1 = header row, data rows start at 2). ALWAYS use the value from the "Row_Number" column when reporting row numbers — never count rows yourself.

Return ONLY a valid JSON object with this exact structure:
{
  "errors": [{"row": number|null, "field": string, "issue": string}],
  "warnings": [{"row": number|null, "field": string, "issue": string}],
  "info": [{"message": string}],
  "summary": {
    "total_shareholders": number,
    "total_shares": number,
    "share_classes": [string],
    "is_math_correct": boolean,
    "fully_diluted_shares": number|null
  }
}

Rules for checking:

ERRORS (blocking issues):
- Missing shareholder name (empty or blank)
- Missing or invalid PAN number — EXCEPT skip PAN checks for entries that are clearly an ESOP/option pool (e.g. name contains "ESOP", "Option Pool", "EOP", "Stock Option") since pools are not legal entities and do not have PANs
- Invalid PAN format: must be exactly 10 characters matching AAAAA9999A (first 3 = any letters, 4th = entity type letter [P/C/H/F/A/B/G/J/L/T/K/E], 5th = any letter, next 4 = digits, last = any letter)
- Duplicate shareholder name (same name appears in more than one row)
- Duplicate PAN (same PAN appears in more than one row — ignore blank PANs)
- Negative or zero share count
- Share counts that appear mathematically inconsistent with stated percentages (off by more than 1%)

WARNINGS (issues to review):
- Missing email address for individual shareholders
- Missing investment date for individual shareholders (pools and founders may not have investment dates)
- Share certificate numbers that do not follow an obvious sequence
- Inconsistent date formatting across rows
- Percentage values that don't sum to exactly 100% (flag as warning, not error, since rounding is common)

INFO (observations):
- Note the ESOP pool size as a % of total shares
- Note if fully diluted share count differs from issued shares
- Note any share classes that are unusual for Indian startups

For the summary:
- total_shareholders: count ALL rows including duplicates (report actual row count, not unique names)
- total_shares: sum of all share counts
- share_classes: unique list of share class values found
- is_math_correct: true only if all rows' % holding × total_shares ≈ that row's share count (within 1%), AND sum of all holdings ≈ 100%
- fully_diluted_shares: include ESOP pool in count if present, otherwise null

Use null for "row" if the issue is table-wide. Do not include any explanation or markdown outside the JSON.`

export async function auditCapTable(csvText) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey || apiKey.startsWith('sk-replace')) {
    throw new Error('OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env.local')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Audit the following Indian startup cap table. Use the Row_Number column for all row references in your response.\n\n${csvText}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content
  if (!raw) throw new Error('Empty response from OpenAI')

  try {
    return JSON.parse(raw)
  } catch {
    throw new Error('Failed to parse AI response as JSON')
  }
}
