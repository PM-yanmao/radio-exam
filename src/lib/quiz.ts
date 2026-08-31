import type { ClassKey, ExamConfig, Question } from '../types'

export const EXAM_CONFIGS: Record<Exclude<ClassKey, 'all'>, ExamConfig> = {
  A: { single: 32, multi: 8, minutes: 40, passScore: 30 },
  B: { single: 45, multi: 15, minutes: 60, passScore: 45 },
  C: { single: 70, multi: 20, minutes: 90, passScore: 70 },
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function sampleExam(questions: Question[], config: ExamConfig): Question[] {
  const singles = shuffle(questions.filter((q) => q.type === 'single')).slice(0, config.single)
  const multis = shuffle(questions.filter((q) => q.type === 'multi')).slice(0, config.multi)
  if (singles.length < config.single || multis.length < config.multi) {
    throw new Error('题库数量不足，无法按规则组卷')
  }
  return shuffle([...singles, ...multis])
}

export function isAnswerCorrect(selected: number[], answer: number[]): boolean {
  if (selected.length !== answer.length) return false
  const a = [...selected].sort((x, y) => x - y)
  const b = [...answer].sort((x, y) => x - y)
  return a.every((v, i) => v === b[i])
}

export interface CategoryGroup {
  category: string
  chapter: string
  questions: Question[]
  done: number
}

export interface ChapterGroup {
  chapter: string
  name: string
  items: CategoryGroup[]
}

export function groupByCategory(
  questions: Question[],
  chapters: Record<string, string>,
  isDone: (id: string) => boolean,
): ChapterGroup[] {
  const map = new Map<string, Question[]>()
  for (const q of questions) {
    const list = map.get(q.category) ?? []
    list.push(q)
    map.set(q.category, list)
  }
  const chapterMap = new Map<string, CategoryGroup[]>()
  for (const [category, list] of map) {
    const chapter = category.split('.')[0]
    const arr = chapterMap.get(chapter) ?? []
    arr.push({
      category,
      chapter,
      questions: list,
      done: list.filter((q) => isDone(q.id)).length,
    })
    chapterMap.set(chapter, arr)
  }
  return [...chapterMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
    .map(([chapter, items]) => ({
      chapter,
      name: chapters[chapter] ?? `第${chapter}章`,
      items: items.sort((a, b) => a.category.localeCompare(b.category, undefined, { numeric: true })),
    }))
}

export function classProgress(questions: Question[], isDone: (id: string) => boolean) {
  const done = questions.filter((q) => isDone(q.id)).length
  return { done, total: questions.length, undone: questions.length - done }
}

export function figureUrl(tag: string): string {
  return `${import.meta.env.BASE_URL}figures/${tag}.jpg`
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
