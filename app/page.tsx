'use client';

import { useState } from 'react';

export default function Home() {
  const [ticker, setTicker] = useState('');

  return (
    <main className="min-h-screen bg-[#0a0e1a] text-white font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-lg font-semibold tracking-tight">BioClarity</span>
        </div>
        <span className="text-sm text-white/40">Education only. Not financial advice.</span>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-28">
        <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-4 py-1.5 text-emerald-400 text-sm mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Plain-English Biotech Research
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight max-w-3xl leading-tight mb-6">
          Understand what you own{' '}
          <span className="text-emerald-400">before you buy.</span>
        </h1>

        <p className="text-lg text-white/50 max-w-xl mb-12 leading-relaxed">
          Enter any biotech or pharma company. Get a plain-English breakdown of their
          pipeline, clinical data, and real downside risk — no jargon, no fluff.
        </p>

        {/* Input */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Enter ticker or company name..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/50 focus:bg-white/8 transition-all"
          />
          <button
            className="bg-emerald-400 hover:bg-emerald-300 text-black font-semibold rounded-xl px-7 py-4 transition-colors whitespace-nowrap"
          >
            Analyze →
          </button>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="px-6 pb-24 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white/4 border border-white/8 rounded-2xl p-7 hover:border-emerald-400/30 transition-colors">
          <div className="text-2xl mb-4">🔬</div>
          <h3 className="font-semibold text-lg mb-2">Company Breakdown</h3>
          <p className="text-white/45 text-sm leading-relaxed">
            Pipeline stage, clinical data, approval odds, and honest downside risk — in plain English.
          </p>
        </div>

        <div className="bg-white/4 border border-white/8 rounded-2xl p-7 hover:border-emerald-400/30 transition-colors">
          <div className="text-2xl mb-4">⚖️</div>
          <h3 className="font-semibold text-lg mb-2">Comparison Mode</h3>
          <p className="text-white/45 text-sm leading-relaxed">
            Two companies, same therapeutic area. See who has stronger data and better positioning.
          </p>
        </div>

        <div className="bg-white/4 border border-white/8 rounded-2xl p-7 hover:border-emerald-400/30 transition-colors">
          <div className="text-2xl mb-4">📖</div>
          <h3 className="font-semibold text-lg mb-2">Integrated Glossary</h3>
          <p className="text-white/45 text-sm leading-relaxed">
            Every technical term explained instantly. Build real biotech literacy as you research.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 text-center py-8 text-white/25 text-sm">
        BioClarity is an educational tool only. Nothing here constitutes financial or investment advice.
      </footer>
    </main>
  );
}