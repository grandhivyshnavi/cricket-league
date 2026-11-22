import { ImageUp, RefreshCw, Trash } from 'lucide-react'
import { useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PHOTO_ACCEPT, validatePhotoFile } from './validation'

interface PhotoUploadProps {
  id: string
  file: File | null
  error?: string
  disabled?: boolean
  onChange(file: File | null): void
  onError(message: string | undefined): void
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Rejects files whose bytes are not a decodable image (e.g. a renamed PDF). */
async function isDecodableImage(file: File) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img.naturalWidth > 0
  } catch {
    return false
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function PhotoUpload({ id, file, error, disabled, onChange, onError }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hintId = useId()
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function accept(files: FileList | null) {
    if (!files?.length) return
    if (files.length > 1) return onError('Only one team photo can be uploaded.')
    const next = files[0]
    const problem = validatePhotoFile(next) ?? ((await isDecodableImage(next)) ? null : 'This file is not a valid image.')
    if (problem) return onError(problem)
    onError(undefined)
    onChange(next)
  }

  const browse = () => inputRef.current?.click()

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (!disabled) void accept(e.dataTransfer.files)
  }

  const describedBy = error ? `${id}-error` : hintId

  return (
    <div>
      <input
        ref={inputRef}
        id={`${id}-input`}
        type="file"
        accept={PHOTO_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onChange={(e) => {
          void accept(e.target.files)
          e.target.value = ''
        }}
      />

      {file && preview ? (
        <div className="overflow-hidden rounded-card border border-volt-400/20 bg-ink-900/60">
          <div className="relative aspect-[16/9] bg-ink-950">
            <img src={preview} alt="Selected team photo preview" className="size-full object-contain" />
          </div>
          <div className="flex flex-col gap-3 border-t border-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fog-50">{file.name}</p>
              <p id={hintId} className="text-xs text-fog-500">
                {formatBytes(file.size)} · ready to upload
              </p>
            </div>
            <div className="flex gap-2">
              <Button id={id} variant="secondary" size="sm" onClick={browse} disabled={disabled} aria-describedby={describedBy}>
                <RefreshCw /> Replace
              </Button>
              <Button
                variant="danger-ghost"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  onChange(null)
                  onError(undefined)
                }}
              >
                <Trash /> Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          id={id}
          type="button"
          onClick={browse}
          disabled={disabled}
          onDragEnter={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className={cn(
            'group flex w-full flex-col items-center justify-center gap-3 rounded-card border border-dashed px-6 py-10 text-center transition-[border-color,background-color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-50',
            dragging
              ? 'border-volt-400/70 bg-volt-400/[0.06] shadow-glow-sm'
              : error
                ? 'border-danger-400/60 bg-danger-500/[0.03]'
                : 'border-white/15 bg-white/[0.015] hover:border-volt-400/40 hover:bg-volt-400/[0.03]',
          )}
        >
          <span className="grid size-12 place-items-center rounded-2xl border border-volt-400/20 bg-volt-400/10 text-volt-400 transition-transform duration-300 group-hover:-translate-y-0.5">
            <ImageUp className="size-5" aria-hidden />
          </span>
          <span className="font-heading text-base text-fog-50">
            {dragging ? 'Drop the photo here' : 'Browse files or drag a photo here'}
          </span>
          <span id={hintId} className="text-xs text-fog-500">
            One image · JPG, JPEG or PNG · up to 5 MB
          </span>
        </button>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-xs font-medium text-danger-400">
          {error}
        </p>
      )}
    </div>
  )
}
