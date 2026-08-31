import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListOrdered, Shuffle, Trash2 } from 'lucide-react'
import { getClassMeta, loadBank } from '../data'
import { wrongStore } from '../lib/storage'
import type { Question } from '../types'

type Tab = 'all' | 'A' | 'B' | 'C'

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'A', label: 'A类' },
  { key: 'B', label: 'B类' },
  { key: 'C', label: 'C类' },
]

export default function WrongPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [version, setVersion] = useState(0)
  const [allQuestions, setAllQuestions] = useState<Question[] | null>(null)

  useEffect(() => {
    let alive = true
    loadBank('all')
      .then((bank) => {
        if (alive) setAllQuestions(bank)
      })
      .catch((e) => console.error('错题题库加载失败', e))
    return () => {
      alive = false
    }
  }, [])

  const wrongIds = useMemo(() => new Set(wrongStore.values()), [version]) // eslint-disable-line react-hooks/exhaustive-deps
  const classIds = useMemo(() => {
    const map = {} as Record<Exclude<Tab, 'all'>, Set<string>>
    for (const key of ['A', 'B', 'C'] as const) {
      map[key] = new Set(getClassMeta(key).items.map((it) => it.id))
    }
    return map
  }, [])

  const list = (allQuestions ?? []).filter((q) => {
    if (!wrongIds.has(q.id)) return false
    if (tab === 'all') return true
    return classIds[tab].has(q.id)
  })

  function remove(id: string) {
    wrongStore.remove(id)
    setVersion((v) => v + 1)
  }

  if (allQuestions === null) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-slate-500">错题集加载中…</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">错题集</h1>
          <p className="mt-1 text-sm text-slate-500">共 {wrongIds.size} 道错题，可重练或手动移除</p>
        </div>
        {wrongIds.size > 0 && (
          <div className="flex gap-2">
            <Link
              to="/practice/all/__wrong__?mode=seq"
              className="flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
            >
              <ListOrdered className="h-3.5 w-3.5" /> 顺序重练
            </Link>
            <Link
              to="/practice/all/__wrong__?mode=shuffle"
              className="flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <Shuffle className="h-3.5 w-3.5" /> 乱序重练
            </Link>
          </div>
        )}
      </header>

      <div className="flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
          <p className="text-3xl">🎉</p>
          <p className="mt-2 font-medium text-slate-600">暂无错题</p>
          <p className="mt-1 text-sm text-slate-400">答题错误会自动收录到这里</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {list.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        q.type === 'single' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'
                      }`}
                    >
                      {q.type === 'single' ? '单选' : '多选'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                      {q.category}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">{q.id}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-800">{q.question}</p>
                  <p className="mt-1.5 text-xs text-emerald-600">
                    正确答案：{q.answer.map((i) => 'ABCD'[i]).join('、')}
                  </p>
                </div>
                <button
                  onClick={() => remove(q.id)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
                  title="从错题集移除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
