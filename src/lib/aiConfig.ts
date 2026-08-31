export interface AIConfig {
  apiUrl: string
  model: string
  apiKey: string
  vision: boolean | null
}

interface EncryptedKey {
  iv: string
  data: string
}

interface StoredAIConfig {
  apiUrl: string
  model: string
  vision?: boolean | null
  key: EncryptedKey
}

const CONFIG_KEY = 'radio-exam.ai-config.v1'
const DB_NAME = 'radio-exam-ai'
const DB_VERSION = 1
const STORE_NAME = 'keys'
const KEY_ID = 'aes-gcm'

/**
 * API Key 安全存储方案（纯前端，无服务器）：
 * - 使用 Web Crypto AES-GCM 加密 API Key；
 * - 加密密钥为不可导出（non-extractable）的 CryptoKey，存放在 IndexedDB；
 * - localStorage 只保存密文（iv + data），不保存明文；
 * - 浏览器环境无法 100% 防止本机脚本解密，但满足“不落明文、不上传服务器”的要求。
 */

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB 打开失败'))
  })
}

function idbGet(db: IDBDatabase, id: string): Promise<CryptoKey | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(id)
    req.onsuccess = () => resolve(req.result as CryptoKey | undefined)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB 读取失败'))
  })
}

function idbPut(db: IDBDatabase, id: string, value: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(value, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB 写入失败'))
  })
}

async function getOrCreateKey(): Promise<CryptoKey> {
  const db = await openDb()
  try {
    const existing = await idbGet(db, KEY_ID)
    if (existing) return existing
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable：无法从 IndexedDB 导出密钥
      ['encrypt', 'decrypt'],
    )
    await idbPut(db, KEY_ID, key)
    return key
  } finally {
    db.close()
  }
}

function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function b64ToBuf(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function encryptText(plain: string, key: CryptoKey): Promise<EncryptedKey> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  )
  return { iv: bufToB64(iv), data: bufToB64(data) }
}

async function decryptText(enc: EncryptedKey, key: CryptoKey): Promise<string> {
  const data = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBuf(enc.iv) },
    key,
    b64ToBuf(enc.data),
  )
  return new TextDecoder().decode(data)
}

export async function saveAIConfig(config: AIConfig): Promise<void> {
  try {
    const key = await getOrCreateKey()
    const enc = await encryptText(config.apiKey, key)
    const stored: StoredAIConfig = {
      apiUrl: config.apiUrl.trim(),
      model: config.model.trim(),
      vision: config.vision ?? null,
      key: enc,
    }
    localStorage.setItem(CONFIG_KEY, JSON.stringify(stored))
  } catch (e) {
    console.error('保存 AI 配置失败', e)
    throw new Error('AI 配置保存失败，请重试')
  }
}

export async function loadAIConfig(): Promise<AIConfig | null> {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAIConfig
    if (
      !parsed ||
      typeof parsed.apiUrl !== 'string' ||
      typeof parsed.model !== 'string' ||
      !parsed.key ||
      typeof parsed.key.iv !== 'string' ||
      typeof parsed.key.data !== 'string'
    ) {
      return null
    }
    const db = await openDb()
    try {
      const key = await idbGet(db, KEY_ID)
      if (!key) return null
      const apiKey = await decryptText(parsed.key, key)
      if (!apiKey) return null
      return {
        apiUrl: parsed.apiUrl,
        model: parsed.model,
        apiKey,
        vision: typeof parsed.vision === 'boolean' ? parsed.vision : null,
      }
    } finally {
      db.close()
    }
  } catch (e) {
    console.error('读取 AI 配置失败', e)
    return null
  }
}

export function isAIConfiguredSync(): boolean {
  return Boolean(localStorage.getItem(CONFIG_KEY))
}

export function clearAIConfig(): void {
  localStorage.removeItem(CONFIG_KEY)
}
