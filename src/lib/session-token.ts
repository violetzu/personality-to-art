import { createHmac, timingSafeEqual } from 'crypto'

const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8 // 8 hours
const PARTICIPANT_TOKEN_MAX_AGE = 60 * 60 * 24 // 24 hours
const PARTICIPANT_RESUME_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

type SessionPayload =
  | { type: 'admin'; exp: number }
  | { type: 'participant'; participantId: number; exp: number }
  | { type: 'participant_resume'; participantId: number; exp: number }

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET must be configured')
  }
  return secret
}

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodePayload(value: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Record<string, unknown>
    if (typeof parsed.exp !== 'number' || parsed.exp <= Date.now()) return null
    if (parsed.type === 'admin') return { type: 'admin', exp: parsed.exp }
    if (
      (parsed.type === 'participant' || parsed.type === 'participant_resume')
      && typeof parsed.participantId === 'number'
      && Number.isInteger(parsed.participantId)
      && parsed.participantId > 0
    ) {
      return { type: parsed.type, participantId: parsed.participantId, exp: parsed.exp }
    }
    return null
  } catch {
    return null
  }
}

function signValue(value: string) {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url')
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function issueToken(payload: SessionPayload) {
  const encoded = encodePayload(payload)
  return `${encoded}.${signValue(encoded)}`
}

function verifyToken(token: string | undefined): SessionPayload | null {
  if (!token) return null
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null
  const expected = signValue(encoded)
  if (!safeEqual(signature, expected)) return null
  return decodePayload(encoded)
}

export function issueAdminSessionToken() {
  return issueToken({ type: 'admin', exp: Date.now() + ADMIN_SESSION_MAX_AGE * 1000 })
}

export function issueParticipantSessionToken(participantId: number) {
  return issueToken({
    type: 'participant',
    participantId,
    exp: Date.now() + PARTICIPANT_TOKEN_MAX_AGE * 1000,
  })
}

export function issueParticipantResumeToken(participantId: number) {
  return issueToken({
    type: 'participant_resume',
    participantId,
    exp: Date.now() + PARTICIPANT_RESUME_MAX_AGE * 1000,
  })
}

export function isAdminToken(token: string | undefined): boolean {
  return verifyToken(token)?.type === 'admin'
}

export function hasParticipantTokenAccess(token: string | null | undefined, participantId: number): boolean {
  const payload = verifyToken(token ?? undefined)
  return payload?.type === 'participant' && payload.participantId === participantId
}

export function getParticipantIdFromResumeToken(token: string | undefined): number | null {
  const payload = verifyToken(token)
  return payload?.type === 'participant_resume' ? payload.participantId : null
}

export { ADMIN_SESSION_MAX_AGE, PARTICIPANT_RESUME_MAX_AGE }
