import { useState } from 'react'
import { LayoutGrid, ScrollText } from 'lucide-react'
import { getSheetStyle, setSheetStyle, type SheetStyle } from '../lib/settings'

const OPTIONS: { value: SheetStyle; label: string; desc: string; icon: typeof LayoutGrid }[] = [
  {
    value: 'full',
    label: '全部展开',
    desc: '答题卡展开后显示所有题号',
    icon: LayoutGrid,
  },
  {
    value: 'scroll',
    label: '部分展开 + 滚动条',
    desc: '答题卡限定高度，右侧滚动查看',
    icon: ScrollText,
  },
]

export default function SheetStylePanel() {
  const [style, setStyle] = useState<SheetStyle>(getSheetStyle())

  function choose(value: SheetStyle) {
    setSheetStyle(value)
    setStyle(value)
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-slate-900">答题卡样式</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        题量较大时建议选择“部分展开 + 滚动条”，避免答题卡过长。
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon
          const active = style === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => choose(opt.value)}
              className={`flex items-start gap-2.5 rounded-2xl border-2 p-3 text-left transition-colors ${
                active
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-indigo-200'
              }`}
            >
              <Icon className={`mt-0.5 h-4 w-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>
                <span className={`block text-sm font-semibold ${active ? 'text-indigo-700' : 'text-slate-800'}`}>
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
