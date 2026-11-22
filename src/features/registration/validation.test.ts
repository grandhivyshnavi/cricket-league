import { describe, expect, it } from 'vitest'
import {
  PLAYER_COUNT,
  emptyRegistrationForm,
  isIndianMobile,
  isIndianPin,
  mapDuplicateError,
  normalizeIndianMobile,
  photoExtension,
  toSubmission,
  validatePhotoFile,
  validateRegistration,
  type RegistrationForm,
} from './validation'

const validForm = (): RegistrationForm => ({
  teamName: '  Kadapa   Kings ',
  email: ' Captain@Example.COM ',
  contactPhone: '+91 98765-43210',
  addressLine1: '12, Main Road',
  addressLine2: '',
  city: 'Kadapa',
  state: 'Andhra Pradesh',
  pinCode: '516001',
  players: Array.from({ length: PLAYER_COUNT }, (_, i) => ({ name: `Player ${i + 1}`, phone: `98765432${String(i).padStart(2, '0')}` })),
})

describe('Indian mobile numbers', () => {
  it('normalises common formats to 10 digits', () => {
    expect(normalizeIndianMobile('+91 98765 43210')).toBe('9876543210')
    expect(normalizeIndianMobile('098765-43210')).toBe('9876543210')
    expect(normalizeIndianMobile('91 9876543210')).toBe('9876543210')
  })
  it('accepts 6–9 prefixed numbers and rejects the rest', () => {
    expect(isIndianMobile('6000000000')).toBe(true)
    expect(isIndianMobile('5876543210')).toBe(false)
    expect(isIndianMobile('987654321')).toBe(false)
    expect(isIndianMobile('98765432100')).toBe(false)
    expect(isIndianMobile('abc')).toBe(false)
  })
})

describe('PIN codes', () => {
  it('requires 6 digits not starting with 0', () => {
    expect(isIndianPin('516001')).toBe(true)
    expect(isIndianPin('516 001')).toBe(true)
    expect(isIndianPin('016001')).toBe(false)
    expect(isIndianPin('51600')).toBe(false)
    expect(isIndianPin('51600a')).toBe(false)
  })
})

describe('validateRegistration', () => {
  it('starts with exactly 13 empty player slots containing only name and phone', () => {
    const form = emptyRegistrationForm()
    expect(form.players).toHaveLength(13)
    expect(Object.keys(form.players[0]).sort()).toEqual(['name', 'phone'])
  })
  it('passes a complete form', () => {
    expect(validateRegistration(validForm())).toEqual({})
  })
  it('reports every required field on an empty form', () => {
    const errors = validateRegistration(emptyRegistrationForm())
    expect(Object.keys(errors)).toHaveLength(7 + PLAYER_COUNT * 2)
    expect(errors.addressLine2).toBeUndefined()
  })
  it('flags invalid email, phone, PIN and player numbers', () => {
    const form = validForm()
    form.email = 'not-an-email'
    form.contactPhone = '12345'
    form.pinCode = '000000'
    form.players[4].phone = '1234567890'
    form.players[10].name = 'A'
    const errors = validateRegistration(form)
    expect(Object.keys(errors).sort()).toEqual(['contactPhone', 'email', 'pinCode', 'players.10.name', 'players.4.phone'])
  })
})

describe('toSubmission', () => {
  it('normalises the payload sent to Supabase', () => {
    const { team, players } = toSubmission(validForm())
    expect(team).toEqual({
      teamName: 'Kadapa Kings',
      email: 'captain@example.com',
      contactPhone: '9876543210',
      addressLine1: '12, Main Road',
      addressLine2: null,
      city: 'Kadapa',
      state: 'Andhra Pradesh',
      pinCode: '516001',
    })
    expect(players).toHaveLength(13)
    expect(players[0]).toEqual({ name: 'Player 1', phone: '9876543200' })
  })
})

describe('intra-form duplicate player detection', () => {
  it('flags duplicate player identity (same name + same phone) within the form', () => {
    const form = validForm()
    form.players[5] = { name: 'Player 1', phone: '9876543200' } // same as player 0
    const errors = validateRegistration(form)
    expect(errors['players.5.name']).toMatch(/Same player as Player 1/)
  })
  it('allows same phone with different name', () => {
    const form = validForm()
    form.players[5] = { name: 'Different Person', phone: '9876543200' } // same phone as player 0
    const errors = validateRegistration(form)
    expect(errors['players.5.name']).toBeUndefined()
  })
  it('allows same name with different phone', () => {
    const form = validForm()
    form.players[5] = { name: 'Player 1', phone: '9876543299' } // same name, different phone
    const errors = validateRegistration(form)
    expect(errors['players.5.name']).toBeUndefined()
  })
  it('detects duplicates case-insensitively with extra whitespace', () => {
    const form = validForm()
    form.players[3] = { name: '  player   1  ', phone: '+91 98765 43200' }
    const errors = validateRegistration(form)
    expect(errors['players.3.name']).toMatch(/Same player as Player 1/)
  })
})

describe('mapDuplicateError', () => {
  it('maps team name duplicate', () => {
    const r = mapDuplicateError('This team name is already registered. Please choose a different team name.')
    expect(r?.key).toBe('teamName')
  })
  it('maps email duplicate', () => {
    const r = mapDuplicateError('This email address is already associated with another team registration.')
    expect(r?.key).toBe('email')
  })
  it('maps contact number duplicate', () => {
    const r = mapDuplicateError('This contact number is already associated with another team registration.')
    expect(r?.key).toBe('contactPhone')
  })
  it('maps player cross-team duplicate', () => {
    const r = mapDuplicateError('Player 4 (Rahul Kumar) is already registered with another team. Please check the player details.')
    expect(r?.key).toBe('players.3.name')
  })
  it('maps intra-form player duplicate', () => {
    const r = mapDuplicateError('Player 7 has the same name and contact number as another player in this form.')
    expect(r?.key).toBe('players.6.name')
  })
  it('returns null for unrecognised errors', () => {
    expect(mapDuplicateError('Something else went wrong')).toBeNull()
  })
})

describe('team photo validation', () => {
  const file = (name: string, type: string, size = 1024) => ({ name, type, size })
  it('accepts JPG, JPEG and PNG', () => {
    expect(photoExtension(file('team.jpg', 'image/jpeg'))).toBe('jpg')
    expect(photoExtension(file('team.JPEG', 'image/jpeg'))).toBe('jpg')
    expect(photoExtension(file('team.png', 'image/png'))).toBe('png')
    expect(validatePhotoFile(file('team.png', 'image/png'))).toBeNull()
  })
  it('rejects other types, mismatched extensions and oversize files', () => {
    expect(validatePhotoFile(file('team.gif', 'image/gif'))).toMatch(/JPG/)
    expect(validatePhotoFile(file('team.png', 'image/jpeg'))).toMatch(/JPG/)
    expect(validatePhotoFile(file('team.webp', 'image/webp'))).toMatch(/JPG/)
    expect(validatePhotoFile(file('team.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1))).toMatch(/5 MB/)
    expect(validatePhotoFile(file('team.jpg', 'image/jpeg', 0))).toMatch(/empty/)
  })
})
