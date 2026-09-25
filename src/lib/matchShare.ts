import type { ShareMatch } from './matches'
import { ESPORTS } from './tournaments'
import logoUrl from '../assets/logo.svg'

export type { ShareMatch }
export type ShareFormat = 'story' | 'square' | 'landscape'

export const SHARE_DIMENSIONS: Record<ShareFormat, { width: number; height: number; label: string; hint: string }> = {
  story: { width: 1080, height: 1920, label: 'Story', hint: 'Instagram / Facebook Story · 1080 × 1920' },
  square: { width: 1080, height: 1080, label: 'Square', hint: 'Instagram Post · 1080 × 1080' },
  landscape: { width: 1200, height: 630, label: 'Landscape', hint: 'Facebook / general post · 1200 × 630' },
}

const COLORS = {
  bg: '#080D0B',
  primary: '#3FD285',
  text: '#FFFFFF',
  secondary: '#A6B0AC',
  win: '#3FD285',
  loss: '#EF4444',
  draw: '#F4B942',
}

const RESULT_COLOR = { WIN: COLORS.win, LOSS: COLORS.loss, DRAW: COLORS.draw } as const

// ---- Copy ----------------------------------------------------------------------

function pairsFrom(score: string): [number, number][] {
  return score
    .split('•')
    .map((part) => part.split('–').map((n) => Number(n.trim())))
    .filter((p): p is [number, number] => p.length === 2 && p.every(Number.isFinite))
}

const MILESTONES = [10, 25, 50, 100, 250, 500]

/**
 * A short line for the card, chosen from what the record actually shows.
 * It never claims expertise, a streak or a milestone the stats don't back.
 */
export function engagementMessage(m: ShareMatch): string {
  const sport = m.sport.toUpperCase()
  const pairs = pairsFrom(m.score)

  if (m.result === 'DRAW') return 'GREAT BATTLE. KEEP PUSHING!'

  if (m.result === 'LOSS') {
    if (m.currentStreak <= -3) return 'THE COMEBACK STARTS HERE.'
    const close = pairs.length > 0 && pairs.every(([a, b]) => Math.abs(a - b) <= 2)
    return close ? 'TOUGH MATCH. STRONG PERFORMANCE.' : 'GOOD GAME. ON TO THE NEXT ONE.'
  }

  if (MILESTONES.includes(m.totalWins)) return 'NEW PERSONAL MILESTONE!'
  if (m.currentStreak >= 3) return `${m.currentStreak} WINS IN A ROW!`
  if (m.sportMatches >= 10 && m.sportWinRate >= 75) return `YOU ARE AN EXPERT IN ${sport}!`
  const dominant = pairs.length > 0 && pairs.every(([a, b]) => a - b >= Math.max(5, Math.ceil(b * 0.4)))
  if (dominant) return ESPORTS.some((e) => e.name === m.sport) ? 'YOU OWNED THE GAME TODAY!' : 'YOU OWNED THE COURT TODAY!'
  return 'ANOTHER WIN FOR THE RECORD!'
}

const tagOf = (s: string) => `#${s.replace(/[^a-z0-9]/gi, '')}`

export function suggestedHashtags(m: ShareMatch): string[] {
  const tags = ['#PlayPanda', tagOf(m.sport), '#GameDay']
  if (m.result === 'WIN') tags.push('#Winning')
  if (m.format.trim()) tags.push(tagOf(m.format))
  return [...new Set(tags.filter((t) => t.length > 1))]
}

/** Normalises free-typed hashtags: "#a b, #c" → ["#a", "#b", "#c"]. */
export function parseHashtags(text: string): string[] {
  const tags = text
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#+/, '').replace(/[^a-z0-9_]/gi, ''))
    .filter(Boolean)
    .map((t) => `#${t}`)
  return [...new Set(tags)].slice(0, 20)
}

