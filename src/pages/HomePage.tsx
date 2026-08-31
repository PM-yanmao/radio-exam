import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckCircle2, Circle, Clock, FileText, XCircle } from 'lucide-react'
import { questionData } from '../data'
import { classProgress } from '../lib/quiz'
import { doneStore, loadHistory, wrongStore } from '../lib/storage'
import type { ClassKey } from '../types'

const CLASS_META: Record<
  ClassKey,
  { key: ClassKey; name: string; desc: string; gradient: string }
> = {
  A: {
    key: 'A',
    name: 'A 类',
    desc: '操作技术能力验证 · 入门级',
    gradient: 'from-sky-500 to-cyan-400',
  },
  B: {
    key: 'B',
    name: 'B 类',
    desc: '操作技术能力验证 · 中级',
    gradient: 'from-indigo-500 to-violet-500',
  },
  C: {
    key: 'C',
    name: 'C 类',
    desc: '操作技术能力验证 · 高级',
    gradient: 'from-fuchsia-500 to-pink-500',
  },
  all: {
    key: 'all',
    name: '全部题库',
    desc: 'A / B / C 三类并集',
    gradient: 'from-amber-500 to-orange-500',
  },
}

export default function HomePage() {
  const total = questionData.classes.all.questions.length
  const done = doneStore.size
  const wrong = wrongStore.size
  const history = loadHistory()

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl md:p-8">
        <p className="text-sm font-medium text-indigo-300">CRAC 业余无线电台操作技术能力验证</p>
        <h1 className="mt-1 text-2xl font-bold tracking-wide md:text-3xl">题库练习与模拟考试</h1>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<BookOpen className="h-5 w-5" />} label="题目总数" value={total} />
          <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="已做" value={done} />
          <StatCard icon={<Circle className="h-5 w-5" />} label="未做" value={total - done} />
          <StatCard icon={<XCircle className="h-5 w-5" />} label="错题" value={wrong} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">选择题库</h2>
          <Link to="/practice" className="flex items-center gap-1 text-sm font-medium text-indigo-600">
            全部类别 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {(Object.keys(CLASS_META) as ClassKey[]).map((key) => {
            const meta = CLASS_META[key]
            const cls = questionData.classes[key]
            const progress = classProgress(cls.questions, (id) => doneStore.has(id))
            const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0
            return (
              <div
                key={key}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className={`inline-flex rounded-xl bg-gradient-to-br ${meta.gradient} px-2.5 py-1 text-xs font-bold text-white shadow`}
                >
                  {meta.name}
                </div>
                <p className="mt-2 text-xs text-slate-500">{meta.desc}</p>
                <div className="mt-3 flex items-end justify-between">
                  <span className="text-2xl font-bold text-slate-900">{progress.total}</span>
                  <span className="text-xs text-slate-500">
                    {progress.done}/{progress.total}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${meta.gradient} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/practice/${key}`}
                    className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-slate-700"
                  >
                    刷题
                  </Link>
                  {key !== 'all' && (
                    <Link
                      to={`/exam/${key}`}
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                    >
                      模拟考试
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">最近考试记录</h2>
          <div className="space-y-2">
            {history.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl text-white ${
                      r.passed ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {r.className} · {r.passed ? '合格' : '不合格'}
                    </p>
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {new Date(r.finishedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">
                    {r.score}
                    <span className="text-xs font-normal text-slate-400"> / {r.total}</span>
                  </p>
                  <p className="text-xs text-slate-400">合格线 {r.passScore}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-indigo-200">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  )
}
