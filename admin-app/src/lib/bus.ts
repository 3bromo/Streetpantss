type Listener = (table: string) => void

const listeners = new Set<Listener>()

export function emitChange(table: string) {
  listeners.forEach((l) => l(table))
}

export function onDataChange(cb: Listener): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
