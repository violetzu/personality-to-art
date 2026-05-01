export interface TipiScoring {
  dimension: 'E' | 'A' | 'C' | 'S' | 'O'
  reverse: boolean
}

export interface PanasItem {
  label: string
  valence: 'positive' | 'negative'
}

export interface TagCategory {
  category: string
  tags: string[]
}

export interface SurveyDescriptions {
  basicSubtitle: string
  tipiInstruction: string
  panasInstruction: string
  textSubtitle: string
  artPromptInstruction: string
  selfDescInstruction: string
  artPromptHints: string
}

export interface SurveyConfig {
  tipiQuestions: string[]
  tipiScoring: TipiScoring[]
  panasItems: PanasItem[]
  quickTags: TagCategory[]
  descriptions: SurveyDescriptions
}

export const SELF_ART_PROMPT_MAX_LENGTH = 500
export const SELF_DESCRIPTION_MAX_LENGTH = 120

const DIMENSIONS = ['E', 'A', 'C', 'S', 'O'] as const
const DESCRIPTION_KEYS = [
  'basicSubtitle',
  'tipiInstruction',
  'panasInstruction',
  'textSubtitle',
  'artPromptInstruction',
  'selfDescInstruction',
  'artPromptHints',
] as const

export const DIMENSION_LABELS: Record<string, string> = {
  E: '外向性', A: '親和性', C: '盡責性', S: '情緒穩定性', O: '開放性',
}

export const DEFAULT_TIPI_QUESTIONS = [
  '較為保留、安靜的',
  '基本上信任他人的',
  '傾向於懶散的',
  '很放鬆、能很好處理壓力的',
  '對藝術興趣不大的',
  '外向、社交能力強的',
  '傾向於找別人缺點的',
  '做事徹底、盡責的',
  '容易感到緊張的',
  '想像力豐富的',
]

export const DEFAULT_TIPI_SCORING: TipiScoring[] = [
  { dimension: 'E', reverse: true },
  { dimension: 'A', reverse: false },
  { dimension: 'C', reverse: true },
  { dimension: 'S', reverse: false },
  { dimension: 'O', reverse: true },
  { dimension: 'E', reverse: false },
  { dimension: 'A', reverse: true },
  { dimension: 'C', reverse: false },
  { dimension: 'S', reverse: true },
  { dimension: 'O', reverse: false },
]

export const DEFAULT_PANAS_ITEMS: PanasItem[] = [
  { label: '積極的', valence: 'positive' },
  { label: '緊張的', valence: 'negative' },
  { label: '愉快的', valence: 'positive' },
  { label: '焦慮的', valence: 'negative' },
  { label: '有活力的', valence: 'positive' },
  { label: '心煩意亂的', valence: 'negative' },
  { label: '興奮的', valence: 'positive' },
  { label: '敏感的', valence: 'negative' },
  { label: '對事物感到有興趣', valence: 'positive' },
  { label: '沮喪的', valence: 'negative' },
  { label: '受到鼓舞的', valence: 'positive' },
  { label: '有壓力的', valence: 'negative' },
]

export const DEFAULT_QUICK_TAGS: TagCategory[] = [
  {
    category: '正向特質',
    tags: ['活潑', '有創意', '有耐心', '親和力', '專注力', '負責', '樂觀', '勇敢', '溫和', '獨立', '謹慎'],
  },
  {
    category: '負向特質',
    tags: ['容易緊張', '內向', '沒自信', '焦慮', '猶豫', '固執', '敏感', '沒耐心', '壓抑'],
  },
]

