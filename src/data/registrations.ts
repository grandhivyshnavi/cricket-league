import type { SupabaseClient } from '@supabase/supabase-js'
import { photoContentType, photoExtension, type RegistrationSubmission } from '@/features/registration/validation'
import { supabase } from '@/lib/supabase'
import type { RegistrationStatus, TeamRegistration } from '@/types/domain'
import { AppError, toAppError } from './errors'

/**
 * Team registration data access.
 *
 * Public submissions go exclusively through SECURITY DEFINER functions
 * (`submit_team_registration`, `complete_team_registration_photo`,
 * `discard_team_registration`) — visitors have no direct table access.
 * Reading, updating and deleting registrations is admin-only (RLS).
 */

export const TEAM_PHOTO_BUCKET = 'team-photos'
export const isRegistrationAvailable = Boolean(supabase)

export type SubmitStage = 'saving' | 'uploading' | 'finalising'

interface PostgrestLikeError {
  code?: string
  message?: string
  details?: string | null
}

function registrationError(error: PostgrestLikeError | null) {
  if (error?.code === 'PGRST202' || error?.code === '42883') {
    return new AppError('Online registration is not available right now. Please try again later.')
  }
  // Pass through the server's specific duplicate error message so the UI
  // can map it to the correct field via mapDuplicateError().
  if (error?.code === '23505') return new AppError(error.message ?? 'A registration with these details already exists.')
  return toAppError(error, 'Could not save the registration.')
}

function client(): SupabaseClient {
  if (!supabase) throw new AppError('Registration requires the live backend (Supabase is not configured).')
  return supabase
}

/**
 * Full submission. Resolves only after everything is persisted:
 *  1. team + 13 players are inserted in one database transaction;
 *  2. the optional photo is uploaded to `<registration id>/team-photo.<ext>`;
 *  3. the photo path is verified and saved.
 * If step 2 or 3 fails, the registration is rolled back and an error is thrown.
 */
export async function submitTeamRegistration(
  submission: RegistrationSubmission,
  photo: File | null,
  onStage?: (stage: SubmitStage) => void,
): Promise<{ id: string }> {
  const db = client()
  if (!photo) throw new AppError('A team photo is required. Please upload a team photo before registering.')
  const ext = photoExtension(photo)
  if (!ext) throw new AppError('Only JPG, JPEG or PNG images are allowed.')

  onStage?.('saving')
  const { data, error } = await db.rpc('submit_team_registration', {
    p_team: submission.team,
    p_players: submission.players,
    p_with_photo: Boolean(photo),
  })
  if (error) throw registrationError(error)
  const id = data as string
  if (!photo || !ext) return { id }

  const path = `${id}/team-photo.${ext}`
  try {
    onStage?.('uploading')
    const upload = await db.storage
      .from(TEAM_PHOTO_BUCKET)
      .upload(path, photo, { contentType: photoContentType(ext), upsert: false, cacheControl: '3600' })
    if (upload.error) throw new AppError(`The team photo could not be uploaded (${upload.error.message}).`)

    onStage?.('finalising')
    const complete = () => db.rpc('complete_team_registration_photo', { p_registration_id: id, p_photo_path: path })
    let result = await complete()
    if (result.error) result = await complete()
    if (result.error) throw registrationError(result.error)
  } catch (e) {
    // Roll back so no registration is left without the photo the team submitted.
    await db.rpc('discard_team_registration', { p_registration_id: id })
    const reason = e instanceof Error ? e.message : 'The team photo could not be saved.'
    throw new AppError(`${reason} Your registration was not saved — please try again.`)
  }
  return { id }
}

/* ------------------------------------------------------------------ */
/*  Admin                                                              */
/* ------------------------------------------------------------------ */

interface PlayerRow {
  player_no: number
  full_name: string
  phone: string
}

interface RegistrationRow {
  id: string
  team_name: string
  email: string
  contact_phone: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  pin_code: string
  photo_path: string | null
  awaiting_photo: boolean
  status: RegistrationStatus
  created_at: string
  registration_players: PlayerRow[] | null
}

const toRegistration = (r: RegistrationRow): TeamRegistration => ({
  id: r.id,
  teamName: r.team_name,
  email: r.email,
  contactPhone: r.contact_phone,
  addressLine1: r.address_line1,
  addressLine2: r.address_line2,
  city: r.city,
  state: r.state,
  pinCode: r.pin_code,
  photoPath: r.photo_path,
  awaitingPhoto: r.awaiting_photo,
  status: r.status,
  createdAt: r.created_at,
  players: (r.registration_players ?? [])
    .map((p) => ({ playerNo: p.player_no, fullName: p.full_name, phone: p.phone }))
    .sort((a, b) => a.playerNo - b.playerNo),
})

export async function listTeamRegistrations(): Promise<TeamRegistration[]> {
  const { data, error } = await client()
    .from('registrations')
    .select(
      'id, team_name, email, contact_phone, address_line1, address_line2, city, state, pin_code, photo_path, awaiting_photo, status, created_at, registration_players (player_no, full_name, phone)',
    )
    .not('team_name', 'is', null)
    .order('created_at', { ascending: false })
  if (error) throw toAppError(error, 'Unable to load registrations.')
  return (data as RegistrationRow[]).map(toRegistration)
}

export async function updateRegistrationStatus(id: string, status: RegistrationStatus): Promise<void> {
  const { data, error } = await client().from('registrations').update({ status }).eq('id', id).select('id')
  if (error) throw toAppError(error)
  if (!data?.length) throw new AppError('Registration not found or you do not have permission to change it.')
}

/** Deletes the registration (players cascade), then its photo. */
export async function deleteTeamRegistration(registration: Pick<TeamRegistration, 'id' | 'photoPath'>): Promise<void> {
  const db = client()
  const { data, error } = await db.from('registrations').delete().eq('id', registration.id).select('id')
  if (error) throw toAppError(error)
  if (!data?.length) throw new AppError('Registration not found or you do not have permission to delete it.')
  if (registration.photoPath) {
    const removal = await db.storage.from(TEAM_PHOTO_BUCKET).remove([registration.photoPath])
    if (removal.error) throw new AppError(`Registration deleted, but its photo could not be removed: ${removal.error.message}`)
  }
}

/** Short-lived signed URL; the bucket is private and readable by admins only. */
export async function getTeamPhotoUrl(path: string): Promise<string> {
  const { data, error } = await client().storage.from(TEAM_PHOTO_BUCKET).createSignedUrl(path, 600)
  if (error || !data) throw new AppError(error?.message ?? 'Unable to load the team photo.')
  return data.signedUrl
}
