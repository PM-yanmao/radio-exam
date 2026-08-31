import type { ClassKey, Question, QuestionMeta } from '../types'
import meta from './meta.json'

export const questionMeta = meta as unknown as QuestionMeta

export function getClassMeta(key: ClassKey) {
  return questionMeta.classes[key]
}

export function getChapterName(code: string): string {
  const chapter = code.split('.')[0]
  return questionMeta.chapters[chapter] ?? `第${chapter}章`
}

const BANK_LOADERS: Record<ClassKey, () => Promise<Question[]>> = {
  A: async () => (await import('./banks/A.json')).default as unknown as Question[],
  B: async () => (await import('./banks/B.json')).default as unknown as Question[],
  C: async () => (await import('./banks/C.json')).default as unknown as Question[],
  all: async () => (await import('./banks/all.json')).default as unknown as Question[],
}

export function loadBank(key: ClassKey): Promise<Question[]> {
  return BANK_LOADERS[key]()
}
