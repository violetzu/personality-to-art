import fs from 'fs/promises'
import { randomUUID } from 'crypto'
import path from 'path'
import { getImagesDir } from './image-storage'

const IMAGES_DIR = getImagesDir()

interface GenerateOptions {
  width?: number
  height?: number
  steps?: number
}

export async function generateImage(prompt: string, opts: GenerateOptions = {}): Promise<string> {
  await fs.mkdir(IMAGES_DIR, { recursive: true })

  const abort = AbortSignal.timeout(300_000)
  const res = await fetch(`${process.env.FLUX_BASE_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.FLUX_API_SECRET
        ? { Authorization: `Bearer ${process.env.FLUX_API_SECRET}` }
        : {}),
    },
    body: JSON.stringify({
      prompt,
      width: opts.width ?? 1024,
      height: opts.height ?? 1024,
      steps: opts.steps ?? 4,
    }),
    signal: abort,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`FLUX error ${res.status}: ${err}`)
  }

  const { b64_json } = await res.json()
  if (!b64_json) throw new Error('No image returned from FLUX')

  const filename = `${randomUUID()}.png`
  await fs.writeFile(path.join(IMAGES_DIR, filename), Buffer.from(b64_json, 'base64'))

  return `/api/images/${filename}`
}
