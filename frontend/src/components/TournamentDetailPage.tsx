import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trophy, ArrowLeft, CheckCircle } from 'lucide-react'

type TournamentDetailPageProps = {
  mode: 'create' | 'edit'
  data: any | null
  isSaving: boolean
  isLoading: boolean
  onBack: () => void
  onSaveDraft: (payload: any) => void
  onPublish: (tournamentId: string) => void
  apiBaseUrl?: string
  authToken?: string | null
}

function toDateInputValue(value?: string | null): string {
  if (!value) return ''
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

function statusLabel(status?: string | null): string {
  if (!status) return 'Draft'
  const s = status.toUpperCase()
  if (s === 'DRAFT') return 'Draft'
  if (s === 'PUBLISHED') return 'Published'
  if (s === 'ONGOING') return 'Ongoing'
  if (s === 'COMPLETED') return 'Completed'
  return status
}

export function TournamentDetailPage({
  mode,
  data,
  isSaving,
  isLoading,
  onBack,
  onSaveDraft,
  onPublish,
  apiBaseUrl,
  authToken,
}: TournamentDetailPageProps) {
  const tournament = data?.tournament
  const applications = data?.applications || []
  const latestSnapshot = data?.latestSnapshot

  const isDraft = (tournament?.status ?? 'DRAFT') === 'DRAFT'

  const [name, setName] = useState<string>(tournament?.name ?? '')
  const [sport, setSport] = useState<string>(tournament?.sport ?? 'FOOTBALL')
  const [level, setLevel] = useState<string>(tournament?.level ?? 'DISTRICT')
  const [genderCategory, setGenderCategory] = useState<string>(tournament?.genderCategory ?? '')
  const [ageCategory, setAgeCategory] = useState<string>(tournament?.ageCategory ?? '')
  const [venue, setVenue] = useState<string>(tournament?.venue ?? '')
  const [format, setFormat] = useState<string>(tournament?.format ?? '')
  const [numberOfTeams, setNumberOfTeams] = useState<string>(
    tournament?.numberOfTeams != null ? String(tournament.numberOfTeams) : ''
  )

  const [matchDurationMinutes, setMatchDurationMinutes] = useState<string>(
    tournament?.matchDurationMinutes != null ? String(tournament.matchDurationMinutes) : ''
  )
  const [numberOfHalves, setNumberOfHalves] = useState<string>(
    tournament?.numberOfHalves != null ? String(tournament.numberOfHalves) : '2'
  )
  const [pointsForWin, setPointsForWin] = useState<string>(
    tournament?.pointsForWin != null ? String(tournament.pointsForWin) : '3'
  )
  const [pointsForDraw, setPointsForDraw] = useState<string>(
    tournament?.pointsForDraw != null ? String(tournament.pointsForDraw) : '1'
  )
  const [pointsForLoss, setPointsForLoss] = useState<string>(
    tournament?.pointsForLoss != null ? String(tournament.pointsForLoss) : '0'
  )
  const [tieBreakRules, setTieBreakRules] = useState<string>(tournament?.tieBreakRules ?? '')

  const [startDate, setStartDate] = useState<string>(toDateInputValue(tournament?.startDate))
  const [endDate, setEndDate] = useState<string>(toDateInputValue(tournament?.endDate))
  const [registrationDeadline, setRegistrationDeadline] = useState<string>(
    toDateInputValue(tournament?.registrationDeadline)
  )

  const [minSquadSize, setMinSquadSize] = useState<string>(
    tournament?.minSquadSize != null ? String(tournament.minSquadSize) : ''
  )
  const [maxSquadSize, setMaxSquadSize] = useState<string>(
    tournament?.maxSquadSize != null ? String(tournament.maxSquadSize) : ''
  )
  const [minAge, setMinAge] = useState<string>(
    tournament?.minAge != null ? String(tournament.minAge) : ''
  )
  const [maxAge, setMaxAge] = useState<string>(
    tournament?.maxAge != null ? String(tournament.maxAge) : ''
  )
  const [requiredDocuments, setRequiredDocuments] = useState<string>(
    tournament?.requiredDocuments ?? ''
  )

  const [entryFeeCents, setEntryFeeCents] = useState<string>(
    tournament?.entryFeeCents != null ? String(tournament.entryFeeCents) : ''
  )
  const [prizePoolDescription, setPrizePoolDescription] = useState<string>(
    tournament?.prizePoolDescription ?? ''
  )

  const dateKeys = useMemo(() => {
    if (!startDate || !endDate) return [] as string[]
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []
    const days: string[] = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().slice(0, 10))
    }
    return days
  }, [startDate, endDate])

  type StepId = 'basic-info' | 'technical-rules' | 'eligibility-docs' | 'financials' | 'staffing-refs'

  const STEPS: { id: StepId; label: string }[] = useMemo(
    () => [
      { id: 'basic-info', label: '1. Basic Info' },
      { id: 'technical-rules', label: '2. Technical Rules' },
      { id: 'eligibility-docs', label: '3. Eligibility & Docs' },
      { id: 'financials', label: '4. Financials' },
      { id: 'staffing-refs', label: '5. Staffing & Refs' },
    ],
    []
  )

  const [activeStep, setActiveStep] = useState<StepId>('basic-info')

  const [selectedDate, setSelectedDate] = useState<string>('')
  const [refereeSearch, setRefereeSearch] = useState<string>('')

  type LocalRefAssignment = {
    id: string
    role: string
    assignedDate: string
    referee: {
      id: string
      phone: string
      role: string
      status: string
      displayName?: string | null
    }
  }

  const [assignmentsByDate, setAssignmentsByDate] = useState<
    Record<string, LocalRefAssignment[]>
  >({})
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const [isSearchingReferees, setIsSearchingReferees] = useState(false)
  const [refereeResults, setRefereeResults] = useState<
    { id: string; name?: string | null; phone: string; status: string }[]
  >([])

  useEffect(() => {
    if (!selectedDate && dateKeys.length > 0) {
      setSelectedDate(dateKeys[0])
    }
  }, [dateKeys, selectedDate])

  useEffect(() => {
    if (!tournament) return
    setName(tournament.name ?? '')
    setSport(tournament.sport ?? 'FOOTBALL')
    setLevel(tournament.level ?? 'DISTRICT')
    setGenderCategory(tournament.genderCategory ?? '')
    setAgeCategory(tournament.ageCategory ?? '')
    setVenue(tournament.venue ?? '')
    setFormat(tournament.format ?? '')
    setNumberOfTeams(
      tournament.numberOfTeams != null ? String(tournament.numberOfTeams) : ''
    )
    setMatchDurationMinutes(
      tournament.matchDurationMinutes != null ? String(tournament.matchDurationMinutes) : ''
    )
    setNumberOfHalves(
      tournament.numberOfHalves != null ? String(tournament.numberOfHalves) : '2'
    )
    setPointsForWin(
      tournament.pointsForWin != null ? String(tournament.pointsForWin) : '3'
    )
    setPointsForDraw(
      tournament.pointsForDraw != null ? String(tournament.pointsForDraw) : '1'
    )
    setPointsForLoss(
      tournament.pointsForLoss != null ? String(tournament.pointsForLoss) : '0'
    )
    setTieBreakRules(tournament.tieBreakRules ?? '')
    setStartDate(toDateInputValue(tournament.startDate))
    setEndDate(toDateInputValue(tournament.endDate))
    setRegistrationDeadline(toDateInputValue(tournament.registrationDeadline))
    setMinSquadSize(
      tournament.minSquadSize != null ? String(tournament.minSquadSize) : ''
    )
    setMaxSquadSize(
      tournament.maxSquadSize != null ? String(tournament.maxSquadSize) : ''
    )
    setMinAge(tournament.minAge != null ? String(tournament.minAge) : '')
    setMaxAge(tournament.maxAge != null ? String(tournament.maxAge) : '')
    setRequiredDocuments(tournament.requiredDocuments ?? '')
    setEntryFeeCents(
      tournament.entryFeeCents != null ? String(tournament.entryFeeCents) : ''
    )
    setPrizePoolDescription(tournament.prizePoolDescription ?? '')
  }, [tournament])

  const reloadAssignments = useCallback(async () => {
    const tournamentId = tournament?.tournamentId as string | undefined
    if (!apiBaseUrl || !authToken || !tournamentId) return
    setIsLoadingAssignments(true)
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/admin/tournaments/${encodeURIComponent(
          tournamentId,
        )}/referees`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      )
      const data = await res.json()
      if (res.ok && data?.success && data.data?.assignmentsByDate) {
        const raw = data.data.assignmentsByDate as Record<string, any[]>
        const next: Record<string, LocalRefAssignment[]> = {}
        Object.entries(raw).forEach(([dateKey, list]) => {
          next[dateKey] = (list as any[]).map((item) => ({
            id: item.id,
            role: item.role,
            assignedDate: item.assignedDate,
            referee: {
              id: item.referee.id,
              phone: item.referee.phone,
              role: item.referee.role,
              status: item.referee.status,
              displayName: item.referee.displayName ?? null,
            },
          }))
        })
        setAssignmentsByDate(next)
      }
    } catch {
      // ignore for now
    } finally {
      setIsLoadingAssignments(false)
    }
  }, [apiBaseUrl, authToken, tournament?.tournamentId])

  useEffect(() => {
    void reloadAssignments()
  }, [reloadAssignments])

  const disableInputs = !isDraft || isSaving || isLoading

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: any = {
      name: name.trim(),
      sport: sport.trim(),
      level: level.trim(),
      genderCategory: genderCategory.trim() || null,
      ageCategory: ageCategory.trim() || null,
      venue: venue.trim() || null,
      format: format || null,
      numberOfTeams: numberOfTeams ? Number(numberOfTeams) : null,
      matchDurationMinutes: matchDurationMinutes ? Number(matchDurationMinutes) : null,
      numberOfHalves: numberOfHalves ? Number(numberOfHalves) : null,
      pointsForWin: pointsForWin ? Number(pointsForWin) : null,
      pointsForDraw: pointsForDraw ? Number(pointsForDraw) : null,
      pointsForLoss: pointsForLoss ? Number(pointsForLoss) : null,
      tieBreakRules: tieBreakRules.trim() || null,
      startDate: startDate || null,
      endDate: endDate || null,
      registrationDeadline: registrationDeadline || null,
      minSquadSize: minSquadSize ? Number(minSquadSize) : null,
      maxSquadSize: maxSquadSize ? Number(maxSquadSize) : null,
      minAge: minAge ? Number(minAge) : null,
      maxAge: maxAge ? Number(maxAge) : null,
      requiredDocuments: requiredDocuments.trim() || null,
      entryFeeCents: entryFeeCents ? Number(entryFeeCents) : null,
      prizePoolDescription: prizePoolDescription.trim() || null,
    }
    onSaveDraft(payload)
  }

  async function handleSearchReferees(query: string) {
    setRefereeSearch(query)
    if (!apiBaseUrl || !authToken || !query.trim()) {
      setRefereeResults([])
      return
    }
    setIsSearchingReferees(true)
    try {
      const url = `${apiBaseUrl}/api/admin/referees?search=${encodeURIComponent(query.trim())}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && Array.isArray(data.data?.referees)) {
        setRefereeResults(
          data.data.referees.map((r: any) => ({
            id: r.id,
            name: r.displayName ?? null,
            phone: r.phone,
            status: r.status,
          })),
        )
      } else {
        setRefereeResults([])
      }
    } catch {
      setRefereeResults([])
    } finally {
      setIsSearchingReferees(false)
    }
  }

  async function handleAssignReferee(refereeId: string) {
    const tournamentId = tournament?.tournamentId as string | undefined
    if (!apiBaseUrl || !authToken || !tournamentId || !selectedDate) return
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/admin/tournaments/${encodeURIComponent(
          tournamentId,
        )}/referees`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refereeId,
            date: selectedDate,
            role: 'CENTER',
          }),
        },
      )
      const data = await res.json()
      if (!res.ok || !data?.success) {
        return
      }
      setRefereeResults([])
      await reloadAssignments()
    } catch {
      // ignore
    }
  }

  async function handleUpdateAssignmentRole(assignmentId: string, role: string) {
    if (!apiBaseUrl || !authToken) return
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/admin/tournaments/referees/${encodeURIComponent(
          assignmentId,
        )}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role }),
        },
      )
      const data = await res.json()
      if (!res.ok || !data?.success) {
        return
      }
      await reloadAssignments()
    } catch {
      // ignore
    }
  }

  async function handleRemoveAssignment(assignmentId: string) {
    if (!apiBaseUrl || !authToken) return
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/admin/tournaments/referees/${encodeURIComponent(
          assignmentId,
        )}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      )
      const data = await res.json()
      if (!res.ok || !data?.success) {
        return
      }
      await reloadAssignments()
    } catch {
      // ignore
    }
  }

  return (
    <div className="trials-module">
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <button
          className="button button--ghost"
          type="button"
          onClick={onBack}
          disabled={isSaving || isLoading}
        >
          <span className="flex items-center gap-2">
            <ArrowLeft size={18} />
            <span>Back to tournaments</span>
          </span>
        </button>
        {tournament?.status && !isDraft && (
          <div className="status status--info">
            <CheckCircle size={18} className="status__icon" />
            <div>
              <strong>Configuration frozen</strong>
              <p style={{ margin: 0 }}>
                This tournament has been published. Settings can no longer be modified.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="profile-card" style={{ marginBottom: '16px' }}>
        <div className="profile-card__header">
          <div className="profile-card__title-row">
            <Trophy size={20} strokeWidth={1.8} />
            <div>
              <p className="profile-card__title">
                {mode === 'create' ? 'New Tournament' : tournament?.name || 'Tournament'}
              </p>
              <p className="profile-card__subtitle">
                Configure identity, format, schedule, eligibility, and financials.
              </p>
            </div>
          </div>
          <div className="profile-card__meta">
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style={{
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'var(--color-border-subtle)',
                background: 'var(--color-surface-soft)',
                color: 'var(--color-text-main)',
              }}
            >
              {statusLabel(tournament?.status)}
            </span>
          </div>
        </div>
        {latestSnapshot && (
          <div className="profile-card__footer">
            <p className="muted" style={{ margin: 0 }}>
              Last published on {new Date(latestSnapshot.snapshotAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 md:self-start">
          <div className="md:sticky md:top-4">
            <nav className="flex md:flex-col gap-2 rounded-lg bg-slate-50 border border-slate-200 p-2">
              {STEPS.map((step) => {
                const isActive = activeStep === step.id
                return (
                  <button
                    key={step.id}
                    type="button"
                    className={`flex-1 md:flex-none text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                    onClick={() => setActiveStep(step.id)}
                    disabled={isSaving || isLoading}
                  >
                    {step.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        <form
          className="col-span-12 md:col-span-9 profile-card personal-tab__block bg-white rounded-lg border border-slate-200 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="space-y-6">
            {activeStep === 'basic-info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="tournament-name">
                    Tournament name
                  </label>
                  <input
                    id="tournament-name"
                    className="input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="tournament-sport">
                    Sport
                  </label>
                  <select
                    id="tournament-sport"
                    className="input"
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    disabled={disableInputs}
                  >
                    <option value="FOOTBALL">Football</option>
                    <option value="CRICKET">Cricket</option>
                    <option value="BASKETBALL">Basketball</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="tournament-level">
                    Level
                  </label>
                  <select
                    id="tournament-level"
                    className="input"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    disabled={disableInputs}
                  >
                    <option value="DISTRICT">District</option>
                    <option value="STATE">State</option>
                    <option value="NATIONAL">National</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="tournament-venue">
                    Venue / Ground
                  </label>
                  <input
                    id="tournament-venue"
                    className="input"
                    type="text"
                    placeholder="e.g. DHSA Ground 1"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="start-date">
                    Start date
                  </label>
                  <input
                    id="start-date"
                    className="input"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="end-date">
                    End date
                  </label>
                  <input
                    id="end-date"
                    className="input"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
                <div className="field">
                  <label
                    className="field__label text-sm font-medium text-slate-700"
                    htmlFor="registration-deadline"
                  >
                    Registration deadline
                  </label>
                  <input
                    id="registration-deadline"
                    className="input"
                    type="date"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="tournament-gender">
                    Gender
                  </label>
                  <input
                    id="tournament-gender"
                    className="input"
                    type="text"
                    placeholder="Boys / Girls / Mixed"
                    value={genderCategory}
                    onChange={(e) => setGenderCategory(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="tournament-age">
                    Age Category
                  </label>
                  <input
                    id="tournament-age"
                    className="input"
                    type="text"
                    placeholder="U13 / U15 / Open"
                    value={ageCategory}
                    onChange={(e) => setAgeCategory(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="tournament-format">
                    Format
                  </label>
                  <select
                    id="tournament-format"
                    className="input"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    disabled={disableInputs}
                  >
                    <option value="">Select format</option>
                    <option value="KNOCKOUT">Knockout</option>
                    <option value="LEAGUE">League</option>
                    <option value="GROUP_KNOCKOUT">Group + Knockout</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="tournament-teams">
                    Number of Teams (optional)
                  </label>
                  <input
                    id="tournament-teams"
                    className="input"
                    type="number"
                    min={0}
                    value={numberOfTeams}
                    onChange={(e) => setNumberOfTeams(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
              </div>
            )}

            {activeStep === 'technical-rules' && (
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="field">
                    <label className="field__label text-sm font-medium text-slate-700" htmlFor="match-duration">
                      Match duration (minutes)
                    </label>
                    <input
                      id="match-duration"
                      className="input"
                      type="number"
                      min={1}
                      value={matchDurationMinutes}
                      onChange={(e) => setMatchDurationMinutes(e.target.value)}
                      disabled={disableInputs}
                    />
                  </div>
                  <div className="field">
                    <label
                      className="field__label text-sm font-medium text-slate-700"
                      htmlFor="number-of-halves"
                    >
                      Number of halves
                    </label>
                    <input
                      id="number-of-halves"
                      className="input"
                      type="number"
                      min={1}
                      value={numberOfHalves}
                      onChange={(e) => setNumberOfHalves(e.target.value)}
                      disabled={disableInputs}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="field">
                    <label className="field__label text-sm font-medium text-slate-700" htmlFor="points-win">
                      Points for Win
                    </label>
                    <input
                      id="points-win"
                      className="input"
                      type="number"
                      value={pointsForWin}
                      onChange={(e) => setPointsForWin(e.target.value)}
                      disabled={disableInputs}
                    />
                  </div>
                  <div className="field">
                    <label className="field__label text-sm font-medium text-slate-700" htmlFor="points-draw">
                      Points for Draw
                    </label>
                    <input
                      id="points-draw"
                      className="input"
                      type="number"
                      value={pointsForDraw}
                      onChange={(e) => setPointsForDraw(e.target.value)}
                      disabled={disableInputs}
                    />
                  </div>
                  <div className="field">
                    <label className="field__label text-sm font-medium text-slate-700" htmlFor="points-loss">
                      Points for Loss
                    </label>
                    <input
                      id="points-loss"
                      className="input"
                      type="number"
                      value={pointsForLoss}
                      onChange={(e) => setPointsForLoss(e.target.value)}
                      disabled={disableInputs}
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="tie-break-rules">
                    Tie-break priority
                  </label>
                  <input
                    id="tie-break-rules"
                    className="input"
                    type="text"
                    placeholder="e.g. GOAL_DIFF > HEAD_TO_HEAD > GOALS_FOR"
                    value={tieBreakRules}
                    onChange={(e) => setTieBreakRules(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
              </div>
            )}

            {activeStep === 'eligibility-docs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="min-squad">
                    Min squad size
                  </label>
                  <input
                    id="min-squad"
                    className="input"
                    type="number"
                    min={1}
                    value={minSquadSize}
                    onChange={(e) => setMinSquadSize(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="max-squad">
                    Max squad size
                  </label>
                  <input
                    id="max-squad"
                    className="input"
                    type="number"
                    min={1}
                    value={maxSquadSize}
                    onChange={(e) => setMaxSquadSize(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="min-age">
                    Min age
                  </label>
                  <input
                    id="min-age"
                    className="input"
                    type="number"
                    min={0}
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="max-age">
                    Max age
                  </label>
                  <input
                    id="max-age"
                    className="input"
                    type="number"
                    min={0}
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
                <div className="field md:col-span-2">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="required-docs">
                    Required documents
                  </label>
                  <textarea
                    id="required-docs"
                    className="input"
                    rows={3}
                    placeholder='Comma-separated or JSON list, e.g. ["DOB_PROOF","SCHOOL_ID"]'
                    value={requiredDocuments}
                    onChange={(e) => setRequiredDocuments(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
              </div>
            )}

            {activeStep === 'financials' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="entry-fee">
                    Entry fee (in smallest currency unit)
                  </label>
                  <input
                    id="entry-fee"
                    className="input"
                    type="number"
                    min={0}
                    value={entryFeeCents}
                    onChange={(e) => setEntryFeeCents(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
                <div className="field md:col-span-2">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="prize-pool">
                    Prize pool
                  </label>
                  <textarea
                    id="prize-pool"
                    className="input"
                    rows={3}
                    placeholder="Describe the prize pool structure"
                    value={prizePoolDescription}
                    onChange={(e) => setPrizePoolDescription(e.target.value)}
                    disabled={disableInputs}
                  />
                </div>
              </div>
            )}

            {activeStep === 'staffing-refs' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Match days</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {(!startDate || !endDate) && (
                      <span className="text-sm text-slate-500">
                        Set tournament dates to assign referees.
                      </span>
                    )}
                    {startDate &&
                      endDate &&
                      dateKeys.map((d) => {
                        const isActive = selectedDate === d
                        return (
                          <button
                            key={d}
                            type="button"
                            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium border ${
                              isActive
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                            onClick={() => setSelectedDate(d)}
                            disabled={disableInputs}
                          >
                            {d}
                          </button>
                        )
                      })}
                  </div>
                </div>

                <div className="field">
                  <label className="field__label text-sm font-medium text-slate-700" htmlFor="referee-search">
                    {selectedDate
                      ? `Search Referee to assign for ${selectedDate}`
                      : 'Search Referee to assign'}
                  </label>
                  <div className="relative">
                    <input
                      id="referee-search"
                      className="input"
                      type="search"
                      placeholder="Search by name or phone"
                      value={refereeSearch}
                      onChange={(e) => void handleSearchReferees(e.target.value)}
                      disabled={disableInputs || !selectedDate}
                    />
                    {selectedDate && refereeResults.length > 0 && !disableInputs && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-56 overflow-auto">
                        {isSearchingReferees && (
                          <div className="px-3 py-2 text-xs text-slate-500">Searching…</div>
                        )}
                        {refereeResults.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                            onClick={() => void handleAssignReferee(r.id)}
                          >
                            <div className="font-medium">{r.name || r.phone}</div>
                            <div className="text-xs text-slate-500">{r.phone}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Assigned referees</p>
                  {selectedDate && assignmentsByDate[selectedDate]?.length
                    ? assignmentsByDate[selectedDate].map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <div className="text-sm">
                            <p className="font-medium text-slate-800">
                              {assignment.referee.displayName || assignment.referee.phone}
                            </p>
                            <p className="text-xs text-slate-500">{assignment.referee.phone}</p>
                          </div>
                          <div className="flex items-center gap-3 w-full md:w-auto">
                            <select
                              className="input"
                              value={assignment.role}
                              disabled={disableInputs}
                              onChange={(e) =>
                                void handleUpdateAssignmentRole(assignment.id, e.target.value)
                              }
                            >
                              <option value="CENTER">Center Referee</option>
                              <option value="LINESMAN">Linesman</option>
                            </select>
                            <button
                              type="button"
                              className="text-xs font-medium text-red-600 hover:text-red-700"
                              disabled={disableInputs}
                              onClick={() => void handleRemoveAssignment(assignment.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    : (
                      <p className="text-sm text-slate-500">
                        {selectedDate
                          ? 'No referees assigned for this date yet.'
                          : 'Select a match date to manage referee assignments.'}
                      </p>
                    )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {(() => {
                const index = STEPS.findIndex((s) => s.id === activeStep)
                const hasPrev = index > 0
                const hasNext = index < STEPS.length - 1
                return (
                  <>
                    {hasPrev && (
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                        onClick={() => setActiveStep(STEPS[index - 1].id)}
                        disabled={isSaving || isLoading}
                      >
                        Back
                      </button>
                    )}
                    {hasNext && (
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                        onClick={() => setActiveStep(STEPS[index + 1].id)}
                        disabled={isSaving || isLoading}
                      >
                        Next
                      </button>
                    )}
                  </>
                )
              })()}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="submit"
                className="button inline-flex items-center justify-center"
                disabled={isSaving || isLoading || !isDraft}
              >
                {isSaving ? 'Saving…' : 'Save draft'}
              </button>
              {tournament?.tournamentId && isDraft && (
                <button
                  type="button"
                  className="button button--primary inline-flex items-center justify-center"
                  disabled={isSaving || isLoading}
                  onClick={() => onPublish(tournament.tournamentId)}
                >
                  Publish tournament
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {applications.length > 0 && (
        <div className="profile-card" style={{ marginTop: '24px' }}>
          <div className="profile-card__header">
            <p className="profile-card__title">Coach applications</p>
            <p className="profile-card__subtitle">
              Review coach squads and captains submitted for this tournament.
            </p>
          </div>
          <div className="profile-card__body">
            <div className="trials-table data-table">
              <table>
                <thead>
                  <tr>
                    <th>Coach / Team</th>
                    <th>Players</th>
                    <th>Captain</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app: any) => {
                    const captain = app.players?.find((p: any) => p.isCaptain)
                    return (
                      <tr key={app.id}>
                        <td>
                          <div className="flex flex-col gap-1">
                            <span>{app.teamName}</span>
                            <span className="muted">
                              {app.coach?.displayName || app.coach?.coachId || 'Coach'}
                            </span>
                          </div>
                        </td>
                        <td>{app.players?.length ?? 0}</td>
                        <td>{captain?.displayName || captain?.playerId || '—'}</td>
                        <td>{statusLabel(app.status)}</td>
                        <td>
                          {app.submittedAt
                            ? new Date(app.submittedAt).toLocaleString()
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

