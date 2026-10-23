# RAG Chatbot

Upload PDF, Word or text files and ask questions about them. Answers come from your documents, with the file and page named underneath.

Stack: Flask, LangChain, FAISS, React (Vite). Works with **Google Gemini** or **OpenAI**.

## Quick start

You need Python 3.10+ and Node 18+.

**1. Backend** (terminal 1)

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
python app.py
```

It runs on http://127.0.0.1:5000.

**2. Frontend** (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Where to put your API key

Either place works. If both exist, the one saved in the app wins.

1. **In the app (easiest):** click **Settings** at the bottom of the left panel, pick Gemini or OpenAI, paste the key, then press **Save and test**. It is stored in `backend/settings.json` on your computer.
2. **In a file:** copy `backend/.env.example` to `backend/.env` and set `GOOGLE_API_KEY=...` or `OPENAI_API_KEY=...`. Restart `python app.py` afterwards.

Get a key: [Gemini](https://aistudio.google.com/apikey) or [OpenAI](https://platform.openai.com/api-keys). Never commit `.env` or `settings.json` (both are in `.gitignore`).

## Models

The backend tries a short list of model names and uses the first one your key can access, so a retired model does not break the app. To pin a specific model, open **Settings > Choose models yourself** or set the `*_CHAT_MODEL` / `*_EMBEDDING_MODEL` variables in `.env`.

Switching provider (or embedding model) changes how documents are embedded, so the app asks you to **re-index**. It rebuilds from the files already stored in `backend/uploads/`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Can't reach the backend" | Start `python app.py` in `backend/` and keep it running. |
| "rejected the API key" | Re-paste the key in Settings and press Save and test. |
| "No selectable text found" | The PDF is a scan. Run OCR first (for example `ocrmypdf in.pdf out.pdf`). |
| "rate limit or quota reached" | Free tiers are limited. The app retries automatically; for big files wait a minute and try again. |
| "could not find the requested model" | A pinned model name is wrong or retired. Clear it in Settings to use automatic selection. |
| Banner says files are not searchable | Press **Index now** in the left panel. |

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET / POST | `/api/settings` | Read or save provider, keys (never returned in full) and models |
| POST | `/api/settings/test` | Check the key and report the models in use |
| POST | `/api/upload` | Upload and index one file (`multipart/form-data`, field `file`) |
| GET | `/api/documents` | List indexed documents and whether re-indexing is needed |
| DELETE | `/api/documents` | Remove everything |
| DELETE | `/api/documents/<filename>` | Remove one document |
| POST | `/api/reindex` | Rebuild the index from `backend/uploads/` |
| POST | `/api/chat` | `{message, conversation_history}` returns `{response, sources}` |
