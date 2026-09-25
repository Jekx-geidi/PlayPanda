import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Database } from './database.types'

type Fn<K extends keyof Database['public']['Functions']> = Database['public']['Functions'][K]
type PostRow = Fn<'timeline_posts'>['Returns'][number]

export type PostAudience = PostRow['audience']
export type PostKind = PostRow['kind']
export type ReportReason = Database['public']['Tables']['reports']['Row']['reason']
export type ReportTarget = Database['public']['Tables']['reports']['Row']['target_type']
export type ReportStatus = Database['public']['Tables']['reports']['Row']['status']

export const PHOTO_BUCKET = 'post-photos'
export const MAX_PHOTOS = 5
export const MAX_CAPTION = 2000
export const MAX_COMMENT = 500
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const AUDIENCES: { value: PostAudience; label: string; icon: string }[] = [
  { value: 'public', label: 'Public', icon: '🌐' },
  { value: 'followers', label: 'Followers', icon: '👥' },
  { value: 'only_me', label: 'Only Me', icon: '🔒' },
]
export const AUDIENCE_LABEL = Object.fromEntries(AUDIENCES.map((a) => [a.value, `${a.icon} ${a.label}`])) as Record<
  PostAudience,
  string
>

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Something else' },
]

// ---- Caption helpers (mirror the posts_prepare trigger) ----------------------

const HASHTAG = /#([A-Za-z0-9_]{1,40})/g

/** Hashtags exactly as the database will store them. */
export function extractHashtags(caption: string): string[] {
  const tags = new Set<string>()
  for (const m of caption.matchAll(HASHTAG)) {
    tags.add(m[1].toLowerCase())
    if (tags.size === 20) break
  }
  return [...tags]
}

export type CaptionPart = { type: 'text'; value: string } | { type: 'tag'; value: string; tag: string }

/** Splits a caption so hashtags can render as links. */
export function splitCaption(caption: string): CaptionPart[] {
  const parts: CaptionPart[] = []
  let last = 0
  for (const m of caption.matchAll(HASHTAG)) {
    const at = m.index ?? 0
    if (at > last) parts.push({ type: 'text', value: caption.slice(last, at) })
    parts.push({ type: 'tag', value: m[0], tag: m[1].toLowerCase() })
    last = at + m[0].length
  }
  if (last < caption.length) parts.push({ type: 'text', value: caption.slice(last) })
  return parts
}

export function relativeTime(iso: string, now = new Date()): string {
  const then = new Date(iso)
  const seconds = Math.round((now.getTime() - then.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return then.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(then.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  })
}

// ---- Draft validation ----------------------------------------------------------

export interface PostDraft {
  kind: PostKind
  tournamentId: string
  sport: string
  caption: string
  audience: PostAudience
  photos: File[]
}

export function validatePostDraft(d: PostDraft): string[] {
  const errors: string[] = []
  if (!d.caption.trim() && d.photos.length === 0) errors.push('Write a caption or add at least one photo.')
  if (d.caption.length > MAX_CAPTION) errors.push(`Captions can be at most ${MAX_CAPTION} characters.`)
  if (d.photos.length > MAX_PHOTOS) errors.push(`You can add up to ${MAX_PHOTOS} photos.`)
  if (d.photos.some((f) => !ACCEPTED_PHOTO_TYPES.includes(f.type))) errors.push('Photos must be JPG, PNG or WEBP.')
  if (d.kind === 'tournament' && !d.tournamentId) errors.push('Choose the tournament this post is about.')
  return errors
}

// ---- Photo compression ---------------------------------------------------------

const MAX_EDGE = 1600

/**
 * Downscales to at most 1600px on the long edge and re-encodes as WEBP
 * (JPEG fallback) so uploads stay well under the bucket's 5 MB limit.
 * Falls back to the original file where canvas isn't available.
 */
export async function compressPhoto(file: File): Promise<Blob> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    const encode = (type: string) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.82))
    const blob = (await encode('image/webp')) ?? (await encode('image/jpeg'))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

// ---- Posts ---------------------------------------------------------------------

export interface TimelinePost {
  id: string
  authorUsername: string
  authorDisplayName: string
  authorAvatarUrl: string | null
  kind: PostKind
  sport: string | null
  caption: string
  hashtags: string[]
  photoPaths: string[]
  photoUrls: string[]
  audience: PostAudience
  hidden: boolean
  tournamentId: string | null
  tournamentName: string | null
  createdAt: string
  editedAt: string | null
  likeCount: number
  commentCount: number
  likedByMe: boolean
  isOwn: boolean
}

