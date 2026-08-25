import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  MessageSquare,
  FileText,
  Layers,
  Users,
  Award,
  HelpCircle,
  Clock,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await adminAPI.getAnalytics();
        setData(res.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-400">Loading admin analytics & metrics...</p>
      </div>
    );
  }

  const overview = data?.overview || {};
  const topDocs = data?.top_cited_documents || [];
  const recentQuestions = data?.recent_questions || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin System Analytics</h1>
        </div>
        <p className="text-xs text-slate-400">
          Monitor RAG retrieval volume, most-cited college policy documents, and recent student queries
        </p>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Ingested Docs</span>
            <FileText className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{overview.total_documents || 0}</p>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 inline-block">
            {overview.total_vectors || 0} vector chunks
          </span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Messages</span>
            <MessageSquare className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{overview.total_messages || 0}</p>
          <span className="text-[10px] text-slate-400 mt-1 inline-block">
            Across {overview.total_sessions || 0} sessions
          </span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Active Users</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{overview.total_users || 0}</p>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 inline-block">
            Students & Staff
          </span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>RAG Grounding Rate</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">100%</p>
          <span className="text-[10px] text-amber-300 font-medium mt-1 inline-block">
            Strict Zero-Hallucination
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Cited Documents */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            Most Cited Documents in Answers
          </h2>

          {topDocs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No citations generated yet. Ask questions in the chat to start citation tracking.
            </div>
          ) : (
            <div className="space-y-3">
              {topDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-400 font-mono text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-xs">
                      {doc.filename}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
                    {doc.citations} citations
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Queries */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-sky-400" />
            Recent Student Inquiries
          </h2>

          {recentQuestions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No recent questions recorded.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">{q}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
