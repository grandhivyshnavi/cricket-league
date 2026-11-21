import { TIME_ZONE, TIME_ZONE_LABEL } from '@/config/site'

/** IST is a fixed UTC+05:30 offset (no daylight saving). */
const IST_OFFSET = '+05:30'
const IST_OFFSET_MS = 330 * 60 * 1000

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const shortDateFmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
})

const timeFmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

export function formatMatchDate(iso: string) {
  return dateFmt.format(new Date(iso))
}

export function formatMatchTime(iso: string) {
  return `${timeFmt.format(new Date(iso)).toUpperCase()} ${TIME_ZONE_LABEL}`
}

export function formatShortDate(isoOrDate: string) {
  return shortDateFmt.format(new Date(isoOrDate.length === 10 ? `${isoOrDate}T12:00:00${IST_OFFSET}` : isoOrDate))
}

/** Converts IST date (YYYY-MM-DD) + time (HH:mm) form values into a UTC ISO timestamp. */
export function istPartsToIso(date: string, time: string) {
  const parsed = new Date(`${date}T${time}:00${IST_OFFSET}`)
  if (Number.isNaN(parsed.getTime())) throw new Error('Invalid date or time')
  return parsed.toISOString()
}

/** Splits a UTC ISO timestamp into IST date/time form values. */
export function isoToIstParts(iso: string) {
  const shifted = new Date(new Date(iso).getTime() + IST_OFFSET_MS).toISOString()
  return { date: shifted.slice(0, 10), time: shifted.slice(11, 16) }
}

/** Calendar key (YYYY-MM-DD in IST) used to group fixtures by match day. */
export function istDayKey(iso: string) {
  return isoToIstParts(iso).date
}

/** Inclusive number of days between two YYYY-MM-DD dates. */
export function inclusiveDays(start: string, end: string) {
  const diff = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)
  if (Number.isNaN(diff) || diff < 0) return null
  return Math.round(diff / 86_400_000) + 1
}

export function formatDateRange(start: string | null, end: string | null) {
  if (!start) return null
  if (!end || end === start) return formatShortDate(start)
  const year = end.slice(0, 4)
  return `${formatShortDate(start)} – ${formatShortDate(end)} ${year}`
}

/** Human-friendly relative time, e.g. "2 hours ago", "3 days ago". */
export function formatRelative(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return 'Just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  if (days < 30) return `${days}d ago`
  return dateFmt.format(new Date(iso))
}
