import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { synthesizeImagePrompt } from '@/lib/llm'
import { generateImage } from '@/lib/flux'
import { hasParticipantAccess } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { checkOrigin } from '@/lib/origin'
import { parsePanasItems } from '@/lib/survey-config'

const GENERATION_LOCK_TTL_MS = 10 * 60 * 1000

export async function POST(req: NextRequest) {
  const blocked = checkOrigin(req)
  if (blocked) return blocked

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(`generate:${ip}`, 10, 60_000)) {
    console.warn(`[generate] rate_limited ip=${ip}`)
    return NextResponse.json({ error: '請求過於頻繁，請稍後再試' }, { status: 429 })
  }

  const { participantId } = await req.json()
  if (!participantId) return NextResponse.json({ error: 'Missing participantId' }, { status: 400 })
  const participantIdNum = Number(participantId)
  if (!Number.isInteger(participantIdNum) || participantIdNum <= 0) {
    return NextResponse.json({ error: 'Invalid participantId' }, { status: 400 })
  }
  if (!await hasParticipantAccess(participantIdNum)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const participant = await prisma.participant.findUnique({
    where: { id: participantIdNum },
  })
  if (!participant) return NextResponse.json({ error: '找不到受試者' }, { status: 404 })

  const now = new Date()
  const lockExpiresAt = new Date(now.getTime() + GENERATION_LOCK_TTL_MS)
  const lock = await prisma.participant.updateMany({
    where: {
      id: participantIdNum,
      OR: [
        { generationLockExpiresAt: null },
        { generationLockExpiresAt: { lt: now } },
      ],
    },
    data: { generationLockExpiresAt: lockExpiresAt },
  })
  if (lock.count === 0) {
    return NextResponse.json({ error: '作品仍在生成中，請稍候再試' }, { status: 409 })
  }

  const t0 = Date.now()
  console.log(`[generate] start participantId=${participantIdNum} ip=${ip}`)

  try {
    // Check retry limit
    const [retrySetting, stepsSetting, panasItemsSetting, count] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'maxRetries' } }),
      prisma.setting.findUnique({ where: { key: 'fluxSteps' } }),
      prisma.setting.findUnique({ where: { key: 'panasItems' } }),
      prisma.prompt.count({ where: { participantId: participantIdNum } }),
    ])
    const maxRetries = Number(retrySetting?.value ?? 3)
    const fluxSteps = Number(stepsSetting?.value ?? 28)
    const panasItems = parsePanasItems(panasItemsSetting?.value)
    const retriesUsed = Math.max(0, count - 1)
    if (retriesUsed >= maxRetries) {
      return NextResponse.json({ error: '已達重繪上限' }, { status: 400 })
    }

    // Build dimension object
    const dimensions = {
      extraversion: participant.extraversion,
      agreeableness: participant.agreeableness,
      conscientiousness: participant.conscientiousness,
      stability: participant.stability,
      openness: participant.openness,
    }

    const tipi = [
      participant.tipi1, participant.tipi2, participant.tipi3, participant.tipi4, participant.tipi5,
      participant.tipi6, participant.tipi7, participant.tipi8, participant.tipi9, participant.tipi10,
    ]
    const panas = [
      participant.panasActive, participant.panasNervous, participant.panasHappy,
      participant.panasAnxious, participant.panasEnergetic, participant.panasUpset,
      participant.panasExcited, participant.panasAfraid, participant.panasInterested,
      participant.panasDistressed, participant.panasInspired, participant.panasStressed,
    ]

    // 1. LLM synthesizes image prompt
    const t1 = Date.now()
    const imagePrompt = await synthesizeImagePrompt({
      age: participant.age,
      gender: participant.gender,
      tipi, panas, panasItems, dimensions,
      selfArtPrompt: participant.selfArtPrompt ?? '',
      selfDescription: participant.selfDescription ?? '',
    })

    console.log(`[generate] llm_done participantId=${participantIdNum} duration=${Date.now() - t1}ms`)

    // 2. FLUX.1 generates image
    const t2 = Date.now()
    const imageUrl = await generateImage(imagePrompt, { steps: fluxSteps })

    console.log(`[generate] flux_done participantId=${participantIdNum} duration=${Date.now() - t2}ms`)

    // 3. Save to DB
    const prompt = await prisma.prompt.create({
      data: {
        participantId: participantIdNum,
        promptText: imagePrompt,
        imageUrl,
      },
    })

    console.log(`[generate] done participantId=${participantIdNum} total=${Date.now() - t0}ms promptId=${prompt.id}`)
    return NextResponse.json({ prompt })
  } catch (e) {
    console.error(`[generate] error participantId=${participantIdNum} total=${Date.now() - t0}ms`, e)
    return NextResponse.json({ error: '生成失敗，請稍後再試' }, { status: 500 })
  } finally {
    await prisma.participant.updateMany({
      where: {
        id: participantIdNum,
        generationLockExpiresAt: lockExpiresAt,
      },
      data: { generationLockExpiresAt: null },
    })
  }
}
