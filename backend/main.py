import json
import threading
import uuid

import ollama
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from storage import load, save, list_chats, delete
from tools import TOOL_SCHEMAS, REQUIRES_APPROVAL, run_tool

MODEL = "llama3.2:3b"
MAX_MESSAGES = 30
MAX_TOOL_ROUNDS = 4
APPROVAL_TIMEOUT = 120  # seconds to wait for Allow/Deny

app = FastAPI(title="Nova")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# in-memory cache; the files on disk are the source of truth
sessions: dict[str, list[dict]] = {}
# tool calls waiting for the user's Allow/Deny click
pending_approvals: dict[str, dict] = {}


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ApprovalRequest(BaseModel):
    allow: bool


def get_history(session_id: str) -> list[dict]:
    if session_id not in sessions:
        sessions[session_id] = load(session_id)
    return sessions[session_id]


def trim(history: list[dict]) -> None:
    if len(history) > MAX_MESSAGES + 1:
        tail = history[-MAX_MESSAGES:]
        # never start in the middle of a tool exchange
        while tail and tail[0]["role"] != "user":
            tail.pop(0)
        history[:] = [history[0]] + tail


def ev(kind: str, **data) -> str:
    """One event as a line of JSON."""
    return json.dumps({"t": kind, **data}, ensure_ascii=False) + "\n"


@app.post("/chat")
def chat(req: ChatRequest):
    try:
        history = get_history(req.session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid session id")

    history.append({"role": "user", "content": req.message})
    trim(history)

    def generate():
        user_idx = len(history) - 1  # index of the user message
        safe_len = len(history)      # history length at the last complete step
        pending = ""                 # reply text streamed but not yet stored
        failed = False
        stream = None
        try:
            for _ in range(MAX_TOOL_ROUNDS):
                content = ""
                tool_calls = []
                stream = ollama.chat(
                    model=MODEL,
                    messages=history,
                    tools=TOOL_SCHEMAS,
                    stream=True,
                    keep_alive="30m",
                    options={"temperature": 0.2},
                )
                for chunk in stream:
                    msg = chunk.message
                    if msg.content:
                        content += msg.content
                        pending = content
                        yield ev("token", v=msg.content)
                    if msg.tool_calls:
                        tool_calls.extend(msg.tool_calls)

                if not tool_calls:
                    if content:
                        history.append({"role": "assistant", "content": content})
                        safe_len = len(history)
                        pending = ""
                    else:
                        yield ev("error", v="Nova returned an empty reply.")
                    break

                history.append({
                    "role": "assistant",
                    "content": content,
                    "tool_calls": [
                        {"function": {
                            "name": tc.function.name,
                            "arguments": dict(tc.function.arguments or {}),
                        }}
                        for tc in tool_calls
                    ],
                })
                pending = ""

                for tc in tool_calls:
                    name = tc.function.name
                    args = dict(tc.function.arguments or {})
                    call_id = uuid.uuid4().hex[:8]

                    if name in REQUIRES_APPROVAL:
                        entry = {"event": threading.Event(), "allow": False}
                        pending_approvals[call_id] = entry
                        yield ev("tool", id=call_id, name=name, args=args, status="approval")
                        answered = entry["event"].wait(APPROVAL_TIMEOUT)
                        pending_approvals.pop(call_id, None)
                        if not (answered and entry["allow"]):
                            history.append({
                                "role": "tool",
                                "tool_name": name,
                                "content": "The user denied permission to use this tool.",
                            })
                            yield ev("tool_result", id=call_id, status="denied")
                            continue
                    else:
                        yield ev("tool", id=call_id, name=name, args=args, status="running")

                    result = run_tool(name, args)
                    history.append({"role": "tool", "tool_name": name, "content": result})
                    yield ev("tool_result", id=call_id, status="done")

                safe_len = len(history)
            else:
                yield ev("error", v="Stopped: too many tool steps in a row.")
        except Exception as e:
            failed = True
            yield ev("error", v=f"Error talking to the model: {e}")
        finally:
            # runs on success, on error, and when the browser disconnects (Stop)
            if stream is not None:
                stream.close()  # tells Ollama to stop generating
            del history[safe_len:]  # drop any half-finished tool exchange
            if pending and not failed:
                history.append({"role": "assistant", "content": pending})
            if len(history) == user_idx + 1 and history[-1]["role"] == "user":
                history.pop()  # nothing came back: forget the question
            else:
                save(req.session_id, history)

    return StreamingResponse(generate(), media_type="application/x-ndjson")


@app.post("/approve/{call_id}")
def approve(call_id: str, body: ApprovalRequest):
    entry = pending_approvals.get(call_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="no pending approval")
    entry["allow"] = body.allow
    entry["event"].set()
    return {"ok": True}


@app.get("/chats")
def get_chats():
    return list_chats()


@app.get("/chats/{session_id}")
def get_chat(session_id: str):
    try:
        history = get_history(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid session id")
    # the browser only needs visible messages
    return [
        {"role": m["role"], "content": m["content"]}
        for m in history
        if m["role"] in ("user", "assistant") and m.get("content")
    ]


@app.delete("/chats/{session_id}")
def delete_chat(session_id: str):
    try:
        delete(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid session id")
    sessions.pop(session_id, None)
    return {"ok": True}

@app.get("/health")
async def health():
    return "everything is fine"
    