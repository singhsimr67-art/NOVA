import ast
import ipaddress
import json
import math
import operator
import socket
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse
from zoneinfo import ZoneInfo

import httpx
from bs4 import BeautifulSoup
from ddgs import DDGS

WORKSPACE = Path(__file__).parent / "workspace"
WORKSPACE.mkdir(exist_ok=True)
NOTES_FILE = Path(__file__).parent / "notes.json"

MAX_READ_CHARS = 8000
MAX_FETCH_BYTES = 1_000_000
MAX_PAGE_CHARS = 6000

# Tools in this set make Nova ask for your approval before running.
REQUIRES_APPROVAL = {"read_file", "fetch_url", "delete_note"}


# ---------------------------------------------------------------- web search
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


# --------------------------------------------------------------------- files
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


# ---------------------------------------------------------------- calculator
_BIN_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}
_UNARY_OPS = {ast.UAdd: operator.pos, ast.USub: operator.neg}
_MATH_FUNCS = {
    "sqrt": math.sqrt, "sin": math.sin, "cos": math.cos, "tan": math.tan,
    "log": math.log, "log10": math.log10, "abs": abs, "round": round,
    "floor": math.floor, "ceil": math.ceil,
}
_CONSTS = {"pi": math.pi, "e": math.e}


def _eval(node):
    if isinstance(node, ast.Expression):
        return _eval(node.body)
    if (
        isinstance(node, ast.Constant)
        and isinstance(node.value, (int, float))
        and not isinstance(node.value, bool)
    ):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in _BIN_OPS:
        left, right = _eval(node.left), _eval(node.right)
        if isinstance(node.op, ast.Pow) and (abs(right) > 100 or abs(left) > 1e12):
            raise ValueError("power too large")
        return _BIN_OPS[type(node.op)](left, right)
    if isinstance(node, ast.UnaryOp) and type(node.op) in _UNARY_OPS:
        return _UNARY_OPS[type(node.op)](_eval(node.operand))
    if isinstance(node, ast.Name) and node.id in _CONSTS:
        return _CONSTS[node.id]
    if (
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id in _MATH_FUNCS
        and not node.keywords
    ):
        return _MATH_FUNCS[node.func.id](*[_eval(a) for a in node.args])
    raise ValueError("unsupported expression")


def calculate(expression: str) -> str:
    expression = expression.strip()
    if not expression or len(expression) > 200:
        return "Please give a short arithmetic expression."
    try:
        result = _eval(ast.parse(expression, mode="eval"))
    except ZeroDivisionError:
        return "Cannot divide by zero."
    except (ValueError, SyntaxError, OverflowError, TypeError) as e:
        return f"Could not calculate that: {e}"
    if isinstance(result, float):
        result = f"{result:.10g}"
    return f"{expression} = {result}"


# ------------------------------------------------------------------ date/time
def get_datetime(timezone: str = "") -> str:
    try:
        if timezone:
            now = datetime.now(ZoneInfo(timezone))
        else:
            now = datetime.now().astimezone()
    except Exception:
        return f"Unknown timezone: {timezone}. Use a name like 'Asia/Kolkata' or 'Europe/Berlin'."
    return now.strftime("%A, %d %B %Y, %H:%M:%S %Z (UTC%z)")


# --------------------------------------------------------------------- notes
def _load_notes() -> list[dict]:
    try:
        with open(NOTES_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _save_notes(notes: list[dict]) -> None:
    tmp = NOTES_FILE.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(notes, f, indent=2, ensure_ascii=False)
    tmp.replace(NOTES_FILE)


def save_note(text: str) -> str:
    text = text.strip()
    if not text:
        return "Nothing to save."
    notes = _load_notes()
    note_id = max((n["id"] for n in notes), default=0) + 1
    notes.append({
        "id": note_id,
        "text": text[:1000],
        "created": datetime.now().strftime("%Y-%m-%d %H:%M"),
    })
    _save_notes(notes)
    return f"Saved note #{note_id}."


def recall_notes(query: str = "") -> str:
    notes = _load_notes()
    words = query.lower().split()
    if words:
        notes = [n for n in notes if any(w in n["text"].lower() for w in words)]
    if not notes:
        return "No matching notes." if words else "No notes saved yet."
    return "\n".join(f"#{n['id']} ({n['created']}): {n['text']}" for n in notes[-30:])


def delete_note(note_id: int) -> str:
    try:
        note_id = int(note_id)
    except (TypeError, ValueError):
        return "Invalid note id."
    notes = _load_notes()
    kept = [n for n in notes if n["id"] != note_id]
    if len(kept) == len(notes):
        return f"No note with id {note_id}."
    _save_notes(kept)
    return f"Deleted note #{note_id}."


# ------------------------------------------------------------------- weather
_WEATHER_CODES = {
    0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
    45: "fog", 48: "freezing fog",
    51: "light drizzle", 53: "drizzle", 55: "heavy drizzle",
    61: "light rain", 63: "rain", 65: "heavy rain",
    71: "light snow", 73: "snow", 75: "heavy snow",
    80: "light showers", 81: "showers", 82: "violent showers",
    95: "thunderstorm", 96: "thunderstorm with hail", 99: "severe thunderstorm with hail",
}


def get_weather(city: str) -> str:
    try:
        geo = httpx.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": city, "count": 1},
            timeout=10,
        )
        geo.raise_for_status()
        places = geo.json().get("results")
        if not places:
            return f"Could not find a place called {city}."
        p = places[0]
        resp = httpx.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": p["latitude"],
                "longitude": p["longitude"],
                "current": "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
                "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
                "timezone": "auto",
                "forecast_days": 3,
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        return f"Weather lookup failed: {e}"

    cur, daily = data["current"], data["daily"]
    place = ", ".join(x for x in (p.get("name"), p.get("admin1"), p.get("country")) if x)
    lines = [
        f"Weather for {place}:",
        f"Now: {cur['temperature_2m']}°C (feels like {cur['apparent_temperature']}°C), "
        f"{_WEATHER_CODES.get(cur['weather_code'], 'unknown conditions')}, "
        f"humidity {cur['relative_humidity_2m']}%, wind {cur['wind_speed_10m']} km/h",
        "Forecast:",
    ]
    for i, day in enumerate(daily["time"]):
        lines.append(
            f"- {day}: {daily['temperature_2m_min'][i]}°C to {daily['temperature_2m_max'][i]}°C, "
            f"{_WEATHER_CODES.get(daily['weather_code'][i], 'unknown')}, "
            f"rain chance {daily['precipitation_probability_max'][i]}%"
        )
    return "\n".join(lines)


