import fs from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hasAdmin } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await hasAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const participant = await prisma.participant.findUnique({
    where: { id: Number(id) },
    include: { prompts: { orderBy: { createdAt: 'asc' } } },
  })

  if (!participant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ participant })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await hasAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const prompts = await prisma.prompt.findMany({
    where: { participantId: Number(id) },
    select: { imageUrl: true },
  })

  await prisma.participant.delete({ where: { id: Number(id) } })

  await Promise.allSettled(
    prompts.map(p => {
      const filename = path.basename(p.imageUrl)
      return fs.unlink(path.join(process.cwd(), 'data', 'images', filename))
    })
  )

  return NextResponse.json({ ok: true })
}
