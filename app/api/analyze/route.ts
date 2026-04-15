import { NextRequest, NextResponse } from 'next/server';
import { TavilyClient } from '@tavily/core';

export async function POST(req: NextRequest) {
  try {
    const { ticker } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    const tavilyKey = process.env.TAVILY_API_KEY;

    if (!apiKey || !tavilyKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

    if (ticker.length > 6 || ticker.includes(' ')) {
      return NextResponse.json({ error: 'FULL_NAME' });
    }

    // ✅ KEEP YOUR VALIDATION EXACTLY THE SAME
    const validationResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a strict stock ticker validator. You only respond with YES or NO. Nothing else.
You have deep knowledge of all biotech and pharmaceutical stock tickers listed on US exchanges including NYSE, NASDAQ, and OTC markets.
You must respond YES to any valid biotech or pharma ticker, including large pharma tickers like NVS (Novartis), PFE (Pfizer), MRK (Merck), ABBV (AbbVie), BMY (Bristol-Myers Squibb), LLY (Eli Lilly), AZN (AstraZeneca), GILD (Gilead), AMGN (Amgen), REGN (Regeneron), VRTX (Vertex), BIIB (Biogen), and thousands of smaller biotech companies.
Respond NO only if the input is clearly not a real biotech or pharma ticker.`,
            },
            {
              role: 'user',
              content: `Is "${ticker}" a valid stock ticker symbol for a real biotech or pharmaceutical company? YES or NO only.`,
            },
          ],
          max_tokens: 5,
        }),
      }
    );

    const validationData = await validationResponse.json();
    const validationAnswer = validationData.choices?.[0]?.message?.content?.trim().toUpperCase();

    if (!validationAnswer || !validationAnswer.includes('YES')) {
      return NextResponse.json({ error: 'NOT_FOUND' });
    }

    // ✅ NEW: Tavily real-time search
    const tavily = new TavilyClient({ apiKey: tavilyKey });

    const searchQuery = `${ticker} biotech pharma company pipeline FDA approvals earnings drugs 2026`;

    const tavilyResponse = await tavily.search({
      query: searchQuery,
      search_depth: 'advanced',
      max_results: 5,
    });

    const context = tavilyResponse.results
      .map((r: any) => r.content)
      .join('\n\n');

    // ✅ SAME PROMPT — only added context at top
    const prompt = `You are a biotech and pharma investment educator writing for long-term retail investors with no background in medicine, science, or finance. Your tone is friendly, clear, and confident — like a knowledgeable friend explaining something important over coffee. Never write long dense paragraphs. Always use bullet points and short sentences.

Use the REAL-TIME INFORMATION below. Do not rely on outdated knowledge.

${context}

CRITICAL RULES — FOLLOW THESE OR THE RESPONSE IS USELESS:
- Never use vague phrases like "diverse pipeline," "promising data," "may need to raise money," or "strong competitive position." These mean nothing to an investor.
- Always use specific drug names, specific numbers, specific comparisons, and specific dollar figures where available.
- If a number exists (a percentage improvement, a survival benefit, a revenue figure, a patent expiry year), use it. Never say "significant improvement" when you can say "28% reduction in risk."
- Always name the actual drugs. Never say "their cancer drug" — say "Pluvicto" or "Keytruda" or whatever the actual name is.
- Write as if the year is 2026 and use the most current information you have available.

Analyze the biotech or pharma company with ticker: ${ticker} from the perspective of a long-term investor with a 5-10 year horizon.

Format each section with a 2-3 sentence intro followed by bullet points. Keep each bullet to 1-2 sentences maximum. Do not repeat or restate the section title inside the text.

**1. What This Company Does**
Introduce the company and explain their true differentiating technology — not a generic answer like "monoclonal antibodies" which every big pharma uses. Find what actually makes this company's approach hard to copy.
- What space they operate in and the specific patient population they serve
- Their actual core technology platform in plain English — what is the "special sauce" that makes their medicines and why is it harder for competitors to copy?
- How established they are — do they have approved drugs generating real revenue, or are they still in research?
- One sentence on why this company exists and what would be lost if they disappeared tomorrow

**2. Their Pipeline**
Name the actual drugs. Never say "a cancer drug" or "a rare disease drug." Use real names. Focus on the 2-3 most commercially important drugs.
- Their single most important drug right now by revenue or pipeline stage — name it, what it treats, and how it is performing commercially if approved
- One or two other specifically named drugs that are key to the next 3-5 years and what stage they are in
- Whether this company has a track record of actually getting drugs approved and selling them
- The overall pipeline strength in one honest sentence — multiple shots on goal, or a one-drug story?

**3. Competitive Edge**
This section must answer one question: is this company's drug actually better than what patients already use today?
- What is the current standard of care — what specific drug or treatment do patients use today?
- What specific number or data point proves this company's drug is better — a percentage improvement, a survival benefit, a response rate?
- Name a specific competitor drug and directly compare: why would a doctor choose this company's drug over that one?
- Is this drug on track to become the new standard of care, or is it fighting for a slice of a crowded market?

**4. The Long-Term Bull Case**
Do not use generic phrases. Ground the bull case in specific commercial reality.
- The single most specific and compelling reason to hold this stock for 5-10 years — name the drug or platform driving this thesis
- What is the realistic revenue opportunity if their key drugs hit their targets?
- What specific competitive moat protects them — a patent, a manufacturing process, a first-mover advantage?
- What specific thing would have to go right over the next 3-5 years for this investment to pay off?

**5. The Downside**
Be specific, honest, and current. Do not soften anything.
- Patent cliff: name the company's most important revenue drug losing or recently lost patent protection, when this is happening, and roughly how much revenue is at risk
- The single biggest clinical or competitive risk right now — name the specific drug or competitor
- Financial health: be specific — are they cash-rich, cash-burning, or somewhere in between?
- Policy risk: if this company sells blockbuster drugs in the US, explain the Inflation Reduction Act risk in plain English
- Worst-case scenario in one honest sentence: what does a 5-year holder lose if things go wrong?`;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 3000,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: JSON.stringify(data) }, { status: 500 });
    }

    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json({ error: 'No text in response: ' + JSON.stringify(data) }, { status: 500 });
    }

    return NextResponse.json({ result: text });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}