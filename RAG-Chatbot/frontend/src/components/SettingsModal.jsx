import { useState, useEffect, useRef } from 'react'
import { X, Eye, EyeOff, Loader2, Check, AlertTriangle, ExternalLink } from 'lucide-react'

const KEY_LINKS = {
  gemini: { href: 'https://aistudio.google.com/apikey', text: 'Get a Gemini key in Google AI Studio' },
  openai: { href: 'https://platform.openai.com/api-keys', text: 'Get an OpenAI key on the OpenAI platform' },
}

const KEY_PLACEHOLDER = { gemini: 'Paste your Gemini API key', openai: 'sk-…' }

export default function SettingsModal({ settings, onClose, onSave, onTest }) {
  const [provider, setProvider] = useState(settings.provider)
  const [keys, setKeys] = useState({ gemini: '', openai: '' })
  const [models, setModels] = useState(() => ({
    gemini: { chat: settings.providers.gemini.chat_model, embedding: settings.providers.gemini.embedding_model },
    openai: { chat: settings.providers.openai.chat_model, embedding: settings.providers.openai.embedding_model },
  }))
  const [showKey, setShowKey] = useState(false)
  const [busy, setBusy] = useState(null) // 'save' | 'test' | null
  const [status, setStatus] = useState(null) // { type: 'ok' | 'error', text, detail }
  const firstField = useRef(null)

  const info = settings.providers[provider]

  useEffect(() => {
    firstField.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const buildPayload = () => ({
    provider,
    api_keys: keys[provider].trim() ? { [provider]: keys[provider].trim() } : {},
    models,
  })

  const save = async (thenTest) => {
    setBusy(thenTest ? 'test' : 'save')
    setStatus(null)
    try {
      await onSave(buildPayload())
      setKeys((k) => ({ ...k, [provider]: '' }))
      if (!thenTest) {
        setStatus({ type: 'ok', text: 'Settings saved.' })
        return
      }
      const result = await onTest()
      setStatus({
        type: 'ok',
        text: `Connected. Answers will use ${result.chat_model}; search uses ${result.embedding_model}.`,
      })
    } catch (err) {
      setStatus({ type: 'error', text: err.message, detail: err.detail })
    } finally {
      setBusy(null)
    }
  }

  const removeKey = async () => {
    setBusy('save')
    setStatus(null)
    try {
      await onSave({ remove_keys: [provider] })
      setStatus({ type: 'ok', text: 'Saved key removed.' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(null)
    }
  }

  const setModel = (kind, value) =>
    setModels((m) => ({ ...m, [provider]: { ...m[provider], [kind]: value } }))

  const keyState = info.has_key
    ? info.key_source === 'env'
      ? `A key ending ${info.key_hint.slice(-4)} was found in backend/.env. Paste a new one below to override it.`
      : `A key ending ${info.key_hint.slice(-4)} is saved. Paste a new one below to replace it.`
    : 'No key saved yet.'

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header className="modal-header">
          <h2 id="settings-title">Settings</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </header>

        <div className="modal-body">
          <fieldset className="field">
            <legend>AI provider</legend>
            <div className="segmented" role="radiogroup" aria-label="AI provider">
              {Object.entries(settings.providers).map(([id, p]) => (
                <label key={id} className={`segment ${provider === id ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="provider"
                    value={id}
                    checked={provider === id}
                    onChange={() => {
                      setProvider(id)
                      setStatus(null)
                    }}
                  />
                  {p.label}
                  {p.has_key && <Check size={14} aria-label="key saved" />}
                </label>
              ))}
            </div>
            {provider !== settings.provider && (
              <p className="field-note">
                Documents you already indexed will need a quick re-index after switching, because each provider uses its own embeddings.
              </p>
            )}
          </fieldset>

          <div className="field">
            <label htmlFor="api-key">{info.label} API key</label>
            <div className="key-input">
              <input
                id="api-key"
                ref={firstField}
                type={showKey ? 'text' : 'password'}
                value={keys[provider]}
                onChange={(e) => setKeys((k) => ({ ...k, [provider]: e.target.value }))}
                placeholder={KEY_PLACEHOLDER[provider]}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <p className="field-note">{keyState}</p>
            <p className="field-note">
              <a href={KEY_LINKS[provider].href} target="_blank" rel="noreferrer">
                {KEY_LINKS[provider].text} <ExternalLink size={12} aria-hidden="true" />
              </a>
            </p>
            <p className="field-note">
              The key is stored in <code>backend/settings.json</code> on this computer and sent only to {info.label}. You can also set it in <code>backend/.env</code>.
            </p>
          </div>

          <details className="advanced">
            <summary>Choose models yourself</summary>
            <p className="field-note">
              Leave these empty and the app picks a working model automatically. Fill them in to pin an exact model name.
            </p>
            <div className="field">
              <label htmlFor="chat-model">Chat model</label>
              <input
                id="chat-model"
                type="text"
                value={models[provider].chat}
                onChange={(e) => setModel('chat', e.target.value)}
                placeholder={`Automatic: ${info.default_chat_models[0]}`}
                spellCheck={false}
              />
            </div>
            <div className="field">
              <label htmlFor="embedding-model">Embedding model</label>
              <input
                id="embedding-model"
                type="text"
                value={models[provider].embedding}
                onChange={(e) => setModel('embedding', e.target.value)}
                placeholder={`Automatic: ${info.default_embedding_models[0]}`}
                spellCheck={false}
              />
              <p className="field-note">Changing the embedding model means re-indexing your documents.</p>
            </div>
          </details>

          {status && (
            <div className={`status ${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>
              {status.type === 'ok' ? <Check size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}
              <div>
                <p>{status.text}</p>
                {status.detail && (
                  <details className="upload-detail">
                    <summary>Technical details</summary>
                    <pre>{status.detail}</pre>
                  </details>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="modal-footer">
          {info.has_key && info.key_source === 'settings' ? (
            <button type="button" className="link-btn danger" onClick={removeKey} disabled={!!busy}>
              Remove saved key
            </button>
          ) : (
            <span />
          )}
          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => save(false)} disabled={!!busy}>
              {busy === 'save' && <Loader2 size={15} className="spin" aria-hidden="true" />}
              Save
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => save(true)}
              disabled={!!busy || (!info.has_key && !keys[provider].trim())}
            >
              {busy === 'test' && <Loader2 size={15} className="spin" aria-hidden="true" />}
              Save and test
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
