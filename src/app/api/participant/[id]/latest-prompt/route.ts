import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hasParticipantAccess, withImageAccessToken } from '@/lib/auth'
import { imageExists } from '@/lib/image-storage'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const participantId = Number(id)
  if (!Number.isInteger(participantId) || participantId <= 0) {
    return NextResponse.json({ error: '無效的參與者 ID' }, { status: 400 })
  }
  const token = req.nextUrl.searchParams.get('token')
  if (!hasParticipantAccess(token, participantId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const accessToken = token ?? ''

  const [prompts, setting, count] = await Promise.all([
    prisma.prompt.findMany({
      where: { participantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.setting.findUnique({ where: { key: 'maxRetries' } }),
    prisma.prompt.count({ where: { participantId } }),
  ])

  if (prompts.length === 0) return NextResponse.json({ error: '尚未生成' }, { status: 404 })

  let prompt = null
  for (const candidate of prompts) {
    if (await imageExists(candidate.imageUrl)) {
      prompt = candidate
      break
    }
  }

  const maxRetries = Number(setting?.value ?? 3)
  if (!prompt) {
    return NextResponse.json({
      prompt: null,
      maxRetries,
      retriesUsed: Math.max(0, count - 1),
      imageMissing: true,
      error: '找不到已保存的作品檔案，請重新生成作品',
    })
  }

  return NextResponse.json({
    prompt: {
      ...prompt,
      imageUrl: withImageAccessToken(prompt.imageUrl, accessToken),
    },
    maxRetries,
    retriesUsed: Math.max(0, count - 1),
  })
}
