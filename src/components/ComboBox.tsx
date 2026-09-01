import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { isInkEffective } from '../lib/settings'

interface ComboBoxOption {
  value: string
  label: string
}

interface ComboBoxProps {
  value: string
  onChange: (value: string) => void
  options: ComboBoxOption[]
  placeholder?: string
  inputMode?: 'text' | 'url' | 'numeric'
}

export default function ComboBox({
  value,
  onChange,
  options,
  placeholder,
  inputMode = 'text',
}: ComboBoxProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <div className="flex gap-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          inputMode={inputMode}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-indigo-300 hover:text-indigo-600"
          title="选择"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && options.length > 0 && (
        <ul className="thin-scroll absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-xl">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-indigo-50 ${
                  opt.value === value ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'
                }`}
                style={
                  isInkEffective() && opt.value === value
                    ? { backgroundColor: '#000000', color: '#ffffff' }
                    : undefined
                }
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
