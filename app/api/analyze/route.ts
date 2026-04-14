import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { ticker } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

    // Reject anything longer than 6 characters or containing spaces
    if (ticker.length > 6 || ticker.includes(' ')) {
      return NextResponse.json({ error: 'FULL_NAME' });
    }

    // Step 1: Validate the ticker
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
Respond NO only if the input is clearly not a real biotech or pharma ticker — for example random letters like PEEE or XYZQ, or a full company name instead of a ticker.`,
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

    // Step 2: Full analysis
   const prompt = `You are a biotech and pharma investment educator writing for long-term retail investors with no background in medicine, science, or finance. Your tone is friendly, clear, and confident — like a knowledgeable friend explaining something important over coffee. Never write long dense paragraphs. Always use bullet points and short sentences.

CRITICAL RULES — FOLLOW THESE OR THE RESPONSE IS USELESS:
- Never use vague phrases like "diverse pipeline," "promising data," "may need to raise money," or "strong competitive position." These mean nothing to an investor.
- Always use specific drug names, specific numbers, specific comparisons, and specific dollar figures where available.
- If a number exists (a percentage improvement, a survival benefit, a revenue figure, a patent expiry year), use it. Never say "significant improvement" when you can say "28% reduction in risk."
- Always name the actual drugs. Never say "their cancer drug" — say "Pluvicto" or "Keytruda" or whatever the actual name is.
- Write as if the year is 2026 and use the most current information you have available.

Analyze the biotech or pharma company with ticker: ${ticker} from the perspective of a long-term investor with a 5-10 year horizon.

Format each section with a 2-3 sentence intro followed by bullet points. Keep each bullet to 1-2 sentences maximum. Do not repeat or restate the section title inside the text.

**1. What This Company Does**
Introduce the company and explain their true differentiating technology — not a generic answer like "monoclonal antibodies" which every big pharma uses. Find what actually makes this company's approach hard to copy. Is it radioligand therapy, mRNA, gene editing, siRNA, cell therapy, or something else? Explain it in plain English like a "special sauce."
- What space they operate in and the specific patient population they serve
- Their actual core technology platform in plain English — what is the "special sauce" that makes their medicines and why is it harder for competitors to copy than a standard pill?
- How established they are — do they have approved drugs generating real revenue, or are they still in research?
- One sentence on why this company exists and what would be lost if they disappeared tomorrow

**2. Their Pipeline**
Name the actual drugs. Never say "a cancer drug" or "a rare disease drug." Use real names. Focus on the 2-3 most commercially important drugs — either already approved and selling, or the closest to approval.
- Their single most important drug right now by revenue or pipeline stage — name it, what it treats, and how it is performing commercially if approved
- One or two other specifically named drugs that are key to the next 3-5 years and what stage they are in
- Whether this company has a track record of actually getting drugs approved and selling them — or are they still unproven?
- The overall pipeline strength in one honest sentence — is this a company with multiple shots on goal, or are they a one-drug story?

**3. Competitive Edge**
This section must answer one question: is this company's drug actually better than what patients already use today? A drug that is merely "as good" as a cheaper generic will not drive stock returns. Force a real comparison.
- What is the current standard of care — what specific drug or treatment do patients use today before this company's drug exists?
- What specific number or data point proves this company's drug is better — a percentage improvement, a survival benefit, a response rate? Use the actual figure.
- Name a specific competitor drug in the same space and directly compare: why would a doctor choose this company's drug over that one?
- Is this drug on track to become the new standard of care, or is it fighting for a slice of a crowded market?

**4. The Long-Term Bull Case**
Do not use generic phrases. The bull case must be grounded in specific commercial reality — what drugs are actually growing, what markets are actually expanding, what advantages are actually defensible.
- The single most specific and compelling reason to hold this stock for 5-10 years — name the drug or platform driving this thesis
- What is the realistic revenue opportunity if their key drugs hit their targets — how large is the patient population or market?
- What specific competitive moat protects them — a patent, a manufacturing process, a first-mover advantage in a new therapy type?
- What specific thing would have to go right over the next 3-5 years for this investment to pay off?

**5. The Downside**
Be specific, honest, and current. Do not soften anything. Always address patent cliff risk by naming the actual drug and the actual expiry timeline. Always address financial health with real numbers where available.
- Patent cliff: name the company's most important revenue drug that is losing or has recently lost patent protection, when this is happening, and roughly how much revenue is at risk — explain in plain English that once a patent expires, cheap generic versions flood the market and sales can collapse
- The single biggest clinical or competitive risk right now — name the specific drug or competitor that poses the threat
- Financial health: be specific — are they cash-rich, cash-burning, or somewhere in between? Do they need to raise more money by selling shares, which would dilute existing investors?
- Policy risk: if this company sells blockbuster drugs in the US, explain the Inflation Reduction Act risk in plain English — the US government can now negotiate prices directly on certain high-selling drugs, which can cut into revenue
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