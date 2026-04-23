import type { PanasItem } from './survey-config'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function synthesizeImagePrompt(params: {
  age: number
  gender: string
  tipi: number[]
  panas: number[]
  panasItems: PanasItem[]
  selfArtPrompt: string
  selfDescription: string
  dimensions: {
    extraversion: number
    agreeableness: number
    conscientiousness: number
    stability: number
    openness: number
  }
}): Promise<string> {
  const { age, gender, panas, panasItems, selfArtPrompt, selfDescription, dimensions } = params

  const panasStr = panas.map((v, i) => {
    const item = panasItems[i]
    const label = item?.label?.trim() || `Item ${i + 1}`
    return `${label}: ${v}`
  }).join(', ')
  const dimStr = Object.entries(dimensions)
    .map(([k, v]) => `${k}: ${v.toFixed(2)}`)
    .join(', ')

  const userMessage = `
Generate ONE image generation prompt for FLUX.1 based on the following participant data.

PRIMARY INPUT (must be faithfully reflected):
- Art vision: "${selfArtPrompt}"
- Self-description: "${selfDescription}"

SECONDARY CONTEXT (use to enrich mood and atmosphere only):
- Big Five personality (1-5): ${dimStr}
- Current emotions (PANAS 1-5): ${panasStr}
- Age: ${age}, Gender: ${gender}

Requirements:
- Write in English using natural language sentences, not keyword lists
- The style, subject, and composition MUST come from the art vision above — do not invent or override them
- Put the most important visual elements FIRST (subject, style, mood)
- Use personality and emotion only to deepen the mood and color palette, not to replace what the participant described
- Do not add human figures unless the art vision mentions people or characters
- STRICTLY under 50 words, no explanations, output ONLY the prompt text
`.trim()

  const messages: Message[] = [
    {
      role: 'system',
      content: `You are an expert art director who translates psychological profiles into vivid image generation prompts. Output only the prompt text, nothing else. [req:${Math.random().toString(36).slice(2)}]`,
    },
    { role: 'user', content: userMessage },
  ]

  const abort = AbortSignal.timeout(120_000)
  const res = await fetch(`${process.env.CHAT_API_ENDPOINT}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CHAT_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.CHAT_MODEL_NAME,
      messages,
      max_tokens: 1500,
      temperature: 0.8,
    }),
    signal: abort,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LLM error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  console.log('[LLM] raw content:', JSON.stringify(content))
  if (!content) throw new Error('LLM returned empty response')

  // strip <think>...</think> reasoning blocks if present
  const cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

  // truncated: only got thinking block, no actual prompt
  if (!cleaned || cleaned.startsWith('<think>')) {
    throw new Error('LLM response truncated — only thinking block received, no prompt generated')
  }

  console.log('[LLM] cleaned content:', JSON.stringify(cleaned))
  return cleaned
}
