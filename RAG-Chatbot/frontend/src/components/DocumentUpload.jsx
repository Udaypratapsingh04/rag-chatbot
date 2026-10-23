import { useState, useRef, useCallback } from 'react'
import { Upload, Loader2, X } from 'lucide-react'

const ACCEPTED_EXTS = ['.pdf', '.txt', '.docx']

/**
 * Drop zone + file picker. Files start indexing as soon as they're chosen
 * (several at once is fine); failures stay on screen with the reason until dismissed.
 */
export default function DocumentUpload({ onUpload }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [items, setItems] = useState([]) // { id, name, status: 'indexing' | 'error', error, detail }
  const inputRef = useRef(null)
  const counter = useRef(0)

  const patch = (id, changes) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)))

  const processFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || [])
      for (const file of files) {
        const id = ++counter.current
        const ext = '.' + file.name.split('.').pop().toLowerCase()
        if (!ACCEPTED_EXTS.includes(ext)) {
          setItems((prev) => [
            ...prev,
            { id, name: file.name, status: 'error', error: 'Only PDF, TXT and DOCX files are supported.' },
          ])
          continue
        }
        setItems((prev) => [...prev, { id, name: file.name, status: 'indexing' }])
        try {
          await onUpload(file)
          setItems((prev) => prev.filter((it) => it.id !== id))
        } catch (err) {
          patch(id, { status: 'error', error: err.message, detail: err.detail })
        }
      }
    },
    [onUpload],
  )

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    processFiles(e.dataTransfer.files)
  }

  const handleInputChange = (e) => {
    processFiles(e.target.files)
    e.target.value = '' // allow choosing the same file again
  }

  return (
    <section aria-label="Add documents">
      <div
        className={`dropzone ${isDragOver ? 'is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <button type="button" className="dropzone-btn" onClick={() => inputRef.current?.click()}>
          <Upload size={18} aria-hidden="true" />
          <span className="dropzone-title">Add documents</span>
          <span className="dropzone-hint">Drop files here or browse. PDF, TXT or DOCX, up to 25 MB.</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          multiple
          hidden
          onChange={handleInputChange}
        />
      </div>

      {items.length > 0 && (
        <ul className="upload-queue" aria-live="polite">
          {items.map((it) => (
            <li key={it.id} className={`upload-item ${it.status}`}>
              <div className="upload-item-row">
                {it.status === 'indexing' ? (
                  <Loader2 size={15} className="spin" aria-hidden="true" />
                ) : null}
                <span className="upload-item-name" title={it.name}>
                  {it.status === 'indexing' ? `Indexing ${it.name}` : it.name}
                </span>
                {it.status === 'error' && (
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Dismiss error for ${it.name}`}
                    onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {it.status === 'indexing' && <div className="progress" role="progressbar" aria-label="Indexing" />}
              {it.status === 'error' && (
                <>
                  <p className="upload-error">{it.error}</p>
                  {it.detail && (
                    <details className="upload-detail">
                      <summary>Technical details</summary>
                      <pre>{it.detail}</pre>
                    </details>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
