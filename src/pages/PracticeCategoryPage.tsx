import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Shuffle, ListOrdered } from 'lucide-react'
import { getClassMeta, questionMeta } from '../data'
import { doneStore } from '../lib/storage'
import type { ClassKey } from '../types'

interface CategoryStat {
  category: string
  chapter: string
  total: number
  done: number
}

interface ChapterGroup {
  chapter: string
  name: string
  items: CategoryStat[]
}

export default function PracticeCategoryPage() {
  const { classKey } = useParams<{ classKey: ClassKey }>()
  const cls = classKey ? getClassMeta(classKey) : undefined
  if (!cls) return <Navigate to="/practice" replace />

  const items = cls.items
  const overallTotal = cls.count
  const overallDone = items.filter((it) => doneStore.has(it.id)).length

  const statMap = new Map<string, CategoryStat>()
  for (const it of items) {
    const stat = statMap.get(it.category) ?? {
      category: it.category,
      chapter: it.category.split('.')[0],
      total: 0,
      done: 0,
    }
    stat.total += 1
    if (doneStore.has(it.id)) stat.done += 1
    statMap.set(it.category, stat)
  }

  const chapterMap = new Map<string, CategoryStat[]>()
  for (const stat of statMap.values()) {
    const arr = chapterMap.get(stat.chapter) ?? []
    arr.push(stat)
    chapterMap.set(stat.chapter, arr)
  }
  const groups: ChapterGroup[] = [...chapterMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
    .map(([chapter, list]) => ({
      chapter,
      name: questionMeta.chapters[chapter] ?? `第${chapter}章`,
      items: list.sort((a, b) => a.category.localeCompare(b.category, undefined, { numeric: true })),
    }))

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Link
          to={`/practice/${classKey}`}
          className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{cls.name}</h1>
          <p className="text-xs text-slate-500">
            {overallTotal} 题 · 已做 {overallDone} · 未做 {overallTotal - overallDone}
          </p>
        </div>
      </header>

      <Link
        to={`/practice/${classKey}`}
        className="flex items-center justify-between rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-900 p-5 text-white shadow-lg transition-transform hover:scale-[1.01]"
      >
        <div>
          <p className="text-lg font-bold">全部题目</p>
          <p className="mt-0.5 text-sm text-indigo-200">
            {overallDone} / {overallTotal} 已做
          </p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold">顺序</span>
          <span className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold">乱序</span>
        </div>
      </Link>

      {groups.map((group) => (
        <section key={group.chapter}>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
            <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
              {group.chapter}
            </span>
            {group.name}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.items.map((item) => {
              const pct = item.total ? Math.round((item.done / item.total) * 100) : 0
              return (
                <div
                  key={item.category}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {item.category}
                      </span>
                      <span className="ml-2 text-xs text-slate-400">{item.total} 题</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {item.done}/{item.total}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link
                      to={`/practice/${classKey}/${item.category}?mode=seq`}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-900 hover:text-white"
                    >
                      <ListOrdered className="h-3.5 w-3.5" /> 顺序
                    </Link>
                    <Link
                      to={`/practice/${classKey}/${item.category}?mode=shuffle`}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-600 hover:text-white"
                    >
                      <Shuffle className="h-3.5 w-3.5" /> 乱序
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
