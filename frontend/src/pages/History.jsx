import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  MessageSquare,
  Search,
  Trash2,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { chatAPI } from '../services/api';

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const res = await chatAPI.getSessions();
      setSessions(res.data || []);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await chatAPI.deleteSession(id);
      setSessions(sessions.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const filteredSessions = sessions.filter((s) =>
    (s.title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-brand-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Conversation History</h1>
          </div>
          <p className="text-xs text-slate-400">
            Browse and resume all your past grounded queries and research sessions
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Sessions Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-400">Loading conversation history...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="glass-panel text-center py-16 px-4 rounded-3xl border border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400 mb-4">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-200 mb-1">No conversations found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            {search ? 'No conversations match your search query.' : 'You haven\'t started any conversations with CampusMind yet.'}
          </p>
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start a New Chat</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((s) => (
            <Link
              key={s.id}
              to={`/chat/${s.id}`}
              className="group glass-card p-5 rounded-2xl border border-slate-800 hover:border-brand-500/40 hover:bg-slate-800/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-1">
                    {s.title || 'Untitled Conversation'}
                  </h3>
                  <button
                    onClick={(e) => handleDelete(s.id, e)}
                    title="Delete Conversation"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-2 mb-4">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {s.updated_at ? new Date(s.updated_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : 'Recently'}
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-400" />
                  {s.message_count || 0} messages
                </span>
                <span className="text-brand-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-medium">
                  Resume Chat
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
