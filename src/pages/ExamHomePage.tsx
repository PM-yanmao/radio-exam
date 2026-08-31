import { Link } from 'react-router-dom'
import { Clock, FileCheck2, ListChecks, Target } from 'lucide-react'
import { EXAM_CONFIGS } from '../lib/quiz'
import type { ClassKey } from '../types'

const CARDS: {
  key: Exclude<ClassKey, 'all'>
  name: string
  desc: string
  gradient: string
}[] = [
  { key: 'A', name: 'A 类考试', desc: '入门级操作技术能力验证', gradient: 'from-sky-500 to-cyan-400' },
  { key: 'B', name: 'B 类考试', desc: '中级操作技术能力验证', gradient: 'from-indigo-500 to-violet-500' },
  { key: 'C', name: 'C 类考试', desc: '高级操作技术能力验证', gradient: 'from-fuchsia-500 to-pink-500' },
]

export default function ExamHomePage() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">模拟考试</h1>
        <p className="mt-1 text-sm text-slate-500">
          严格按考试规则组卷：单选 + 多选，限时答题，到点自动交卷
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {CARDS.map((card) => {
          const cfg = EXAM_CONFIGS[card.key]
          const total = cfg.single + cfg.multi
          return (
            <div
              key={card.key}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className={`inline-flex rounded-xl bg-gradient-to-br ${card.gradient} px-3 py-1.5 text-sm font-bold text-white shadow`}
              >
                {card.name}
              </div>
              <p className="mt-2 text-xs text-slate-500">{card.desc}</p>

              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <ListChecks className="h-4 w-4 text-slate-400" />
                  {total} 题（单选 {cfg.single} + 多选 {cfg.multi}）
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {cfg.minutes} 分钟
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Target className="h-4 w-4 text-slate-400" />
                  答对 {cfg.passScore} 题合格
                </div>
              </div>

              <Link
                to={`/exam/${card.key}`}
                className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              >
                <FileCheck2 className="h-4 w-4" /> 开始考试
              </Link>
            </div>
          )
        })}
      </div>

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">考试规则说明</p>
        <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs leading-relaxed">
          <li>单选题选对得分；多选题必须全部选对才得分，漏选、错选、多选均不得分。</li>
          <li>开始后计时立即启动，交卷前请勿关闭页面；时间耗尽将自动交卷。</li>
          <li>交卷后立即显示成绩与逐题回顾，并保存考试记录。</li>
        </ul>
      </div>
    </div>
  )
}
