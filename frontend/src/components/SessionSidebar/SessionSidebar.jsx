import React from 'react';
import {
  MessageSquarePlus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';

export default function SessionSidebar({
  sessions = [],
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onToggleOpen
}) {
  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-30 flex flex-col glass-panel border-r border-slate-800 transition-all duration-300 ${
        isOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-16'
      }`}
      style={{ height: 'calc(100vh - 65px)' }}
    >
      {/* Header with New Chat Button */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2">
        {isOpen ? (
          <button
            onClick={onNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-sm font-semibold shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        ) : (
          <button
            onClick={onNewChat}
            title="New Chat"
            className="w-10 h-10 rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center mx-auto shadow-md transition-all"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        )}

        {/* Toggle Collapse */}
        <button
          onClick={onToggleOpen}
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden md:block"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isOpen && (
          <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Recent Chats</span>
            <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">
              {sessions.length}
            </span>
          </div>
        )}

        {sessions.length === 0 ? (
          isOpen && (
            <div className="text-center py-8 px-4 text-xs text-slate-400">
              <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
              No conversations yet. Start a new chat above!
            </div>
          )
        ) : (
          sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 font-medium'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                }`}
                onClick={() => onSelectSession(s.id)}
              >
                <div className="flex items-center gap-2.5 truncate min-w-0">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                  {isOpen && <span className="truncate">{s.title || 'Conversation'}</span>}
                </div>

                {isOpen && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                    title="Delete Conversation"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      {isOpen && (
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Grounded in College Docs</span>
        </div>
      )}
    </aside>
  );
}
