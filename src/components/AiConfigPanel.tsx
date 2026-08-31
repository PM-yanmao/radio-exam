import { useEffect, useState } from 'react'
import { Eye, EyeOff, KeyRound, Save, ShieldCheck } from 'lucide-react'
import { AI_API_PRESETS, AI_MODEL_PRESETS } from '../lib/ai'
import { clearAIConfig, isAIConfiguredSync, loadAIConfig, saveAIConfig } from '../lib/aiConfig'

export default function AiConfigPanel() {
  const [apiUrl, setApiUrl] = useState('')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [configured, setConfigured] = useState(isAIConfiguredSync())
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadAIConfig().then((cfg) => {
      if (!alive) return
      if (cfg) {
        setApiUrl(cfg.apiUrl)
        setModel(cfg.model)
        setConfigured(true)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  async function handleSave() {
    setMessage(null)
    setError(null)
    const url = apiUrl.trim()
    const mdl = model.trim()
    if (!url || !mdl || !apiKey.trim()) {
      setError('请完整填写 API 地址、模型名称和 API Key')
      return
    }
    if (!/^https?:\/\//i.test(url)) {
      setError('API 地址需以 http:// 或 https:// 开头')
      return
    }
    setSaving(true)
    try {
      await saveAIConfig({ apiUrl: url, model: mdl, apiKey: apiKey.trim() })
      setConfigured(true)
      setApiKey('')
      setMessage('配置已加密保存到本机浏览器，不会上传服务器')
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  function handleClear() {
    clearAIConfig()
    setConfigured(false)
    setApiKey('')
    setMessage(null)
    setError(null)
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-indigo-500" />
        <h2 className="text-base font-bold text-slate-900">AI 解答配置</h2>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        配置后可在刷题页使用 AI 解析题目。API Key 使用 Web Crypto 加密后保存在本机，不存明文、不上传服务器。
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">API 地址</label>
          <input
            list="ai-api-presets"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="选择或输入 API 地址"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <datalist id="ai-api-presets">
            {AI_API_PRESETS.map((p) => (
              <option key={p.url} value={p.url}>
                {p.name}
              </option>
            ))}
          </datalist>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">模型</label>
          <input
            list="ai-model-presets"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="选择或输入模型名称"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <datalist id="ai-model-presets">
            {AI_MODEL_PRESETS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={configured ? '已加密保存（如需更换请输入新 Key）' : '请输入 API Key'}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title={showKey ? '隐藏' : '显示'}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {message && <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p>}
      {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-colors hover:bg-indigo-500 disabled:bg-slate-300 disabled:shadow-none"
        >
          <Save className="h-4 w-4" /> {saving ? '保存中…' : '保存配置'}
        </button>
        {configured && (
          <button
            onClick={handleClear}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 hover:border-rose-300 hover:text-rose-500"
          >
            清除
          </button>
        )}
      </div>

      <div
        className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${
          configured ? 'text-emerald-600' : 'text-amber-600'
        }`}
      >
        <ShieldCheck className="h-4 w-4" />
        {configured ? '已配置，刷题页 AI 解答可用' : '未配置，AI 解答将引导你到这里完成配置'}
      </div>
    </div>
  )
}