type Result<T> = { data: T; error: string | null }

export interface PostQuery {
  authorUsername?: string
  feed?: boolean
  hashtag?: string
  postId?: string
  before?: string
  limit?: number
}

async function signedUrls(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (paths.length === 0) return map
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60)
  for (const item of data ?? []) if (item.path && item.signedUrl) map.set(item.path, item.signedUrl)
  return map
}

export async function listPosts(q: PostQuery): Promise<Result<TimelinePost[]>> {
  const { data, error } = await supabase.rpc('timeline_posts', {
    p_author_username: q.authorUsername ?? null,
    p_feed: q.feed ?? false,
    p_hashtag: q.hashtag ?? null,
    p_post_id: q.postId ?? null,
    p_before: q.before ?? null,
    p_limit: q.limit ?? 20,
  })
  if (error) return { data: [], error: error.message }
  const rows = data ?? []
  const urls = await signedUrls(rows.flatMap((r) => r.photo_paths))
  return {
    data: rows.map((r) => ({
      id: r.id,
      authorUsername: r.author_username,
      authorDisplayName: r.author_display_name,
      authorAvatarUrl: r.author_avatar_url,
      kind: r.kind,
      sport: r.sport,
      caption: r.caption,
      hashtags: r.hashtags,
      photoPaths: r.photo_paths,
      // A photo whose URL can't be signed is simply not shown.
      photoUrls: r.photo_paths.map((p) => urls.get(p)).filter((u): u is string => Boolean(u)),
      audience: r.audience,
      hidden: r.hidden,
      tournamentId: r.tournament_id,
      tournamentName: r.tournament_name,
      createdAt: r.created_at,
      editedAt: r.edited_at,
      likeCount: Number(r.like_count),
      commentCount: Number(r.comment_count),
      likedByMe: r.liked_by_me,
      isOwn: r.is_own,
    })),
    error: null,
  }
}

function extensionFor(blob: Blob, original: File): string {
  if (blob.type === 'image/webp') return 'webp'
  if (blob.type === 'image/png') return 'png'
  if (blob.type === 'image/jpeg') return 'jpg'
  return original.name.split('.').pop()?.toLowerCase() || 'jpg'
}

/**
 * Uploads photos into <author>/<post>/ then inserts the post. If the insert
 * fails, the just-uploaded photos are removed again.
 */
export async function createPost(session: Session, d: PostDraft): Promise<Result<string | null>> {
  const postId = crypto.randomUUID()
  const uploaded: string[] = []

  for (const [i, file] of d.photos.entries()) {
    const blob = await compressPhoto(file)
    const path = `${session.user.id}/${postId}/${i + 1}.${extensionFor(blob, file)}`
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, blob, { contentType: blob.type || file.type, upsert: false })
    if (error) {
      if (uploaded.length) await supabase.storage.from(PHOTO_BUCKET).remove(uploaded)
      return { data: null, error: `Photo upload failed: ${error.message}` }
    }
    uploaded.push(path)
  }

  const { error } = await supabase.from('posts').insert({
    id: postId,
    author_id: session.user.id,
    kind: d.kind,
    tournament_id: d.kind === 'tournament' ? d.tournamentId : null,
    sport: d.sport.trim() || null,
    caption: d.caption.trim(),
    audience: d.audience,
    photo_paths: uploaded,
  })
  if (error) {
    if (uploaded.length) await supabase.storage.from(PHOTO_BUCKET).remove(uploaded)
    if (/violates foreign key/i.test(error.message))
      return { data: null, error: 'Create your player profile before posting.' }
    return { data: null, error: error.message }
  }
  return { data: postId, error: null }
}

export async function updatePost(
  id: string,
  patch: { caption?: string; audience?: PostAudience; hidden?: boolean }
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('posts').update(patch).eq('id', id)
  return { error: error?.message ?? null }
}

/** Deletes the post and its photos. Official match records are unaffected. */
export async function deletePost(post: Pick<TimelinePost, 'id' | 'photoPaths'>): Promise<{ error: string | null }> {
  const { error } = await supabase.from('posts').delete().eq('id', post.id)
  if (error) return { error: error.message }
  if (post.photoPaths.length) await supabase.storage.from(PHOTO_BUCKET).remove(post.photoPaths)
  return { error: null }
}

// ---- Likes & comments ------------------------------------------------------------

