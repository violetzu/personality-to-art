import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import { prisma } from '@/lib/db'
import { hasAdmin, hasParticipantAccess } from '@/lib/auth'
import { getImageFilePath } from '@/lib/image-storage'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  const safe = filename
  const filePath = getImageFilePath(safe)
  const imageUrl = `/api/images/${safe}`
  const token = req.nextUrl.searchParams.get('token')

  if (!await hasAdmin()) {
    const prompt = await prisma.prompt.findFirst({
      where: { imageUrl },
      select: { participantId: true },
    })
    if (!prompt || !hasParticipantAccess(token, prompt.participantId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const buf = await fs.readFile(filePath)
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, no-store, max-age=0',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
