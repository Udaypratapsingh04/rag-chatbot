import { useState } from 'react'
import { FileText, Trash2, Settings, RefreshCw, Loader2, X, AlertTriangle } from 'lucide-react'
import DocumentUpload from './DocumentUpload'

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function reindexCopy(library) {
  if (library.reindex_reason === 'model_changed') {
    return {
      text: `You switched models. These documents were indexed with ${library.index_model || 'another model'} and need re-indexing before you can chat.`,
      action: 'Re-index documents',
    }
  }
  const n = library.unindexed_files.length
  return {
    text: `${n} file${n === 1 ? ' is' : 's are'} in the uploads folder but not searchable yet.`,
    action: 'Index now',
  }
}

export default function Sidebar({
  open,
  onClose,
  library,
  settings,
  notice,
  reindexing,
  onUpload,
  onRemove,
  onClear,
  onReindex,
  onOpenSettings,
}) {
  const [confirming, setConfirming] = useState(null)
  const docs = library.documents
  const provider = settings?.providers?.[settings.provider]

  const handleClear = () => {
    if (window.confirm('Remove every document and clear the search index? This cannot be undone.')) {
      onClear()
    }
  }

  return (
    <>
      {open && <div className="scrim" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Document library">
        <header className="sidebar-header">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-mark-line" />
            </span>
            <h1>RAG Chatbot</h1>
          </div>
          <button type="button" className="icon-btn sidebar-close" onClick={onClose} aria-label="Close library">
            <X size={18} />
          </button>
        </header>

        <div className="sidebar-body">
          {library.needs_reindex && (
            <div className="callout" role="status">
              <AlertTriangle size={16} aria-hidden="true" />
              <div>
                <p>{reindexCopy(library).text}</p>
                <button type="button" className="btn btn-small" onClick={onReindex} disabled={reindexing}>
                  {reindexing ? <Loader2 size={14} className="spin" aria-hidden="true" /> : <RefreshCw size={14} aria-hidden="true" />}
                  {reindexing ? 'Re-indexing…' : reindexCopy(library).action}
                </button>
              </div>
            </div>
          )}

          <DocumentUpload onUpload={onUpload} />

          {notice && (
            <p className="inline-error" role="alert">
              {notice}
            </p>
          )}

          <section aria-label="Indexed documents">
            <div className="section-head">
              <h2>Library</h2>
              {docs.length > 0 && (
                <button type="button" className="link-btn" onClick={handleClear}>
                  Clear all
                </button>
              )}
            </div>

            {docs.length === 0 ? (
              <p className="empty">Nothing indexed yet. Add a file above and it will show up here.</p>
            ) : (
              <ul className="doc-list">
                {docs.map((doc) => (
                  <li key={doc.filename} className="doc-item">
                    <FileText size={18} className="doc-icon" aria-hidden="true" />
                    <div className="doc-info">
                      <p className="doc-name" title={doc.filename}>
                        {doc.filename}
                      </p>
                      <p className="doc-meta">
                        {doc.chunks} chunks{doc.size ? `, ${formatSize(doc.size)}` : ''}
                      </p>
                    </div>
                    {confirming === doc.filename ? (
                      <div className="doc-confirm">
                        <button
                          type="button"
                          className="btn btn-small btn-danger"
                          onClick={() => {
                            setConfirming(null)
                            onRemove(doc.filename)
                          }}
                        >
                          Remove
                        </button>
                        <button type="button" className="btn btn-small btn-quiet" onClick={() => setConfirming(null)}>
                          Keep
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="icon-btn doc-remove"
                        aria-label={`Remove ${doc.filename}`}
                        onClick={() => setConfirming(doc.filename)}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <footer className="sidebar-footer">
          <button type="button" className="settings-btn" onClick={onOpenSettings}>
            <Settings size={17} aria-hidden="true" />
            <span className="settings-btn-text">
              <span className="settings-btn-title">Settings</span>
              <span className="settings-btn-sub">
                {!settings
                  ? 'Connecting…'
                  : provider?.has_key
                    ? `${provider.label} connected`
                    : `Add your ${provider?.label || ''} API key`}
              </span>
            </span>
            {settings && (
              <span className={`status-dot ${provider?.has_key ? 'ok' : 'warn'}`} aria-hidden="true" />
            )}
          </button>
        </footer>
      </aside>
    </>
  )
}
