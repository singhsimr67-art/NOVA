import json
import re
from pathlib import Path

from prompts import SYSTEM_PROMPT

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

# custom chat names live here, as {session_id: title}
TITLES_FILE = Path(__file__).parent / "titles.json"

# session_id becomes part of a file path, so only allow letters, digits,
# dashes and underscores. This blocks tricks like "../../etc/passwd".
VALID_ID = re.compile(r"[A-Za-z0-9_-]{1,64}")


def _path(session_id: str) -> Path:
    if not VALID_ID.fullmatch(session_id):
        raise ValueError("invalid session id")
    return DATA_DIR / f"{session_id}.json"


def load(session_id: str) -> list[dict]:
    path = _path(session_id)
    if not path.exists():
        return [{"role": "system", "content": SYSTEM_PROMPT}]
    with open(path, encoding="utf-8") as f:
        history = json.load(f)
    # always use the current system prompt, even for older saved chats
    if history and history[0]["role"] == "system":
        history[0]["content"] = SYSTEM_PROMPT
    return history


def save(session_id: str, history: list[dict]) -> None:
    path = _path(session_id)
    tmp = path.with_suffix(".tmp")
    # write to a temp file first, then rename, so a crash mid-write
    # can't leave a half-written (corrupt) chat file
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)
    tmp.replace(path)


# ------------------------------------------------------------ custom titles
def _load_titles() -> dict:
    try:
        with open(TITLES_FILE, encoding="utf-8") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def _save_titles(titles: dict) -> None:
    tmp = TITLES_FILE.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(titles, f, indent=2, ensure_ascii=False)
    tmp.replace(TITLES_FILE)


def set_title(session_id: str, title: str) -> None:
    """Rename a chat. An empty title removes the custom name."""
    path = _path(session_id)  # validates the id
    if not path.exists():
        raise FileNotFoundError(session_id)
    title = " ".join(title.split())[:80]  # tidy whitespace, cap the length
    titles = _load_titles()
    if title:
        titles[session_id] = title
    else:
        titles.pop(session_id, None)
    _save_titles(titles)


# ------------------------------------------------------------ chat listing
def list_chats() -> list[dict]:
    """All saved chats, newest first, as {id, title}."""
    titles = _load_titles()
    chats = []
    for p in DATA_DIR.glob("*.json"):
        try:
            with open(p, encoding="utf-8") as f:
                history = json.load(f)
        except (json.JSONDecodeError, OSError):
            continue  # skip unreadable files
        first_user = next((m["content"] for m in history if m["role"] == "user"), None)
        if first_user is None:
            continue  # nothing said yet
        title = titles.get(p.stem)
        if not title:
            title = first_user.strip().replace("\n", " ")
            if len(title) > 40:
                title = title[:40] + "…"
        chats.append({"id": p.stem, "title": title, "mtime": p.stat().st_mtime})
    chats.sort(key=lambda c: c["mtime"], reverse=True)
    return [{"id": c["id"], "title": c["title"]} for c in chats]


def delete(session_id: str) -> None:
    _path(session_id).unlink(missing_ok=True)
    titles = _load_titles()
    if titles.pop(session_id, None) is not None:
        _save_titles(titles)
