import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Send, Sparkles, X } from 'lucide-react'
import { requestAI, type ChatMessage } from '../lib/ai'
import { loadAIConfig } from '../lib/aiConfig'
import type { Question } from '../types'

const LETTERS = ['A', 'B', 'C', 'D']

function systemPrompt(): ChatMessage {
  return {
    role: 'system',
    content:
      '你是一名业余无线电考试辅导老师，擅长用通俗易懂的中文讲解题目。回答时先给出结论，再分点讲解，重点说明每个选项为什么对或错。',
  }
}

function buildInitialMessage(q: Question): string {
  return [
    '请解析下面这道业余无线电考试题：',
    '',
    `题型：${q.type === 'single' ? '单选题' : '多选题'}`,
    `题干：${q.question}`,
    ...q.options.map((opt, i) => `${LETTERS[i]}. ${opt}`),
    '',
    '请先给出正确答案，再逐步讲解解题思路，并说明每个选项的对错原因。',
  ].join('\n')
}

export default function AiChatDialog({
  question,
  onClose,
}: {
  question: Question
  onClose: () => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [configMissing, setConfigMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    startInitial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, error, configMissing])

  async function startInitial() {
    const config = await loadAIConfig()
    if (!config) {
      setConfigMissing(true)
      return
    }
    const user: ChatMessage = { role: 'user', content: buildInitialMessage(question) }
    setMessages([user])
    setLoading(true)
    try {
      const reply = await requestAI([systemPrompt(), user])
      setMessages([user, { role: 'assistant', content: reply }])
    } catch (e) {
      console.error('AI 解析失败', e)
      setError(e instanceof Error ? e.message : 'AI 解析失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  async function sendFollowUp() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError(null)
    const user: ChatMessage = { role: 'user', content: text }
    const next = [...messages, user]
    setMessages(next)
    setLoading(true)
    try {
      const reply = await requestAI([systemPrompt(), ...next])
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (e) {
      console.error('AI 追问失败', e)
      setError(e instanceof Error ? e.message : 'AI 解析失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">AI 解析</h2>
              <p className="font-mono text-xs text-slate-400">{question.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="thin-scroll flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4">
          {configMissing ? (
            <div className="mx-auto mt-8 max-w-sm rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <p className="text-2xl">🤖</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">尚未配置 AI 服务</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                请先在「模拟考试」页右侧的 AI 配置面板中填写 API 地址、模型和 API Key，再回来使用 AI 解析。
              </p>
              <Link
                to="/exam"
                onClick={onClose}
                className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                去配置 AI
              </Link>
            </div>
          ) : (
            <>
              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-sm leading-relaxed text-white">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm">
                      {m.content}
                    </div>
                  </div>
                ),
              )}

              {loading && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                  AI 正在思考…
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p className="font-semibold">AI 服务暂时不可用</p>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">{error}</p>
                  <p className="mt-1 text-xs opacity-75">详细错误已输出到浏览器控制台（F12）。</p>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {!configMissing && (
          <footer className="border-t border-slate-100 bg-white px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendFollowUp()
                  }
                }}
                rows={1}
                placeholder="继续追问，例如：为什么 B 选项不对？"
                className="thin-scroll max-h-32 min-h-[42px] flex-1 resize-none rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                onClick={sendFollowUp}
                disabled={loading || !input.trim()}
                className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white shadow-md disabled:bg-slate-300"
                title="发送"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}
