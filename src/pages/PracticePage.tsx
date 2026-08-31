import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Layers,
  ListOrdered,
  RotateCcw,
  Shuffle,
  Sparkles,
  XCircle,
} from 'lucide-react'
import AiChatDialog from '../components/AiChatDialog'
import { getClass, questionData } from '../data'
import { isAnswerCorrect } from '../lib/quiz'
import { recordAnswer, wrongStore } from '../lib/storage'
import type { ClassKey, Question } from '../types'

const LETTERS = ['A', 'B', 'C', 'D']
type Mode = 'seq' | 'shuffle'

export default function PracticePage() {
  const { classKey = 'A', category = 'all' } = useParams<{
    classKey: ClassKey
    category: string
  }>()
  const [searchParams] = useSearchParams()
  const urlMode: Mode = searchParams.get('mode') === 'shuffle' ? 'shuffle' : 'seq'

  const cls = getClass(classKey)
  const baseQuestions = useMemo<Question[]>(() => {
    if (category === '__wrong__') {
      const ids = new Set(wrongStore.values())
      return questionData.classes.all.questions.filter((q) => ids.has(q.id))
    }
    if (!cls) return []
    return category === 'all'
      ? cls.questions
      : cls.questions.filter((q) => q.category === category)
  }, [cls, category])

  const [mode, setMode] = useState<Mode>(urlMode)
  const [order, setOrder] = useState<number[]>([])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number[]>>({})
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)

  useEffect(() => {
    const n = baseQuestions.length
    setMode(urlMode)
    setIndex(0)
    setAnswers({})
    setChecks({})
    setFinished(false)
    setSheetOpen(false)
    setAiOpen(false)
    setOrder(
      urlMode === 'shuffle'
        ? [Math.floor(Math.random() * Math.max(n, 1))]
        : Array.from({ length: n }, (_, i) => i),
    )
  }, [baseQuestions, urlMode])

  if (!cls) return <Navigate to="/practice" replace />
  if (baseQuestions.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-slate-500">
          {category === '__wrong__' ? '错题集为空，先去刷题吧' : '该类别暂无题目'}
        </p>
        <Link
          to={category === '__wrong__' ? '/wrong' : `/practice/${classKey}/categories`}
          className="mt-3 inline-block text-indigo-600"
        >
          {category === '__wrong__' ? '返回错题集' : '返回分类浏览'}
        </Link>
      </div>
    )
  }

  const q = baseQuestions[order[index]]
  if (!q) return null

  const qid = q.id
  const selected = answers[qid] ?? []
  const revealed = checks[qid] !== undefined
  const isCorrect = revealed ? checks[qid] : false
  const correctLetters = q.answer.map((i) => LETTERS[i]).join('、')
  const answeredCount = Object.keys(checks).length
  const total = baseQuestions.length
  const remainingCount = total - answeredCount
  const backTo =
    category === '__wrong__'
      ? '/wrong'
      : category === 'all'
        ? '/practice'
        : `/practice/${classKey}/categories`
  const title =
    category === '__wrong__'
      ? '错题重练'
      : `${cls.name} · ${category === 'all' ? '全部题目' : category}`

  if (finished) {
    const correctCount = Object.values(checks).filter(Boolean).length
    const wrongQuestions = baseQuestions.filter((qq) => checks[qq.id] === false)
    return (
      <PracticeSummary
        total={total}
        correctCount={correctCount}
        wrongQuestions={wrongQuestions}
        classKey={classKey}
        category={category}
        onReview={(id) => reviewQuestion(id)}
        onRestart={restart}
      />
    )
  }

  function switchMode(next: Mode) {
    if (next === mode || total === 0) return
    const cur = order[index] ?? 0
    if (next === 'shuffle') {
      setOrder(order.slice(0, index + 1))
    } else {
      setOrder(Array.from({ length: total }, (_, i) => (cur + i) % total))
      setIndex(0)
    }
    setMode(next)
  }

  function jumpTo(baseIndex: number) {
    const pos = order.indexOf(baseIndex)
    if (pos >= 0) setIndex(pos)
    else {
      setOrder((prev) => [...prev, baseIndex])
      setIndex(order.length)
    }
  }

  function reviewQuestion(id: string) {
    const bi = baseQuestions.findIndex((qq) => qq.id === id)
    if (bi < 0) return
    jumpTo(bi)
    setFinished(false)
  }

  function restart() {
    setIndex(0)
    setAnswers({})
    setChecks({})
    setFinished(false)
    setOrder(
      mode === 'shuffle'
        ? [Math.floor(Math.random() * total)]
        : Array.from({ length: total }, (_, i) => i),
    )
  }

  function toggleOption(oi: number) {
    if (revealed) return
    setAnswers((prev) => {
      const cur = prev[qid] ?? []
      if (q.type === 'single') return { ...prev, [qid]: [oi] }
      const next = cur.includes(oi) ? cur.filter((x) => x !== oi) : [...cur, oi]
      return { ...prev, [qid]: next }
    })
  }

  function confirm() {
    if (selected.length === 0 || revealed) return
    const ok = isAnswerCorrect(selected, q.answer)
    setChecks((prev) => ({ ...prev, [qid]: ok }))
    recordAnswer(q.id, ok)
  }

  function goPrev() {
    if (index > 0) setIndex(index - 1)
  }

  function goNext() {
    const curBi = order[index]
    if (mode === 'shuffle') {
      const remaining = baseQuestions
        .map((qq, bi) => ({ qq, bi }))
        .filter(({ qq, bi }) => checks[qq.id] === undefined && bi !== curBi)
      if (remaining.length === 0) {
        const curQ = baseQuestions[curBi]
        if (curQ && checks[curQ.id] !== undefined) setFinished(true)
        return
      }
      const next = remaining[Math.floor(Math.random() * remaining.length)].bi
      setOrder((prev) => [...prev, next])
      setIndex(index + 1)
    } else if (index < order.length - 1) {
      setIndex(index + 1)
    } else {
      setFinished(true)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="flex items-center gap-2.5">
        <Link
          to={backTo}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-slate-900 md:text-lg">{title}</h1>
          <p className="text-xs text-slate-500">
            已答 {answeredCount}/{total}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => setAiOpen(true)}
            className="flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-100"
            title="AI 解析"
          >
            <Sparkles className="h-3.5 w-3.5" /> AI
          </button>
          <div className="flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
            <button
              onClick={() => switchMode('seq')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                mode === 'seq' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ListOrdered className="h-3.5 w-3.5" />
              顺序
            </button>
            <button
              onClick={() => switchMode('shuffle')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                mode === 'shuffle' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shuffle className="h-3.5 w-3.5" />
              乱序
            </button>
          </div>
          {category !== '__wrong__' && (
            <Link
              to={`/practice/${classKey}/categories`}
              className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-indigo-600"
              title="分类浏览"
            >
              <Layers className="h-4 w-4" />
            </Link>
          )}
        </div>
      </header>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }}
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex items-center justify-between">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              q.type === 'single' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'
            }`}
          >
            {q.type === 'single' ? '单选题' : '多选题'}
          </span>
          <span className="font-mono text-xs text-slate-400">{q.id}</span>
        </div>

        {q.figure && (
          <img
            src={`${import.meta.env.BASE_URL}${q.figure}`}
            alt={`附图 ${q.tag}`}
            className="mt-4 max-h-72 w-full rounded-2xl border border-slate-100 bg-slate-50 object-contain"
          />
        )}

        <h2 className="mt-4 text-base font-semibold leading-relaxed text-slate-900 md:text-lg">
          {q.question}
        </h2>

        <div className="mt-5 space-y-2.5">
          {q.options.map((opt, oi) => {
            const isSel = selected.includes(oi)
            const isAnswer = q.answer.includes(oi)
            let clsName =
              'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
            if (isSel && !revealed) clsName = 'border-indigo-500 bg-indigo-50'
            if (revealed) {
              if (isAnswer) clsName = 'border-emerald-500 bg-emerald-50'
              else if (isSel) clsName = 'border-rose-400 bg-rose-50'
              else clsName = 'border-slate-100 bg-slate-50 opacity-70'
            }
            return (
              <button
                key={oi}
                onClick={() => toggleOption(oi)}
                disabled={revealed}
                className={`option-enter flex w-full items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${clsName}`}
              >
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    isSel || (revealed && isAnswer)
                      ? isAnswer && revealed
                        ? 'bg-emerald-500 text-white'
                        : isSel && revealed
                          ? 'bg-rose-500 text-white'
                          : 'bg-indigo-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {LETTERS[oi]}
                </span>
                <span className="text-sm leading-relaxed text-slate-800">{opt}</span>
                {revealed && isAnswer && (
                  <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-500" />
                )}
                {revealed && isSel && !isAnswer && (
                  <XCircle className="ml-auto h-5 w-5 shrink-0 text-rose-500" />
                )}
              </button>
            )
          })}
        </div>

        {revealed && (
          <div
            className={`mt-4 rounded-2xl p-4 text-sm ${
              isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}
          >
            <p className="font-bold">
              {isCorrect ? '回答正确' : '回答错误'}，正确答案：{correctLetters}
            </p>
            {q.type === 'multi' && (
              <p className="mt-1 text-xs opacity-80">多选题需全部选对才得分</p>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> 上一题
          </button>
          {!revealed ? (
            <button
              onClick={confirm}
              disabled={selected.length === 0}
              className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-colors hover:bg-indigo-500 disabled:bg-slate-300 disabled:shadow-none"
            >
              确认答案
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex items-center gap-1 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-colors hover:bg-indigo-500"
            >
              {mode === 'shuffle' ? (
                remainingCount === 0 ? (
                  '查看结果'
                ) : (
                  <>
                    随机下一题 <Shuffle className="h-4 w-4" />
                  </>
                )
              ) : index === order.length - 1 ? (
                '查看结果'
              ) : (
                <>
                  下一题 <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">答题卡</p>
            {!sheetOpen && (
              <p className="mt-0.5 text-xs text-slate-400">
                已答 {answeredCount} / 共 {total} 题
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={restart}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5" /> 重来
            </button>
            <button
              onClick={() => setFinished(true)}
              className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              结束练习
            </button>
            <button
              onClick={() => setSheetOpen((v) => !v)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              {sheetOpen ? (
                <>
                  收起 <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  展开 <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
        {sheetOpen && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {baseQuestions.map((qq, bi) => {
              const checked = checks[qq.id]
              const isCurrent = bi === order[index]
              let clsName = 'bg-slate-100 text-slate-600'
              if (checked === true) clsName = 'bg-emerald-500 text-white'
              else if (checked === false) clsName = 'bg-rose-500 text-white'
              return (
                <button
                  key={qq.id}
                  onClick={() => jumpTo(bi)}
                  className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold transition-transform ${clsName} ${
                    isCurrent ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                  }`}
                >
                  {bi + 1}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {aiOpen && <AiChatDialog question={q} onClose={() => setAiOpen(false)} />}
    </div>
  )
}

function PracticeSummary(props: {
  total: number
  correctCount: number
  wrongQuestions: Question[]
  classKey: ClassKey
  category: string
  onReview: (id: string) => void
  onRestart: () => void
}) {
  const { total, correctCount, wrongQuestions, classKey, category, onReview, onRestart } = props
  const wrongCount = wrongQuestions.length
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div
          className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${
            wrongCount === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
          }`}
        >
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">练习完成</h1>
        <p className="mt-2 text-slate-500">
          共 {total} 题，答对 {correctCount} 题，答错 {wrongCount} 题
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to={
              category === '__wrong__'
                ? '/wrong'
                : category === 'all'
                  ? '/practice'
                  : `/practice/${classKey}/categories`
            }
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
          >
            返回
          </Link>
          <button
            onClick={onRestart}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500"
          >
            再来一遍
          </button>
        </div>
      </div>

      {wrongCount > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-slate-700">错题回顾</h2>
          <div className="space-y-2">
            {wrongQuestions.map((qq) => (
              <button
                key={qq.id}
                onClick={() => onReview(qq.id)}
                className="flex w-full items-center justify-between rounded-2xl bg-rose-50 px-4 py-3 text-left hover:bg-rose-100"
              >
                <span className="text-sm font-medium text-rose-700">{qq.question}</span>
                <span className="ml-3 shrink-0 text-xs text-rose-500">点击查看</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
