import { isValidEmail } from '@/lib/utils'

/**
 * Team registration form model + validation. These rules mirror the
 * server-side checks in `submit_team_registration()` (see
 * supabase/migrations/20261122120000_team_registrations.sql); the database
 * remains the source of truth.
 */

/** No longer a fixed count — the form starts with INITIAL_PLAYER_ROWS and
 *  lets teams add or remove players. The backend accepts 1–13 players. */
export const PLAYER_COUNT = 13       // kept for display / success message
export const MIN_PLAYERS = 1
export const MAX_PLAYERS = 13
export const INITIAL_PLAYER_ROWS = 3  // shown by default (all optional)
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024
export const PHOTO_ACCEPT = 'image/jpeg,image/png,.jpg,.jpeg,.png'

export interface PlayerEntry {
  name: string
  phone: string
}

export interface RegistrationForm {
  teamName: string
  email: string
  contactPhone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pinCode: string
  players: PlayerEntry[]
}

export type TeamField = Exclude<keyof RegistrationForm, 'players'>
export type PlayerField = `players.${number}.${keyof PlayerEntry}`
export type FieldKey = TeamField | PlayerField | 'photo'
export type FormErrors = Partial<Record<FieldKey, string>>

/** Order used to focus the first invalid field after a failed submit.
 *  Player count is variable so we build this dynamically in validateRegistration. */
export const FIELD_ORDER_BASE: FieldKey[] = [
  'teamName',
  'email',
  'contactPhone',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'pinCode',
  'photo',
]

export function fieldOrderForPlayers(count: number): FieldKey[] {
  const playerFields = Array.from({ length: count }, (_, i) =>
    [`players.${i}.name`, `players.${i}.phone`] as PlayerField[],
  ).flat()
  return ['teamName', ...playerFields, 'email', 'contactPhone', 'addressLine1', 'addressLine2', 'city', 'state', 'pinCode', 'photo']
}

/** Legacy alias kept for components that read FIELD_ORDER at module level.
 *  Defaults to MAX_PLAYERS — form code should use fieldOrderForPlayers(). */
export const FIELD_ORDER: FieldKey[] = fieldOrderForPlayers(MAX_PLAYERS)

export function emptyRegistrationForm(): RegistrationForm {
  return {
    teamName: '',
    email: '',
    contactPhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pinCode: '',
    players: Array.from({ length: INITIAL_PLAYER_ROWS }, () => ({ name: '', phone: '' })),
  }
}

/** Returns true when both fields of a player row are empty (row should be ignored). */
export function isEmptyPlayer(p: PlayerEntry) {
  return !p.name.trim() && !p.phone.trim()
}

/** Returns true when only one of name/phone is filled (partial row). */
export function isPartialPlayer(p: PlayerEntry) {
  return !isEmptyPlayer(p) && (!p.name.trim() || !p.phone.trim())
}

