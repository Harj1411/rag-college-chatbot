import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  GraduationCap,
  ArrowRight,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import MessageBubble from '../MessageBubble/MessageBubble';

const SAMPLE_QUESTIONS = [
  'What is the minimum attendance requirement for semester exams?',
  'What are the eligibility criteria for placement registration?',
  'How much is the hostel fee and when is the late penalty applied?',
  'What are the details of the Dean\'s Merit Scholarship?'
];

export default function ChatWindow({
  session,
  messages = [],
  isLoading,
  onSendMessage,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputResize = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950/40 relative">
      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4">
        {messages.length === 0 ? (
          /* Empty State / Welcome Screen */
          <div className="max-w-2xl mx-auto py-10 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-sky-400 mx-auto flex items-center justify-center text-white shadow-xl shadow-brand-500/20 mb-5">
              <GraduationCap className="w-9 h-9" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              How can CampusMind help you today?
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto mb-8">
              Ask questions about academic policies, examination rules, fee schedules, hostel curfews, or placement criteria. Every answer is grounded directly in official college documents.
            </p>

            {/* Quick Sample Questions */}
            <div className="text-left space-y-2 max-w-xl mx-auto">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5 text-brand-400" />
                <span>Suggested Questions</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SAMPLE_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(q);
                      onSendMessage(q);
                    }}
                    className="p-3 text-left rounded-xl glass-card hover:border-brand-500/50 hover:bg-slate-800/80 transition-all text-xs text-slate-300 hover:text-white flex items-start justify-between gap-2 group shadow-sm"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Render Messages */
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3.5 my-4 animate-slide-up">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 shrink-0">
                  <Bot className="w-5 h-5 animate-pulse" />
                </div>
                <div className="glass-card rounded-2xl rounded-tl-sm p-4 text-sm text-slate-300 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Retrieving college documents & grounding answer...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Box Footer */}
      <div className="p-4 sm:px-8 border-t border-slate-800/80 glass-panel">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-end gap-2">
          <div className="flex-1 relative rounded-2xl bg-slate-900/90 border border-slate-700/80 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputResize}
              onKeyDown={handleKeyDown}
              placeholder="Ask about syllabus, circulars, fees, placements, hostel rules..."
              rows={1}
              className="w-full px-4 py-3.5 text-sm bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none resize-none max-h-32"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-3.5 rounded-2xl flex items-center justify-center font-semibold transition-all shrink-0 ${
              input.trim() && !isLoading
                ? 'bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white shadow-lg shadow-brand-500/20 hover:scale-105'
                : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
            }`}
          >
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
        <p className="text-center text-[11px] text-slate-400 mt-2">
          CampusMind answers exclusively from verified college documents with real citations.
        </p>
      </div>
    </div>
  );
}
