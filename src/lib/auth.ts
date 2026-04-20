import { cookies } from 'next/headers'
import {
  ADMIN_SESSION_MAX_AGE,
  getParticipantIdFromResumeToken,
  hasParticipantTokenAccess,
  isAdminToken,
  issueAdminSessionToken,
  issueParticipantSessionToken,
  issueParticipantResumeToken,
  PARTICIPANT_RESUME_MAX_AGE,
} from './session-token'

const ADMIN_COOKIE = 'eq_admin'
const PARTICIPANT_COOKIE = 'eq_participant'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: ADMIN_SESSION_MAX_AGE,
}

const PARTICIPANT_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: PARTICIPANT_RESUME_MAX_AGE,
}

export async function setAdminCookie() {
  const store = await cookies()
  const token = issueAdminSessionToken()
  store.set(ADMIN_COOKIE, token, COOKIE_OPTS)
}

export async function clearAdminCookie() {
  const store = await cookies()
  store.delete(ADMIN_COOKIE)
}

export async function setParticipantCookie(participantId: number) {
  const store = await cookies()
  const token = issueParticipantResumeToken(participantId)
  store.set(PARTICIPANT_COOKIE, token, PARTICIPANT_COOKIE_OPTS)
}

export async function clearParticipantCookie() {
  const store = await cookies()
  store.delete(PARTICIPANT_COOKIE)
}

export async function hasAdmin(): Promise<boolean> {
  const store = await cookies()
  return isAdminToken(store.get(ADMIN_COOKIE)?.value)
}

export function issueParticipantToken(participantId: number): string {
  return issueParticipantSessionToken(participantId)
}

export function hasParticipantAccess(token: string | null | undefined, participantId: number): boolean {
  return hasParticipantTokenAccess(token, participantId)
}

export async function getResumeParticipantId(): Promise<number | null> {
  const store = await cookies()
  return getParticipantIdFromResumeToken(store.get(PARTICIPANT_COOKIE)?.value)
}

export function withImageAccessToken(imageUrl: string, token: string): string {
  const separator = imageUrl.includes('?') ? '&' : '?'
  return `${imageUrl}${separator}token=${encodeURIComponent(token)}`
}
