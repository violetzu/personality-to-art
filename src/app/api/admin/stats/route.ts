import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hasAdmin } from '@/lib/auth'

export async function GET() {
  if (!await hasAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [totalParticipants, totalPrompts, promptCounts] = await Promise.all([
    prisma.participant.count(),
    prisma.prompt.count(),
    prisma.prompt.groupBy({
      by: ['participantId'],
      _count: { _all: true },
    }),
  ])

  const participantsWithRetry = promptCounts.filter(item => item._count._all > 1).length

  return NextResponse.json({
    stats: {
      totalParticipants,
      totalPrompts,
      avgImagesPerParticipant: totalParticipants > 0 ? totalPrompts / totalParticipants : null,
      retryParticipantRate: totalParticipants > 0 ? participantsWithRetry / totalParticipants : null,
    },
  })
}
