import { Settings } from 'lucide-react'
import AiConfigPanel from '../components/AiConfigPanel'
import SheetStylePanel from '../components/SheetStylePanel'

export default function AiConfigPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200">
          <Settings className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">配置</h1>
          <p className="text-sm text-slate-500">AI 解答服务设置，配置后可在刷题页使用 AI 解析题目</p>
        </div>
      </header>

      <AiConfigPanel />
      <SheetStylePanel />
    </div>
  )
}
