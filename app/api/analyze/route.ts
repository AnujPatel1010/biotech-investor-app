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
    const prompt = `You are a biotech and pharma investment educator writing for retail investors who have no background in medicine, science, or finance. Your tone should be semi-formal — clear, precise, and professional, but never cold or condescending. Write as if you are a knowledgeable advisor explaining something important to a smart person who simply hasn't encountered this world before. Avoid jargon entirely, or if a technical term is necessary, explain it immediately in plain English.

Analyze the biotech or pharma company with ticker: ${ticker}

Write detailed, thorough responses for each of the following 5 sections. Each section should be at least 3-4 substantial paragraphs.

**1. What This Company Does**
Explain the company's core mission and focus. What disease, condition, or medical problem are they trying to solve? Describe who is affected by this condition and why it matters. Explain how their drug, therapy, or technology works in plain English — what does it actually do inside the body? What makes their approach different or notable compared to existing treatments? Give the reader a genuine understanding of the problem and the solution being pursued.

**2. Where They Are in the Pipeline**
Explain the current development stage of their lead drug or therapy. Describe what each stage of clinical development means in plain English — what is a Phase 1, Phase 2, or Phase 3 trial, and why does it matter? Where does this company fall in that process? How many years might it realistically take before their treatment could reach patients? If they have multiple drugs in development, describe the most advanced one in detail and briefly mention others.

**3. What the Clinical Data Has Shown**
Summarize the key results from their clinical trials so far. What did the data show — did the drug work, and how well? What were the response rates, survival benefits, or other key measurements, explained in plain English? Were there any safety concerns or side effects? How does this data compare to existing treatments or competitor results? Be honest about both the strengths and the limitations of the data.

**4. The Case for Approval**
Explain what a realistic path to success looks like for this company. What conditions would need to be met for their drug to get approved by the FDA or other regulatory bodies? Explain what the FDA approval process means in plain English. What are the key upcoming milestones — trial readouts, regulatory submissions, or partnership deals — that investors should watch for? Why might regulators look favorably on this drug?

**5. The Downside**
Now that the reader understands the company fully, explain the real risks with honesty and specificity. What could go wrong in clinical trials? What happens to the stock and to investors if a trial fails? Are there financial risks such as the need to raise more money? Are there competitor threats? What is the realistic worst-case scenario for someone who invests in this company today? Do not soften this section — investors deserve a clear-eyed view of what they could lose.`;

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