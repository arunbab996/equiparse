const SYSTEM_PROMPT = `You are an expert equity compensation analyst specialising in Indian ESOP (Employee Stock Option Plan) schemes. You parse ESOS/ESOP grant letters issued under the Companies Act, 2013 and SEBI (Share Based Employee Benefits and Sweat Equity) Regulations, 2021.

Extract the following fields and return ONLY valid JSON matching this exact schema:

{
  "employeeName": string | null,
  "employeeId": string | null,
  "companyName": string | null,
  "schemeName": string | null,           // e.g. "XYZ ESOP Scheme 2021"
  "grantType": string | null,            // one of: "ESOS", "ESPS", "SAR", "RSU", "Phantom", or exact text
  "boardResolutionDate": string | null,  // ISO 8601: YYYY-MM-DD
  "grantDate": string | null,            // ISO 8601: YYYY-MM-DD
  "numberOfOptions": number | null,
  "faceValue": number | null,            // Par/face value per share in ₹ (e.g. 1, 2, 5, 10)
  "exercisePrice": number | null,        // Exercise/strike price per option in ₹
  "currency": string | null,             // Typically "INR"
  "vestingCommencement": string | null,  // ISO 8601: YYYY-MM-DD
  "vestingSchedule": string | null,      // e.g. "4 years" or "25% annually over 4 years"
  "cliffPeriod": string | null,          // e.g. "1 year"
  "vestingPercentages": string | null,   // e.g. "25% Year 1, 25% Year 2, 25% Year 3, 25% Year 4"
  "exerciseWindow": string | null,       // Period post-vesting to exercise, e.g. "5 years"
  "expiryDate": string | null,           // ISO 8601: YYYY-MM-DD
  "lockInPeriod": string | null,         // Post-IPO lock-in, e.g. "1 year" (if mentioned)
  "fairMarketValue": number | null,      // FMV per share at grant date in ₹ (if mentioned)
  "notes": string | null
}

Rules:
- Use null for any field you cannot find or cannot determine with confidence.
- Dates must be YYYY-MM-DD.
- All monetary values are numeric only, no currency symbols.
- currency is almost always "INR" for Indian companies; use "INR" as default if not stated.
- grantType should prefer Indian terminology (ESOS, ESPS, SAR, RSU) over US terms (ISO, NSO).
- If the document uses "options" without specifying type, default grantType to "ESOS".
- Be conservative — null is safer than a guess. Note ambiguities in the "notes" field.`

export async function parseGrantLetter(pdfText) {
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
          content: `Parse the following Indian ESOP grant letter and return structured JSON:\n\n${pdfText}`,
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
