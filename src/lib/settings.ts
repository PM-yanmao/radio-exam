export type SheetStyle = 'full' | 'scroll'

const SHEET_STYLE_KEY = 'radio-exam.sheet-style.v1'

export function getSheetStyle(): SheetStyle {
  try {
    return localStorage.getItem(SHEET_STYLE_KEY) === 'full' ? 'full' : 'scroll'
  } catch {
    return 'scroll'
  }
}

export function setSheetStyle(style: SheetStyle): void {
  localStorage.setItem(SHEET_STYLE_KEY, style)
}

export type InkMode = 'auto' | 'on' | 'off'

const INK_MODE_KEY = 'radio-exam.ink-mode.v1'

export function getInkMode(): InkMode {
  try {
    const v = localStorage.getItem(INK_MODE_KEY)
    return v === 'on' || v === 'off' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

export function setInkMode(mode: InkMode): void {
  localStorage.setItem(INK_MODE_KEY, mode)
}

export function isInkEffective(): boolean {
  const mode = getInkMode()
  if (mode === 'on') return true
  if (mode === 'off') return false
  try {
    return window.matchMedia('(prefers-contrast: more)').matches
  } catch {
    return false
  }
}
