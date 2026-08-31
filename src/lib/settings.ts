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
