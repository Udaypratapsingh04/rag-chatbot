import { useState, useEffect, useCallback, useRef } from 'react'
import ChatWindow from './components/ChatWindow'
import Sidebar from './components/Sidebar'
import SettingsModal from './components/SettingsModal'
import { api } from './api'

const EMPTY_LIBRARY = {
  documents: [],
  needs_reindex: false,
  reindex_reason: null,
  unindexed_files: [],
  index_model: null,
}

export default function App() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [library, setLibrary] = useState(EMPTY_LIBRARY)
  const [settings, setSettings] = useState(null)
  const [backendError, setBackendError] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reindexing, setReindexing] = useState(false)
  const [libraryNotice, setLibraryNotice] = useState(null)
  const nextId = useRef(1)

  const refresh = useCallback(async () => {
    try {
      const [lib, cfg] = await Promise.all([api('/documents'), api('/settings')])
      setLibrary(lib)
      setSettings(cfg)
      setBackendError(null)
    } catch (err) {
      setBackendError(err.message)
    }
  }, [])

  useEffect(() => {
    refresh()
    // If the backend was started after the page, pick it up when the tab regains focus.
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [refresh])

  const addMessage = useCallback((message) => {
    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, timestamp: new Date().toISOString(), ...message },
    ])
  }, [])

  const handleSendMessage = useCallback(
    async (text) => {
      const content = text.trim()
      if (!content || isLoading) return

      // Failed turns are shown to the person but never replayed to the model.
      const history = messages
        .filter((m) => !m.isError)
        .map((m) => ({ role: m.role, content: m.content }))

      addMessage({ role: 'user', content })
      setIsLoading(true)
      try {
        const data = await api('/chat', {
          method: 'POST',
          json: { message: content, conversation_history: history },
        })
        addMessage({
          role: 'assistant',
          content: data.response,
          sources: data.sources || [],
        })
      } catch (err) {
        addMessage({
          role: 'assistant',
          content: err.message,
          isError: true,
          errorCode: err.code,
          detail: err.detail,
        })
        if (err.code === 'reindex_required') refresh()
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading, addMessage, refresh],
  )

  const handleUpload = useCallback(
    async (file) => {
      const form = new FormData()
      form.append('file', file)
      const data = await api('/upload', { method: 'POST', body: form })
      await refresh()
      return data
    },
    [refresh],
  )

  const handleRemove = useCallback(
    async (filename) => {
      try {
        await api(`/documents/${encodeURIComponent(filename)}`, { method: 'DELETE' })
        setLibraryNotice(null)
      } catch (err) {
        setLibraryNotice(err.message)
      }
      await refresh()
    },
    [refresh],
  )

  const handleClear = useCallback(async () => {
    try {
      await api('/documents', { method: 'DELETE' })
      setLibraryNotice(null)
    } catch (err) {
      setLibraryNotice(err.message)
    }
    await refresh()
  }, [refresh])

  const handleReindex = useCallback(async () => {
    setReindexing(true)
    setLibraryNotice(null)
    try {
      const data = await api('/reindex', { method: 'POST' })
      if (data.skipped?.length) {
        setLibraryNotice(
          `Skipped ${data.skipped.map((s) => s.filename).join(', ')}: no readable text.`,
        )
      }
    } catch (err) {
      setLibraryNotice(err.message)
      if (err.code === 'no_key' || err.code === 'auth') setSettingsOpen(true)
    } finally {
      setReindexing(false)
      await refresh()
    }
  }, [refresh])

  const handleSaveSettings = useCallback(async (payload) => {
    const cfg = await api('/settings', { method: 'POST', json: payload })
    setSettings(cfg)
    setLibrary(await api('/documents'))
    return cfg
  }, [])

  const handleTestSettings = useCallback(() => api('/settings/test', { method: 'POST' }), [])

  return (
    <div className="app">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        library={library}
        settings={settings}
        notice={libraryNotice}
        reindexing={reindexing}
        onUpload={handleUpload}
        onRemove={handleRemove}
        onClear={handleClear}
        onReindex={handleReindex}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        settings={settings}
        documentCount={library.documents.length}
        backendError={backendError}
        needsReindex={library.needs_reindex}
        onSendMessage={handleSendMessage}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSidebar={() => setSidebarOpen(true)}
        onRetryConnection={refresh}
      />
      {settingsOpen && settings && (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSaveSettings}
          onTest={handleTestSettings}
        />
      )}
    </div>
  )
}
