const SYSTEM_PROMPT = `You are an expert at auditing Indian startup cap tables. Analyse the table data provided and return ONLY a valid JSON object with this structure:
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

Check for:
- Rows with missing shareholder names or PAN numbers
- Duplicate shareholder entries (same name or PAN appearing more than once)
- Share totals that don't add up correctly across all rows
- Missing or inconsistent share classes (e.g. "Equity", "Preference", "CCPS", "ESOP")
- Invalid, missing, or inconsistently formatted dates
- Negative or zero share counts
- Invalid PAN format (Indian PAN is 10 characters: AAAAA9999A pattern)
- Missing or suspicious data in any column (e.g. blank cells in key fields)
- Any fields that look incomplete, ambiguous, or use inconsistent formatting

For Indian cap tables specifically also check:
- Whether share certificate numbers follow a sequence
- Whether the total of all share classes matches the authorised/issued capital if stated
- ESOP pool percentage vs total shares

Return row numbers as they appear in the data (starting from row 2 where row 1 is the header). Use null for row if the issue is table-wide. Do not include any explanation or markdown outside the JSON.`

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
          content: `Audit the following Indian startup cap table and return structured JSON:\n\n${csvText}`,
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
