from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import requests

load_dotenv()

API_KEY = os.getenv("API_KEY")

app = FastAPI()

class PromptRequest(BaseModel):
    prompt: str

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "ok"}

# Models list endpoint
@app.get("/models")
def list_models():
    ollama_url = "http://localhost:11434/api/tags"
    try:
        response = requests.get(ollama_url)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch models from Ollama")
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))

# Generate text endpoint
@app.post("/generate")
def generate(request: PromptRequest, x_api_key: str = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    ollama_url = "http://localhost:11434/api/generate"
    response = requests.post(ollama_url, json={
        "model": "llama3",
        "prompt": request.prompt,
        "stream": False
    })

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Ollama model error")

    output = response.json()
    return {"response": output.get("response", "")}
