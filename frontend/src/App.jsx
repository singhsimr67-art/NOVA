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
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const editDoneRef = useRef(false);
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem("nova-theme") ||
      (window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark")
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("nova-theme", theme);
  }, [theme]);

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

  // change the last message (the assistant reply being built)
  function updateLast(fn) {
    setMessages((prev) => {
      const copy = [...prev];
      copy[copy.length - 1] = fn(copy[copy.length - 1]);
      return copy;
    });
  }

  function applyEvent(evt) {
    if (evt.t === "token") {
      updateLast((m) => ({ ...m, content: m.content + evt.v }));
    } else if (evt.t === "tool") {
      updateLast((m) => ({
        ...m,
        tools: [
          ...(m.tools || []),
          { id: evt.id, name: evt.name, args: evt.args, status: evt.status },
        ],
      }));
    } else if (evt.t === "tool_result") {
      updateLast((m) => ({
        ...m,
        tools: (m.tools || []).map((t) =>
          t.id === evt.id ? { ...t, status: evt.status } : t
        ),
      }));
    } else if (evt.t === "error") {
      updateLast((m) => ({
        ...m,
        content: (m.content ? m.content + "\n\n" : "") + `⚠ ${evt.v}`,
      }));
    }
  }

  async function approve(id, allow) {
    updateLast((m) => ({
      ...m,
      tools: (m.tools || []).map((t) =>
        t.id === id ? { ...t, status: allow ? "running" : "denied" } : t
      ),
    }));
    try {
      await fetch(`${API}/approve/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allow }),
      });
    } catch {
      /* backend gone: nothing to do */
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);
    let received = false;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "", tools: [] },
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
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep the unfinished last line
        for (const line of lines) {
          if (!line.trim()) continue;
          let evt;
          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }
          if (evt.t === "token") received = true;
          applyEvent(evt);
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // user pressed Stop: keep the partial reply, or undo if nothing arrived
        if (!received) {
          setMessages((prev) => prev.slice(0, -2));
          setInput(text);
        }
      } else {
        updateLast(() => ({
          role: "assistant",
          content: `Could not reach Nova: ${err.message}`,
          tools: [],
        }));
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
      refreshChats();
    }
  }

  function stop() {
    // deny any tool still waiting for approval so the server stops waiting
    const last = messages[messages.length - 1];
    (last?.tools || [])
      .filter((t) => t.status === "approval")
      .forEach((t) => approve(t.id, false));
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

  function startRename(id, title, e) {
    e.stopPropagation();
    if (loading) return;
    editDoneRef.current = false;
    setEditingId(id);
    setEditValue(title);
  }

  async function commitRename() {
    if (editDoneRef.current || !editingId) return;
    editDoneRef.current = true;
    const id = editingId;
    setEditingId(null);
    try {
      await fetch(`${API}/chats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editValue }),
      });
    } catch {
      /* backend offline: keep the old title */
    }
    refreshChats();
  }

  function cancelRename() {
    editDoneRef.current = true;
    setEditingId(null);
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
              {editingId === c.id ? (
                <input
                  className="rename-input"
                  value={editValue}
                  autoFocus
                  maxLength={80}
                  onChange={(e) => setEditValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") cancelRename();
                  }}
                />
              ) : (
                <>
                  <span
                    className="chat-title"
                    title="Double-click to rename"
                    onDoubleClick={(e) => startRename(c.id, c.title, e)}
                  >
                    {c.title}
                  </span>
                  <span className="chat-actions">
                    <button
                      className="edit"
                      onClick={(e) => startRename(c.id, c.title, e)}
                      title="Rename chat"
                    >
                      ✎
                    </button>
                    <button
                      className="delete"
                      onClick={(e) => deleteChat(c.id, e)}
                      title="Delete chat"
                    >
                      ✕
                    </button>
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </aside>

      <div className="app">
        <header>
          <h1>
            <span className="logo-dot" />
            Nova
          </h1>
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </header>

        <main>
          {messages.length === 0 && (
            <div className="empty">
              <div className="orbit" />
              <h2>Hi, I'm Nova</h2>
              <p>Ask me anything.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <Message
              key={i}
              role={m.role}
              content={m.content}
              tools={m.tools}
              pending={loading && i === messages.length - 1}
              onApprove={approve}
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
