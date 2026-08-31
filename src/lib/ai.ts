import { loadAIConfig } from './aiConfig'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export const AI_API_PRESETS: { name: string; url: string }[] = [
  { name: 'OpenAI', url: 'https://api.openai.com/v1' },
  { name: 'DeepSeek', url: 'https://api.deepseek.com' },
  { name: 'Moonshot (Kimi)', url: 'https://api.moonshot.cn/v1' },
  { name: '智谱 GLM', url: 'https://open.bigmodel.cn/api/paas/v4' },
  { name: '阿里云百炼 (Qwen)', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { name: 'SiliconFlow', url: 'https://api.siliconflow.cn/v1' },
]

export const AI_MODEL_PRESETS: string[] = [
  'gpt-4o-mini',
  'gpt-4o',
  'deepseek-v4-flash',
  'deepseek-v4-pro',
  'deepseek-v4-flash-vision-exp',
  'moonshot-v1-8k',
  'glm-4-flash',
  'qwen-turbo',
]

export class AINotConfiguredError extends Error {
  constructor() {
    super('AI_NOT_CONFIGURED')
    this.name = 'AINotConfiguredError'
  }
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
