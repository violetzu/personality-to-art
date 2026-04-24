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
  PARTICIPANT_TOKEN_MAX_AGE,
} from './session-token'

const ADMIN_COOKIE = 'eq_admin'
const PARTICIPANT_COOKIE = 'eq_participant'
const PARTICIPANT_ACCESS_COOKIE = 'eq_access'

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

export async function clearParticipantAccessCookie() {
  const store = await cookies()
  store.delete(PARTICIPANT_ACCESS_COOKIE)
}

export async function setParticipantAccessCookie(participantId: number) {
  const store = await cookies()
  const token = issueParticipantSessionToken(participantId)
  store.set(PARTICIPANT_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: PARTICIPANT_TOKEN_MAX_AGE,
  })
}

export async function hasAdmin(): Promise<boolean> {
  const store = await cookies()
  return isAdminToken(store.get(ADMIN_COOKIE)?.value)
}

export async function hasParticipantAccess(participantId: number): Promise<boolean> {
  const store = await cookies()
  const token = store.get(PARTICIPANT_ACCESS_COOKIE)?.value
  return hasParticipantTokenAccess(token, participantId)
}

export async function getResumeParticipantId(): Promise<number | null> {
  const store = await cookies()
  return getParticipantIdFromResumeToken(store.get(PARTICIPANT_COOKIE)?.value)
}
