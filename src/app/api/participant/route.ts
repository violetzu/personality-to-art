import fs from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getResumeParticipantId, setParticipantAccessCookie, setParticipantCookie } from '@/lib/auth'
import { checkOrigin } from '@/lib/origin'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  computeDimensions,
  parseTipiScoring,
  SELF_ART_PROMPT_MAX_LENGTH,
  SELF_DESCRIPTION_MAX_LENGTH,
} from '@/lib/survey-config'
import { getImageFilePath } from '@/lib/image-storage'

export async function POST(req: NextRequest) {
  const blocked = checkOrigin(req)
  if (blocked) return blocked

  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(`participant:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: '請求過於頻繁，請稍後再試' }, { status: 429 })
  }

  const body = await req.json()
  const { name, age, gender, tipi, panas, selfArtPrompt, selfDescription } = body
  const normalizedName = String(name ?? '').trim()
  const normalizedGender = String(gender ?? '').trim()
  const normalizedSelfArtPrompt = String(selfArtPrompt ?? '').trim()
  const normalizedSelfDescription = String(selfDescription ?? '').trim()

  const ageNum = Number(age)
  if (!normalizedName || !Number.isInteger(ageNum) || ageNum < 10 || ageNum > 100 || !normalizedGender
    || tipi?.length !== 10 || panas?.length !== 12) {
    return NextResponse.json({ error: '資料不完整' }, { status: 400 })
  }
  if (normalizedSelfArtPrompt.length > SELF_ART_PROMPT_MAX_LENGTH) {
    return NextResponse.json({ error: `自我意象藝術作品最多 ${SELF_ART_PROMPT_MAX_LENGTH} 字` }, { status: 400 })
  }
  if (normalizedSelfDescription.length > SELF_DESCRIPTION_MAX_LENGTH) {
    return NextResponse.json({ error: `自我描述最多 ${SELF_DESCRIPTION_MAX_LENGTH} 字` }, { status: 400 })
  }
  const inRange = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5
  if (!tipi.every(inRange) || !panas.every(inRange)) {
    return NextResponse.json({ error: '量表數值無效' }, { status: 400 })
  }

  const scoringSetting = await prisma.setting.findUnique({ where: { key: 'tipiScoring' } })
  const dimensions = computeDimensions(tipi, parseTipiScoring(scoringSetting?.value))
  if (Object.values(dimensions).some(v => !Number.isFinite(v))) {
    return NextResponse.json({ error: '量表計分失敗' }, { status: 400 })
  }

  const participantData = {
    name: normalizedName, age: ageNum, gender: normalizedGender,
    tipi1: tipi[0], tipi2: tipi[1], tipi3: tipi[2], tipi4: tipi[3], tipi5: tipi[4],
    tipi6: tipi[5], tipi7: tipi[6], tipi8: tipi[7], tipi9: tipi[8], tipi10: tipi[9],
    panasActive: panas[0], panasNervous: panas[1], panasHappy: panas[2],
    panasAnxious: panas[3], panasEnergetic: panas[4], panasUpset: panas[5],
    panasExcited: panas[6], panasAfraid: panas[7], panasInterested: panas[8],
    panasDistressed: panas[9], panasInspired: panas[10], panasStressed: panas[11],
    extraversion: dimensions.extraversion,
    agreeableness: dimensions.agreeableness,
    conscientiousness: dimensions.conscientiousness,
    stability: dimensions.stability,
    openness: dimensions.openness,
    selfArtPrompt: normalizedSelfArtPrompt || null,
    selfDescription: normalizedSelfDescription || null,
    generationLockExpiresAt: null,
  }

  const resumeParticipantId = await getResumeParticipantId()
  let participant: { id: number }
  let staleImageUrls: string[] = []

  if (resumeParticipantId) {
    const existingParticipant = await prisma.participant.findUnique({
      where: { id: resumeParticipantId },
      select: {
        id: true,
        generationLockExpiresAt: true,
        prompts: { select: { imageUrl: true } },
      },
    })

    if (existingParticipant) {
      if (existingParticipant.generationLockExpiresAt && existingParticipant.generationLockExpiresAt > new Date()) {
        return NextResponse.json(
          { error: '目前正在生成上一張作品，請等待完成後再修改問卷' },
          { status: 409 }
        )
      }
      staleImageUrls = existingParticipant.prompts.map((prompt: { imageUrl: string }) => prompt.imageUrl)
      const [, updatedParticipant] = await prisma.$transaction([
        prisma.prompt.deleteMany({ where: { participantId: existingParticipant.id } }),
        prisma.participant.update({
          where: { id: existingParticipant.id },
          data: participantData,
          select: { id: true },
        }),
      ])
      console.log(`[participant] updated id=${updatedParticipant.id}`)
      participant = updatedParticipant
    } else {
      participant = await prisma.participant.create({
        data: participantData,
        select: { id: true },
      })
      console.log(`[participant] created id=${participant.id}`)
    }
  } else {
    participant = await prisma.participant.create({
      data: participantData,
      select: { id: true },
    })
    console.log(`[participant] created id=${participant.id}`)
  }

  await Promise.allSettled(staleImageUrls.map(imageUrl => fs.unlink(getImageFilePath(imageUrl))))

  await setParticipantCookie(participant.id)
  await setParticipantAccessCookie(participant.id)
  return NextResponse.json({ id: participant.id })
}
