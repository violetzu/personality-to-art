import fs from 'fs/promises'
import path from 'path'

export interface PromptAnalysis {
  description: string
  bigFive: {
    extraversion: number
    agreeableness: number
    conscientiousness: number
    stability: number
    openness: number
  }
  panas: {
    active: number
    nervous: number
    happy: number
    anxious: number
    energetic: number
    upset: number
    excited: number
    afraid: number
    interested: number
    distressed: number
    inspired: number
    stressed: number
  }
  analyzedAt: string
}

function isScore(v: unknown): boolean {
  return typeof v === 'number' && v >= 1 && v <= 5
}

function validateAnalysis(data: unknown): data is Omit<PromptAnalysis, 'analyzedAt'> {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if (typeof d.description !== 'string' || !d.description) return false
  const bf = d.bigFive as Record<string, unknown>
  if (!bf || typeof bf !== 'object') return false
  for (const k of ['extraversion', 'agreeableness', 'conscientiousness', 'stability', 'openness']) {
    if (!isScore(bf[k])) return false
  }
  const panas = d.panas as Record<string, unknown>
  if (!panas || typeof panas !== 'object') return false
  for (const k of ['active', 'nervous', 'happy', 'anxious', 'energetic', 'upset', 'excited', 'afraid', 'interested', 'distressed', 'inspired', 'stressed']) {
    if (!isScore(panas[k])) return false
  }
  return true
}

export async function analyzeImage(imageUrl: string): Promise<PromptAnalysis> {
  // imageUrl is like /api/images/filename.png — read file directly
  const filename = path.basename(imageUrl)
  const filePath = path.join(process.cwd(), 'data', 'images', filename)
  const buf = await fs.readFile(filePath)
  const b64 = buf.toString('base64')

  const systemPrompt = `You are a psychologist and art analyst. Given an AI-generated artwork, infer the psychological profile of its creator. You must respond with ONLY valid JSON, no markdown, no explanation.`

  const userPrompt = `Analyze this artwork and infer the creator's psychological profile.

Return ONLY this JSON structure (all numeric scores 1-5):
{
  "description": "2-3 sentence personality description inferred from the artwork",
  "bigFive": {
    "extraversion": <1-5>,
    "agreeableness": <1-5>,
    "conscientiousness": <1-5>,
    "stability": <1-5>,
    "openness": <1-5>
  },
  "panas": {
    "active": <1-5>, "nervous": <1-5>, "happy": <1-5>, "anxious": <1-5>, "energetic": <1-5>, "upset": <1-5>,
    "excited": <1-5>, "afraid": <1-5>, "interested": <1-5>, "distressed": <1-5>, "inspired": <1-5>, "stressed": <1-5>
  }
}`

  const abort = AbortSignal.timeout(120_000)
  const res = await fetch(`${process.env.CHAT_API_ENDPOINT}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CHAT_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.VISION_MODEL_NAME ?? 'gpt-oss-120b',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
            { type: 'text', text: userPrompt },
          ],
        },
      ],
      max_tokens: 600,
      temperature: 0.3,
    }),
    signal: abort,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Vision API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  let content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response from vision model')

  // strip think tags if present
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

  // extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON found in response: ${content}`)

  const parsed = JSON.parse(jsonMatch[0])
  if (!validateAnalysis(parsed)) {
    throw new Error('Vision API returned unexpected schema')
  }
  return { ...parsed, analyzedAt: new Date().toISOString() }
}
