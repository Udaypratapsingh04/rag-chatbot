/**
 * Tiny fetch wrapper. Every failure becomes an ApiError with a message that is
 * safe to show to the user, so the UI never has to say "Unexpected end of JSON input".
 */
export class ApiError extends Error {
  constructor(message, { code, detail, status } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.detail = detail
    this.status = status
  }
}

const OFFLINE_MESSAGE =
  "Can't reach the backend. Open a terminal in the backend folder and run: python app.py"

export async function api(path, { method = 'GET', json, body, signal } = {}) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: json ? { 'Content-Type': 'application/json' } : undefined,
      body: json ? JSON.stringify(json) : body,
      signal,
    })
  } catch {
    throw new ApiError(OFFLINE_MESSAGE, { code: 'offline' })
  }

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    // The body wasn't JSON (for example an HTML error page from a proxy).
  }

  if (!res.ok) {
    if (!data) {
      // The Vite dev proxy answers with an empty 500 when nothing is listening on port 5000.
      const backendDown = [500, 502, 503, 504].includes(res.status) && !text.trim()
      throw new ApiError(backendDown ? OFFLINE_MESSAGE : `The server returned an error (${res.status}).`, {
        code: backendDown ? 'offline' : 'server_error',
        status: res.status,
        detail: text.slice(0, 300),
      })
    }
    throw new ApiError(data.error || `Request failed (${res.status}).`, {
      code: data.code,
      detail: data.detail,
      status: res.status,
    })
  }
  return data
}
