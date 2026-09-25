import { useEffect, useMemo, useRef, useState } from 'react'
import { suggestedHashtags, type ShareFormat, type ShareMatch } from '../../lib/matchShare'
import { ACCEPTED_PHOTO_TYPES } from '../../lib/timeline'
import ExportShareCard from './ExportShareCard'
import MatchSharePreview from './MatchSharePreview'
import {
  CaptionEditor,
  EngagementMessage,
  HashtagEditor,
  MatchPhotoUploader,
  MatchStatOverlay,
  ShareFormatSelector,
  type SharePhoto,
} from './ShareControls'
import './ShareMatchBuilder.css'

function loadImage(file: File): Promise<SharePhoto> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => resolve({ id: crypto.randomUUID(), name: file.name, url, image, file })
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`${file.name} couldn’t be opened as an image.`))
    }
    image.src = url
  })
}

/**
 * Share Match Builder. `match` (official facts) and the visual choices below
 * are kept separate: nothing here can change the result, score, opponent,
 * sport or date.
 */
export default function ShareMatchBuilder({ match }: { match: ShareMatch }) {
  const [format, setFormat] = useState<ShareFormat>('story')
  const [photos, setPhotos] = useState<SharePhoto[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loadingPhoto, setLoadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const suggestions = useMemo(() => suggestedHashtags(match), [match])
  const [hashtags, setHashtags] = useState<string[]>(suggestions)
  const [showStats, setShowStats] = useState(true)

  // Release object URLs only when a photo is removed or the builder closes.
  const urls = useRef(new Set<string>())
  useEffect(() => {
    const current = urls.current
    return () => current.forEach((u) => URL.revokeObjectURL(u))
  }, [])

  const addPhotos = async (files: File[]) => {
    const bad = files.find((f) => !ACCEPTED_PHOTO_TYPES.includes(f.type))
    if (bad) {
      setPhotoError(`${bad.name}: photos must be JPG, PNG or WEBP.`)
      return
    }
    setPhotoError(null)
    setLoadingPhoto(true)
    try {
      const loaded = await Promise.all(files.map(loadImage))
      loaded.forEach((p) => urls.current.add(p.url))
      setPhotos((list) => [...list, ...loaded])
      if (!selectedId && loaded[0]) setSelectedId(loaded[0].id)
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Photo upload failed.')
    } finally {
      setLoadingPhoto(false)
    }
  }

  const removePhoto = (id: string) => {
    const gone = photos.find((p) => p.id === id)
    if (gone) {
      URL.revokeObjectURL(gone.url)
      urls.current.delete(gone.url)
    }
    setPhotos((list) => list.filter((p) => p.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const image = photos.find((p) => p.id === selectedId)?.image ?? null
  const options = useMemo(() => ({ caption, hashtags, showStats, image }), [caption, hashtags, showStats, image])

  return (
    <section className="ShareBuilder">
      <div className="ShareBuilder-previewCol">
        <MatchSharePreview match={match} format={format} options={options} />
      </div>
      <div className="ShareBuilder-controls">
        <MatchStatOverlay match={match} showStats={showStats} onShowStats={setShowStats} />
        <EngagementMessage match={match} />
        <MatchPhotoUploader photos={photos} selectedId={selectedId} onAdd={addPhotos} onRemove={removePhoto}
          onSelect={setSelectedId} loading={loadingPhoto} />
        {photoError && <p className="ShareBuilder-status ShareBuilder-status--error" role="alert">{photoError}</p>}
        <section className="ShareBuilder-panel" aria-label="Caption and hashtags">
          <CaptionEditor value={caption} onChange={setCaption} />
          <HashtagEditor value={hashtags} suggestions={suggestions} onChange={setHashtags} />
        </section>
        <section className="ShareBuilder-panel">
          <ShareFormatSelector value={format} onChange={setFormat} />
        </section>
        <ExportShareCard match={match} format={format} options={options} />
      </div>
    </section>
  )
}
