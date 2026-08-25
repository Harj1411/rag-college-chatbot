import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  User,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import SourceCitationDrawer from '../SourceCitation/SourceCitationDrawer';
import { chatAPI } from '../../services/api';

export default function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'up' | 'down'
  const isUser = message.role === 'user';
  const isFallback = message.content?.includes('Not Found in College Documents') ||
                     message.content?.includes('could not find relevant information');

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (rating) => {
    if (feedback) return; // Prevent duplicate
    setFeedback(rating);
    try {
      await chatAPI.submitFeedback({
        message_id: message.id,
        rating,
        comment: null,
      });
    } catch (err) {
      console.error('Feedback submit error:', err);
    }
  };

  return (
    <div
      className={`flex items-start gap-3.5 my-4 group animate-slide-up ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
          isUser
            ? 'bg-gradient-to-tr from-brand-600 to-sky-400 text-white'
            : isFallback
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : 'bg-gradient-to-tr from-slate-800 to-slate-700 text-brand-400 border border-slate-700'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5" />
        ) : isFallback ? (
          <AlertTriangle className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>

      {/* Bubble Container */}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 text-sm transition-all ${
          isUser
            ? 'bg-gradient-to-br from-brand-600 to-blue-700 text-white shadow-lg shadow-brand-600/10 rounded-tr-sm'
            : isFallback
            ? 'bg-amber-950/20 border border-amber-500/30 text-slate-200 rounded-tl-sm shadow-md'
            : 'glass-card text-slate-200 rounded-tl-sm shadow-md'
        }`}
      >
        {/* Assistant Header Badge */}
        {!isUser && (
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-700/40">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-[11px] font-semibold text-slate-300">
                {isFallback ? 'CampusMind Notice' : 'CampusMind Grounded Answer'}
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                title="Copy Answer"
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="prose-chat">
          <ReactMarkdown>{message.content}</ReactMarkdown>
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-brand-400 animate-pulse align-middle font-mono">▋</span>
          )}
        </div>

        {/* Citations if available */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceCitationDrawer sources={message.sources} />
        )}

        {/* Feedback Row */}
        {!isUser && !isFallback && (
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span className="text-[10px] text-slate-400">Was this verified answer helpful?</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleFeedback('up')}
                className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                  feedback === 'up' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFeedback('down')}
                className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                  feedback === 'down' ? 'text-rose-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
