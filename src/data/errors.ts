export class AppError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AppError'
  }
}

export const PERMISSION_DENIED = 'Only tournament administrators can make this change.'

interface PostgrestLikeError {
  code?: string
  message?: string
  details?: string | null
}

/** Maps Postgres / PostgREST errors onto messages suitable for the UI. */
export function toAppError(error: PostgrestLikeError | null | undefined, fallback = 'Request failed.'): AppError {
  if (!error) return new AppError(fallback)
  const text = `${error.message ?? ''} ${error.details ?? ''}`
  switch (error.code) {
    case '42501':
      return new AppError(PERMISSION_DENIED)
    case '23001':
    case '23503':
      return new AppError('This team is part of scheduled or completed matches. Remove those matches first.')
    case '23505':
      return new AppError('A team with this name already exists.')
    case '23514':
      if (text.includes('distinct_teams')) return new AppError('A team cannot play against itself.')
      if (text.includes('results_le_played')) return new AppError('Wins plus losses cannot exceed matches played.')
      return new AppError('Some values are invalid. Please review the form.')
  }
  return new AppError(error.message || fallback)
}
