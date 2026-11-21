import ollama
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from storage import load, save, list_chats, delete

MODEL = "llama3.2:3b"
MAX_MESSAGES = 20

app = FastAPI(title="Nova")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# in-memory cache; the files on disk are the source of truth
sessions: dict[str, list[dict]] = {}


class ChatRequest(BaseModel):
    session_id: str
    message: str


def get_history(session_id: str) -> list[dict]:
    if session_id not in sessions:
        sessions[session_id] = load(session_id)
    return sessions[session_id]


def trim(history: list[dict]) -> None:
    if len(history) > MAX_MESSAGES + 1:
        history[:] = [history[0]] + history[-MAX_MESSAGES:]


@app.post("/chat")
def chat(req: ChatRequest):
    try:
        history = get_history(req.session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid session id")

    history.append({"role": "user", "content": req.message})
    trim(history)

    def generate():
        reply = ""
        try:
            for chunk in ollama.chat(
                model=MODEL, messages=history, stream=True, keep_alive="30m"
            ):
                piece = chunk["message"]["content"]
                reply += piece
                yield piece
        except Exception as e:
            history.pop()
            yield f"\n[Error talking to the model: {e}]"
            return
        history.append({"role": "assistant", "content": reply})
        save(req.session_id, history)

    return StreamingResponse(generate(), media_type="text/plain")


@app.get("/chats")
def get_chats():
    return list_chats()


@app.get("/chats/{session_id}")
def get_chat(session_id: str):
    try:
        history = get_history(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid session id")
    # the browser doesn't need the system prompt
    return [m for m in history if m["role"] != "system"]


@app.delete("/chats/{session_id}")
def delete_chat(session_id: str):
    try:
        delete(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid session id")
    sessions.pop(session_id, None)
    return {"ok": True}
