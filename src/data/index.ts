import type { ClassKey, QuestionData } from '../types'
import raw from './questions.json'

export const questionData = raw as unknown as QuestionData

export function getClass(key: ClassKey) {
  return questionData.classes[key]
}

export function getChapterName(code: string): string {
  const chapter = code.split('.')[0]
  return questionData.chapters[chapter] ?? `第${chapter}章`
}
