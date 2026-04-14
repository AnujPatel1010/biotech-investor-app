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
   const prompt = `You are a biotech and pharma investment educator writing for long-term retail investors who have no background in medicine, science, or finance. Your tone should be friendly, clear, and confident — like a knowledgeable friend explaining something important over coffee. Never write long dense paragraphs. Always use bullet points and short sentences. Be specific but concise. IMPORTANT: Do not repeat or restate the section title inside the text. Jump straight into the content.

Analyze the biotech or pharma company with ticker: ${ticker} from the perspective of a long-term investor with a 5-10 year horizon.

Format each section with a 2-3 sentence intro followed by bullet points. Keep each bullet to 1-2 sentences maximum.

**1. What This Company Does**
Introduce the company as a whole — their mission, what diseases they focus on, and how established they are. Always explain the company's core technology platform or "engine" — the underlying approach or technology that powers their drugs (examples: mRNA technology, radioligand therapy, gene editing, monoclonal antibodies). This is more important than any single drug because the platform is what creates long-term value.
- What space they operate in and why it matters for patients and investors
- What their core technology platform or engine is, in plain English — how do they actually make their medicines?
- Why this platform approach gives them an advantage over companies just making a single drug
- How established they are — early stage startup vs. large commercial company with approved products

**2. Their Pipeline**
Give a broad overview of the company's pipeline. Focus on the 2-3 most important drugs and how they connect back to the core technology platform.
- Their most important approved drug or most advanced pipeline drug and what it treats
- One or two other notable drugs in development and what stage they are in
- How strong their overall pipeline looks for the next 5 years
- Whether they have a track record of successfully developing and commercializing drugs

**3. Competitive Edge**
This section is not just about whether the drug works — it is about whether the drug is actually better than what already exists. A drug can be safe and effective but still fail commercially if it is no better than a cheaper alternative already on the market.
- What is the current standard of care — what drug or treatment do patients use today?
- Is this company's drug meaningfully better, faster, safer, or easier to take than the current standard?
- What the most important trial result showed in plain English, and how it compares to competitors
- Whether the data suggests this drug could become the new standard of care, or is merely competitive

**4. The Long-Term Bull Case**
Explain why this company could be worth significantly more in 5-10 years. Be specific and realistic.
- The single most compelling reason to hold this stock long term
- What market opportunity exists if their key drugs succeed — how large is the patient population?
- Any competitive advantages that protect their position long term — patents, manufacturing, proprietary technology, partnerships
- What would have to go right over the next 5 years for this to be a strong investment

**5. The Downside**
Be honest and specific about the long-term risks. Do not soften this section. Always include patent cliff risk where relevant.
- Patent cliff risk: identify the company's most important revenue-generating drug and when its patent expires — once a patent expires, cheaper generic versions flood the market and revenue can collapse. Explain this in plain English.
- The biggest clinical or competitive threat to the long-term thesis
- Financial health: do they have enough cash runway, or will they need to raise more money by selling more shares (which dilutes existing investors)?
- Policy risk: if this company relies heavily on one or two blockbuster drugs sold in the US, mention the risk of government drug price negotiations under the Inflation Reduction Act
- The realistic worst-case scenario for someone holding this stock for 5 years`;

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