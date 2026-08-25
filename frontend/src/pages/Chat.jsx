import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatAPI } from '../services/api';
import SessionSidebar from '../components/SessionSidebar/SessionSidebar';
import ChatWindow from '../components/ChatWindow/ChatWindow';

export default function Chat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Fetch all user sessions on mount
  const fetchSessions = async () => {
    try {
      const res = await chatAPI.getSessions();
      setSessions(res.data || []);
      return res.data || [];
    } catch (err) {
      console.error('Error fetching sessions:', err);
      return [];
    }
  };

  // Load a specific session's messages
  const loadSession = async (id) => {
    if (!id) return;
    try {
      const res = await chatAPI.getSession(id);
      setActiveSession(res.data.session);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Error loading session:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      const allSessions = await fetchSessions();
      if (sessionId) {
        await loadSession(sessionId);
      } else if (allSessions.length > 0) {
        // Default to most recent session
        navigate(`/chat/${allSessions[0].id}`, { replace: true });
      }
    };
    init();
  }, [sessionId]);

  // Handle New Chat creation
  const handleNewChat = async () => {
    try {
      const res = await chatAPI.createSession({ title: 'New Conversation' });
      const newSession = res.data;
      setSessions([newSession, ...sessions]);
      setActiveSession(newSession);
      setMessages([]);
      navigate(`/chat/${newSession.id}`);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  // Handle Select Session from sidebar
  const handleSelectSession = (id) => {
    navigate(`/chat/${id}`);
  };

  // Handle Delete Session
  const handleDeleteSession = async (id) => {
    try {
      await chatAPI.deleteSession(id);
      const remaining = sessions.filter((s) => s.id !== id);
      setSessions(remaining);

      if (id === sessionId) {
        if (remaining.length > 0) {
          navigate(`/chat/${remaining[0].id}`);
        } else {
          setActiveSession(null);
          setMessages([]);
          navigate('/chat');
        }
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  // Handle sending a message in the active session with real-time SSE streaming
  const handleSendMessage = async (content) => {
    let currentSessionId = sessionId;

    // If no active session, create one first
    if (!currentSessionId) {
      try {
        const res = await chatAPI.createSession({ title: content.slice(0, 30) });
        currentSessionId = res.data.id;
        setActiveSession(res.data);
        setSessions([res.data, ...sessions]);
        navigate(`/chat/${currentSessionId}`, { replace: true });
      } catch (err) {
        console.error('Failed to create session for message:', err);
        return;
      }
    }

    const tempUserMsgId = `user-${Date.now()}`;
    const tempAssistantMsgId = `assistant-${Date.now()}`;

    // 1. Optimistically append user message
    const tempUserMsg = {
      id: tempUserMsgId,
      session_id: currentSessionId,
      role: 'user',
      content,
      sources: [],
      created_at: new Date().toISOString(),
    };

    // 2. Append placeholder assistant message
    const placeholderAssistantMsg = {
      id: tempAssistantMsgId,
      session_id: currentSessionId,
      role: 'assistant',
      content: '',
      sources: [],
      isStreaming: true,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg, placeholderAssistantMsg]);
    setIsLoading(true);

    try {
      await chatAPI.streamMessage(currentSessionId, content, {
        onSources: (sources) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantMsgId ? { ...msg, sources } : msg
            )
          );
        },
        onToken: (delta) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantMsgId
                ? { ...msg, content: msg.content + delta }
                : msg
            )
          );
        },
        onDone: (finalMsg) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantMsgId
                ? { ...finalMsg, isStreaming: false }
                : msg
            )
          );
          fetchSessions();
        },
        onError: (err) => {
          console.error('Streaming error:', err);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantMsgId
                ? {
                    ...msg,
                    content:
                      msg.content ||
                      '⚠️ **Error:** Unable to stream answer at this moment. Please verify backend status.',
                    isStreaming: false,
                  }
                : msg
            )
          );
        },
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden">
      {/* Sessions Sidebar */}
      <SessionSidebar
        sessions={sessions}
        activeSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Chat Flow */}
      <ChatWindow
        session={activeSession}
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
