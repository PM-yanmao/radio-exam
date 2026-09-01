import { NavLink, Outlet } from 'react-router-dom'
import { BookOpen, FileText, Home, RadioTower, Settings, XCircle } from 'lucide-react'
import { useEffect, useState, type ComponentType } from 'react'
import { isInkEffective } from '../lib/settings'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
}

const NAVS: NavItem[] = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/practice', label: '刷题', icon: BookOpen },
  { to: '/wrong', label: '错题集', icon: XCircle },
  { to: '/exam', label: '模拟考试', icon: FileText },
  { to: '/config', label: '配置', icon: Settings },
]

export default function Layout() {
  const [ink, setInk] = useState(() => isInkEffective())

  useEffect(() => {
    const update = () => setInk(isInkEffective())
    window.addEventListener('radio-ink-change', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('radio-ink-change', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  return (
    <div className={`min-h-screen pb-20 md:pb-0 ${ink ? 'ink-mode' : ''}`}>
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <NavLink to="/" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-indigo-200">
              <RadioTower className="h-4.5 w-4.5" />
            </span>
            <span className="tracking-wide">业余无线电考试题库</span>
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            {NAVS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 md:py-8">
        <Outlet />
      </main>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {NAVS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-500'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
