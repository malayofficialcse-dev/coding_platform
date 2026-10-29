// client/src/components/AIChatbot/AIChatbot.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AIChatbot.css';

// Generate a stable session ID per browser tab
const SESSION_ID = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: `👋 Hi! I'm **CodeBot**, your AI tutor on Code Campus.\n\nI can help you with:\n- 📚 Course content & topics\n- 💻 DSA problems & editorials\n- 🧪 Exam questions & practice\n- 🐛 Code debugging & explanation\n- 📊 Your learning progress\n\nWhat would you like to learn today?`,
  timestamp: new Date().toISOString(),
};

export default function AIChatbot() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen]       = useState(false);
  const [messages, setMessages]   = useState([WELCOME_MESSAGE]);
  const [input, setInput]         = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [intentLabel, setIntentLabel] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const abortRef       = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const addMessage = (msg) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), ...msg }]);
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    setIntentLabel('');

    // Add user message
    addMessage({ role: 'user', content: text, timestamp: new Date().toISOString() });

    // Placeholder for streaming assistant message
    const assistantId = `ai_${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', streaming: true, timestamp: new Date().toISOString() },
    ]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text, session_id: SESSION_ID }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'intent') {
              setIntentLabel(data.intent?.replace(/_/g, ' ') ?? '');
            }

            if (data.type === 'token') {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: m.content + data.token }
                    : m
                )
              );
            }

            if (data.type === 'done' || data.type === 'error') {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, streaming: false } : m
                )
              );
              if (data.type === 'error') {
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId
                      ? { ...m, content: '⚠️ Something went wrong. Please try again.' }
                      : m
                  )
                );
              }
            }
          } catch (_) { /* skip malformed SSE lines */ }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev =>
          prev.map(m =>
            m.streaming
              ? { ...m, streaming: false, content: '⚠️ Connection error. Please try again.' }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      setIntentLabel('');
    }
  }, [input, isStreaming, token]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
  };

  // Render simple markdown: **bold**, `code`, \n
  const renderContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={i} className="ai-inline-code">{part.slice(1, -1)}</code>;
      if (part === '\n') return <br key={i} />;
      return part;
    });
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        id="ai-chatbot-trigger"
        className={`ai-chatbot-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label="Open AI Tutor"
        title="Ask CodeBot"
      >
        <span className="ai-trigger-icon">{isOpen ? '✕' : '🤖'}</span>
        {!isOpen && <span className="ai-trigger-badge">AI</span>}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div id="ai-chatbot-window" className="ai-chatbot-window" role="dialog" aria-label="CodeBot AI Tutor">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <div className="ai-avatar">🤖</div>
              <div>
                <h3 className="ai-title">CodeBot</h3>
                <span className="ai-status">
                  {isStreaming ? (
                    <><span className="ai-dot streaming" />Thinking…</>
                  ) : (
                    <><span className="ai-dot online" />Online</>
                  )}
                </span>
              </div>
            </div>
            <div className="ai-header-actions">
              <button id="ai-clear-btn" className="ai-icon-btn" onClick={clearChat} title="Clear chat">🗑</button>
              <button id="ai-close-btn" className="ai-icon-btn" onClick={() => setIsOpen(false)} title="Close">✕</button>
            </div>
          </div>

          {/* Intent badge */}
          {intentLabel && (
            <div className="ai-intent-badge">
              🔍 Searching: <strong>{intentLabel}</strong>
            </div>
          )}

          {/* Messages */}
          <div className="ai-messages" id="ai-messages-container">
            {messages.map(msg => (
              <div key={msg.id} className={`ai-message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="ai-msg-avatar">🤖</div>
                )}
                <div className={`ai-bubble ${msg.role}`}>
                  <div className="ai-bubble-content">
                    {renderContent(msg.content)}
                    {msg.streaming && <span className="ai-cursor">▌</span>}
                  </div>
                  <span className="ai-timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="ai-input-area">
            <textarea
              ref={inputRef}
              id="ai-message-input"
              className="ai-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask CodeBot anything… (Enter to send)"
              rows={1}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <button id="ai-stop-btn" className="ai-send-btn stop" onClick={stopStreaming} title="Stop">⏹</button>
            ) : (
              <button
                id="ai-send-btn"
                className="ai-send-btn"
                onClick={sendMessage}
                disabled={!input.trim()}
                title="Send (Enter)"
              >
                ➤
              </button>
            )}
          </div>
          <p className="ai-disclaimer">AI responses may be inaccurate. Always verify important information.</p>
        </div>
      )}
    </>
  );
}
