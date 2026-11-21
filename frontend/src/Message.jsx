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

export default function Message({ role, content, pending }) {
  // user messages stay plain text; only Nova's replies are rendered as Markdown
  if (role === "user") {
    return <div className="msg user">{content}</div>;
  }

  return (
    <div className="msg assistant">
      {content ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{ pre: CodeBlock }}
        >
          {content}
        </ReactMarkdown>
      ) : (
        pending && "…"
      )}
    </div>
  );
}
