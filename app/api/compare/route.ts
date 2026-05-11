import { NextRequest, NextResponse } from 'next/server';
import { tavily } from '@tavily/core';

async function validateTicker(ticker: string, apiKey: string): Promise<boolean> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a strict stock ticker validator. Respond YES or NO only. No other text.' },
        { role: 'user', content: `Is "${ticker}" a valid stock ticker for a real biotech or pharma company? YES or NO only.` },
      ],
      max_tokens: 5,
    }),
  });
  const data = await res.json();
  const answer = data.choices?.[0]?.message?.content?.trim().toUpperCase();
  return answer?.includes('YES') ?? false;
}

export async function POST(req: NextRequest) {
  try {
    const { tickerA, tickerB } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    const tavilyKey = process.env.TAVILY_API_KEY;

    if (!apiKey || !tavilyKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

    if (tickerA.length > 6 || tickerA.includes(' ') || tickerB.length > 6 || tickerB.includes(' ')) {
      return NextResponse.json({ error: 'FULL_NAME' });
    }

    const [valA, valB] = await Promise.all([
      validateTicker(tickerA, apiKey),
      validateTicker(tickerB, apiKey),
    ]);

    if (!valA) return NextResponse.json({ error: 'NOT_FOUND_A' });
    if (!valB) return NextResponse.json({ error: 'NOT_FOUND_B' });

    const tvly = tavily({ apiKey: tavilyKey });
    const [searchA, searchB] = await Promise.all([
      tvly.search(`${tickerA} biotech pharma pipeline FDA drugs earnings 2026`, { search_depth: 'advanced', max_results: 4 }),
      tvly.search(`${tickerB} biotech pharma pipeline FDA drugs earnings 2026`, { search_depth: 'advanced', max_results: 4 }),
    ]);

    const contextA = searchA?.results?.map((r: any) => r.content).join('\n\n') || 'No data found.';
    const contextB = searchB?.results?.map((r: any) => r.content).join('\n\n') || 'No data found.';

    const prompt = `You are comparing two biotech/pharma companies for a long-term retail investor with no finance or science background. Be specific — use real drug names, real numbers, real comparisons. Never be vague.

COMPANY A: ${tickerA}
REAL-TIME DATA FOR ${tickerA}:
${contextA}

COMPANY B: ${tickerB}
REAL-TIME DATA FOR ${tickerB}:
${contextB}

Return ONLY a valid JSON object with this exact structure. No markdown, no backticks, no explanation — just raw JSON:

{
  "sections": [
    {
      "title": "What Each Company Does",
      "companyA": "3-4 bullet points about ${tickerA}, each starting with • and separated by newlines. Explain their core technology and what makes them unique.",
      "companyB": "3-4 bullet points about ${tickerB}, each starting with • and separated by newlines. Explain their core technology and what makes them unique."
    },
    {
      "title": "Pipeline Comparison",
      "companyA": "3-4 bullet points naming actual drugs, their stages, and commercial performance for ${tickerA}.",
      "companyB": "3-4 bullet points naming actual drugs, their stages, and commercial performance for ${tickerB}."
    },
    {
      "title": "Clinical Data",
      "companyA": "3-4 bullet points on key trial results for ${tickerA} with specific numbers where available.",
      "companyB": "3-4 bullet points on key trial results for ${tickerB} with specific numbers where available."
    },
    {
      "title": "Competitive Position",
      "companyA": "3-4 bullet points on how ${tickerA} stacks up against competitors and the current standard of care.",
      "companyB": "3-4 bullet points on how ${tickerB} stacks up against competitors and the current standard of care."
    },
    {
      "title": "Long-Term Outlook",
      "companyA": "3-4 bullet points on the long-term bull case and key risks for ${tickerA}.",
      "companyB": "3-4 bullet points on the long-term bull case and key risks for ${tickerB}."
    }
  ],
  "scores": {
    "companyA": {
      "pipeline": <integer 0-25>,
      "data": <integer 0-25>,
      "competitive": <integer 0-25>,
      "financial": <integer 0-25>,
      "total": <sum of above>
    },
    "companyB": {
      "pipeline": <integer 0-25>,
      "data": <integer 0-25>,
      "competitive": <integer 0-25>,
      "financial": <integer 0-25>,
      "total": <sum of above>
    }
  },
  "verdict": "2-3 sentence plain English verdict on which company looks stronger for a 5-10 year investor and why, referencing the score difference."
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a JSON-only response bot. Return valid JSON only. No markdown, no backticks, no explanation.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 4000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: JSON.stringify(data) }, { status: 500 });
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    const clean = text
        .replace(/```json|```/g, '')
        .replace(/\r?\n/g, ' ')
        .replace(/\r/g, '')
        .trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({ result: parsed });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}