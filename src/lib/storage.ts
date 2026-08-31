import type { ExamRecord } from '../types'

const DONE_KEY = 'radio-exam.done.v1'
const WRONG_KEY = 'radio-exam.wrong.v1'
const HISTORY_KEY = 'radio-exam.history.v1'

function readSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) return new Set(arr.filter((x) => typeof x === 'string'))
  } catch {
    // ignore corrupted data
  }
  return new Set()
}

function writeSet(key: string, set: Set<string>): void {
  localStorage.setItem(key, JSON.stringify([...set]))
}

function createSetStore(key: string) {
  const cache = readSet(key)
  return {
    has: (id: string) => cache.has(id),
    add: (id: string) => {
      if (cache.has(id)) return
      cache.add(id)
      writeSet(key, cache)
    },
    remove: (id: string) => {
      if (!cache.has(id)) return
      cache.delete(id)
      writeSet(key, cache)
    },
    values: () => [...cache],
    get size() {
      return cache.size
    },
    clear: () => {
      cache.clear()
      writeSet(key, cache)
    },
  }
}

export const doneStore = createSetStore(DONE_KEY)
export const wrongStore = createSetStore(WRONG_KEY)

export function recordAnswer(id: string, isCorrect: boolean): void {
  doneStore.add(id)
  if (!isCorrect) wrongStore.add(id)
}

export function loadHistory(): ExamRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) return arr
  } catch {
    // ignore corrupted data
  }
  return []
}

export function saveHistory(record: ExamRecord): ExamRecord[] {
  const history = [record, ...loadHistory()].slice(0, 50)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  return history
}
