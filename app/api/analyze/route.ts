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
   const prompt = `You are a biotech and pharma investment educator writing for retail investors with no background in medicine, science, or finance. Your tone should be friendly, clear, and confident — like a knowledgeable friend explaining something important over coffee. Never write long dense paragraphs. Always use bullet points and short sentences. Be specific but concise. IMPORTANT: Do not repeat or restate the section title inside the text. Jump straight into the content.

Analyze the biotech or pharma company with ticker: ${ticker}

CRITICAL INSTRUCTION: Before writing anything, identify the single most important drug or therapy in this company's pipeline — the one with the most clinical data, the most advanced stage, or the most upcoming catalysts. Every single section below must be about THIS ONE DRUG ONLY. Do not switch drugs between sections. The entire breakdown must tell one coherent story about one specific drug from start to finish.

At the very top of your response, before Section 1, write one line in this exact format:
Focus Drug: [drug name] — [what it treats in plain English]

Then write all 5 sections about that drug only.

Format each section with a 2-3 sentence intro followed by bullet points. Keep each bullet to 1-2 sentences maximum.

**1. What This Company Does**
Introduce the company and explain the specific disease or condition their focus drug targets.
- What the disease or condition is, and who it affects in plain English
- How this specific drug works inside the body — no jargon
- What makes this drug different from existing treatments
- Why this is a meaningful problem worth solving

**2. Where They Are in the Pipeline**
Focus only on the current development stage of the one focus drug identified above. Use the most recent information available.
- What stage this specific drug is currently in and what that stage means in plain English
- What the most recent clinical trial or regulatory action was for this drug
- What the company's current plan is for this drug going forward
- How far away this drug realistically is from reaching patients

**3. What the Clinical Data Has Shown**
Report only the clinical trial results for the one focus drug. Be specific about trial names and numbers if known.
- The name of the most important trial for this drug and what it was testing
- The key result in plain English — did it work, and how well?
- Any safety concerns or notable side effects from the trial data
- How these results compare to the current standard of care or competing drugs

**4. The Case for Approval**
Build directly on the clinical data above for this one drug only.
- What the FDA would specifically need to see to approve this drug
- Whether there is a known PDUFA date or regulatory submission date for this drug, and what that means
- Key upcoming milestones or trial readouts that could move this drug forward
- Why regulators might look favorably on this specific drug based on the data

**5. The Downside**
Now that the reader understands this specific drug fully, explain the real risks honestly.
- What happens specifically if this drug's next trial or regulatory decision fails
- Financial risks to the company if this drug does not succeed
- Competitor drugs in the same space that could make this drug obsolete
- The realistic worst-case scenario for an investor betting on this drug today`;

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