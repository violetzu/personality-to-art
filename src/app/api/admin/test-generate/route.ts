import { NextRequest, NextResponse } from 'next/server'
import { hasAdmin } from '@/lib/auth'
import { generateImage } from '@/lib/flux'

export async function POST(req: NextRequest) {
  if (!await hasAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { prompt, width, height, steps } = await req.json()
    if (!prompt?.trim()) return NextResponse.json({ error: '請輸入提示詞' }, { status: 400 })

    const widthNum = width === undefined ? undefined : Number(width)
    const heightNum = height === undefined ? undefined : Number(height)
    const stepsNum = steps === undefined ? undefined : Number(steps)

    if (widthNum !== undefined && (!Number.isInteger(widthNum) || widthNum < 256 || widthNum > 2048)) {
      return NextResponse.json({ error: '寬度格式錯誤' }, { status: 400 })
    }
    if (heightNum !== undefined && (!Number.isInteger(heightNum) || heightNum < 256 || heightNum > 2048)) {
      return NextResponse.json({ error: '高度格式錯誤' }, { status: 400 })
    }
    if (stepsNum !== undefined && (!Number.isInteger(stepsNum) || stepsNum < 1 || stepsNum > 50)) {
      return NextResponse.json({ error: 'Steps 格式錯誤' }, { status: 400 })
    }

    const url = await generateImage(prompt.trim(), {
      width: widthNum,
      height: heightNum,
      steps: stepsNum,
    })
    return NextResponse.json({ url })
  } catch (error) {
    console.error('admin test generate failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失敗' },
      { status: 500 }
    )
  }
}