export async function setLiked(session: Session, postId: string, liked: boolean): Promise<{ error: string | null }> {
  const { error } = liked
    ? await supabase.from('post_likes').insert({ post_id: postId, user_id: session.user.id })
    : await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', session.user.id)
  if (error && /violates foreign key/i.test(error.message))
    return { error: 'Create your player profile to like posts.' }
  return { error: error?.message ?? null }
}

export interface PostComment {
  id: string
  authorUsername: string
  authorDisplayName: string
  authorAvatarUrl: string | null
  body: string
  createdAt: string
  canDelete: boolean
}

export async function listComments(postId: string): Promise<Result<PostComment[]>> {
  const { data, error } = await supabase.rpc('post_comments_for', { p_post_id: postId })
  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((c) => ({
      id: c.id,
      authorUsername: c.author_username,
      authorDisplayName: c.author_display_name,
      authorAvatarUrl: c.author_avatar_url,
      body: c.body,
      createdAt: c.created_at,
      canDelete: c.can_delete,
    })),
    error: null,
  }
}

export async function addComment(session: Session, postId: string, body: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('post_comments').insert({ post_id: postId, author_id: session.user.id, body: body.trim() })
  if (error && /violates foreign key/i.test(error.message))
    return { error: 'Create your player profile to comment.' }
  return { error: error?.message ?? null }
}

export async function deleteComment(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('post_comments').delete().eq('id', id)
  return { error: error?.message ?? null }
}

// ---- Moderation --------------------------------------------------------------

export async function reportContent(
  session: Session,
  target: { type: ReportTarget; id: string },
  reason: ReportReason,
  details: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('reports').insert({
    reporter_id: session.user.id,
    target_type: target.type,
    target_id: target.id,
    reason,
    details: details.trim(),
  })
  if (error && /reports_one_open_per_target/i.test(error.message))
    return { error: 'You already reported this. Our team will review it.' }
  return { error: error?.message ?? null }
}

async function playerId(username: string): Promise<string | null> {
  const { data } = await supabase.rpc('player_id_for', { p_username: username })
  return data ?? null
}

export async function isBlocked(session: Session, username: string): Promise<boolean> {
  const id = await playerId(username)
  if (!id) return false
  const { data } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', session.user.id)
    .eq('blocked_id', id)
    .maybeSingle()
  return Boolean(data)
}

export async function setBlocked(session: Session, username: string, blocked: boolean): Promise<{ error: string | null }> {
  const id = await playerId(username)
  if (!id) return { error: 'Player not found.' }
  const { error } = blocked
    ? await supabase.from('blocks').insert({ blocker_id: session.user.id, blocked_id: id })
    : await supabase.from('blocks').delete().eq('blocker_id', session.user.id).eq('blocked_id', id)
  if (error && /violates foreign key/i.test(error.message))
    return { error: 'Create your player profile to block players.' }
  return { error: error?.message ?? null }
}

export interface AdminReport {
  id: string
  targetType: ReportTarget
  targetId: string
  reason: ReportReason
  details: string
  status: ReportStatus
  createdAt: string
  reporterUsername: string | null
  subjectUsername: string | null
  snippet: string | null
  postId: string | null
}

export async function listReports(status: ReportStatus = 'open'): Promise<Result<AdminReport[]>> {
  const { data, error } = await supabase.rpc('admin_reports', { p_status: status })
  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((r) => ({
      id: r.id,
      targetType: r.target_type,
      targetId: r.target_id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.created_at,
      reporterUsername: r.reporter_username,
      subjectUsername: r.subject_username,
      snippet: r.snippet,
      postId: r.post_id,
    })),
    error: null,
  }
}

export async function setReportStatus(id: string, status: Exclude<ReportStatus, 'open'>): Promise<{ error: string | null }> {
  const { error } = await supabase.from('reports').update({ status }).eq('id', id)
  return { error: error?.message ?? null }
}

/** Admin removal of reported content. */
export async function adminRemove(target: { type: ReportTarget; id: string }): Promise<{ error: string | null }> {
  if (target.type === 'post') {
    const { data } = await supabase.from('posts').select('photo_paths').eq('id', target.id).maybeSingle()
    return deletePost({ id: target.id, photoPaths: data?.photo_paths ?? [] })
  }
  if (target.type === 'comment') return deleteComment(target.id)
  // There is no account suspension yet; admins remove the user's posts one by one.
  return { error: 'Suspending accounts is not available yet. Remove the reported posts or comments instead.' }
}
