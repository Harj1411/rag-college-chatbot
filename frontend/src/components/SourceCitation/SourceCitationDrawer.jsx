import React, { useState } from 'react';
import { BookOpen, FileText, ExternalLink, X, ChevronRight, Award } from 'lucide-react';

export default function SourceCitationDrawer({ sources = [] }) {
  const [selectedSource, setSelectedSource] = useState(null);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3.5 pt-3 border-t border-slate-700/50">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-3.5 h-3.5 text-brand-400" />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Retrieved College Sources ({sources.length})
        </span>
      </div>

      {/* Citation Chips */}
      <div className="flex flex-wrap gap-2">
        {sources.map((src, idx) => {
          const scorePercent = Math.round((src.score || 0) * 100);
          return (
            <button
              key={idx}
              onClick={() => setSelectedSource(src)}
              className="group inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-brand-500/50 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-brand-400 group-hover:scale-110 transition-transform" />
              <span className="truncate max-w-[140px] font-medium">{src.doc_name}</span>
              <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                P.{src.page || 1}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                {scorePercent}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail Modal / Drawer */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-xl rounded-2xl p-6 border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setSelectedSource(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base leading-tight">
                  {selectedSource.doc_name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                    Page {selectedSource.page || 1}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-semibold">
                    Match Confidence: {Math.round((selectedSource.score || 0) * 100)}%
                  </span>
                  {selectedSource.section && (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
                      {selectedSource.section}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
                Grounding Excerpt from Document
              </p>
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedSource.text_snippet || 'No excerpt available.'}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedSource(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
