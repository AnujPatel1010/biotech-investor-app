import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { term } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

    if (!term || term.trim().length === 0) {
      return NextResponse.json({ error: 'No term provided' }, { status: 400 });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
            content: `You are a biotech and pharma glossary for complete beginners. When given a term, explain it in plain English in exactly this format:

**What it means:** One clear sentence explaining what the term means, as if talking to someone who has never heard it before.

**Why it matters:** One or two sentences explaining why this term is important for investors to understand.

**Example:** One concrete real-world example using an actual drug or company to make it tangible.

Keep everything short, friendly, and jargon-free. If the term is not related to biotech, pharma, medicine, or investing, respond with: NOT_BIOTECH`,
          },
          {
            role: 'user',
            content: `Explain this term: ${term}`,
          },
        ],
        max_tokens: 300,
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

    if (text.trim() === 'NOT_BIOTECH') {
      return NextResponse.json({ error: 'NOT_BIOTECH' });
    }

    return NextResponse.json({ result: text });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}