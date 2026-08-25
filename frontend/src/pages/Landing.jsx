import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Search,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  FileCheck2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Landing() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-brand-600/15 via-sky-500/5 to-transparent blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-1/3 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center flex-1 flex flex-col justify-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-8 mx-auto shadow-sm">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span>Strictly Grounded Retrieval-Augmented Generation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
          Ask Your College Handbook <br />
          <span className="bg-gradient-to-r from-brand-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            Get Verified, Cited Answers.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          CampusMind connects directly to your college’s syllabus, circulars, fee schedules, exam rules, and placement notices. Never guess, never hallucinate — every answer shows its exact source document and page number.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to={isAuthenticated ? "/chat" : "/register"}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white font-bold text-base shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            <span>{isAuthenticated ? "Open Chat Interface" : "Get Started as Student"}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-card hover:bg-slate-800/80 text-slate-200 font-semibold text-base border border-slate-700 transition-all"
          >
            Administrator Login
          </Link>
        </div>

        {/* Core Value Props Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Zero Hallucinations</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              If an answer is not in the uploaded college documents, CampusMind explicitly says "I don't know" rather than making up answers.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Auditable Source Citations</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every single claim includes the specific document filename, page number, and similarity confidence score for verification.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Role Separation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Admin users upload and manage documents with background chunking and vector purge; students get fast, authenticated answers.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works RAG Pipeline Diagram */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            How the RAG Pipeline Works
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            A complete end-to-end architecture built with LangChain, ChromaDB, and Google Gemini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 font-mono font-bold flex items-center justify-center mx-auto mb-3">1</div>
            <h4 className="font-bold text-slate-200 text-sm mb-1">Document Ingestion</h4>
            <p className="text-xs text-slate-400">PDFs/DOCXs parsed page-by-page and split into ~800 char semantic chunks with overlap.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 font-mono font-bold flex items-center justify-center mx-auto mb-3">2</div>
            <h4 className="font-bold text-slate-200 text-sm mb-1">Vector Storage</h4>
            <p className="text-xs text-slate-400">Chunks embedded using Gemini text-embedding-004 and stored locally in persistent ChromaDB.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-mono font-bold flex items-center justify-center mx-auto mb-3">3</div>
            <h4 className="font-bold text-slate-200 text-sm mb-1">Similarity Search</h4>
            <p className="text-xs text-slate-400">Student question is embedded and top-4 relevant chunks are filtered against confidence score threshold.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center mx-auto mb-3">4</div>
            <h4 className="font-bold text-slate-200 text-sm mb-1">Grounded Generation</h4>
            <p className="text-xs text-slate-400">Gemini LLM synthesizes an accurate answer with citations using only the retrieved context chunks.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-xs text-slate-400 border-t border-slate-800/80">
        <p>© 2026 CampusMind. Built for NxtWave AI Project Submission with FastAPI, React, LangChain & ChromaDB.</p>
      </footer>
    </div>
  );
}