export const DEFAULT_DESCRIPTIONS: SurveyDescriptions = {
  basicSubtitle: '您的資料僅供學術研究，請放心填寫',
  tipiInstruction: '「我是一個___的人」，請選擇最符合您的程度',
  panasInstruction: '我現在的情緒，請選擇符合程度',
  textSubtitle: '最後兩個問題，完成後即可生成專屬藝術作品',
  artPromptInstruction: '請用文字描述一個「最能代表你自己的作品」（不限形式，例如圖片、場景、插畫、風格等）。',
  selfDescInstruction: '請用三～五個詞描述自己，可點選快速標籤或自行輸入',
  artPromptHints: `你可以從以下幾個方向來思考：

**1. 色彩（Color）**
- 整體是明亮還是偏暗？
- 偏暖色（紅、橘）還是冷色（藍、紫）？
- 顏色是強烈、飽和，還是柔和、淡淡的？

*範例：「整體是柔和的粉色調，帶一點暖色系的光」*

**2. 風格（Style）**
- 偏寫實、卡通、抽象，還是夢幻？
- 是簡約還是細節很多？
- 有沒有特定風格（例如日系、美式、復古、未來感）？

*範例：「偏夢幻插畫風格，有點像童話故事的感覺」*

**3. 光線與氛圍（Lighting & Mood）**
- 是白天、夜晚、黃昏？
- 光線是柔和還是強烈？
- 整體感覺是溫暖、孤單、神秘、快樂？

*範例：「在夕陽下，光線很溫暖，有點安靜的氛圍」*

**4. 主體內容（Subject）**
- 畫面裡有什麼？（人、動物、物品、場景）
- 有沒有特別的動作或情境？

*範例：「一個人在房間裡畫畫，旁邊有貓陪著」*

**5. 想傳達的感覺（Emotion / Meaning）**
- 這個作品代表你的什麼特質？
- 想讓別人感受到什麼？

*範例：「代表我比較內向，但很喜歡自己的小世界」*

---

**綜合範例**

「畫的整體偏柔和的暖色調，是在下午有夕陽的時候，一個人坐在海邊，讓我感到很安心，整體插畫風格」`,
}

export const DEFAULT_HOME_INTRO = `親愛的受試者您好：

感謝您參與本研究。本問卷旨在了解使用者與 AI 互動時所撰寫之提示詞，是否能反映個人特質與情緒狀態。

填答內容包含簡短人格與情緒題目，以及一段「最能代表您的作品」之描述。提示詞請盡量具體完整，以利後續分析。所有資料皆採匿名處理，僅供學術研究使用。

本問卷無標準答案，請依直覺與真實想法填答。感謝您的協助！

---

xx大學 xxxx學系 xx班
研究生：xxx 敬上`

export function parseHomeIntro(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_HOME_INTRO
  const trimmed = raw.trim()
  return trimmed || DEFAULT_HOME_INTRO
}

function parseStoredJson(raw: string | null | undefined): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function normalizeFixedStringArray(value: unknown, expectedLength: number): string[] | null {
  if (!Array.isArray(value) || value.length !== expectedLength) return null
  const normalized = value.map(item => typeof item === 'string' ? item.trim() : '')
  return normalized.every(Boolean) ? normalized : null
}

function normalizeTipiScoring(value: unknown): TipiScoring[] | null {
  if (!Array.isArray(value) || value.length !== DEFAULT_TIPI_SCORING.length) return null
  const normalized = value.map(item => {
    if (!item || typeof item !== 'object') return null
    const dimension = 'dimension' in item ? item.dimension : undefined
    const reverse = 'reverse' in item ? item.reverse : undefined
    if (!DIMENSIONS.includes(dimension as typeof DIMENSIONS[number]) || typeof reverse !== 'boolean') {
      return null
    }
    return { dimension, reverse } as TipiScoring
  })
  return normalized.every(Boolean) ? normalized as TipiScoring[] : null
}

function normalizePanasItems(value: unknown): PanasItem[] | null {
  if (!Array.isArray(value) || value.length !== DEFAULT_PANAS_ITEMS.length) return null
  const normalized = value.map((item, i) => {
    if (!item || typeof item !== 'object') return null
    const label = 'label' in item && typeof item.label === 'string' ? item.label.trim() : ''
    if (!label) return null
    const rawValence = 'valence' in item ? item.valence : undefined
    const valence: 'positive' | 'negative' =
      rawValence === 'positive' || rawValence === 'negative'
        ? rawValence
        : (DEFAULT_PANAS_ITEMS[i]?.valence ?? (i % 2 === 0 ? 'positive' : 'negative'))
    return { label, valence }
  })
  if (!normalized.every(Boolean)) return null
  const labels = normalized.map(i => i!.label)
  if (new Set(labels).size !== labels.length) return null
  return normalized as PanasItem[]
}

