import json
import re
from pathlib import Path

from prompts import SYSTEM_PROMPT

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

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
        return json.load(f)


def save(session_id: str, history: list[dict]) -> None:
    path = _path(session_id)
    tmp = path.with_suffix(".tmp")
    # write to a temp file first, then rename, so a crash mid-write
    # can't leave a half-written (corrupt) chat file
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)
    tmp.replace(path)


def list_chats() -> list[dict]:
    """All saved chats, newest first, as {id, title}."""
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
        title = first_user.strip().replace("\n", " ")
        if len(title) > 40:
            title = title[:40] + "…"
        chats.append({"id": p.stem, "title": title, "mtime": p.stat().st_mtime})
    chats.sort(key=lambda c: c["mtime"], reverse=True)
    return [{"id": c["id"], "title": c["title"]} for c in chats]


def delete(session_id: str) -> None:
    _path(session_id).unlink(missing_ok=True)
