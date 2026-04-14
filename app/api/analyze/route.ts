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
Introduce the company as a whole — their overall mission, what diseases or conditions they focus on, and how established they are.
- What space they operate in and why it matters
- How the company makes money — approved drugs, partnerships, royalties, etc.
- How big or established they are — early stage startup vs. large established pharma
- What makes this company's overall approach distinctive

**2. Their Pipeline**
Give a broad overview of the company's pipeline across all stages. Focus on the 2-3 most important drugs.
- Their most advanced or most important drug and what it treats
- One or two other notable drugs in development and what stage they are in
- What the company's overall pipeline strength looks like for the next 5 years
- Whether they have a history of successfully developing and commercializing drugs

**3. What the Data Has Shown**
Summarize the clinical results for their 2-3 most important drugs. Focus on what the data means for the company's long-term future.
- The most important trial result for their lead drug in plain English
- What the data says about whether this company knows how to develop effective drugs
- Any safety concerns across their portfolio that investors should know about
- How their data compares to competitors in the same space

**4. The Long-Term Bull Case**
Explain why this company could be worth significantly more in 5-10 years. Be specific and realistic.
- The single most compelling reason to hold this stock long term
- What market opportunity exists if their key drugs succeed
- Any competitive advantages that could protect their position long term — patents, technology, partnerships
- What would have to go right over the next 5 years for this to be a strong investment

**5. The Downside**
Be honest and specific about the long-term risks. Do not soften this section.
- The biggest threat to the long-term thesis — clinical, competitive, or financial
- Financial health risks — do they have enough cash, do they need to raise money
- Competition that could make their drugs obsolete or less valuable
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