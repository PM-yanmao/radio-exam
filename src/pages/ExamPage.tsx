import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  XCircle,
} from 'lucide-react'
import { getClassMeta, loadBank } from '../data'
import { EXAM_CONFIGS, formatClock, isAnswerCorrect, sampleExam } from '../lib/quiz'
import { isInkEffective } from '../lib/settings'
import { recordAnswer, saveHistory } from '../lib/storage'
import type { ClassKey, ExamRecord, Question } from '../types'

const LETTERS = ['A', 'B', 'C', 'D']

interface ExamResult {
  score: number
  passed: boolean
  durationSec: number
  auto: boolean
}

export default function ExamPage() {
  const { classKey = 'A' } = useParams<{ classKey: ClassKey }>()
  const navigate = useNavigate()
  const clsMeta = classKey === 'all' ? undefined : getClassMeta(classKey)
  const config = EXAM_CONFIGS[classKey as Exclude<ClassKey, 'all'>]
  const [questions, setQuestions] = useState<Question[] | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      if (!clsMeta || !config) return
      try {
        const bank = await loadBank(classKey as Exclude<ClassKey, 'all'>)
        if (!alive) return
        setQuestions(sampleExam(bank, config))
      } catch (e) {
        console.error('考试题库加载失败', e)
        if (alive) setQuestions([])
      }
    }
    setQuestions(null)
    void load()
    return () => {
      alive = false
    }
  }, [clsMeta, config, classKey])

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number[]>>({})
  const [timeLeft, setTimeLeft] = useState(() => (config ? config.minutes * 60 : 0))
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<ExamResult | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const answersRef = useRef(answers)

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    setIndex(0)
    setAnswers({})
    setTimeLeft(config ? config.minutes * 60 : 0)
    setSubmitted(false)
    setResult(null)
    setSheetOpen(false)
  }, [questions, config])

  useEffect(() => {
    if (submitted) return
    const timer = window.setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [submitted])

  useEffect(() => {
    if (timeLeft === 0 && !submitted && questions !== null && questions.length > 0) {
      finishExam(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  if (!clsMeta || !config || classKey === 'all') return <Navigate to="/exam" replace />
  if (questions === null) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-slate-500">正在组卷…</p>
      </div>
    )
  }
  if (questions.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-slate-500">题库数量不足，无法组卷</p>
        <Link to="/exam" className="mt-3 inline-block text-indigo-600">
          返回考试首页
        </Link>
      </div>
    )
  }

  const q = questions[index]
  const selected = answers[index] ?? []
  const ink = isInkEffective()
  const answeredCount = Object.keys(answers).filter((k) => (answers[Number(k)] ?? []).length > 0).length

  function finishExam(auto: boolean) {
    if (submitted || !questions || !clsMeta || !config) return
    let score = 0
    questions.forEach((question, i) => {
      const ok = isAnswerCorrect(answersRef.current[i] ?? [], question.answer)
      if (ok) score++
      recordAnswer(question.id, ok)
    })
    const passed = score >= config.passScore
    const durationSec = config.minutes * 60 - timeLeft
    const record: ExamRecord = {
      id: `${Date.now()}`,
      classKey: classKey as Exclude<ClassKey, 'all'>,
      className: clsMeta.name,
      score,
      total: questions.length,
      passScore: config.passScore,
      passed,
      durationSec,
      finishedAt: new Date().toISOString(),
    }
    saveHistory(record)
    setResult({ score, passed, durationSec, auto })
    setSubmitted(true)
  }

  function toggleOption(oi: number) {
    setAnswers((prev) => {
      const cur = prev[index] ?? []
      if (q.type === 'single') return { ...prev, [index]: [oi] }
      const next = cur.includes(oi) ? cur.filter((x) => x !== oi) : [...cur, oi]
      return { ...prev, [index]: next }
    })
  }

  if (submitted && result) {
    return (
      <ExamResultView
        questions={questions}
        answers={answers}
        result={result}
        className={clsMeta.name}
        passScore={config.passScore}
        onRetry={() => navigate(0)}
      />
    )
  }

  const danger = timeLeft < 5 * 60

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/exam"
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-indigo-600"
            onClick={(e) => {
              if (!window.confirm('退出后本次考试将作废，确定退出吗？')) e.preventDefault()
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{clsMeta.name}模拟考试</h1>
            <p className="text-xs text-slate-500">
              已答 {answeredCount}/{questions.length} · 单选 {config.single} + 多选 {config.multi}
            </p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-sm font-bold tabular-nums shadow-sm ${
            danger ? 'bg-rose-100 text-rose-600' : 'bg-white text-slate-800'
          }`}
        >
          <Clock className="h-4 w-4" />
          {formatClock(timeLeft)}
        </div>
      </header>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${danger ? 'bg-rose-500' : 'bg-indigo-500'}`}
          style={{ width: `${(index / questions.length) * 100}%` }}
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
          <span className="mr-1 text-indigo-500">{index + 1}.</span>
          {q.question}
        </h2>

        <div className="mt-5 space-y-2.5">
          {q.options.map((opt, oi) => {
            const isSel = selected.includes(oi)
            return (
              <button
                key={oi}
                onClick={() => toggleOption(oi)}
                className={`option-enter flex w-full items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                  isSel
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
                }`}
                style={
                  ink && isSel
                    ? { backgroundColor: '#000000', color: '#ffffff', borderColor: '#000000' }
                    : undefined
                }
              >
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    isSel ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                  style={
                    ink && isSel
                      ? { backgroundColor: '#ffffff', color: '#000000' }
                      : undefined
                  }
                >
                  {LETTERS[oi]}
                </span>
                <span className="text-sm leading-relaxed text-slate-800">{opt}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setIndex(Math.max(0, index - 1))}
            disabled={index === 0}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> 上一题
          </button>
          {index < questions.length - 1 ? (
            <button
              onClick={() => setIndex(index + 1)}
              className="flex items-center gap-1 rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-colors hover:bg-indigo-500"
            >
              下一题
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                const unanswered = questions.length - answeredCount
                const msg =
                  unanswered > 0
                    ? `还有 ${unanswered} 题未作答，确定交卷吗？`
                    : '确定交卷吗？'
                if (window.confirm(msg)) finishExam(false)
              }}
              className="rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-colors hover:bg-emerald-500"
            >
              交卷
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
                已答 {answeredCount} / 共 {questions.length} 题
              </p>
            )}
          </div>
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
        {sheetOpen && (
          <>
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
              <span>
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-indigo-500 align-middle" />
                已答
              </span>
              <span>
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-slate-200 align-middle" />
                未答
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {questions.map((_, i) => {
                const answered = (answers[i] ?? []).length > 0
                return (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold transition-transform ${
                      answered ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                    } ${i === index ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ExamResultView(props: {
  questions: Question[]
  answers: Record<number, number[]>
  result: ExamResult
  className: string
  passScore: number
  onRetry: () => void
}) {
  const { questions, answers, result, className, passScore, onRetry } = props
  const wrongIndexes = questions
    .map((_, i) => i)
    .filter((i) => !isAnswerCorrect(answers[i] ?? [], questions[i].answer))
  const minutes = Math.floor(result.durationSec / 60)
  const seconds = result.durationSec % 60

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div
          className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${
            result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}
        >
          {result.passed ? <CheckCircle2 className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
        </div>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          {result.score}
          <span className="text-base font-normal text-slate-400"> / {questions.length}</span>
        </h1>
        <p className={`mt-2 text-lg font-bold ${result.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
          {result.passed ? '考试合格' : '考试不合格'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {className} · 合格线 {passScore} 题
        </p>
        <p className="mt-1 text-xs text-slate-400">
          用时 {minutes} 分 {seconds} 秒{result.auto ? ' · 时间耗尽自动交卷' : ''}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/exam"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
          >
            返回考试首页
          </Link>
          <button
            onClick={onRetry}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500"
          >
            再考一次
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-700">逐题回顾（答错 {wrongIndexes.length} 题）</h2>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const user = answers[i] ?? []
            const ok = isAnswerCorrect(user, q.answer)
            return (
              <div key={i} className={`rounded-2xl border p-4 ${ok ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">
                    {i + 1}. {q.type === 'single' ? '单选' : '多选'}
                  </span>
                  {ok ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-500" />
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-800">{q.question}</p>
                <p className="mt-2 text-xs">
                  <span className={ok ? 'text-emerald-600' : 'text-rose-600'}>
                    你的答案：{user.length ? user.map((x) => LETTERS[x]).join('、') : '未作答'}
                  </span>
                  {!ok && (
                    <span className="ml-3 text-emerald-600">
                      正确答案：{q.answer.map((x) => LETTERS[x]).join('、')}
                    </span>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
