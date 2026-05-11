'use client';

import { useState } from 'react';
import Link from 'next/link';

const COMMON_TERMS = [
  'Phase 3 Trial', 'FDA Approval', 'PDUFA Date', 'Clinical Trial',
  'Pipeline', 'Biomarker', 'Orphan Drug', 'Accelerated Approval',
  'Patent Cliff', 'IND Application', 'NDA', 'BLA',
  'Placebo', 'Double Blind Study', 'Primary Endpoint', 'Market Cap',
  'Dilution', 'Cash Runway', 'Blockbuster Drug', 'Generic Drug',
];

export default function GlossaryPage() {
  const [term, setTerm] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchedTerm, setSearchedTerm] = useState('');

  const lookup = async (searchTerm?: string) => {
    const termToSearch = searchTerm || term;
    if (!termToSearch.trim()) return;
    setLoading(true);
    setResult('');
    setError('');
    setSearchedTerm(termToSearch);

    try {
      const res = await fetch('/api/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: termToSearch }),
      });

      const data = await res.json();

      if (data.error === 'NOT_BIOTECH') {
        setError(`"${termToSearch}" doesn't appear to be a biotech or investing term. Try something like "Phase 3 Trial" or "PDUFA Date".`);
        return;
      }
      if (data.error) {
        setError('Something went wrong. Please try again.');
        return;
      }

      setResult(data.result);
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatResult = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.map((line, i) => {
      if (line.startsWith('**') && line.includes(':**')) {
        const label = line.match(/\*\*(.+?):\*\*/)?.[1];
        const content = line.replace(/\*\*.+?:\*\*\s*/, '');
        return (
          <div key={i} className="mb-4">
            <span className="text-emerald-400 font-semibold">{label}: </span>
            <span className="text-white/70">{content}</span>
          </div>
        );
      }
      return <p key={i} className="text-white/70 mb-2">{line}</p>;
    });
  };

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
          <Link href="/comparison" className="text-sm text-white/50 hover:text-white transition-colors">Comparison Mode</Link>
          <Link href="/glossary" className="text-sm text-emerald-400 font-medium">Glossary</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-16">
        <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-4 py-1.5 text-emerald-400 text-sm mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Plain-English Definitions
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl leading-tight mb-4">
          Biotech terms,{' '}
          <span className="text-emerald-400">actually explained.</span>
        </h1>
        <p className="text-white/50 max-w-lg mb-10 leading-relaxed">
          Type any biotech or pharma term and get a plain-English explanation — no medical degree required.
        </p>

        {/* Search Input */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && lookup()}
            placeholder="e.g. PDUFA Date, Phase 3 Trial..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/50 transition-all"
          />
          <button
            onClick={() => lookup()}
            disabled={loading}
            className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-7 py-4 transition-colors whitespace-nowrap"
          >
            {loading ? 'Looking up...' : 'Look Up →'}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </section>

      {/* Result */}
      {result && (
        <section className="px-6 pb-12 max-w-2xl mx-auto">
          <div className="bg-white/4 border border-white/8 rounded-2xl p-8">
            <h3 className="text-emerald-400 font-bold text-xl mb-6">{searchedTerm}</h3>
            {formatResult(result)}
          </div>
        </section>
      )}

      {/* Common Terms */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <h2 className="text-white/40 text-sm font-semibold uppercase tracking-widest mb-6 text-center">Common Terms</h2>
        <div className="flex flex-wrap gap-3 justify-center">
          {COMMON_TERMS.map((t) => (
            <button
              key={t}
              onClick={() => { setTerm(t); lookup(t); }}
              className="bg-white/4 border border-white/8 rounded-full px-4 py-2 text-sm text-white/60 hover:text-white hover:border-emerald-400/40 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 text-center py-8 text-white/25 text-sm">
        BioClarity is an educational tool only. Nothing here constitutes financial or investment advice.
      </footer>
    </main>
  );
}