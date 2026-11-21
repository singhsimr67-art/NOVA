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
