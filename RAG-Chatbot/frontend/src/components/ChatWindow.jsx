import { useRef, useEffect, useState, useCallback } from 'react'
import { ArrowUp, Menu, KeyRound, WifiOff, RefreshCw } from 'lucide-react'
import ChatMessage from './ChatMessage'

const SUGGESTIONS = [
  'Summarize the main points',
  'What decisions or deadlines are mentioned?',
  'List any action items and who owns them',
]

export default function ChatWindow({
  messages,
  isLoading,
  settings,
  documentCount,
  backendError,
  needsReindex,
  onSendMessage,
  onOpenSettings,
  onOpenSidebar,
  onRetryConnection,
}) {
  const [value, setValue] = useState('')
  const endRef = useRef(null)
  const textareaRef = useRef(null)
  const provider = settings?.providers?.[settings.provider]
  const canChat = !backendError && settings?.ready && documentCount > 0 && !needsReindex

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading])

  const submit = useCallback(
    (text) => {
      const trimmed = (text ?? value).trim()
      if (!trimmed || isLoading) return
      onSendMessage(trimmed)
      setValue('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    },
    [value, isLoading, onSendMessage],
  )

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  const handleChange = (e) => {
    setValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  const placeholder = backendError
    ? 'Waiting for the backend…'
    : !settings?.ready
      ? 'Add an API key in Settings to start'
      : documentCount === 0
        ? 'Add a document first, then ask about it'
        : 'Ask something about your documents'

  return (
    <main className="chat">
      <header className="chat-header">
        <button type="button" className="icon-btn menu-btn" onClick={onOpenSidebar} aria-label="Open library">
          <Menu size={20} />
        </button>
        <div className="chat-title">
          <h2>Ask your documents</h2>
          <p>
            {documentCount === 0
              ? 'No documents yet'
              : `${documentCount} document${documentCount === 1 ? '' : 's'} searchable`}
            {provider?.has_key ? `, answered by ${provider.label}` : ''}
          </p>
        </div>
      </header>

      <div className="messages" role="log" aria-live="polite">
        <div className="messages-inner">
          {backendError && (
            <div className="banner banner-warn" role="alert">
              <WifiOff size={18} aria-hidden="true" />
              <div>
                <p className="banner-title">Backend not reachable</p>
                <p>{backendError}</p>
                <button type="button" className="btn btn-small" onClick={onRetryConnection}>
                  <RefreshCw size={14} aria-hidden="true" /> Try again
                </button>
              </div>
            </div>
          )}

          {!backendError && settings && !settings.ready && (
            <div className="banner" role="status">
              <KeyRound size={18} aria-hidden="true" />
              <div>
                <p className="banner-title">Add your API key to get started</p>
                <p>
                  Paste a Google Gemini or OpenAI key in Settings. It stays on this computer and is only sent to the provider you choose.
                </p>
                <button type="button" className="btn btn-small btn-primary" onClick={onOpenSettings}>
                  Open settings
                </button>
              </div>
            </div>
          )}

          {messages.length === 0 && !backendError && (
            <div className="welcome">
              <h3>
                {documentCount > 0
                  ? 'What would you like to know?'
                  : 'Bring a document, then ask it anything'}
              </h3>
              <p>
                {documentCount > 0
                  ? 'Answers come from your files, with the file and page named underneath.'
                  : 'Add a PDF, Word file or text file from the library on the left. Once it is indexed you can ask questions here.'}
              </p>
              {canChat && (
                <div className="suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" className="suggestion" onClick={() => submit(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} onOpenSettings={onOpenSettings} />
          ))}

          {isLoading && (
            <div className="turn turn-assistant" aria-label="Thinking">
              <div className="typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="composer-wrap">
        <div className="composer">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            aria-label="Your question"
            disabled={isLoading}
          />
          <button
            type="button"
            className="send-btn"
            onClick={() => submit()}
            disabled={!value.trim() || isLoading}
            aria-label="Send"
          >
            <ArrowUp size={18} />
          </button>
        </div>
        <p className="composer-hint">Enter sends, Shift+Enter adds a new line.</p>
      </div>
    </main>
  )
}
