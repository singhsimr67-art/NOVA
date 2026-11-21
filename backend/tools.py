from pathlib import Path

from ddgs import DDGS

WORKSPACE = Path(__file__).parent / "workspace"
WORKSPACE.mkdir(exist_ok=True)

MAX_READ_CHARS = 8000

# Tools in this set make Nova ask for your approval before running.
REQUIRES_APPROVAL = {"read_file"}


def web_search(query: str) -> str:
    try:
        results = DDGS().text(query, max_results=5)
    except Exception as e:
        return f"Search failed: {e}"
    if not results:
        return "No results found."
    lines = []
    for r in results:
        lines.append(f"- {r.get('title', '')}\n  {r.get('href', '')}\n  {r.get('body', '')}")
    return "\n".join(lines)[:6000]


def list_files() -> str:
    files = sorted(
        p.relative_to(WORKSPACE).as_posix()
        for p in WORKSPACE.rglob("*")
        if p.is_file()
    )
    return "\n".join(files[:200]) or "The workspace folder is empty."


def read_file(path: str) -> str:
    root = WORKSPACE.resolve()
    target = (WORKSPACE / path).resolve()
    # block anything that escapes the workspace (../, absolute paths, symlinks)
    if not target.is_relative_to(root):
        return "Access denied: that path is outside the workspace folder."
    if not target.is_file():
        return f"File not found: {path}"
    try:
        text = target.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return "This file is not plain text."
    if len(text) > MAX_READ_CHARS:
        text = text[:MAX_READ_CHARS] + "\n...[truncated]"
    return text


TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for current information, news or facts you do not know.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query"}
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": "List the files in the user's workspace folder.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read a text file from the user's workspace folder.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "File name or relative path, as shown by list_files",
                    }
                },
                "required": ["path"],
            },
        },
    },
]

_FUNCS = {"web_search": web_search, "list_files": list_files, "read_file": read_file}


def run_tool(name: str, args: dict) -> str:
    func = _FUNCS.get(name)
    if func is None:
        return f"Unknown tool: {name}"
    try:
        return func(**args)
    except TypeError:
        return "Bad arguments for this tool."
    except Exception as e:
        return f"Tool error: {e}"
