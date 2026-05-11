'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ComparisonPage() {
  const [tickerA, setTickerA] = useState('');
  const [tickerB, setTickerB] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const compare = async () => {
    if (!tickerA.trim() || !tickerB.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickerA, tickerB }),
      });

      const data = await res.json();

      if (data.error === 'NOT_FOUND_A') { setError(`"${tickerA}" doesn't appear to be a valid biotech or pharma ticker.`); return; }
      if (data.error === 'NOT_FOUND_B') { setError(`"${tickerB}" doesn't appear to be a valid biotech or pharma ticker.`); return; }
      if (data.error === 'FULL_NAME') { setError('Please enter ticker symbols only (e.g. MRNA, PFE) — not full company names.'); return; }
      if (data.error) { setError(data.error); return; }

      setResult(data.result);
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatBullets = (text: string) => {
    return text.split('•').filter(s => s.trim()).map((line, i) => (
      <div key={i} className="flex gap-2 mb-2">
        <span className="text-emerald-400 shrink-0">•</span>
        <span>{line.trim()}</span>
      </div>
    ));
  };

  const winner = result ? (result.scores.companyA.total >= result.scores.companyB.total ? tickerA : tickerB) : null;
  const loser = result ? (winner === tickerA ? tickerB : tickerA) : null;
  const pointDiff = result ? Math.abs(result.scores.companyA.total - result.scores.companyB.total) : 0;

  return (
    <main className="min-h-screen bg-[#0a0e1a] text-white font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-lg font-semibold tracking-tight">BioClarity</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors">Company Breakdown</Link>
          <Link href="/comparison" className="text-sm text-emerald-400 font-medium">Comparison Mode</Link>
          <Link href="/glossary" className="text-sm text-white/50 hover:text-white transition-colors">Glossary</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-16">
        <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-4 py-1.5 text-emerald-400 text-sm mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Head-to-Head Analysis
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl leading-tight mb-4">
          Compare two companies,{' '}
          <span className="text-emerald-400">side by side.</span>
        </h1>
        <p className="text-white/50 max-w-lg mb-10 leading-relaxed">
          Enter two biotech or pharma tickers to get a plain-English comparison of their pipeline, data, and long-term investment case.
        </p>

        {/* Inputs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg">
          <input
            type="text"
            value={tickerA}
            onChange={(e) => setTickerA(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && compare()}
            placeholder="First ticker (e.g. MRNA)"
            maxLength={6}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/50 transition-all"
          />
          <span className="text-white/30 font-bold text-xl">VS</span>
          <input
            type="text"
            value={tickerB}
            onChange={(e) => setTickerB(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && compare()}
            placeholder="Second ticker (e.g. PFE)"
            maxLength={6}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/50 transition-all"
          />
        </div>

        <button
          onClick={compare}
          disabled={loading}
          className="mt-5 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-10 py-4 transition-colors"
        >
          {loading ? 'Comparing...' : 'Compare →'}
        </button>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </section>

      {/* Results */}
      {result && (
        <section className="px-6 pb-24 max-w-6xl mx-auto">
          <div className="grid grid-cols-2 gap-4 mb-4 px-1">
            <div className="text-center text-emerald-400 font-bold text-3xl">{tickerA}</div>
            <div className="text-center text-emerald-400 font-bold text-3xl">{tickerB}</div>
          </div>

          {result.sections.map((section: any, i: number) => (
            <div key={i} className="mb-4">
              <h3 className="text-emerald-400 font-semibold text-lg mb-3 text-center">{section.title}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/4 border border-white/8 rounded-2xl p-6 text-sm text-white/70 leading-relaxed">
                  {formatBullets(section.companyA)}
                </div>
                <div className="bg-white/4 border border-white/8 rounded-2xl p-6 text-sm text-white/70 leading-relaxed">
                  {formatBullets(section.companyB)}
                </div>
              </div>
            </div>
          ))}

          {/* Score Card */}
          <div className="mt-8 bg-white/4 border border-white/8 rounded-2xl p-8">
            <h3 className="text-center font-bold text-lg mb-6">Score Breakdown</h3>
            <div className="grid grid-cols-3 gap-4 text-sm text-center mb-6">
              <div className="text-white/40 font-medium uppercase tracking-widest text-xs">Category</div>
              <div className="text-emerald-400 font-bold">{tickerA}</div>
              <div className="text-emerald-400 font-bold">{tickerB}</div>
              {['pipeline', 'data', 'competitive', 'financial'].map((key) => (
                <>
                  <div key={key + 'label'} className="text-white/50 capitalize py-2 border-t border-white/5">{key}</div>
                  <div key={key + 'a'} className="text-white py-2 border-t border-white/5">{result.scores.companyA[key]}<span className="text-white/30">/25</span></div>
                  <div key={key + 'b'} className="text-white py-2 border-t border-white/5">{result.scores.companyB[key]}<span className="text-white/30">/25</span></div>
                </>
              ))}
              <div className="text-white font-bold py-2 border-t border-emerald-400/30">Total</div>
              <div className="text-emerald-400 font-bold py-2 border-t border-emerald-400/30">{result.scores.companyA.total}<span className="text-white/30">/100</span></div>
              <div className="text-emerald-400 font-bold py-2 border-t border-emerald-400/30">{result.scores.companyB.total}<span className="text-white/30">/100</span></div>
            </div>
          </div>

          {/* Verdict Box */}
          <div className="mt-4 bg-emerald-400/10 border border-emerald-400/30 rounded-2xl p-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <h3 className="text-emerald-400 font-bold text-lg">The Verdict</h3>
            </div>
            <p className="text-white text-center text-base leading-relaxed mb-3">
              <span className="text-emerald-400 font-bold">{winner}</span> looks stronger by{' '}
              <span className="text-emerald-400 font-bold">{pointDiff} points</span> over{' '}
              <span className="text-white/60">{loser}</span>.
            </p>
            <p className="text-white/70 text-center text-sm leading-relaxed mb-4">{result.verdict}</p>
            <p className="text-white/30 text-center text-xs">
              This analysis is AI-generated and for educational purposes only. It is not financial advice. Always do your own research before investing.
            </p>
          </div>
        </section>
      )}

      {/* Feature Cards */}
      <section className="px-6 pb-24 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Link href="/" className="bg-white/4 border border-white/8 rounded-2xl p-7 hover:border-emerald-400/30 transition-colors block">
          <div className="text-2xl mb-4">🔬</div>
          <h3 className="font-semibold text-lg mb-2">Company Breakdown</h3>
          <p className="text-white/45 text-sm leading-relaxed">
            Pipeline stage, clinical data, approval odds, and honest downside risk — in simple English.
          </p>
        </Link>
        <Link href="/comparison" className="bg-white/4 border border-white/8 rounded-2xl p-7 hover:border-emerald-400/30 transition-colors block">
          <div className="text-2xl mb-4">⚖️</div>
          <h3 className="font-semibold text-lg mb-2">Comparison Mode</h3>
          <p className="text-white/45 text-sm leading-relaxed">
            Two companies, same therapeutic area. See who has stronger data and better positioning.
          </p>
        </Link>
        <Link href="/glossary" className="bg-white/4 border border-white/8 rounded-2xl p-7 hover:border-emerald-400/30 transition-colors block">
          <div className="text-2xl mb-4">📖</div>
          <h3 className="font-semibold text-lg mb-2">Integrated Glossary</h3>
          <p className="text-white/45 text-sm leading-relaxed">
            Every technical term explained instantly. Build real biotech literacy as you research.
          </p>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 text-center py-8 text-white/25 text-sm">
        BioClarity is an educational tool only. Nothing here constitutes financial or investment advice.
      </footer>
    </main>
  );
}