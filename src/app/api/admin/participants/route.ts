import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hasAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!await hasAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rawSearch = req.nextUrl.searchParams.get('search') ?? ''
  const search = rawSearch.slice(0, 100)
  const searchId = Number(search)

  const participants = await prisma.participant.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            ...(Number.isInteger(searchId) && searchId > 0 ? [{ id: searchId }] : []),
          ],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, age: true, gender: true,
      extraversion: true, agreeableness: true, conscientiousness: true,
      stability: true, openness: true,
      selfArtPrompt: true, selfDescription: true, createdAt: true,
      _count: { select: { prompts: true } },
    },
  })

  return NextResponse.json({ participants })
}
