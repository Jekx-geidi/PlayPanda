import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserAccount } from '../lib/account'
import {
  EMPTY_PROFILE,
  MAX_PROFILE_SPORTS,
  PROFILE_SPORTS,
  SKILL_LEVELS,
  getMyProfile,
  saveMyProfile,
  suggestUsername,
  validateProfile,
  type ProfileErrors,
  type ProfileForm,
} from '../lib/players'
import './ProfileEditPage.css'
import './StatusPage.css'

function Choice<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string
  name: string
  value: T
  options: { value: T; label: string; hint: string }[]
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="ProfileEdit-choice">
      <legend>{legend}</legend>
      {options.map((o) => (
        <label key={o.value}>
          <input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} />
          <span><strong>{o.label}</strong><small>{o.hint}</small></span>
        </label>
      ))}
    </fieldset>
  )
}

function Field({ id, label, error, hint, children }: { id: string; label: ReactNode; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="ProfileEdit-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <small className="ProfileEdit-error">{error}</small> : hint ? <small>{hint}</small> : null}
    </div>
  )
}

/** Create or edit the signed-in user's public sports profile. */
export default function ProfileEditPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<ProfileForm>(EMPTY_PROFILE)
  const [exists, setExists] = useState(false)
  const [checking, setChecking] = useState(true)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (loading || !session) return
    let cancelled = false
    ;(async () => {
      const mine = await getMyProfile(session)
      if (cancelled) return
      if (mine.data) {
        setForm(mine.data)
        setExists(true)
      } else {
        // New profile: start from the registration form's display name.
        const account = await getUserAccount(session)
        if (cancelled) return
        const name = account?.displayName ?? session.user.email?.split('@')[0] ?? ''
        setForm({ ...EMPTY_PROFILE, displayName: name, username: suggestUsername(name) })
        if (mine.error) setSaveError(mine.error)
      }
      setChecking(false)
    })()
    return () => {
      cancelled = true
    }
  }, [session, loading])

  if (loading || (session && checking)) {
    return (
      <div className="StatusPage">
        <p className="StatusPage-text">Loading your profile…</p>
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />

  const set = (patch: Partial<ProfileForm>) => setForm((f) => ({ ...f, ...patch }))
  const toggleSport = (sport: string) =>
    set({ sports: form.sports.includes(sport) ? form.sports.filter((s) => s !== sport) : [...form.sports, sport] })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validateProfile(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    setSaveError(null)
    const { error } = await saveMyProfile(session, form, exists)
    setSaving(false)
    if (error) {
      setSaveError(error)
      return
    }
    navigate(`/player/${form.username}`, { replace: true })
  }

  return (
    <main className="ProfileEdit">
      <Link to={exists ? `/player/${form.username}` : '/players'} className="ProfileEdit-back">
        ← {exists ? 'Back to my profile' : 'Discover players'}
      </Link>
      <h1>{exists ? 'Edit Profile' : 'Create Your Player Profile'}</h1>
      <p className="ProfileEdit-lead">
        This is your public sports profile. Your email and contact number are never shown on it.
      </p>

      <form onSubmit={submit} noValidate className="ProfileEdit-form">
        {saveError && <p className="ProfileEdit-alert" role="alert">{saveError}</p>}

        <section className="ProfileEdit-section">
          <h2>Identity</h2>
          <div className="ProfileEdit-grid">
            <Field id="pe-username" label="Username" error={errors.username} hint={`Your profile link: /player/${form.username || 'username'}`}>
              <div className="ProfileEdit-prefix">
                <span aria-hidden="true">@</span>
                <input id="pe-username" value={form.username} maxLength={20} autoComplete="off"
                  onChange={(e) => set({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} />
              </div>
            </Field>
            <Field id="pe-name" label="Display name" error={errors.displayName}>
              <input id="pe-name" value={form.displayName} maxLength={40} onChange={(e) => set({ displayName: e.target.value })} />
            </Field>
            <Field id="pe-avatar" label={<>Avatar URL <span className="ProfileEdit-optional">(optional)</span></>} error={errors.avatarUrl} hint="An https:// link to a square image.">
              <input id="pe-avatar" type="url" value={form.avatarUrl} onChange={(e) => set({ avatarUrl: e.target.value })} />
            </Field>
            <Field id="pe-city" label={<>City / area <span className="ProfileEdit-optional">(optional)</span></>} error={errors.city} hint="City only — never your exact address.">
              <input id="pe-city" value={form.city} maxLength={60} placeholder="Cebu" onChange={(e) => set({ city: e.target.value })} />
            </Field>
          </div>
          <Field id="pe-bio" label={<>Bio <span className="ProfileEdit-optional">(optional)</span></>} error={errors.bio} hint={`${form.bio.length}/280`}>
            <textarea id="pe-bio" rows={3} maxLength={280} value={form.bio} onChange={(e) => set({ bio: e.target.value })} />
          </Field>
        </section>

        <section className="ProfileEdit-section">
          <h2>Sports &amp; games</h2>
          <p className="ProfileEdit-hint">Pick up to {MAX_PROFILE_SPORTS}. Players can find you by these.</p>
          <div className="ProfileEdit-sports" role="group" aria-label="Sports and games">
            {PROFILE_SPORTS.map((sport) => {
              const on = form.sports.includes(sport)
              return (
                <button key={sport} type="button" aria-pressed={on} className={on ? 'is-on' : ''}
                  disabled={!on && form.sports.length >= MAX_PROFILE_SPORTS} onClick={() => toggleSport(sport)}>
                  {sport}
                </button>
              )
            })}
          </div>
          {errors.sports && <small className="ProfileEdit-error">{errors.sports}</small>}
          <div className="ProfileEdit-grid">
            <Field id="pe-skill" label="Skill level">
              <select id="pe-skill" value={form.skillLevel} onChange={(e) => set({ skillLevel: e.target.value as ProfileForm['skillLevel'] })}>
                <option value="">Prefer not to say</option>
                {SKILL_LEVELS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <label className="ProfileEdit-check">
              <input type="checkbox" checked={form.availableToPlay} onChange={(e) => set({ availableToPlay: e.target.checked })} />
              I&apos;m available to play
            </label>
          </div>
        </section>

        <section className="ProfileEdit-section">
          <h2>Profile privacy</h2>
          <div className="ProfileEdit-grid">
            <Choice legend="Profile" name="pv" value={form.profileVisibility} onChange={(v) => set({ profileVisibility: v })}
              options={[
                { value: 'public', label: 'Public', hint: 'Anyone can see your sports profile.' },
                { value: 'followers', label: 'Followers only', hint: 'Others see only your name and avatar until they follow you.' },
              ]} />
            <Choice legend="Match history" name="mh" value={form.matchHistoryVisibility} onChange={(v) => set({ matchHistoryVisibility: v })}
              options={[
                { value: 'public', label: 'Public', hint: 'Anyone who can see your profile.' },
                { value: 'followers', label: 'Followers only', hint: 'Only people who follow you.' },
                { value: 'private', label: 'Private', hint: 'Only you.' },
              ]} />
            <Choice legend="Following & followers lists" name="fl" value={form.followingVisibility} onChange={(v) => set({ followingVisibility: v })}
              options={[
                { value: 'public', label: 'Public', hint: 'Others can open your lists. Counts are always shown.' },
                { value: 'private', label: 'Private', hint: 'Only you can open your lists.' },
              ]} />
            <Choice legend="Availability" name="av" value={form.availabilityVisibility} onChange={(v) => set({ availabilityVisibility: v })}
              options={[
                { value: 'matchmaking', label: 'Matchmaking only', hint: 'Show “Available to play” in Discover.' },
                { value: 'private', label: 'Private', hint: 'Never show your availability.' },
              ]} />
          </div>
        </section>

        <div className="ProfileEdit-actions">
          <button type="submit" className="ProfileEdit-primary" disabled={saving}>
            {saving ? 'Saving…' : exists ? 'Save Profile' : 'Create Profile'}
          </button>
        </div>
      </form>
    </main>
  )
}
