import type {
  TipiScoring, PanasItem, TagCategory, SurveyDescriptions,
} from '@/lib/survey-config'

export interface Participant {
  id: number
  name: string
  age: number
  gender: string
  extraversion: number
  agreeableness: number
  conscientiousness: number
  stability: number
  openness: number
  selfArtPrompt: string | null
  selfDescription: string | null
  createdAt: string
  _count: { prompts: number }
}

export interface DetailParticipant extends Participant {
  tipi1: number; tipi2: number; tipi3: number; tipi4: number; tipi5: number
  tipi6: number; tipi7: number; tipi8: number; tipi9: number; tipi10: number
  panasActive: number; panasNervous: number; panasHappy: number; panasAnxious: number
  panasEnergetic: number; panasUpset: number; panasExcited: number; panasAfraid: number
  panasInterested: number; panasDistressed: number; panasInspired: number; panasStressed: number
  prompts: { id: number; promptText: string; imageUrl: string; analysis: string | null; createdAt: string }[]
}

export interface Stats {
  totalParticipants: number
  totalPrompts: number
  avgImagesPerParticipant: number | null
  retryParticipantRate: number | null
}

export interface Settings {
  maxRetries: number
  fluxSteps: number
  homeIntro: string
  tipiQuestions: string[]
  tipiScoring: TipiScoring[]
  panasItems: PanasItem[]
  descriptions: SurveyDescriptions
  quickTags: TagCategory[]
}
