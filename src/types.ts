export type ClassKey = 'A' | 'B' | 'C' | 'all'

export interface Question {
  id: string
  tag: string
  category: string
  type: 'single' | 'multi'
  correctCount: number
  question: string
  options: string[]
  answer: number[]
  figure?: string | null
}

export interface QuestionClass {
  name: string
  questions: Question[]
}

export interface QuestionData {
  generatedAt: string
  chapters: Record<string, string>
  classes: Record<ClassKey, QuestionClass>
}

export interface ExamRecord {
  id: string
  classKey: Exclude<ClassKey, 'all'>
  className: string
  score: number
  total: number
  passScore: number
  passed: boolean
  durationSec: number
  finishedAt: string
}

export interface ExamConfig {
  single: number
  multi: number
  minutes: number
  passScore: number
}
