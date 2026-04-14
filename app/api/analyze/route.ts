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
    const prompt = `You are a biotech and pharma investment educator writing for retail investors who have no background in medicine, science, or finance. Your tone should be friendly, clear, and confident — like a knowledgeable friend explaining something important over coffee. Never write long dense paragraphs. Always use bullet points and short sentences. Be specific but concise.

Analyze the biotech or pharma company with ticker: ${ticker}

Format each section exactly like this — a 2-3 sentence intro followed by bullet points. Keep each bullet point to 1-2 sentences maximum. Make sure the user or reader doesn't feel overwhelmed with information, but at the same time, make it interesting and enjoyable to read. IMPORTANT: Do not repeat or restate the section title inside the text. Jump straight into the content.

**1. What This Company Does**
Brief 2-sentence intro explaining the company and what disease they target.
- What the disease or condition is, and who it affects
- How their drug or therapy works in plain English
- What makes their approach different from existing treatments
- Why this company exists and what problem they are solving

**2. Where They Are in the Pipeline**
Brief 2-sentence intro explaining their current stage.
- What stage they are in (Phase 1, 2, 3, or approved) and what that stage means in plain English
- How far away they are from potentially reaching patients
- What the next major milestone is
- If they have multiple drugs, briefly name the others

**3. What the Clinical Data Has Shown**
Brief 2-sentence intro summarizing the overall picture.
- The key result from their most important trial in plain English
- Whether the drug appeared to work, and how well
- Any safety concerns or notable side effects
- How the results compare to existing treatments

**4. The Case for Approval**
Brief 2-sentence intro on what success looks like.
- What the FDA would need to see to approve this drug
- Key upcoming trial readouts or regulatory dates to watch
- Why regulators might look favorably on this drug
- What a realistic best-case timeline looks like

**5. The Downside**
Brief 2-sentence intro being honest about the risks.
- What happens if a clinical trial fails
- Financial risks such as needing to raise more money
- Competitor threats in the same space
- The realistic worst-case scenario for an investor today`;

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