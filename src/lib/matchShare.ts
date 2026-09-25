export type ShareFormat = 'story' | 'square' | 'landscape'
export type ShareMatch = { player: string; opponent: string; result: 'WIN' | 'LOSS' | 'DRAW'; score: string; sport: string; event?: string; tournament?: string; playedAt: string; verified: boolean; wins?: number; losses?: number; matches?: number; winRate?: number }
export const SHARE_DIMENSIONS: Record<ShareFormat, { width: number; height: number; label: string }> = { story: { width: 1080, height: 1920, label: 'Story · 1080 × 1920' }, square: { width: 1080, height: 1080, label: 'Square · 1080 × 1080' }, landscape: { width: 1200, height: 630, label: 'Landscape · 1200 × 630' } }

export function suggestedHashtags(match: ShareMatch): string[] {
  return ['#PlayPanda', `#${match.sport.replace(/[^a-z0-9]/gi, '')}`, '#GameDay', ...(match.tournament ? [`#${match.tournament.replace(/[^a-z0-9]/gi, '')}`] : []), ...(match.result === 'WIN' ? ['#Winning'] : [])]
}

export function engagementMessage(match: ShareMatch): string {
  if (match.result === 'LOSS') return 'GOOD GAME. ON TO THE NEXT ONE!'
  if (match.result === 'DRAW') return 'GREAT BATTLE. KEEP PUSHING!'
  if ((match.wins ?? 0) >= 3 && (match.matches ?? 0) > 0 && (match.wins ?? 0) === (match.matches ?? 0)) return 'YOU ARE ON A WINNING RUN!'
  if ((match.wins ?? 0) >= 10) return 'ANOTHER WIN FOR THE RECORD!'
  return 'CHAMPIONSHIP ENERGY!'
}

export async function renderMatchShareCard(match: ShareMatch, format: ShareFormat, options: { caption: string; hashtags: string; image?: HTMLImageElement | null }): Promise<Blob> {
  if (!match.verified) throw new Error('Only verified or confirmed matches can be shared as official cards.')
  const { width, height } = SHARE_DIMENSIONS[format]
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
  const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas is unavailable.')
  context.fillStyle = '#080D0B'; context.fillRect(0, 0, width, height)
  if (options.image) { const scale = Math.max(width / options.image.width, height / options.image.height); const w = options.image.width * scale; const h = options.image.height * scale; context.globalAlpha = .45; context.drawImage(options.image, (width - w) / 2, (height - h) / 2, w, h); context.globalAlpha = 1; context.fillStyle = 'rgba(8,13,11,.55)'; context.fillRect(0, 0, width, height) }
  const pad = Math.round(width * .08); context.fillStyle = '#3FD285'; context.font = `800 ${Math.max(22, width * .025)}px Arial`; context.fillText('PLAYPANDA', pad, pad * 1.15)
  context.fillStyle = match.result === 'WIN' ? '#22C55E' : match.result === 'LOSS' ? '#EF4444' : '#F4B942'; context.font = `900 ${Math.max(50, width * .1)}px Arial`; context.fillText(match.result, pad, height * .42)
  context.fillStyle = '#FFFFFF'; context.font = `700 ${Math.max(32, width * .06)}px Arial`; context.fillText(match.score, pad, height * .51); context.font = `700 ${Math.max(22, width * .03)}px Arial`; context.fillText(`${match.sport}${match.event ? ` · ${match.event}` : ''}`, pad, height * .57); context.font = `500 ${Math.max(18, width * .022)}px Arial`; context.fillStyle = '#A6B0AC'; context.fillText(`${match.player} vs ${match.opponent}`, pad, height * .62); context.fillText(new Date(match.playedAt).toLocaleString(), pad, height * .66)
  context.fillStyle = '#FFFFFF'; context.font = `800 ${Math.max(20, width * .026)}px Arial`; context.fillText(engagementMessage(match), pad, height * .78); context.font = `500 ${Math.max(16, width * .018)}px Arial`; context.fillStyle = '#A6B0AC'; context.fillText(options.caption.slice(0, 90), pad, height * .84); context.fillText(options.hashtags.slice(0, 100), pad, height * .88)
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG generation failed.')), 'image/png'))
}
