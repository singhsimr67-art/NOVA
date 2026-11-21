import ollama
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from storage import load, save  # NEW

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
        sessions[session_id] = load(session_id)  # NEW: load from disk
    return sessions[session_id]


def trim(history: list[dict]) -> None:
    if len(history) > MAX_MESSAGES + 1:
        history[:] = [history[0]] + history[-MAX_MESSAGES:]


@app.post("/chat")
def chat(req: ChatRequest):
    try:
        history = get_history(req.session_id)
    except ValueError:  # NEW: bad session id
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
        save(req.session_id, history)  # NEW: persist after every reply

    return StreamingResponse(generate(), media_type="text/plain")


@app.post("/reset/{session_id}")
def reset(session_id: str):
    # only clears the in-memory copy; the saved file stays on disk
    sessions.pop(session_id, None)
    return {"ok": True}
