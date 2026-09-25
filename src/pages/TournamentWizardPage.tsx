import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminShell from '../components/admin/AdminShell'
import {
  CATEGORY_LABEL,
  CUSTOM_ESPORT,
  CUSTOM_PLACEHOLDER,
  CUSTOM_SPORT,
  EMPTY_DRAFT,
  FORMATS,
  FORMAT_LABEL,
  PARTICIPANT_LABEL,
  PARTICIPANT_TYPES,
  SCORING_FIELDS,
  WIZARD_STEPS,
  deleteTournament,
  formatDateRange,
  getTournament,
  hasErrors,
  publishTournament,
  saveTournamentDraft,
  scoringDefaultsFor,
  scoringFamilyFor,
  sportOptionsFor,
  unpublishTournament,
  validateForPublish,
  type Category,
  type ScoringConfig,
  type StepKey,
  type TournamentDraft,
  type TournamentStatus,
} from '../lib/tournaments'
import './TournamentWizardPage.css'

function Field({
  id,
  label,
  optional,
  helper,
  children,
}: {
  id: string
  label: string
  optional?: boolean
  helper?: string
  children: ReactNode
}) {
  return (
    <div className="Wizard-field">
      <label htmlFor={id} className="Wizard-label">
        {label} {optional && <span className="Wizard-optional">(optional)</span>}
      </label>
      {children}
      {helper && <p className="Wizard-helper">{helper}</p>}
    </div>
  )
}

