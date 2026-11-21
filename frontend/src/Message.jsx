import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

// A code block with a Copy button
function CodeBlock({ children }) {
  const preRef = useRef(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(preRef.current?.innerText ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: ignore */
    }
  }

  return (
    <div className="code-block">
      <button className="copy-btn" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </button>
      <pre ref={preRef}>{children}</pre>
    </div>
  );
}

const LABELS = {
  web_search: "Searching the web",
  list_files: "Listing workspace files",
  read_file: "Reading file",
};

// Shows one tool call: running, waiting for approval, done or denied
function ToolCard({ tool, onApprove }) {
  const detail = tool.args?.query || tool.args?.path || "";
  const label = LABELS[tool.name] || tool.name;

  if (tool.status === "approval") {
    return (
      <div className="tool-card approval">
        <div className="tool-text">
          Nova wants to read <code>{detail || "a file"}</code>
        </div>
        <div className="tool-actions">
          <button onClick={() => onApprove(tool.id, true)}>Allow</button>
          <button className="deny-btn" onClick={() => onApprove(tool.id, false)}>
            Deny
          </button>
        </div>
      </div>
    );
  }

  const icon =
    tool.status === "done" ? "✓" : tool.status === "denied" ? "✕" : "";

  return (
    <div className={`tool-card ${tool.status}`}>
      {tool.status === "running" && <span className="tool-pulse" />}
      {icon && <span className="tool-icon">{icon}</span>}
      <span className="tool-text">
        {label}
        {detail && `: ${detail}`}
        {tool.status === "denied" && " (denied)"}
      </span>
    </div>
  );
}

export default function Message({ role, content, tools, pending, onApprove }) {
  // user messages stay plain text; only Nova's replies are rendered as Markdown
  if (role === "user") {
    return <div className="msg user">{content}</div>;
  }

  const hasTools = tools && tools.length > 0;

  return (
    <div className="msg assistant">
      {hasTools && (
        <div className="tool-list">
          {tools.map((t) => (
            <ToolCard key={t.id} tool={t} onApprove={onApprove} />
          ))}
        </div>
      )}
      {content ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{ pre: CodeBlock }}
        >
          {content}
        </ReactMarkdown>
      ) : (
        !hasTools && pending && "…"
      )}
    </div>
  );
}
