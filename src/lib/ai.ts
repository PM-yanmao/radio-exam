import { loadAIConfig } from './aiConfig'

export type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ChatContentPart[]
}

export const AI_API_PRESETS: { name: string; url: string }[] = [
  { name: 'OpenAI', url: 'https://api.openai.com/v1' },
  { name: 'DeepSeek', url: 'https://api.deepseek.com' },
  { name: 'Moonshot (Kimi)', url: 'https://api.moonshot.cn/v1' },
  { name: '智谱 GLM', url: 'https://open.bigmodel.cn/api/paas/v4' },
  { name: '阿里云百炼 (Qwen)', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { name: 'SiliconFlow', url: 'https://api.siliconflow.cn/v1' },
]

/** 实时从 OpenAI 兼容的 /models 接口获取模型列表 */
export async function fetchModels(apiUrl: string, apiKey: string): Promise<string[]> {
  const base = apiUrl.trim().replace(/\/+$/, '')
  let res: Response
  try {
    res = await fetch(`${base}/models`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
    })
  } catch (e) {
    console.error('获取模型列表网络请求失败', e)
    throw new Error('网络连接失败，请检查 API 地址')
  }

  if (!res.ok) {
    let detail = ''
    try {
      const data = await res.json()
      detail = data?.error?.message || JSON.stringify(data)
    } catch {
      detail = await res.text().catch(() => '')
    }
    console.error(`获取模型列表失败（HTTP ${res.status}）`, detail)
    throw new Error(`获取模型列表失败（HTTP ${res.status}）`)
  }

  const data = await res.json()
  const ids: string[] = (data?.data ?? [])
    .map((item: { id?: unknown }) => (typeof item?.id === 'string' ? item.id : ''))
    .filter((id: string) => id.trim() !== '')
  if (ids.length === 0) {
    console.error('获取模型列表返回为空', data)
    throw new Error('未获取到可用模型，请手动输入')
  }
  return ids
}

export class AINotConfiguredError extends Error {
  constructor() {
    super('AI_NOT_CONFIGURED')
    this.name = 'AINotConfiguredError'
  }
}

const TINY_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/**
 * 通过发送一张 1x1 透明 GIF 探测模型是否支持图片输入。
 * 返回 true=支持，false=服务端明确报错（视为不支持），null=网络等原因无法确认。
 */
export async function detectVisionSupport(
  apiUrl: string,
  apiKey: string,
  model: string,
): Promise<boolean | null> {
  const base = apiUrl.trim().replace(/\/+$/, '')
  let res: Response
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Reply with OK' },
              { type: 'image_url', image_url: { url: TINY_IMAGE } },
            ],
          },
        ],
        max_tokens: 1,
        stream: false,
      }),
    })
  } catch (e) {
    console.error('视觉能力检测网络请求失败', e)
    return null
  }

  if (res.ok) return true

  let detail = ''
  try {
    const data = await res.json()
    detail = data?.error?.message || JSON.stringify(data)
  } catch {
    detail = await res.text().catch(() => '')
  }
  console.error(`视觉能力检测失败（HTTP ${res.status}）`, detail)
  return false
}

export async function requestAI(messages: ChatMessage[]): Promise<string> {
  const config = await loadAIConfig()
  if (!config) throw new AINotConfiguredError()

  const base = config.apiUrl.replace(/\/+$/, '')
  const url = `${base}/chat/completions`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.3,
        stream: false,
      }),
    })
  } catch (e) {
    console.error('AI 网络请求失败', e)
    throw new Error('网络连接失败，请检查网络后重试')
  }

  if (!res.ok) {
    let detail = ''
    try {
      const data = await res.json()
      detail = data?.error?.message || JSON.stringify(data)
    } catch {
      detail = await res.text().catch(() => '')
    }
    console.error(`AI 服务错误（HTTP ${res.status}）`, detail)
    throw new Error(`AI 服务返回错误（HTTP ${res.status}），请检查 API 地址、模型名称或 API Key`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    console.error('AI 返回内容为空', data)
    throw new Error('AI 返回内容为空，请稍后重试')
  }
  return content.trim()
}
