import { useEffect, useRef, useState } from 'react'
import { SHARE_DIMENSIONS, drawShareCard, type ShareCardOptions, type ShareFormat, type ShareMatch } from '../../lib/matchShare'

/**
 * Live preview drawn by the same function that produces the PNG, so what
 * you see is exactly what you download.
 */
export default function MatchSharePreview({
  match,
  format,
  options,
}: {
  match: ShareMatch
  format: ShareFormat
  options: ShareCardOptions
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const { width, height } = SHARE_DIMENSIONS[format]

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    let cancelled = false
    const t = setTimeout(() => {
      drawShareCard(el, match, format, options)
        .then(() => !cancelled && setFailed(null))
        .catch((e: unknown) => !cancelled && setFailed(e instanceof Error ? e.message : 'Preview failed.'))
    }, 120)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [match, format, options])

  return (
    <div className={`ShareBuilder-preview ShareBuilder-preview--${format}`}>
      <canvas
        ref={canvas}
        width={width}
        height={height}
        style={{ aspectRatio: `${width} / ${height}` }}
        role="img"
        aria-label={`${SHARE_DIMENSIONS[format].label} share card preview: ${match.result} ${match.score}, ${match.sport}`}
      />
      {failed && <p className="ShareBuilder-hint" role="status">Preview unavailable: {failed}</p>}
    </div>
  )
}