export function formatPlayedAt(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} • ${time}`
}

// ---- Canvas rendering ------------------------------------------------------------

export interface ShareCardOptions {
  caption: string
  hashtags: string[]
  showStats: boolean
  image: HTMLImageElement | null
}

const FONT = "Rajdhani, 'Segoe UI', Arial, sans-serif"

let logoPromise: Promise<HTMLImageElement | null> | null = null
function loadLogo(): Promise<HTMLImageElement | null> {
  logoPromise ??= new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = logoUrl
  })
  return logoPromise
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= maxWidth || !line) line = next
    else {
      lines.push(line)
      line = word
      if (lines.length === maxLines) break
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
    let last = lines[maxLines - 1]
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
    lines[maxLines - 1] = `${last.trimEnd()}…`
  }
  return lines
}

interface Block {
  lines: string[]
  size: number
  weight: number
  color: string
  gap: number
  spacing?: number
}

/**
 * Draws the card into `canvas`. Match facts come only from `m` (the stored
 * result); the options are the player's own photo, caption and hashtags.
 * The original photo is only read, never modified.
 */
export async function drawShareCard(
  canvas: HTMLCanvasElement,
  m: ShareMatch,
  format: ShareFormat,
  o: ShareCardOptions
): Promise<void> {
  const { width, height } = SHARE_DIMENSIONS[format]
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available in this browser.')

  try {
    await document.fonts?.load(`700 40px Rajdhani`)
  } catch {
    // fall back to system fonts
  }
  const logo = await loadLogo()

  const unit = Math.min(width, height) / 1080
  const pad = Math.round((format === 'landscape' ? 56 : 80) * unit * (format === 'landscape' ? 1.6 : 1))

  // 1. Background: the player's photo (cover), else a branded gradient.
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, width, height)
  if (o.image) {
    const scale = Math.max(width / o.image.naturalWidth, height / o.image.naturalHeight)
    const w = o.image.naturalWidth * scale
    const h = o.image.naturalHeight * scale
    ctx.drawImage(o.image, (width - w) / 2, (height - h) / 2, w, h)
  } else {
    const g = ctx.createLinearGradient(0, 0, width, height)
    g.addColorStop(0, '#14211C')
    g.addColorStop(1, COLORS.bg)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, width, height)
  }
  // Legibility scrim, darker toward the text.
  const scrim = format === 'landscape' ? ctx.createLinearGradient(width, 0, 0, 0) : ctx.createLinearGradient(0, 0, 0, height)
  scrim.addColorStop(0, 'rgba(8,13,11,0.25)')
  scrim.addColorStop(format === 'landscape' ? 0.45 : 0.4, 'rgba(8,13,11,0.55)')
  scrim.addColorStop(1, 'rgba(8,13,11,0.94)')
  ctx.fillStyle = scrim
  ctx.fillRect(0, 0, width, height)

  // 2. Branding (top left) and confirmation badge (top right).
  const logoH = Math.round(70 * unit * (format === 'landscape' ? 1.4 : 1))
  if (logo && logo.naturalWidth) {
    const logoW = (logo.naturalWidth / logo.naturalHeight) * logoH
    ctx.drawImage(logo, pad, pad, logoW, logoH)
  } else {
    ctx.fillStyle = COLORS.primary
    ctx.font = `800 ${logoH * 0.6}px ${FONT}`
    ctx.textBaseline = 'middle'
    ctx.fillText('PLAYPANDA', pad, pad + logoH / 2)
  }
  const badge = '✓ CONFIRMED MATCH'
  const badgeSize = Math.round(26 * unit * (format === 'landscape' ? 1.4 : 1))
  ctx.font = `700 ${badgeSize}px ${FONT}`
  const bw = ctx.measureText(badge).width + badgeSize * 1.4
  const bh = badgeSize * 1.9
  const bx = width - pad - bw
  const by = pad + (logoH - bh) / 2
  ctx.fillStyle = 'rgba(8,13,11,0.6)'
  ctx.strokeStyle = COLORS.primary
  ctx.lineWidth = Math.max(2, 3 * unit)
  ctx.beginPath()
  ctx.roundRect(bx, by, bw, bh, bh / 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = COLORS.primary
  ctx.textBaseline = 'middle'
  ctx.fillText(badge, bx + badgeSize * 0.7, by + bh / 2 + 1)

  // 3. Text stack, laid out bottom-up so it always sits on the scrim.
  const k = format === 'landscape' ? 1.05 : 1
  const textWidth = format === 'landscape' ? width * 0.62 : width - pad * 2
  const measure = (size: number, weight: number) => {
    ctx.font = `${weight} ${size}px ${FONT}`
  }
  const block = (text: string, size: number, weight: number, color: string, gap: number, maxLines = 1, spacing?: number): Block => {
    measure(size, weight)
    return { lines: wrap(ctx, text, textWidth, maxLines), size, weight, color, gap, spacing }
  }
  const s = (n: number) => Math.round(n * unit * k)

  const blocks: Block[] = [
    block(m.result, s(format === 'story' ? 220 : format === 'landscape' ? 150 : 170), 800, RESULT_COLOR[m.result], s(4), 1, 0.04),
    block(m.score, s(84), 700, COLORS.text, s(18)),
    block([m.sport, m.format].filter(Boolean).join(' · '), s(42), 700, COLORS.text, s(6)),
    block(`${m.player} vs ${m.opponent}`, s(34), 600, COLORS.secondary, s(6)),
    block(formatPlayedAt(m.playedAt), s(30), 500, COLORS.secondary, s(28)),
  ]
  if (o.showStats && m.sportMatches > 0) {
    const stats = [`WINS ${m.sportWins}`, `LOSSES ${m.sportLosses}`, `MATCHES ${m.sportMatches}`, `WIN RATE ${m.sportWinRate}%`]
    blocks.push(block(stats.join('  ·  '), s(30), 700, COLORS.text, s(26)))
  }
  blocks.push(block(engagementMessage(m), s(48), 800, COLORS.primary, s(22), 2))
  const optional: Block[] = []
  if (o.caption.trim()) optional.push(block(o.caption.trim(), s(32), 500, COLORS.text, s(12), format === 'landscape' ? 1 : 3))
  if (o.hashtags.length) optional.push(block(o.hashtags.join(' '), s(28), 700, COLORS.primary, 0, 2))

  const heightOf = (list: Block[]) => list.reduce((h, b) => h + b.lines.length * b.size * 1.12 + b.gap, 0)
  const available = height - pad * 2 - logoH - s(40)
  const all = [...blocks, ...optional]
  // Drop optional extras (hashtags first, then caption) rather than overflow.
  while (all.length > blocks.length && heightOf(all) > available) all.pop()

  let y = height - pad - heightOf(all)
  ctx.textBaseline = 'top'
  for (const b of all) {
    measure(b.size, b.weight)
    ctx.fillStyle = b.color
    if ('letterSpacing' in ctx && b.spacing) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${b.size * b.spacing}px`
    for (const line of b.lines) {
      ctx.fillText(line, pad, y)
      y += b.size * 1.12
    }
    if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px'
    y += b.gap
  }
}

export async function renderShareCardPng(m: ShareMatch, format: ShareFormat, o: ShareCardOptions): Promise<Blob> {
  const canvas = document.createElement('canvas')
  await drawShareCard(canvas, m, format, o)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG generation failed.'))), 'image/png')
  )
}

export function shareFileName(m: ShareMatch, format: ShareFormat): string {
  const sport = m.sport.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `playpanda-${sport}-${m.result.toLowerCase()}-${format}.png`
}
