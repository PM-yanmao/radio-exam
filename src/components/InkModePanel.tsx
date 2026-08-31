import { useState } from 'react'
import { Monitor, Sun, Contrast } from 'lucide-react'
import { getInkMode, setInkMode, type InkMode } from '../lib/settings'

const OPTIONS: { value: InkMode; label: string; desc: string; icon: typeof Monitor }[] = [
  { value: 'auto', label: '自动检测', desc: '跟随系统/设备的高对比偏好', icon: Monitor },
  { value: 'on', label: '强制开启', desc: '适合墨水屏等低对比度屏幕', icon: Contrast },
  { value: 'off', label: '关闭', desc: '始终使用彩色界面', icon: Sun },
]

export default function InkModePanel() {
  const [mode, setMode] = useState<InkMode>(getInkMode())

  function choose(value: InkMode) {
    setInkMode(value)
    setMode(value)
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-slate-900">墨水屏 / 高对比模式</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        墨水屏或 WebView 上深色渐变和细进度条可能看不清，开启后界面会变为白底黑字高对比样式。
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon
          const active = mode === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => choose(opt.value)}
              className={`flex items-start gap-2 rounded-2xl border-2 p-3 text-left transition-colors ${
                active ? 'border-black bg-slate-100' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <Icon className={`mt-0.5 h-4 w-4 ${active ? 'text-black' : 'text-slate-400'}`} />
              <span>
                <span className={`block text-sm font-semibold ${active ? 'text-black' : 'text-slate-800'}`}>
                  {opt.label}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">{opt.desc}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