/** Strips control characters and collapses whitespace (same as the database). */
export function cleanText(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** "+91 98765-43210", "098765 43210", "98765 43210" -> "9876543210". */
export function normalizeIndianMobile(value: string) {
  const digits = value.replace(/\D/g, '')
  return /^(91|0)?[6-9]\d{9}$/.test(digits) ? digits.slice(-10) : digits
}

export function isIndianMobile(value: string) {
  return /^[6-9]\d{9}$/.test(normalizeIndianMobile(value))
}

export function isIndianPin(value: string) {
  return /^[1-9]\d{5}$/.test(value.replace(/\s/g, ''))
}

function lengthError(value: string, label: string, min: number, max: number) {
  const v = cleanText(value)
  if (!v) return `${label} is required.`
  if (v.length < min) return `${label} must be at least ${min} characters.`
  if (v.length > max) return `${label} must be at most ${max} characters.`
  return null
}

function mobileError(value: string, label: string) {
  if (!value.trim()) return `${label} is required.`
  return isIndianMobile(value) ? null : 'Enter a valid 10-digit Indian mobile number (starts with 6–9).'
}

export function validateField(key: Exclude<FieldKey, 'photo'>, form: RegistrationForm): string | null {
  const player = /^players\.(\d+)\.(name|phone)$/.exec(key)
  if (player) {
    const index = Number(player[1])
    const entry = form.players[index]
    if (!entry) return null
    // Empty rows are skipped — only validate when the row is at least partially filled.
    if (isEmptyPlayer(entry)) return null
    return player[2] === 'name'
      ? lengthError(entry.name, `Player ${index + 1} name`, 2, 80)
      : mobileError(entry.phone, `Player ${index + 1} contact number`)
  }
  switch (key as TeamField) {
    case 'teamName':
      return lengthError(form.teamName, 'Team name', 2, 60)
    case 'email': {
      const v = form.email.trim()
      if (!v) return 'Email address is required.'
      return v.length <= 254 && isValidEmail(v) ? null : 'Enter a valid email address.'
    }
    case 'contactPhone':
      return mobileError(form.contactPhone, 'Team contact number')
    case 'addressLine1':
      return lengthError(form.addressLine1, 'Address', 3, 120)
    case 'addressLine2':
      return cleanText(form.addressLine2).length > 120 ? 'Address line 2 must be at most 120 characters.' : null
    case 'city':
      return lengthError(form.city, 'City', 2, 60)
    case 'state':
      return cleanText(form.state) ? null : 'Select a state.'
    case 'pinCode':
      if (!form.pinCode.trim()) return 'PIN code is required.'
      return isIndianPin(form.pinCode) ? null : 'Enter a valid 6-digit PIN code.'
  }
  return null
}

export function validateRegistration(form: RegistrationForm): FormErrors {
  const errors: FormErrors = {}
  const dynamicFieldOrder = fieldOrderForPlayers(form.players.length)
  for (const key of dynamicFieldOrder) {
    if (key === 'photo') continue
    const error = validateField(key, form)
    if (error) errors[key] = error
  }

  // Intra-form duplicate player detection (name + phone identity).
  // Only among non-empty rows.
  const seen = new Map<string, number>()
  for (let i = 0; i < form.players.length; i++) {
    if (isEmptyPlayer(form.players[i])) continue
    const name = cleanText(form.players[i].name).toLowerCase()
    const phone = normalizeIndianMobile(form.players[i].phone)
    if (!name || !phone || phone.length !== 10) continue
    const identity = `${name}::${phone}`
    const prev = seen.get(identity)
    if (prev !== undefined) {
      const key: FieldKey = `players.${i}.name`
      if (!errors[key]) errors[key] = `Same player as Player ${prev + 1}. Each player identity (name + number) must be unique.`
    } else {
      seen.set(identity, i)
    }
  }

  return errors
}

/**
 * Maps a server-side duplicate error message from `submit_team_registration()`
 * to a specific form field key so the UI can highlight the right field.
 * Returns null if the message is not a recognised duplicate error.
 */
export function mapDuplicateError(message: string): { key: FieldKey; message: string } | null {
  if (/team name is already registered/i.test(message))
    return { key: 'teamName', message: 'This team name is already registered. Please choose a different team name.' }
  if (/email.+already associated/i.test(message))
    return { key: 'email', message: 'This email address is already associated with another team registration.' }
  if (/contact number.+already associated/i.test(message))
    return { key: 'contactPhone', message: 'This contact number is already associated with another team registration.' }

  // "Player 4 (Rahul Kumar) is already registered with another team."
  const playerMatch = /Player (\d+).*already registered with another team/i.exec(message)
  if (playerMatch) {
    const idx = Number(playerMatch[1]) - 1
    return { key: `players.${idx}.name`, message: 'This player is already registered with another team. Please check the player details.' }
  }

  // "Player 4 has the same name and contact number as another player"
  const intraMatch = /Player (\d+).*same name and contact/i.exec(message)
  if (intraMatch) {
    const idx = Number(intraMatch[1]) - 1
    return { key: `players.${idx}.name`, message: 'Same player identity as another player in this form.' }
  }

  return null
}

export interface RegistrationSubmission {
  team: {
    teamName: string
    email: string
    contactPhone: string
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string
    pinCode: string
  }
  players: { name: string; phone: string }[]
}

/** Normalised payload sent to `submit_team_registration()`.
 *  Empty player rows are dropped; only fully completed rows are included. */
export function toSubmission(form: RegistrationForm): RegistrationSubmission {
  const players = form.players
    .filter((p) => !isEmptyPlayer(p))
    .map((p) => ({ name: cleanText(p.name), phone: normalizeIndianMobile(p.phone) }))

  return {
    team: {
      teamName: cleanText(form.teamName),
      email: form.email.trim().toLowerCase(),
      contactPhone: normalizeIndianMobile(form.contactPhone),
      addressLine1: cleanText(form.addressLine1),
      addressLine2: cleanText(form.addressLine2) || null,
      city: cleanText(form.city),
      state: cleanText(form.state),
      pinCode: form.pinCode.replace(/\s/g, ''),
    },
    players,
  }
}

const PHOTO_TYPES: Record<string, 'jpg' | 'png'> = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png' }

/** Storage extension for an accepted photo, or null when the type is not allowed. */
export function photoExtension(file: Pick<File, 'name' | 'type'>): 'jpg' | 'png' | null {
  const ext = /\.(jpe?g|png)$/i.exec(file.name)?.[1].toLowerCase()
  const fromExt = ext ? (ext === 'png' ? 'png' : 'jpg') : null
  const fromType = PHOTO_TYPES[file.type.toLowerCase()] ?? null
  if (file.type) return fromType && (!fromExt || fromExt === fromType) ? fromType : null
  return fromExt
}

export function photoContentType(ext: 'jpg' | 'png') {
  return ext === 'png' ? 'image/png' : 'image/jpeg'
}

export function validatePhotoFile(file: Pick<File, 'name' | 'type' | 'size'>): string | null {
  if (!photoExtension(file)) return 'Only JPG, JPEG or PNG images are allowed.'
  if (file.size === 0) return 'This file is empty.'
  if (file.size > PHOTO_MAX_BYTES) return 'The photo must be 5 MB or smaller.'
  return null
}
