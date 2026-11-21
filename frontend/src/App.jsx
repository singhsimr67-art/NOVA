import { useState, useRef, useEffect } from "react";
import "./App.css";
import Message from "./Message";

const API = "http://localhost:8000";

export default function App() {
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function refreshChats() {
    try {
      const res = await fetch(`${API}/chats`);
      setChats(await res.json());
    } catch {
      /* backend offline: leave the list as it is */
    }
  }

  useEffect(() => {
    refreshChats();
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);
    let received = false;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: text }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Server error ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) received = true;
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + chunk };
          return copy;
        });
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // user pressed Stop: keep the partial reply, or undo if nothing arrived
        if (!received) {
          setMessages((prev) => prev.slice(0, -2));
          setInput(text);
        }
      } else {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: `Could not reach Nova: ${err.message}`,
          };
          return copy;
        });
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
      refreshChats();
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newChat() {
    if (loading) return;
    setMessages([]);
    setSessionId(crypto.randomUUID());
  }

  async function openChat(id) {
    if (loading || id === sessionId) return;
    try {
      const res = await fetch(`${API}/chats/${id}`);
      if (!res.ok) throw new Error();
      setMessages(await res.json());
      setSessionId(id);
    } catch {
      /* ignore: chat couldn't be loaded */
    }
  }

  async function deleteChat(id, e) {
    e.stopPropagation();
    if (loading) return;
    if (!window.confirm("Delete this chat?")) return;
    try {
      await fetch(`${API}/chats/${id}`, { method: "DELETE" });
    } catch {
      return;
    }
    if (id === sessionId) newChat();
    refreshChats();
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <button className="new-chat" onClick={newChat} disabled={loading}>
          + New chat
        </button>
        <div className="chat-list">
          {chats.length === 0 && <p className="no-chats">No saved chats yet</p>}
          {chats.map((c) => (
            <div
              key={c.id}
              className={`chat-item ${c.id === sessionId ? "active" : ""}`}
              onClick={() => openChat(c.id)}
            >
              <span className="chat-title">{c.title}</span>
              <button
                className="delete"
                onClick={(e) => deleteChat(c.id, e)}
                title="Delete chat"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </aside>

      <div className="app">
        <header>
          <h1>Nova</h1>
        </header>

        <main>
          {messages.length === 0 && (
            <p className="empty">Hi, I'm Nova. Ask me anything.</p>
          )}
          {messages.map((m, i) => (
            <Message
              key={i}
              role={m.role}
              content={m.content}
              pending={loading && i === messages.length - 1}
            />
          ))}
          <div ref={bottomRef} />
        </main>

        <footer>
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message Nova (Enter to send, Shift+Enter for a new line)"
          />
          {loading ? (
            <button className="stop-btn" onClick={stop}>
              Stop
            </button>
          ) : (
            <button onClick={send} disabled={!input.trim()}>
              Send
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
