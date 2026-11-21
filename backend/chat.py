import ollama
from prompts import SYSTEM_PROMPT

MODEL = "llama3.2:3b"

# Memory = this list. Every turn we send the whole thing back to the model.
messages = [{"role": "system", "content": SYSTEM_PROMPT}]


for chunk in ollama.chat(
    model="llama3.2:3b",
    messages=[{"role": "user", "content": "say hi"}],
    stream=True,
):
    print(chunk)