export default function TournamentWizardPage() {
  const { id: routeId } = useParams()
  const isNew = !routeId || routeId === 'new'
  const navigate = useNavigate()

  const [draft, setDraft] = useState<TournamentDraft>(EMPTY_DRAFT)
  const [savedId, setSavedId] = useState<string | undefined>(isNew ? undefined : routeId)
  const [status, setStatus] = useState<TournamentStatus>('draft')
  const [loading, setLoading] = useState(!isNew)
  const [notFound, setNotFound] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [showStepErrors, setShowStepErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (isNew) return
    let cancelled = false
    getTournament(routeId!).then((result) => {
      if (cancelled) return
      if (result.error) setNotice({ kind: 'error', text: result.error })
      if (!result.data) setNotFound(!result.error)
      else {
        setDraft(result.data.draft)
        setStatus(result.data.status)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [isNew, routeId])

  // UXS: warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const errors = useMemo(() => validateForPublish(draft), [draft])
  const step = WIZARD_STEPS[stepIndex]
  const stepErrors = step.key === 'review' ? [] : (errors[step.key] ?? [])
  const isLast = stepIndex === WIZARD_STEPS.length - 1

  const update = (patch: Partial<TournamentDraft>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setDirty(true)
    setNotice(null)
  }
  const updateScoring = (patch: Partial<ScoringConfig>) =>
    update({ scoring: { ...draft.scoring, ...patch } })

  const goTo = (index: number) => {
    setStepIndex(index)
    setShowStepErrors(false)
    window.scrollTo?.({ top: 0 })
  }

  const handleContinue = () => {
    if (stepErrors.length > 0) {
      setShowStepErrors(true)
      return
    }
    goTo(stepIndex + 1)
  }

  const afterSave = (id: string, message: string) => {
    setSavedId(id)
    setDirty(false)
    setNotice({ kind: 'ok', text: message })
    if (isNew) navigate(`/admin/tournaments/${id}`, { replace: true })
  }

  const handleSaveDraft = async () => {
    setBusy(true)
    const result = status === 'published'
      ? await publishTournament(draft, savedId)
      : await saveTournamentDraft(draft, savedId)
    setBusy(false)
    if (result.error || !result.data) {
      setNotice({ kind: 'error', text: result.error ?? 'Save failed.' })
      return
    }
    afterSave(result.data, status === 'published' ? 'Changes published.' : 'Draft saved.')
  }

  const handlePublish = async () => {
    if (hasErrors(errors)) return
    setBusy(true)
    const result = await publishTournament(draft, savedId)
    setBusy(false)
    if (result.error || !result.data) {
      setNotice({ kind: 'error', text: result.error ?? 'Publish failed.' })
      return
    }
    setStatus('published')
    afterSave(result.data, 'Tournament published. It is now visible on /tournaments.')
  }

  const handleUnpublish = async () => {
    if (!savedId) return
    if (!window.confirm('Unpublish this tournament? It will disappear from the public site.')) return
    setBusy(true)
    const { error } = await unpublishTournament(savedId)
    setBusy(false)
    if (error) {
      setNotice({ kind: 'error', text: error })
      return
    }
    setStatus('draft')
    setNotice({ kind: 'ok', text: 'Tournament moved back to draft.' })
  }

  const handleDelete = async () => {
    if (!savedId) return
    if (!window.confirm('Delete this draft permanently? This cannot be undone.')) return
    setBusy(true)
    const { error } = await deleteTournament(savedId)
    setBusy(false)
    if (error) {
      setNotice({ kind: 'error', text: error })
      return
    }
    setDirty(false)
    navigate('/admin/tournaments', { replace: true })
  }

  if (loading) {
    return (
      <AdminShell>
        <p className="AdminPage-empty">Loading tournament…</p>
      </AdminShell>
    )
  }

  if (notFound) {
    return (
      <AdminShell>
        <h1 className="AdminPage-title">Tournament not found</h1>
        <Link to="/admin/tournaments" className="AdminPage-link">
          Back to tournaments
        </Link>
      </AdminShell>
    )
  }

  const sportOptions = sportOptionsFor(draft.category)
  const customLabel = draft.category === 'esports' ? CUSTOM_ESPORT : CUSTOM_SPORT
  const isCustomSport =
    draft.sportGame !== '' && !sportOptions.some((s) => s.name === draft.sportGame)
  const customMode = isCustomSport
  const family = scoringFamilyFor(draft.sportGame)
  const needsRoster = draft.participantType === 'team' || draft.participantType === 'multiplayer'

  const renderStep = (key: StepKey) => {
    switch (key) {
      case 'basic':
        return (
          <>
            <Field id="t-name" label="Tournament Name">
              <input id="t-name" className="Wizard-input" value={draft.name} maxLength={120}
                onChange={(e) => update({ name: e.target.value })} />
            </Field>
            <Field id="t-description" label="Description" optional>
              <textarea id="t-description" className="Wizard-input" rows={4} maxLength={5000}
                value={draft.description} onChange={(e) => update({ description: e.target.value })} />
            </Field>
            <Field id="t-cover" label="Cover Image URL" optional helper="Paste an https:// link to the banner image.">
              <input id="t-cover" type="url" className="Wizard-input" value={draft.coverImageUrl}
                onChange={(e) => update({ coverImageUrl: e.target.value })} />
            </Field>
            <div className="Wizard-row">
              <Field id="t-start" label="Start Date">
                <input id="t-start" type="date" className="Wizard-input" value={draft.startDate}
                  onChange={(e) => update({ startDate: e.target.value })} />
              </Field>
              <Field id="t-end" label="End Date">
                <input id="t-end" type="date" className="Wizard-input" value={draft.endDate} min={draft.startDate || undefined}
                  onChange={(e) => update({ endDate: e.target.value })} />
              </Field>
            </div>
            <div className="Wizard-row">
              <Field id="t-reg-start" label="Registration Start">
                <input id="t-reg-start" type="datetime-local" className="Wizard-input" value={draft.registrationStart}
                  onChange={(e) => update({ registrationStart: e.target.value })} />
              </Field>
              <Field id="t-reg-end" label="Registration End">
                <input id="t-reg-end" type="datetime-local" className="Wizard-input" value={draft.registrationEnd}
                  onChange={(e) => update({ registrationEnd: e.target.value })} />
              </Field>
            </div>
            <Field id="t-venue" label="Venue">
              <input id="t-venue" className="Wizard-input" value={draft.venue} maxLength={200}
                onChange={(e) => update({ venue: e.target.value })} />
            </Field>
            <fieldset className="Wizard-fieldset">
              <legend className="Wizard-label">Visibility</legend>
              <label className="Wizard-choice">
                <input type="radio" name="visibility" checked={draft.visibility === 'public'}
                  onChange={() => update({ visibility: 'public' })} />
                <span><strong>Public</strong><small>Listed on /tournaments once published.</small></span>
              </label>
              <label className="Wizard-choice">
                <input type="radio" name="visibility" checked={draft.visibility === 'private'}
                  onChange={() => update({ visibility: 'private' })} />
                <span><strong>Private</strong><small>Only admins can see it, even after publishing.</small></span>
              </label>
            </fieldset>
          </>
        )

      case 'category':
        return (
          <fieldset className="Wizard-fieldset">
            <legend className="Wizard-label">Tournament Category</legend>
            {(['sports', 'esports'] as Category[]).map((c) => (
              <label key={c} className="Wizard-choice">
                <input type="radio" name="category" checked={draft.category === c}
                  onChange={() => {
                    if (draft.category !== c) update({ category: c, sportGame: '', scoring: {} })
                  }} />
                <span>
                  <strong>{CATEGORY_LABEL[c]}</strong>
                  <small>{c === 'sports' ? 'Basketball, volleyball, badminton, bowling…' : 'Mobile Legends, Valorant, Tekken, PUBG…'}</small>
                </span>
              </label>
            ))}
          </fieldset>
        )

      case 'sport':
        if (!draft.category) {
          return <p className="Wizard-helper">Choose a category first.</p>
        }
        return (
          <>
            <Field id="t-sport" label={draft.category === 'esports' ? 'Game' : 'Sport'}>
              <select id="t-sport" className="Wizard-input"
                value={customMode ? customLabel : draft.sportGame}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === customLabel) update({ sportGame: CUSTOM_PLACEHOLDER, scoring: {} })
                  else update({ sportGame: value, scoring: scoringDefaultsFor(value) })
                }}>
                <option value="">Select…</option>
                {sportOptions.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                <option value={customLabel}>{customLabel}</option>
              </select>
            </Field>
            {customMode && (
              <Field id="t-sport-custom" label="Custom name">
                <input id="t-sport-custom" className="Wizard-input" maxLength={60}
                  value={draft.sportGame === CUSTOM_PLACEHOLDER ? '' : draft.sportGame}
                  onChange={(e) => update({ sportGame: e.target.value || CUSTOM_PLACEHOLDER })} />
              </Field>
            )}
          </>
        )

      case 'event':
        return (
          <Field id="t-event" label="Event / Division" helper="e.g. Men’s Open, U-18 Mixed, Pro Division.">
            <input id="t-event" className="Wizard-input" maxLength={120} value={draft.eventDivision}
              onChange={(e) => update({ eventDivision: e.target.value })} />
          </Field>
        )

      case 'participant':
        return (
          <fieldset className="Wizard-fieldset">
            <legend className="Wizard-label">Participant Type</legend>
            {PARTICIPANT_TYPES.map((p) => (
              <label key={p.value} className="Wizard-choice">
                <input type="radio" name="participantType" checked={draft.participantType === p.value}
                  onChange={() => update({ participantType: p.value })} />
                <span><strong>{p.label}</strong><small>{p.blurb}</small></span>
              </label>
            ))}
          </fieldset>
        )

      case 'format':
        return (
          <fieldset className="Wizard-fieldset Wizard-grid">
            <legend className="Wizard-label">Tournament Format</legend>
            {FORMATS.map((f) => (
              <label key={f.value} className="Wizard-choice">
                <input type="radio" name="format" checked={draft.format === f.value}
                  onChange={() => update({ format: f.value })} />
                <span><strong>{f.label}</strong></span>
              </label>
            ))}
          </fieldset>
        )

      case 'scoring': {
        const fields = SCORING_FIELDS[family]
        return (
          <>
            {!draft.sportGame && <p className="Wizard-helper">Choose a sport or game first.</p>}
            <div className="Wizard-row">
              {fields.map((f) => (
                <Field key={f.key} id={`t-score-${f.key}`} label={f.label}>
                  <input id={`t-score-${f.key}`} type="number" min={1} max={999} className="Wizard-input"
                    value={(draft.scoring[f.key] as number | undefined) ?? ''}
                    onChange={(e) => updateScoring({ [f.key]: e.target.value === '' ? undefined : Number(e.target.value) })} />
                </Field>
              ))}
            </div>
            {family === 'sets' && (
              <label className="Wizard-check">
                <input type="checkbox" checked={draft.scoring.winByTwo ?? true}
                  onChange={(e) => updateScoring({ winByTwo: e.target.checked })} />
                Sets must be won by two points
              </label>
            )}
            <Field id="t-score-notes" label="Scoring notes" optional helper="Tiebreak, overtime or house rules to show participants.">
              <textarea id="t-score-notes" className="Wizard-input" rows={3} maxLength={1000}
                value={draft.scoring.notes ?? ''} onChange={(e) => updateScoring({ notes: e.target.value || undefined })} />
            </Field>
          </>
        )
      }

      case 'registration':
        return (
          <>
            <Field id="t-max" label="Maximum Entries" helper="Total teams/players/pairs accepted (2–1024).">
              <input id="t-max" type="number" min={2} max={1024} className="Wizard-input" value={draft.maxEntries}
                onChange={(e) => update({ maxEntries: e.target.value })} />
            </Field>
            {needsRoster && (
              <div className="Wizard-row">
                <Field id="t-roster-min" label="Minimum Roster Size">
                  <input id="t-roster-min" type="number" min={1} max={100} className="Wizard-input" value={draft.rosterMin}
                    onChange={(e) => update({ rosterMin: e.target.value })} />
                </Field>
                <Field id="t-roster-max" label="Maximum Roster Size">
                  <input id="t-roster-max" type="number" min={1} max={100} className="Wizard-input" value={draft.rosterMax}
                    onChange={(e) => update({ rosterMax: e.target.value })} />
                </Field>
              </div>
            )}
            <label className="Wizard-check">
              <input type="checkbox" checked={draft.requiresApproval}
                onChange={(e) => update({ requiresApproval: e.target.checked })} />
              Entries need admin approval before they are confirmed
            </label>
          </>
        )

      case 'review':
        return <Review draft={draft} errors={errors} onEdit={goTo} />
    }
  }

  return (
    <AdminShell>
      <p className="AdminPage-eyebrow">
        <Link to="/admin/tournaments" className="AdminPage-link">← Tournaments</Link>
      </p>
      <div className="AdminPage-titleRow">
        <h1 className="AdminPage-title">{draft.name.trim() || (isNew ? 'Create Tournament' : 'Untitled draft')}</h1>
        <span className={`StatusPill StatusPill--${status}`}>{status === 'published' ? 'Published' : 'Draft'}</span>
      </div>

      <div className="Wizard">
        <ol className="Wizard-steps" aria-label="Setup steps">
          {WIZARD_STEPS.map((s, i) => {
            const incomplete = s.key !== 'review' && (errors[s.key]?.length ?? 0) > 0
            return (
              <li key={s.key}>
                <button type="button" onClick={() => goTo(i)}
                  className={`Wizard-step${i === stepIndex ? ' is-current' : ''}${incomplete ? '' : ' is-complete'}`}
                  aria-current={i === stepIndex ? 'step' : undefined}>
                  <span className="Wizard-stepNum" aria-hidden="true">{incomplete || s.key === 'review' ? i + 1 : '✓'}</span>
                  {s.label}
                </button>
              </li>
            )
          })}
        </ol>

        <section className="Wizard-panel" aria-labelledby="wizard-step-title">
          <p className="Wizard-progress">Step {stepIndex + 1} of {WIZARD_STEPS.length}</p>
          <div className="Wizard-progressBar" aria-hidden="true">
            <span style={{ width: `${((stepIndex + 1) / WIZARD_STEPS.length) * 100}%` }} />
          </div>
          <h2 id="wizard-step-title" className="Wizard-title">{step.label}</h2>

          {notice && (
            <div className={notice.kind === 'error' ? 'AdminPage-error' : 'Wizard-ok'} role={notice.kind === 'error' ? 'alert' : 'status'}>
              {notice.text}
            </div>
          )}

          <div className="Wizard-body">{renderStep(step.key)}</div>

          {showStepErrors && stepErrors.length > 0 && (
            <ul className="Wizard-errors" role="alert">
              {stepErrors.map((m) => <li key={m}>{m}</li>)}
            </ul>
          )}

          <div className="Wizard-actions">
            <button type="button" className="AdminPage-btn AdminPage-btn--outline" onClick={() => goTo(stepIndex - 1)}
              disabled={stepIndex === 0 || busy}>
              Back
            </button>
            <button type="button" className="AdminPage-btn AdminPage-btn--outline" onClick={handleSaveDraft} disabled={busy}>
              {status === 'published' ? 'Save & Update' : 'Save Draft'}
            </button>
            {isLast ? (
              status === 'published' ? (
                <button type="button" className="AdminPage-btn AdminPage-btn--danger" onClick={handleUnpublish} disabled={busy}>
                  Unpublish
                </button>
              ) : (
                <button type="button" className="AdminPage-btn" onClick={handlePublish} disabled={busy || hasErrors(errors)}>
                  {busy ? 'Publishing…' : 'Publish'}
                </button>
              )
            ) : (
              <button type="button" className="AdminPage-btn" onClick={handleContinue} disabled={busy}>
                Continue
              </button>
            )}
          </div>

          {savedId && status === 'draft' && (
            <button type="button" className="Wizard-delete" onClick={handleDelete} disabled={busy}>
              Delete draft
            </button>
          )}
        </section>
      </div>
    </AdminShell>
  )
}

function Review({
  draft,
  errors,
  onEdit,
}: {
  draft: TournamentDraft
  errors: ReturnType<typeof validateForPublish>
  onEdit: (index: number) => void
}) {
  const family = scoringFamilyFor(draft.sportGame)
  const scoringSummary = SCORING_FIELDS[family]
    .map((f) => `${f.label}: ${draft.scoring[f.key] ?? '—'}`)
    .concat(family === 'sets' ? [`Win by two: ${draft.scoring.winByTwo ?? true ? 'Yes' : 'No'}`] : [])
    .join(' · ')
  const rows: { step: StepKey; label: string; value: ReactNode }[] = [
    { step: 'basic', label: 'Name', value: draft.name || '—' },
    { step: 'basic', label: 'Dates', value: formatDateRange(draft.startDate || null, draft.endDate || null) },
    { step: 'basic', label: 'Registration', value: draft.registrationStart && draft.registrationEnd
      ? `${new Date(draft.registrationStart).toLocaleString()} – ${new Date(draft.registrationEnd).toLocaleString()}` : '—' },
    { step: 'basic', label: 'Venue', value: draft.venue || '—' },
    { step: 'basic', label: 'Visibility', value: draft.visibility === 'public' ? 'Public' : 'Private' },
    { step: 'category', label: 'Category', value: draft.category ? CATEGORY_LABEL[draft.category] : '—' },
    { step: 'sport', label: 'Sport / Game', value: draft.sportGame || '—' },
    { step: 'event', label: 'Event / Division', value: draft.eventDivision || '—' },
    { step: 'participant', label: 'Participant Type', value: draft.participantType ? PARTICIPANT_LABEL[draft.participantType] : '—' },
    { step: 'format', label: 'Format', value: draft.format ? FORMAT_LABEL[draft.format] : '—' },
    { step: 'scoring', label: 'Scoring', value: scoringSummary || (draft.scoring.notes ? 'See notes' : 'Custom') },
    { step: 'registration', label: 'Max Entries', value: draft.maxEntries || '—' },
    ...(draft.participantType === 'team' || draft.participantType === 'multiplayer'
      ? [{ step: 'registration' as StepKey, label: 'Roster Size', value: `${draft.rosterMin || '—'} – ${draft.rosterMax || '—'}` }]
      : []),
    { step: 'registration', label: 'Approval', value: draft.requiresApproval ? 'Admin approves entries' : 'Auto-confirm entries' },
  ]
  const problems = WIZARD_STEPS.flatMap((s, i) =>
    s.key === 'review' ? [] : (errors[s.key] ?? []).map((m) => ({ index: i, label: s.label, message: m }))
  )

  return (
    <>
      {problems.length > 0 ? (
        <div className="Wizard-blocked" role="alert">
          <p><strong>Not ready to publish.</strong> Fix these first:</p>
          <ul>
            {problems.map((p) => (
              <li key={`${p.label}-${p.message}`}>
                <button type="button" className="AdminPage-link Wizard-linkBtn" onClick={() => onEdit(p.index)}>
                  {p.label}
                </button>
                : {p.message}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="Wizard-ok" role="status">Everything required is set. Review the details, then publish.</p>
      )}
      <dl className="Wizard-review">
        {rows.map((r) => (
          <div key={r.label} className="Wizard-reviewRow">
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
            <button type="button" className="AdminPage-link Wizard-linkBtn"
              onClick={() => onEdit(WIZARD_STEPS.findIndex((s) => s.key === r.step))}
              aria-label={`Edit ${r.label}`}>
              Edit
            </button>
          </div>
        ))}
      </dl>
    </>
  )
}
