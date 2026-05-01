import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { DEFAULT_PANAS_ITEMS } from '../src/lib/survey-config'

const connectionString =
  process.env.DATABASE_URL ??
  `postgresql://${process.env.POSTGRES_USER ?? 'eq_user'}:${process.env.POSTGRES_PASSWORD ?? ''}@${process.env.POSTGRES_HOST ?? 'localhost'}:${process.env.POSTGRES_PORT ?? '5432'}/${process.env.POSTGRES_DB ?? 'eq_research'}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  const setting = await prisma.setting.findUnique({ where: { key: 'panasItems' } })

  if (!setting) {
    console.log('panasItems 設定不存在，使用預設值，無需遷移。')
    return
  }

  let items: unknown[]
  try {
    items = JSON.parse(setting.value) as unknown[]
  } catch {
    console.error('panasItems JSON 解析失敗，請手動檢查。')
    return
  }

  if (!Array.isArray(items)) {
    console.error('panasItems 不是陣列，請手動檢查。')
    return
  }

  let changed = 0
  const updated = items.map((item: unknown, i: number) => {
    if (!item || typeof item !== 'object') return item
    const obj = item as Record<string, unknown>
    if (obj.valence === 'positive' || obj.valence === 'negative') return obj
    const valence = DEFAULT_PANAS_ITEMS[i]?.valence ?? (i % 2 === 0 ? 'positive' : 'negative')
    changed++
    return { ...obj, valence }
  })

  if (changed === 0) {
    console.log('所有題目已有 valence 欄位，無需遷移。')
    return
  }

  await prisma.setting.update({
    where: { key: 'panasItems' },
    data: { value: JSON.stringify(updated) },
  })

  console.log(`遷移完成：${changed} 題補上 valence 欄位。`)
  console.table(updated)
}

main().catch(console.error).finally(() => prisma.$disconnect())
