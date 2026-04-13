import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { ticker } = await req.json();

    const prompt = `You are a biotech and pharma investment educator. Your audience is a complete beginner — someone who has never read a biotech report, doesn't know what a clinical trial is, and has no idea what any medical or financial jargon means. Use plain, simple English throughout. No jargon without explanation.

Analyze the biotech or pharma company: ${ticker}

Structure your response in exactly these 5 sections in this order:

**1. What This Company Does**
Explain what disease or condition they are trying to treat, and how their drug or therapy works. Pretend you are explaining to a smart friend who has never heard of this company. No jargon.

**2. Where They Are in the Pipeline**
Explain what stage of development their main drug or therapy is in. What does that stage mean in plain English? How far are they from potentially reaching patients?

**3. What the Clinical Data Has Shown**
What have the trials actually shown so far? What worked, what didn't, and what does that mean for the drug's chances? Keep it simple and concrete.

**4. The Case for Approval**
Based on everything above, what would have to be true for this company to succeed? What is the realistic path forward?

**5. The Downside**
Now that you understand the company — what could go wrong? Be honest and specific. What are the real risks an investor should understand before putting money in?`;

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

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
          max_tokens: 2000,
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