# ------------------------------------------------------------- read web page
def _check_public(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise ValueError("only http and https URLs are allowed")
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    for info in socket.getaddrinfo(parsed.hostname, port):
        if not ipaddress.ip_address(info[4][0]).is_global:
            raise ValueError("that address is not a public website")


def fetch_url(url: str) -> str:
    try:
        current = url
        is_html = True
        data = b""
        encoding = "utf-8"
        with httpx.Client(
            timeout=10, follow_redirects=False, headers={"User-Agent": "Nova/1.0"}
        ) as client:
            for _ in range(4):
                _check_public(current)  # re-checked on every redirect hop
                with client.stream("GET", current) as r:
                    if r.is_redirect:
                        current = urljoin(current, r.headers.get("location", ""))
                        continue
                    r.raise_for_status()
                    ctype = r.headers.get("content-type", "")
                    if "html" not in ctype and "text/plain" not in ctype:
                        return f"Cannot read this content type: {ctype or 'unknown'}"
                    is_html = "html" in ctype
                    encoding = r.encoding or "utf-8"
                    for chunk in r.iter_bytes():
                        data += chunk
                        if len(data) > MAX_FETCH_BYTES:
                            break
                    break
            else:
                return "Too many redirects."
    except Exception as e:
        return f"Could not open that page: {e}"

    text = data.decode(encoding, errors="replace")
    title = ""
    if is_html:
        soup = BeautifulSoup(text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
            tag.decompose()
        title = soup.title.get_text(strip=True) if soup.title else ""
        text = soup.get_text("\n", strip=True)
    if len(text) > MAX_PAGE_CHARS:
        text = text[:MAX_PAGE_CHARS] + "\n...[truncated]"
    return (f"Title: {title}\n\n" if title else "") + text


# ------------------------------------------------------------------- schemas
def _tool(name, description, properties=None, required=None):
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": {
                "type": "object",
                "properties": properties or {},
                "required": required or [],
            },
        },
    }


TOOL_SCHEMAS = [
    _tool("web_search",
          "Search the web for current information, news or facts you do not know.",
          {"query": {"type": "string", "description": "The search query"}}, ["query"]),
    _tool("fetch_url",
          "Open one specific web page and read its text. Use when the user gives a URL.",
          {"url": {"type": "string", "description": "Full URL starting with http:// or https://"}}, ["url"]),
    _tool("get_weather",
          "Get the current weather and a 3-day forecast for a city.",
          {"city": {"type": "string", "description": "City name, e.g. Berlin"}}, ["city"]),
    _tool("calculate",
          "Evaluate an arithmetic expression exactly. Always use this for math.",
          {"expression": {"type": "string", "description": "e.g. 15/100*2480 + sqrt(144)"}}, ["expression"]),
    _tool("get_datetime",
          "Get the current date and time, optionally in a given timezone.",
          {"timezone": {"type": "string", "description": "Optional IANA name like Europe/Berlin"}}),
    _tool("save_note",
          "Save a note the user wants remembered across conversations.",
          {"text": {"type": "string", "description": "The note to save"}}, ["text"]),
    _tool("recall_notes",
          "Look up the user's saved notes. Leave query empty to list recent notes.",
          {"query": {"type": "string", "description": "Optional keywords to search for"}}),
    _tool("delete_note",
          "Delete one saved note by its number.",
          {"note_id": {"type": "integer", "description": "The note number, as shown by recall_notes"}}, ["note_id"]),
    _tool("list_files", "List the files in the user's workspace folder."),
    _tool("read_file",
          "Read a text file from the user's workspace folder.",
          {"path": {"type": "string", "description": "File name or relative path, as shown by list_files"}}, ["path"]),
]

_FUNCS = {
    "web_search": web_search,
    "fetch_url": fetch_url,
    "get_weather": get_weather,
    "calculate": calculate,
    "get_datetime": get_datetime,
    "save_note": save_note,
    "recall_notes": recall_notes,
    "delete_note": delete_note,
    "list_files": list_files,
    "read_file": read_file,
}


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