function normalizeQuickTags(value: unknown): TagCategory[] | null {
  if (!Array.isArray(value)) return null
  const normalized = value.map(item => {
    if (!item || typeof item !== 'object') return null
    const category = 'category' in item && typeof item.category === 'string' ? item.category.trim() : ''
    const rawTags = 'tags' in item && Array.isArray(item.tags) ? item.tags as unknown[] : null
    const tags = rawTags
      ? rawTags.map((tag: unknown) => typeof tag === 'string' ? tag.trim() : '').filter(Boolean)
      : null
    if (!category || !tags || tags.length === 0) return null
    return { category, tags: Array.from(new Set(tags)) }
  })
  return normalized.every(Boolean) ? normalized as TagCategory[] : null
}

function normalizeDescriptions(value: unknown): Partial<SurveyDescriptions> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<Record<typeof DESCRIPTION_KEYS[number], unknown>>
  const normalized: Partial<SurveyDescriptions> = {}
  for (const key of DESCRIPTION_KEYS) {
    const raw = record[key]
    if (raw === undefined) continue
    if (typeof raw !== 'string' || !raw.trim()) return null
    normalized[key] = raw.trim()
  }
  return normalized
}

export function parseTipiQuestions(raw: string | null | undefined): string[] {
  return normalizeFixedStringArray(parseStoredJson(raw), DEFAULT_TIPI_QUESTIONS.length) ?? DEFAULT_TIPI_QUESTIONS
}

export function parseTipiScoring(raw: string | null | undefined): TipiScoring[] {
  return normalizeTipiScoring(parseStoredJson(raw)) ?? DEFAULT_TIPI_SCORING
}

export function parsePanasItems(raw: string | null | undefined): PanasItem[] {
  return normalizePanasItems(parseStoredJson(raw)) ?? DEFAULT_PANAS_ITEMS
}

export function parseQuickTags(raw: string | null | undefined): TagCategory[] {
  return normalizeQuickTags(parseStoredJson(raw)) ?? DEFAULT_QUICK_TAGS
}

export function parseDescriptions(raw: string | null | undefined): SurveyDescriptions {
  return {
    ...DEFAULT_DESCRIPTIONS,
    ...(normalizeDescriptions(parseStoredJson(raw)) ?? {}),
  }
}

export function validateTipiQuestionsInput(value: unknown): string[] | null {
  return normalizeFixedStringArray(value, DEFAULT_TIPI_QUESTIONS.length)
}

export function validateTipiScoringInput(value: unknown): TipiScoring[] | null {
  return normalizeTipiScoring(value)
}

export function validatePanasItemsInput(value: unknown): PanasItem[] | null {
  return normalizePanasItems(value)
}

export function validateQuickTagsInput(value: unknown): TagCategory[] | null {
  return normalizeQuickTags(value)
}

export function validateDescriptionsInput(value: unknown): Partial<SurveyDescriptions> | null {
  return normalizeDescriptions(value)
}

export function parseSurveyConfigMap(map: Record<string, string | undefined>): SurveyConfig {
  return {
    tipiQuestions: parseTipiQuestions(map.tipiQuestions),
    tipiScoring: parseTipiScoring(map.tipiScoring),
    panasItems: parsePanasItems(map.panasItems),
    quickTags: parseQuickTags(map.quickTags),
    descriptions: parseDescriptions(map.descriptions),
  }
}

export function computePanas(scores: number[], items: PanasItem[]): { pa: number; na: number } {
  let paSum = 0, paCount = 0, naSum = 0, naCount = 0
  items.forEach((item, i) => {
    if (item.valence === 'positive') { paSum += scores[i]; paCount++ }
    else { naSum += scores[i]; naCount++ }
  })
  return { pa: paCount > 0 ? paSum / paCount : 0, na: naCount > 0 ? naSum / naCount : 0 }
}

export function computeDimensions(tipi: (number | null)[], scoring: TipiScoring[]) {
  const t = tipi.map(v => v ?? 3)
  const sums: Record<string, number> = { E: 0, A: 0, C: 0, S: 0, O: 0 }
  const counts: Record<string, number> = { E: 0, A: 0, C: 0, S: 0, O: 0 }
  scoring.forEach((s, i) => {
    sums[s.dimension] += s.reverse ? (6 - t[i]) : t[i]
    counts[s.dimension]++
  })
  return {
    extraversion: sums.E / (counts.E || 1),
    agreeableness: sums.A / (counts.A || 1),
    conscientiousness: sums.C / (counts.C || 1),
    stability: sums.S / (counts.S || 1),
    openness: sums.O / (counts.O || 1),
  }
}
