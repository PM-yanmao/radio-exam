import { useNavigate } from 'react-router-dom'
import { ArrowRight, Layers, ListOrdered } from 'lucide-react'
import { getClassMeta } from '../data'
import { doneStore } from '../lib/storage'
import type { ClassKey } from '../types'

const CARDS: { key: ClassKey; name: string; desc: string; gradient: string }[] = [
  {
    key: 'A',
    name: 'A 类题库',
    desc: '683 题 · 入门级操作技术能力验证',
    gradient: 'from-sky-500 to-cyan-400',
  },
  {
    key: 'B',
    name: 'B 类题库',
    desc: '1143 题 · 中级操作技术能力验证',
    gradient: 'from-indigo-500 to-violet-500',
  },
  {
    key: 'C',
    name: 'C 类题库',
    desc: '1282 题 · 高级操作技术能力验证',
    gradient: 'from-fuchsia-500 to-pink-500',
  },
  {
    key: 'all',
    name: '全部题库',
    desc: '1375 题 · A / B / C 三类并集',
    gradient: 'from-amber-500 to-orange-500',
  },
]

export default function PracticeClassPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">分类刷题</h1>
        <p className="mt-1 text-sm text-slate-500">
          点击题库卡片直接开始刷题，右上角可切换顺序/乱序；按章节浏览请使用「分类」入口
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => {
          const cls = getClassMeta(card.key)
          const totalCount = cls.count
          const doneCount = cls.items.filter((it) => doneStore.has(it.id)).length
          const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0
          const categories = new Set(cls.items.map((it) => it.category)).size
          return (
            <div
              key={card.key}
              onClick={() => navigate(`/practice/${card.key}`)}
              className="group cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br ${card.gradient} px-3 py-1.5 text-sm font-bold text-white shadow`}
                >
                  <Layers className="h-4 w-4" />
                  {card.name}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/practice/${card.key}/categories`)
                    }}
                    className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                  >
                    分类
                  </button>
                  <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">{card.desc}</p>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-3xl font-bold text-slate-900">{totalCount}</span>
                <span className="text-xs text-slate-500">
                  {doneCount} 已做 · {totalCount - doneCount} 未做 · {categories} 个类别
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${card.gradient} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-slate-700">
                <ListOrdered className="h-4 w-4" /> 开始刷题
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
