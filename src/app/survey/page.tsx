import { prisma } from '@/lib/db'
import { getResumeParticipantId } from '@/lib/auth'
import {
  parseSurveyConfigMap,
  type SurveyConfig,
} from '@/lib/survey-config'
import SurveyForm from './SurveyForm'

export const dynamic = 'force-dynamic'

async function getSurveyConfig(): Promise<SurveyConfig> {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ['tipiQuestions', 'tipiScoring', 'panasItems', 'quickTags', 'descriptions'] } },
  })
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
  return parseSurveyConfigMap(map)
}

async function getInitialValues() {
  const participantId = await getResumeParticipantId()
  if (!participantId) return null

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: {
      name: true,
      age: true,
      gender: true,
      tipi1: true,
      tipi2: true,
      tipi3: true,
      tipi4: true,
      tipi5: true,
      tipi6: true,
      tipi7: true,
      tipi8: true,
      tipi9: true,
      tipi10: true,
      panasActive: true,
      panasNervous: true,
      panasHappy: true,
      panasAnxious: true,
      panasEnergetic: true,
      panasUpset: true,
      panasExcited: true,
      panasAfraid: true,
      panasInterested: true,
      panasDistressed: true,
      panasInspired: true,
      panasStressed: true,
      selfArtPrompt: true,
      selfDescription: true,
    },
  })

  if (!participant) return null

  return {
    name: participant.name,
    age: String(participant.age),
    gender: participant.gender,
    tipi: [
      participant.tipi1,
      participant.tipi2,
      participant.tipi3,
      participant.tipi4,
      participant.tipi5,
      participant.tipi6,
      participant.tipi7,
      participant.tipi8,
      participant.tipi9,
      participant.tipi10,
    ],
    panas: [
      participant.panasActive,
      participant.panasNervous,
      participant.panasHappy,
      participant.panasAnxious,
      participant.panasEnergetic,
      participant.panasUpset,
      participant.panasExcited,
      participant.panasAfraid,
      participant.panasInterested,
      participant.panasDistressed,
      participant.panasInspired,
      participant.panasStressed,
    ],
    artPrompt: participant.selfArtPrompt ?? '',
    selfDesc: participant.selfDescription ?? '',
  }
}

export default async function SurveyPage() {
  const [config, initialValues] = await Promise.all([getSurveyConfig(), getInitialValues()])
  return <SurveyForm config={config} initialValues={initialValues} />
}
