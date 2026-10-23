import ReactMarkdown from 'react-markdown'
import { AlertTriangle } from 'lucide-react'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function pageLabel(pages) {
  if (!pages || pages.length === 0) return ''
  return pages.length === 1 ? `, p. ${pages[0]}` : `, pp. ${pages.join(', ')}`
}

export default function ChatMessage({ message, onOpenSettings }) {
  const { role, content, sources, timestamp, isError, errorCode, detail } = message

  if (role === 'user') {
    return (
      <div className="turn turn-user">
        <div className="bubble-user">{content}</div>
        {timestamp && <span className="stamp">{formatTime(timestamp)}</span>}
      </div>
    )
  }

  if (isError) {
    const needsSettings = ['no_key', 'auth', 'billing', 'model'].includes(errorCode)
    return (
      <div className="turn turn-assistant">
        <div className="answer answer-error" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          <div>
            <p>{content}</p>
            {needsSettings && (
              <button type="button" className="btn btn-small" onClick={onOpenSettings}>
                Open settings
              </button>
            )}
            {detail && (
              <details className="upload-detail">
                <summary>Technical details</summary>
                <pre>{detail}</pre>
              </details>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="turn turn-assistant">
      <div className="answer">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
      {sources && sources.length > 0 && (
        <ul className="sources" aria-label="Sources">
          {sources.map((src) => (
            <li key={src.filename} className="source-chip">
              {src.filename}
              {pageLabel(src.pages)}
            </li>
          ))}
        </ul>
      )}
      {timestamp && <span className="stamp">{formatTime(timestamp)}</span>}
    </div>
  )
}
