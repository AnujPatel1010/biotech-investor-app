import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { ticker } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Say hello and tell me what your knowledge cutoff date is.` }] }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: JSON.stringify(data) }, { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return NextResponse.json({ result: text });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}