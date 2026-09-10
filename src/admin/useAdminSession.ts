import { useEffect, useState } from 'react'
import { AdminSession } from '../lib/types'
import { getBackend } from '../lib/backend'

export function useAdminSession() {
  const backend = getBackend()
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined)

  useEffect(() => {
    let active = true
    backend
      .getSession()
      .then((s) => {
        if (active) setSession(s)
      })
      .catch(() => {
        // Mobile private-mode / storage-restricted browsers: treat as signed
        // out instead of hanging the guard.
        if (active) setSession(null)
      })
    const un = backend.onAuthChange((s) => {
      if (active) setSession(s)
    })
    return () => {
      active = false
      un()
    }
  }, [backend])

  return { backend, session, ready: session !== undefined }
}
