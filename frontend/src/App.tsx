import type { FormEvent } from 'react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import './App.css'

function App() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

  const [phone, setPhone] = useState('')
  const [mpin, setMpin] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [me, setMe] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [inviteToken, setInviteToken] = useState<string | null>(null) // kept for legacy links but no longer used
  const [signupPhone, setSignupPhone] = useState('')
  const [signupOtp, setSignupOtp] = useState('')
  const [signupMpin, setSignupMpin] = useState('')
  const [signupUserId, setSignupUserId] = useState<string | null>(null)
  const [signupStep, setSignupStep] = useState<'phone' | 'otp' | 'mpin' | 'done'>('phone')
  const [signupMessage, setSignupMessage] = useState<string | null>(null)
  const [isLoadingMe, setIsLoadingMe] = useState(false)
  
  // Application state
  const [application, setApplication] = useState<any>(null)
  const [isLoadingApplication, setIsLoadingApplication] = useState(false)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [applicationForm, setApplicationForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    sport: '',
    primaryPosition: [] as string[],
    dominantFoot: '',
    height: '',
    weight: '',
    city: '',
    state: '',
    district: '',
    pincode: '',
    nationality: '',
    playerPhone: '',
    playerEmail: '',
    preferredTeamIds: [] as string[],
  })
  const [declarationAccepted, setDeclarationAccepted] = useState(false)
  const [declarationMedicallyFit, setDeclarationMedicallyFit] = useState(false)
  const [declarationConsentProfile, setDeclarationConsentProfile] = useState(false)
  const [teams, setTeams] = useState<Array<{ id: string; teamId: string; name: string }>>([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [teamSearch, setTeamSearch] = useState('')
  const [showTeamsDropdown, setShowTeamsDropdown] = useState(false)
  type EmergencyContact = { name: string; phone: string; relation: string }
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: '', phone: '', relation: '' },
  ])
  const [docIdProof, setDocIdProof] = useState<File | null>(null)
  const [docAgeProof, setDocAgeProof] = useState<File | null>(null)
  const [docPlayerPhoto, setDocPlayerPhoto] = useState<File | null>(null)
  type ExtraDocument = { id: string; file: File | null; type: string; notes: string }
  const [extraDocuments, setExtraDocuments] = useState<ExtraDocument[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState<string>('Document preview')
  const [previewMimeType, setPreviewMimeType] = useState<string | null>(null)

  // Admin Applications state
  const [applications, setApplications] = useState<any[]>([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null)

  // Admin Users state
  type AdminUser = {
    id: string
    phone: string
    email?: string | null
    role: string
    status: string
    createdAt: string
    lastLoginAt?: string | null
    application?: { status?: string | null; submittedAt?: string | null } | null
    player?: { playerId?: string | null } | null
  }
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [usersPage, setUsersPage] = useState(1)
  const [usersLimit] = useState(20)
  const [usersTotalPages, setUsersTotalPages] = useState(1)
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersSearch, setUsersSearch] = useState('')

  // Coach management state (admin)
  const [coaches, setCoaches] = useState<any[]>([])
  const [isLoadingCoaches, setIsLoadingCoaches] = useState(false)
  const [showCoachModal, setShowCoachModal] = useState(false)
  const [coachForm, setCoachForm] = useState({
    phone: '',
    email: '',
    sport: 'FOOTBALL',
    coachingRole: 'ASSISTANT',
    ageGroups: [] as string[],
    specializationTags: [] as string[],
    yearsExperience: '',
  })

  // MPIN management state
  const [mpinForm, setMpinForm] = useState({
    currentMpin: '',
    newMpin: '',
    confirmMpin: '',
  })
  const [isUpdatingMpin, setIsUpdatingMpin] = useState(false)

  // Trials state
  const [trials, setTrials] = useState<any[]>([])
  const [isLoadingTrials, setIsLoadingTrials] = useState(false)
  const [selectedTrial, setSelectedTrial] = useState<any>(null)

  // My Players state (for coaches)
  const [myPlayers, setMyPlayers] = useState<any[]>([])
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false)
  const [myPlayersSearch, setMyPlayersSearch] = useState('')
  const [myTeamsForPlayers, setMyTeamsForPlayers] = useState<any[]>([])
  const [selectedMyPlayer, setSelectedMyPlayer] = useState<any | null>(null)
  const [isLoadingMyPlayerProfile, setIsLoadingMyPlayerProfile] = useState(false)

  // Coach Teams state
  const [myTeams, setMyTeams] = useState<any[]>([])
  const [isLoadingMyTeams, setIsLoadingMyTeams] = useState(false)

  // Admin Teams state
  const [adminTeams, setAdminTeams] = useState<any[]>([])
  const [isLoadingAdminTeams, setIsLoadingAdminTeams] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<any[]>([])
  const [isLoadingTeamPlayers, setIsLoadingTeamPlayers] = useState(false)

  // Team Players -> Player profile detail (inline)
  const [selectedTeamPlayerProfile, setSelectedTeamPlayerProfile] = useState<any | null>(null)
  const [isLoadingTeamPlayerProfile, setIsLoadingTeamPlayerProfile] = useState(false)

  // Admin: team creation requests (notifications)
  const [adminTeamRequests, setAdminTeamRequests] = useState<any[]>([])
  const [isLoadingAdminTeamRequests, setIsLoadingAdminTeamRequests] = useState(false)

  // Admin Players module state
  type AdminPlayerListItem = {
    id: string
    playerId: string
    displayName?: string | null
    footballStatus: string
    primaryPosition?: string | null
    dominantFoot?: string | null
    gender?: string | null
    dateOfBirth?: string | null
    city?: string | null
    state?: string | null
    district?: string | null
    createdAt: string
    user: {
      id: string
      phone: string
      email?: string | null
      role: string
      status: string
      createdAt: string
      lastLoginAt?: string | null
      application?: { id: string; status?: string | null; submittedAt?: string | null } | null
    }
  }
  const [adminPlayers, setAdminPlayers] = useState<AdminPlayerListItem[]>([])
  const [isLoadingAdminPlayers, setIsLoadingAdminPlayers] = useState(false)
  const [playersPage, setPlayersPage] = useState(1)
  const [playersLimit] = useState(50)
  const [playersTotalPages, setPlayersTotalPages] = useState(1)
  const [playersTotal, setPlayersTotal] = useState(0)
  const [playersSearch, setPlayersSearch] = useState('')
  const [selectedAdminPlayer, setSelectedAdminPlayer] = useState<any | null>(null)
  const [isLoadingSelectedPlayer, setIsLoadingSelectedPlayer] = useState(false)

  async function login() {
    setError(null)
    setToken(null)
    setMe(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, mpin }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Login failed')
        return
      }
      // Set token and user data immediately from login response
      setToken(data.data.token)
      if (data.data.user) {
        setMe(data.data.user)
      }
      // Also load full user profile (will update me with complete data)
      // This ensures we have the latest user data
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    }
  }

  async function loadMe() {
    if (!token) return
    setError(null)
    setMe(null)
    setIsLoadingMe(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to load profile')
        return
      }
      setMe(data.data.user)
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    } finally {
      setIsLoadingMe(false)
    }
  }

  async function startSignup() {
    setError(null)
    setSignupMessage(null)
    if (!signupPhone) {
      setError('Phone number is required')
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: signupPhone }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to send OTP')
        return
      }
      setSignupUserId(data.data.userId)
      setSignupStep('otp')
      setSignupMessage('OTP sent. Check server console for the code.')
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    }
  }

  async function verifySignupOtp() {
    setError(null)
    setSignupMessage(null)
    if (!signupUserId) {
      setError('Missing signup session. Please try again.')
      return
    }
    if (!signupOtp) {
      setError('OTP is required')
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: signupUserId, otpCode: signupOtp }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || 'OTP verification failed')
        return
      }
      setSignupStep('mpin')
      setSignupMessage('OTP verified. Please set your MPIN.')
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    }
  }

  async function resendSignupOtp() {
    setError(null)
    setSignupMessage(null)
    if (!signupUserId) {
      setError('Missing signup session. Please try again.')
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: signupUserId }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to resend OTP')
        return
      }
      setSignupMessage('OTP resent. Check server console for the new code.')
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    }
  }

  async function setupSignupMpin() {
    setError(null)
    setSignupMessage(null)
    if (!signupUserId) {
      setError('Missing signup session. Please try again.')
      return
    }
    if (!signupMpin) {
      setError('MPIN is required')
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/setup-mpin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: signupUserId, mpin: signupMpin }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to set MPIN')
        return
      }
      setSignupStep('done')
      setSignupMessage('Account created. You can now log in.')
      setPhone(signupPhone)
      setMpin('')
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    }
  }

  function logout() {
    setToken(null)
    setMe(null)
    setError(null)
    setSuccessMessage(null)
    setMode('login')
    setApplication(null)
    setApplicationForm({
      fullName: '',
      dateOfBirth: '',
      gender: '',
      sport: '',
      primaryPosition: [],
      dominantFoot: '',
      height: '',
      weight: '',
      city: '',
      state: '',
      district: '',
      pincode: '',
      nationality: '',
      playerPhone: '',
      playerEmail: '',
      preferredTeamIds: [],
    })
    setDeclarationAccepted(false)
    setDeclarationMedicallyFit(false)
    setDeclarationConsentProfile(false)
    setTeamSearch('')
    setEmergencyContacts([{ name: '', phone: '', relation: '' }])
    setDocIdProof(null)
    setDocAgeProof(null)
    setDocPlayerPhoto(null)
    setExtraDocuments([])
    setActiveModuleId('dashboard')
    setActiveTab('')
  }

  useEffect(() => {
    if (!token) return
    void loadMe()
  }, [token])

  function getUsersRoleFilter(tab: string): string | undefined {
    if (tab === 'Players') return 'PLAYER'
    if (tab === 'Coaches') return 'COACH'
    if (tab === 'Admins') return 'ADMIN'
    if (tab === 'Users') return 'USER'
    return undefined
  }

  const loadUsers = useCallback(
    async (opts?: { role?: string; page?: number; search?: string }) => {
      if (!token) return
      setError(null)
      setIsLoadingUsers(true)
      try {
        const params = new URLSearchParams()
        const role = opts?.role
        const page = opts?.page ?? 1
        const search = opts?.search
        if (role) params.set('role', role)
        params.set('page', String(page))
        params.set('limit', String(usersLimit))
        if (search) params.set('search', search)

        const query = params.toString()
        const res = await fetch(`${API_BASE_URL}/api/admin/users${query ? `?${query}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (res.ok && data?.success && data.data?.users) {
          setAdminUsers(data.data.users)
          const pages = data.data?.pagination?.pages ?? 1
          const total = data.data?.pagination?.total ?? data.data?.users?.length ?? 0
          setUsersTotalPages(pages)
          setUsersTotal(total)
        } else {
          setError(data?.message || 'Failed to load users')
        }
      } catch (err) {
        setError('Cannot reach backend. Make sure the server is running.')
      } finally {
        setIsLoadingUsers(false)
      }
    },
    [token, API_BASE_URL, usersLimit],
  )

  const loadCoaches = useCallback(async () => {
    if (!token) return
    setError(null)
    setIsLoadingCoaches(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/coach/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && data.data?.coaches) {
        setCoaches(data.data.coaches)
      } else {
        setError(data?.message || 'Failed to load coaches')
      }
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    } finally {
      setIsLoadingCoaches(false)
    }
  }, [token, API_BASE_URL])

  const loadApplication = useCallback(async () => {
    if (!token) return
    setError(null)
    setIsLoadingApplication(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/application/my-application`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && data.data?.application) {
        const app = data.data.application
        setApplication(app)
        // Populate form if draft
        if (app.status === 'DRAFT') {
          const parseStringOrJsonArray = (value: unknown): string[] => {
            if (!value) return []
            if (Array.isArray(value)) return value.filter((v) => typeof v === 'string') as string[]
            if (typeof value === 'string') {
              const trimmed = value.trim()
              if (!trimmed) return []
              if (trimmed.startsWith('[')) {
                try {
                  const parsed = JSON.parse(trimmed) as unknown
                  if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === 'string') as string[]
                } catch {
                  // ignore
                }
              }
              return trimmed.split(',').map((s) => s.trim()).filter(Boolean)
            }
            return []
          }
          setApplicationForm({
            fullName: app.fullName || '',
            dateOfBirth: app.dateOfBirth ? new Date(app.dateOfBirth).toISOString().split('T')[0] : '',
            gender: app.gender || '',
            sport: (app as any)?.sport || 'FOOTBALL',
            primaryPosition: parseStringOrJsonArray(app.primaryPosition),
            dominantFoot:
              typeof app.dominantFoot === 'string' && app.dominantFoot.trim().length > 0
                ? app.dominantFoot
                : '',
            height: app.height?.toString() || '',
            weight: app.weight?.toString() || '',
            city: app.city || '',
            state: app.state || '',
            district: app.district || '',
            pincode: app.pincode || '',
            nationality: app.nationality || '',
            playerPhone: app.playerPhone || '',
            playerEmail: (app as any)?.playerEmail || '',
            preferredTeamIds: parseStringOrJsonArray(app.preferredTeamIds),
          })

          // Emergency contacts (repeater) — if backend returns JSON, prefer it; otherwise fallback to legacy single fields
          const contactsJson = (app as any)?.emergencyContactsJson
          if (typeof contactsJson === 'string' && contactsJson.trim().startsWith('[')) {
            try {
              const parsed = JSON.parse(contactsJson) as unknown
              if (Array.isArray(parsed) && parsed.length > 0) {
                setEmergencyContacts(
                  parsed.map((c: any) => ({
                    name: String(c?.name || ''),
                    phone: String(c?.phone || ''),
                    relation: String(c?.relation || ''),
                  })),
                )
              }
            } catch {
              // ignore
            }
          } else {
            setEmergencyContacts([
              {
                name: String((app as any)?.emergencyContactName || ''),
                phone: String((app as any)?.emergencyContactPhone || ''),
                relation: String((app as any)?.emergencyContactRelation || ''),
              },
            ])
          }
        }
      } else if (res.status === 404) {
        // No application yet
        setApplication(null)
      } else {
        setError(data?.message || 'Failed to load application')
      }
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    } finally {
      setIsLoadingApplication(false)
    }
  }, [token, API_BASE_URL])

  const loadActiveTeams = useCallback(async () => {
    if (!token) return
    setError(null)
    setIsLoadingTeams(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/teams/active`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && data.data?.teams) {
        setTeams(data.data.teams)
      } else {
        setError(data?.message || 'Failed to load teams')
      }
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    } finally {
      setIsLoadingTeams(false)
    }
  }, [token, API_BASE_URL])

  // Preload teams when opening the application modal
  useEffect(() => {
    if (!showApplicationModal) return
    if (!token) return
    if (teams.length > 0) return
    void loadActiveTeams()
  }, [showApplicationModal, token, teams.length, loadActiveTeams])

  async function uploadApplicationDocument(file: File, documentType: string, notes?: string) {
    if (!token) return
    const form = new FormData()
    form.append('file', file)
    form.append('documentType', documentType)
    form.append('ownerType', 'PLAYER_APPLICATION')
    if (notes) form.append('notes', notes)
    const res = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    const data = await res.json()
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || `Failed to upload ${documentType}`)
    }
  }

  async function openDocumentPreview(documentId: string) {
    if (!token) return
    const res = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'Failed to load document')
    }
    const doc = data.data?.document as any
    const fileUrl = doc?.fileUrl as string | undefined
    if (!fileUrl) throw new Error('Document fileUrl missing')
    setPreviewUrl(`${API_BASE_URL}${fileUrl}`)
    setPreviewTitle(doc?.fileName || doc?.documentType || 'Document preview')
    setPreviewMimeType(doc?.mimeType || null)
  }

  async function saveApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return Promise.resolve()
    setError(null)
    
    // Validation
    if (!applicationForm.fullName || !applicationForm.dateOfBirth || !applicationForm.gender || 
        !applicationForm.playerPhone ||
        !emergencyContacts[0]?.name ||
        !emergencyContacts[0]?.phone) {
      setError('Please fill all required fields')
      return Promise.resolve()
    }

    setIsLoadingApplication(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/application/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...applicationForm,
          sport: applicationForm.sport || 'FOOTBALL',
          primaryPosition: applicationForm.primaryPosition,
          dominantFoot: applicationForm.dominantFoot,
          preferredTeamIds: applicationForm.preferredTeamIds,
          emergencyContactName: emergencyContacts[0]?.name || '',
          emergencyContactPhone: emergencyContacts[0]?.phone || '',
          emergencyContactRelation: emergencyContacts[0]?.relation || '',
          emergencyContactsJson: JSON.stringify(emergencyContacts),
          height: applicationForm.height ? parseInt(applicationForm.height) : undefined,
          weight: applicationForm.weight ? parseInt(applicationForm.weight) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to save application')
        return Promise.resolve()
      }
      setApplication(data.data.application)

      // Upload documents if user selected any (draft-save is allowed without docs)
      try {
        if (docIdProof) await uploadApplicationDocument(docIdProof, 'ID_PROOF')
        if (docAgeProof) await uploadApplicationDocument(docAgeProof, 'DOB_PROOF')
        if (docPlayerPhoto) await uploadApplicationDocument(docPlayerPhoto, 'PHOTO')
        for (const d of extraDocuments) {
          if (d.file && d.type) {
            await uploadApplicationDocument(d.file, d.type, d.notes)
          }
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to upload document(s)')
        return Promise.resolve()
      }

      setError(null)
      setSuccessMessage('Application saved successfully!')
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
      return Promise.resolve()
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
      return Promise.resolve()
    } finally {
      setIsLoadingApplication(false)
    }
  }

  async function submitApplication() {
    if (!token) return Promise.resolve()
    setError(null)

    if (!declarationAccepted || !declarationMedicallyFit || !declarationConsentProfile) {
      setError('You must confirm all declarations and consents before submitting.')
      return Promise.resolve()
    }

    // Validate required fields before submit
    if (
      !applicationForm.fullName ||
      !applicationForm.dateOfBirth ||
      !applicationForm.gender ||
      !applicationForm.playerPhone ||
      !applicationForm.nationality ||
      !applicationForm.pincode ||
      applicationForm.preferredTeamIds.length === 0 ||
      !emergencyContacts[0]?.name ||
      !emergencyContacts[0]?.phone
    ) {
      setError('Please complete all required fields before submitting.')
      return Promise.resolve()
    }

    if (!/^\d{6}$/.test(applicationForm.pincode)) {
      setError('Pincode must be 6 digits.')
      return Promise.resolve()
    }

    if (!docIdProof) {
      setError('Identity proof (ID Proof) is required before submitting.')
      return Promise.resolve()
    }

    if (!confirm('Are you sure you want to submit this application? You cannot edit it after submission.')) {
      return Promise.resolve()
    }

    setIsLoadingApplication(true)
    try {
      // Ensure latest draft is saved with latest form data
      const saveRes = await fetch(`${API_BASE_URL}/api/application/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...applicationForm,
          sport: applicationForm.sport || 'FOOTBALL',
          primaryPosition: applicationForm.primaryPosition,
          dominantFoot: applicationForm.dominantFoot,
          preferredTeamIds: applicationForm.preferredTeamIds,
          emergencyContactName: emergencyContacts[0]?.name || '',
          emergencyContactPhone: emergencyContacts[0]?.phone || '',
          emergencyContactRelation: emergencyContacts[0]?.relation || '',
          emergencyContactsJson: JSON.stringify(emergencyContacts),
          height: applicationForm.height ? parseInt(applicationForm.height) : undefined,
          weight: applicationForm.weight ? parseInt(applicationForm.weight) : undefined,
        }),
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok || !saveData?.success) {
        setError(saveData?.message || 'Failed to save application before submit')
        return Promise.resolve()
      }
      setApplication(saveData.data.application)

      // Upload documents (ID proof required; others optional)
      if (docIdProof) await uploadApplicationDocument(docIdProof, 'ID_PROOF')
      if (docAgeProof) await uploadApplicationDocument(docAgeProof, 'DOB_PROOF')
      if (docPlayerPhoto) await uploadApplicationDocument(docPlayerPhoto, 'PHOTO')
      for (const d of extraDocuments) {
        if (d.file && d.type) {
          await uploadApplicationDocument(d.file, d.type, d.notes)
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/application/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to submit application')
        return Promise.resolve()
      }
      setApplication(data.data.application)
      setError(null)
      setSuccessMessage('Application submitted successfully! Trial will be assigned soon.')
      setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      void loadApplication() // Reload to get updated status
      return Promise.resolve()
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
      return Promise.resolve()
    } finally {
      setIsLoadingApplication(false)
    }
  }

  function switchMode(nextMode: 'login' | 'signup') {
    setMode(nextMode)
    setError(null)
    setSignupMessage(null)
    setMpin('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mode === 'login') {
      void login()
      return
    }
    if (signupStep === 'phone') {
      void startSignup()
    } else if (signupStep === 'otp') {
      void verifySignupOtp()
    } else if (signupStep === 'mpin') {
      void setupSignupMpin()
    }
  }

  type ModuleConfig = {
    id: string
    label: string
    tabs: string[]
  }

  const userRole = me?.role as string | undefined
  const modulesByRole: Record<string, ModuleConfig[]> = {
    ADMIN: [
      { id: 'dashboard', label: 'Dashboard', tabs: ['Overview', 'Activity'] },
      { id: 'users', label: 'User Management', tabs: ['All', 'Users', 'Players', 'Coaches', 'Admins'] },
      { id: 'players', label: 'Players', tabs: ['All Players'] },
      { id: 'applications', label: 'Applications', tabs: ['Pending', 'Review', 'Approved', 'Rejected'] },
      { id: 'coach-invites', label: 'Coach Invites', tabs: ['Active', 'Accepted', 'Expired'] },
      { id: 'teams', label: 'Teams', tabs: ['All Teams', 'Team Players'] },
      { id: 'documents', label: 'Documents', tabs: ['Pending', 'Verified', 'Rejected'] },
      { id: 'trials', label: 'Trials', tabs: ['Assigned', 'Completed', 'Retest'] },
      { id: 'notifications', label: 'Notifications', tabs: ['Team Requests'] },
    ],
    COACH: [
      { id: 'dashboard', label: 'Dashboard', tabs: ['Overview', 'Today'] },
      { id: 'assigned-trials', label: 'Assigned Trials', tabs: ['Pending', 'Completed', 'Needs Retest'] },
      { id: 'my-teams', label: 'My Teams', tabs: ['My Teams'] },
      { id: 'my-players', label: 'My Players', tabs: ['All Players'] },
      { id: 'evaluations', label: 'Evaluations', tabs: ['Recommended', 'Not Recommended'] },
      { id: 'profile', label: 'Profile', tabs: ['About', 'Credentials'] },
    ],
    PLAYER: [
      { id: 'dashboard', label: 'Dashboard', tabs: ['Overview', 'Activity'] },
      { id: 'profile', label: 'Profile', tabs: ['Personal', 'Medical'] },
      { id: 'documents', label: 'Documents', tabs: ['Pending', 'Verified'] },
      { id: 'eligibility', label: 'Eligibility', tabs: ['Status', 'History'] },
    ],
    USER: [
      { id: 'dashboard', label: 'Dashboard', tabs: ['Overview'] },
      { id: 'application', label: 'My Application', tabs: ['Draft', 'Submitted', 'Review'] },
      { id: 'documents', label: 'Documents', tabs: ['Pending', 'Verified'] },
      { id: 'notifications', label: 'Notifications', tabs: ['All', 'Unread'] },
    ],
  }

  const availableModules = useMemo(() => {
    if (!userRole) return []
    const modules = modulesByRole[userRole] || []
    // Debug: Log role and modules to help diagnose issues
    if (import.meta.env.DEV) {
      console.log('User Role:', userRole, 'Available Modules:', modules)
    }
    return modules
  }, [userRole])

  const [activeModuleId, setActiveModuleId] = useState<string>('dashboard')
  const [activeTab, setActiveTab] = useState<string>('')

  // Reset to page 1 when filters change in Users module
  useEffect(() => {
    if (activeModuleId !== 'users') return
    setUsersPage(1)
  }, [activeModuleId, activeTab, usersSearch])

  // Reset to page 1 when filters change in Admin Players module
  useEffect(() => {
    if (activeModuleId !== 'players') return
    setPlayersPage(1)
  }, [activeModuleId, playersSearch])

  useEffect(() => {
    if (availableModules.length === 0) {
      // Reset to dashboard if no modules available (e.g., role not loaded yet)
      setActiveModuleId('dashboard')
      setActiveTab('')
      return
    }
    const defaultModule = availableModules[0]
    // Only update if the current module is not in available modules
    // This prevents switching away from a valid module when role changes
    const currentModuleExists = availableModules.some(m => m.id === activeModuleId)
    if (!currentModuleExists) {
      setActiveModuleId(defaultModule.id)
      setActiveTab(defaultModule.tabs[0] || '')
    }
  }, [availableModules])

  const loadTrials = useCallback(async () => {
    if (!token) return
    setError(null)
    setIsLoadingTrials(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/trial/my-trials`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && data.data?.trials) {
        setTrials(data.data.trials)
      } else {
        setError(data?.message || 'Failed to load trials')
      }
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    } finally {
      setIsLoadingTrials(false)
    }
  }, [token, API_BASE_URL])

  const loadMyPlayers = useCallback(async () => {
    if (!token) return
    setError(null)
    setIsLoadingPlayers(true)
    try {
      const query = new URLSearchParams()
      if (myPlayersSearch.trim()) query.set('search', myPlayersSearch.trim())
      const res = await fetch(`${API_BASE_URL}/api/coach/my-players${query.toString() ? `?${query.toString()}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && data.data?.players) {
        setMyPlayers(data.data.players)
        setMyTeamsForPlayers(data.data.teams || [])
      } else {
        setError(data?.message || 'Failed to load players')
      }
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    } finally {
      setIsLoadingPlayers(false)
    }
  }, [token, API_BASE_URL, myPlayersSearch])

  const loadMyPlayerProfile = useCallback(
    async (playerIdOrDbId: string) => {
      if (!token) return
      setError(null)
      setIsLoadingMyPlayerProfile(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/coach/players/${encodeURIComponent(playerIdOrDbId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (res.ok && data?.success && data.data?.player) {
          setSelectedMyPlayer(data.data)
        } else {
          setError(data?.message || 'Failed to load player profile')
        }
      } catch (err) {
        setError('Cannot reach backend. Make sure the server is running.')
      } finally {
        setIsLoadingMyPlayerProfile(false)
      }
    },
    [token, API_BASE_URL],
  )

  const loadMyTeams = useCallback(async () => {
    if (!token) return
    setError(null)
    setIsLoadingMyTeams(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/teams/coach/my-teams`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && data.data?.teams) {
        setMyTeams(data.data.teams)
      } else {
        setError(data?.message || 'Failed to load teams')
      }
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    } finally {
      setIsLoadingMyTeams(false)
    }
  }, [token, API_BASE_URL])

  const loadAdminTeams = useCallback(async () => {
    if (!token) return
    setError(null)
    setIsLoadingAdminTeams(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/teams/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && data.data?.teams) {
        setAdminTeams(data.data.teams)
      } else {
        setError(data?.message || 'Failed to load teams')
      }
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    } finally {
      setIsLoadingAdminTeams(false)
    }
  }, [token, API_BASE_URL])

  const loadAdminPlayers = useCallback(async () => {
    if (!token) return
    setError(null)
    setIsLoadingAdminPlayers(true)
    try {
      const query = new URLSearchParams()
      query.set('page', String(playersPage))
      query.set('limit', String(playersLimit))
      if (playersSearch.trim()) query.set('search', playersSearch.trim())
      const res = await fetch(`${API_BASE_URL}/api/admin/players?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && data.data?.players) {
        setAdminPlayers(data.data.players)
        const pagination = data.data.pagination
        setPlayersTotalPages(pagination?.pages || 1)
        setPlayersTotal(pagination?.total || 0)
      } else {
        setError(data?.message || 'Failed to load players')
      }
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    } finally {
      setIsLoadingAdminPlayers(false)
    }
  }, [token, API_BASE_URL, playersPage, playersLimit, playersSearch])

  const loadAdminPlayerProfile = useCallback(
    async (playerIdOrDbId: string) => {
      if (!token) return
      setError(null)
      setIsLoadingSelectedPlayer(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/players/${encodeURIComponent(playerIdOrDbId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (res.ok && data?.success && data.data?.player) {
          setSelectedAdminPlayer(data.data)
        } else {
          setError(data?.message || 'Failed to load player profile')
        }
      } catch (err) {
        setError('Cannot reach backend. Make sure the server is running.')
      } finally {
        setIsLoadingSelectedPlayer(false)
      }
    },
    [token, API_BASE_URL],
  )

  const loadTeamPlayerProfile = useCallback(
    async (playerIdOrDbId: string) => {
      if (!token) return
      setError(null)
      setIsLoadingTeamPlayerProfile(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/players/${encodeURIComponent(playerIdOrDbId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (res.ok && data?.success && data.data?.player) {
          setSelectedTeamPlayerProfile(data.data)
        } else {
          setError(data?.message || 'Failed to load player profile')
        }
      } catch (err) {
        setError('Cannot reach backend. Make sure the server is running.')
      } finally {
        setIsLoadingTeamPlayerProfile(false)
      }
    },
    [token, API_BASE_URL],
  )

  const loadAdminTeamRequests = useCallback(async () => {
    if (!token) return
    setError(null)
    setIsLoadingAdminTeamRequests(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/team-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && data.data?.requests) {
        setAdminTeamRequests(data.data.requests)
      } else {
        setError(data?.message || 'Failed to load team requests')
      }
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    } finally {
      setIsLoadingAdminTeamRequests(false)
    }
  }, [token, API_BASE_URL])

  const loadApplications = useCallback(async () => {
    if (!token) return
    setError(null)
    setIsLoadingApplications(true)
    try {
      // Fetch all applications (excluding DRAFT)
      const res = await fetch(`${API_BASE_URL}/api/admin/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && data.data?.applications) {
        setApplications(data.data.applications)
      } else {
        setError(data?.message || 'Failed to load applications')
      }
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    } finally {
      setIsLoadingApplications(false)
    }
  }, [token, API_BASE_URL])

  useEffect(() => {
    if (token && activeModuleId === 'application') {
      void loadApplication()
    }
    if (token && activeModuleId === 'users' && me?.role === 'ADMIN') {
      void loadUsers({
        role: getUsersRoleFilter(activeTab),
        page: usersPage,
        search: usersSearch.trim() || undefined,
      })
    }
    if (token && activeModuleId === 'applications' && me?.role === 'ADMIN') {
      void loadApplications()
    }
    if (token && activeModuleId === 'teams' && me?.role === 'ADMIN') {
      void loadAdminTeams()
    }
    if (token && activeModuleId === 'notifications' && me?.role === 'ADMIN') {
      void loadAdminTeamRequests()
    }
    if (token && activeModuleId === 'players' && me?.role === 'ADMIN') {
      void loadAdminPlayers()
    }
    if (token && activeModuleId === 'coach-invites') {
      void loadCoaches()
    }
    if (token && activeModuleId === 'assigned-trials') {
      void loadTrials()
      if (me?.role === 'COACH' && teams.length === 0) void loadActiveTeams()
    }
    if (token && activeModuleId === 'assigned-trials' && me?.role === 'COACH' && selectedTrial && teams.length === 0) {
      void loadActiveTeams()
    }
    if (token && activeModuleId === 'my-players' && me?.role === 'COACH') {
      void loadMyPlayers()
    }
    if (token && activeModuleId === 'my-teams' && me?.role === 'COACH') {
      void loadMyTeams()
    }
  }, [
    token,
    activeModuleId,
    activeTab,
    usersPage,
    usersSearch,
    loadUsers,
    loadApplication,
    loadApplications,
    loadAdminTeams,
    loadAdminTeamRequests,
    loadAdminPlayers,
    loadCoaches,
    loadTrials,
    loadMyPlayers,
    loadMyTeams,
    loadActiveTeams,
    teams.length,
    me?.role,
    selectedTrial,
  ])

  async function createCoachInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return Promise.resolve()
    setError(null)
    
    if (!coachForm.phone) {
      setError('Phone number is required')
      return Promise.resolve()
    }

    setIsLoadingCoaches(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/coach/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...coachForm,
          yearsExperience: coachForm.yearsExperience ? parseInt(coachForm.yearsExperience) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to create coach invite')
        return Promise.resolve()
      }
      setError(null)
      const inviteLink = data.data?.inviteLink || `${window.location.origin}/invite/${data.data?.inviteToken || ''}`
      setSuccessMessage(`Coach invite sent successfully! OTP sent to phone. Invite Link: ${inviteLink}`)
      // Copy invite link to clipboard if possible
      if (navigator.clipboard) {
        navigator.clipboard.writeText(inviteLink).catch(() => {})
      }
      setTimeout(() => {
        setSuccessMessage(null)
      }, 10000) // Show longer to allow copying the link
      setShowCoachModal(false)
      setCoachForm({
        phone: '',
        email: '',
        sport: 'FOOTBALL',
        coachingRole: 'ASSISTANT',
        ageGroups: [],
        specializationTags: [],
        yearsExperience: '',
      })
      void loadCoaches()
      return Promise.resolve()
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
      return Promise.resolve()
    } finally {
      setIsLoadingCoaches(false)
    }
  }

  // Check for legacy invite token in URL on mount (show info message only)
  useEffect(() => {
    if (token) return // Don't check invite if already logged in

    const path = window.location.pathname
    const inviteMatch = path.match(/\/invite\/([a-f0-9]{32})/i)
    if (inviteMatch) {
      const tokenFromUrl = inviteMatch[1]
      setInviteToken(tokenFromUrl)
      setError('Coach invite links are no longer used. Please login with phone and MPIN provided by admin.')
      window.history.replaceState({}, '', '/')
    }
  }, [token])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showApplicationModal) setShowApplicationModal(false)
        if (showCoachModal) setShowCoachModal(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showApplicationModal, showCoachModal])

  const activeModule = availableModules.find((module) => module.id === activeModuleId)

  return (
    <div className="page page--minimal">
      <main className="auth-layout">
        <header className="auth-header">
          <div className="auth-icon" aria-hidden="true">
            ⚽
          </div>
          <div>
            <p className="auth-title">DHSA Sports</p>
            <p className="muted">Secure login</p>
          </div>
        </header>
        <section className={`card ${token ? 'card--app' : 'card--login'}`}>
          <div className="card__header">
            <h2>{token ? 'Welcome' : mode === 'login' ? 'Sign in' : 'Create account'}</h2>
            <p className="muted">
              {token
                ? 'You are signed in.'
                : mode === 'login'
                  ? 'Use your phone and MPIN to login (admin, coach, referee, or player).'
                  : 'Register as a new user with phone, OTP, and MPIN.'}
            </p>
          </div>
          {token ? (
            <div className="app-shell">
              <div className="app-header">
                <div>
                  <p className="app-title">Dashboard</p>
                  <p className="muted">{me?.role ? `${me.role} access` : 'Signed in'}</p>
                </div>
                <div className="app-actions">
                  <button className="button button--ghost" type="button" onClick={loadMe}>
                    Refresh
                  </button>
                  <button className="button button--danger" type="button" onClick={logout}>
                    Logout
                  </button>
                </div>
              </div>

              {isLoadingMe && <div className="status status--info">Loading profile...</div>}

              {me && (
                <div className="profile-card profile-card--compact">
                  <div>
                    <p className="profile-card__label">Phone</p>
                    <p className="profile-card__value">{me.phone}</p>
                  </div>
                  <div>
                    <p className="profile-card__label">Role</p>
                    <p className="profile-card__value" style={{ 
                      color: me.role === 'ADMIN' ? '#ef4444' : me.role === 'USER' ? '#10b981' : '#2563eb',
                      fontWeight: 'bold'
                    }}>
                      {me.role || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="profile-card__label">Status</p>
                    <p className="profile-card__value" style={{ 
                      color: me.status === 'ACTIVE' ? '#10b981' : me.status === 'VERIFIED' ? '#3b82f6' : me.status === 'INVITED' ? '#f59e0b' : '#ef4444',
                      fontWeight: 'bold'
                    }}>
                      {me.status}
                    </p>
                  </div>
                  {me.coach && (
                    <div>
                      <p className="profile-card__label">Coach ID</p>
                      <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{me.coach.coachId}</p>
                    </div>
                  )}
                  {me.player && (
                    <div>
                      <p className="profile-card__label">Player ID</p>
                      <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{me.player.playerId}</p>
                    </div>
                  )}
                </div>
              )}

              {me && me.role === 'COACH' && me.status === 'INVITED' && !me.mpinHash && (
                <div className="status status--info">
                  <strong>Action Required:</strong> Please set your MPIN to complete your account setup. Go to <strong>Profile → Credentials</strong> tab to set your MPIN. After setting MPIN, your status will change to VERIFIED, and you'll need to wait for admin activation to become ACTIVE.
                </div>
              )}

              {me && me.role === 'COACH' && me.status === 'VERIFIED' && (
                <div className="status status--info">
                  <strong>Waiting for Activation:</strong> Your account is verified. Please wait for an administrator to activate your account. Once activated, your status will change to ACTIVE and you'll have full access.
                </div>
              )}
              
              {me && !userRole && (
                <div className="status status--error">
                  <strong>Warning:</strong> User role not recognized. Please refresh or contact support.
                </div>
              )}

              <div className="app-layout">
                <aside className="sidebar">
                  <p className="sidebar__title">Modules</p>
                  <div className="sidebar__list">
                    {availableModules.map((module) => (
                      <button
                        key={module.id}
                        className={`sidebar__item ${activeModuleId === module.id ? 'sidebar__item--active' : ''}`}
                        type="button"
                        onClick={() => {
                          setActiveModuleId(module.id)
                          setActiveTab(module.tabs[0] || '')
                          setError(null)
                          setSuccessMessage(null)
                        }}
                      >
                        {module.label}
                      </button>
                    ))}
                  </div>
                </aside>

                <section className="content">
                  <div className="content__header">
                    <div>
                      <p className="content__title">{activeModule?.label || 'Module'}</p>
                      <p className="muted">Clean minimal view</p>
                    </div>
                    <div className="tabs">
                      {(activeModule?.tabs || []).map((tab) => (
                        <button
                          key={tab}
                          className={`tab ${activeTab === tab ? 'tab--active' : ''}`}
                          type="button"
                          onClick={() => {
                          setActiveTab(tab)
                          setError(null)
                          setSuccessMessage(null)
                        }}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeModuleId === 'users' && me?.role === 'ADMIN' ? (
                    <div className="users-module">
                      <div
                        className="module-actions"
                        style={{
                          marginBottom: '20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>User Management</h3>
                          <p className="muted" style={{ margin: '4px 0 0' }}>
                            Accounts list (filtered by role tab)
                          </p>
                        </div>
                        <button
                          className="button button--ghost"
                          type="button"
                          onClick={() => {
                            void loadUsers({
                              role: getUsersRoleFilter(activeTab),
                              page: usersPage,
                              search: usersSearch.trim() || undefined,
                            })
                          }}
                          disabled={isLoadingUsers}
                        >
                          Refresh
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <div style={{ flex: '1 1 280px' }}>
                          <input
                            className="input"
                            placeholder="Search phone or email"
                            value={usersSearch}
                            onChange={(e) => setUsersSearch(e.target.value)}
                          />
                        </div>
                        <button className="button button--ghost" type="button" onClick={() => setUsersSearch('')} disabled={!usersSearch || isLoadingUsers}>
                          Clear
                        </button>
                      </div>

                      <div className="muted" style={{ marginBottom: '12px' }}>
                        Showing page {usersPage} / {usersTotalPages} · Total {usersTotal}
                      </div>

                      {isLoadingUsers ? (
                        <div className="status status--info">Loading users...</div>
                      ) : adminUsers.length > 0 ? (
                        <div className="users-list">
                          {adminUsers.map((user) => (
                            <div key={user.id} className="profile-card" style={{ marginBottom: '12px' }}>
                              <div className="profile-card__grid">
                                <div>
                                  <p className="profile-card__label">Phone</p>
                                  <p className="profile-card__value">{user.phone}</p>
                                </div>
                                <div>
                                  <p className="profile-card__label">Email</p>
                                  <p className="profile-card__value">{user.email || '—'}</p>
                                </div>
                                <div>
                                  <p className="profile-card__label">Role</p>
                                  <p className="profile-card__value" style={{ fontWeight: 'bold' }}>
                                    {user.role}
                                  </p>
                                </div>
                                <div>
                                  <p className="profile-card__label">Status</p>
                                  <p
                                    className="profile-card__value"
                                    style={{
                                      color: user.status === 'ACTIVE' ? '#10b981' : user.status === 'VERIFIED' ? '#3b82f6' : '#f59e0b',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    {user.status}
                                  </p>
                                </div>
                                <div>
                                  <p className="profile-card__label">Created</p>
                                  <p className="profile-card__value">{user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}</p>
                                </div>
                                <div>
                                  <p className="profile-card__label">Last Login</p>
                                  <p className="profile-card__value">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}</p>
                                </div>
                                <div>
                                  <p className="profile-card__label">Application</p>
                                  <p className="profile-card__value">{user.application?.status || '—'}</p>
                                </div>
                                <div>
                                  <p className="profile-card__label">Player ID</p>
                                  <p className="profile-card__value">{user.player?.playerId || '—'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state">
                          <p className="empty-state__title">No users found</p>
                          <p className="muted">Try switching tabs or clearing search.</p>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                        <button
                          className="button button--ghost"
                          type="button"
                          disabled={isLoadingUsers || usersPage <= 1}
                          onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                        >
                          ← Prev
                        </button>
                        <button
                          className="button button--ghost"
                          type="button"
                          disabled={isLoadingUsers || usersPage >= usersTotalPages}
                          onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  ) : activeModuleId === 'players' && me?.role === 'ADMIN' ? (
                    <div className="admin-players-module">
                      <div
                        className="module-actions"
                        style={{
                          marginBottom: '20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Players</h3>
                          <p className="muted" style={{ margin: '4px 0 0' }}>
                            View all approved players and open full player profiles.
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {selectedAdminPlayer && (
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => setSelectedAdminPlayer(null)}
                              disabled={isLoadingSelectedPlayer}
                            >
                              ← Back to Players
                            </button>
                          )}
                          <button
                            className="button button--ghost"
                            type="button"
                            onClick={() => {
                              if (selectedAdminPlayer) return
                              void loadAdminPlayers()
                            }}
                            disabled={isLoadingAdminPlayers || Boolean(selectedAdminPlayer)}
                          >
                            Refresh
                          </button>
                        </div>
                      </div>

                      {!selectedAdminPlayer ? (
                        <>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                            <div style={{ flex: '1 1 280px' }}>
                              <input
                                className="input"
                                placeholder="Search playerId, name, phone, email, location..."
                                value={playersSearch}
                                onChange={(e) => setPlayersSearch(e.target.value)}
                              />
                            </div>
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => setPlayersSearch('')}
                              disabled={!playersSearch || isLoadingAdminPlayers}
                            >
                              Clear
                            </button>
                          </div>

                          <div className="muted" style={{ marginBottom: '12px' }}>
                            Showing page {playersPage} / {playersTotalPages} · Total {playersTotal}
                          </div>

                          {isLoadingAdminPlayers ? (
                            <div className="status status--info">Loading players...</div>
                          ) : adminPlayers.length > 0 ? (
                            <div className="users-list">
                              {adminPlayers.map((p) => (
                                <div key={p.id} className="profile-card" style={{ marginBottom: '12px' }}>
                                  <div className="profile-card__grid">
                                    <div>
                                      <p className="profile-card__label">Player ID</p>
                                      <p className="profile-card__value">{p.playerId}</p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Name</p>
                                      <p className="profile-card__value">{p.displayName || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Phone</p>
                                      <p className="profile-card__value">{p.user?.phone || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Status</p>
                                      <p className="profile-card__value" style={{ fontWeight: 'bold', color: p.footballStatus === 'ACTIVE' ? '#10b981' : '#f59e0b' }}>
                                        {p.footballStatus}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Position</p>
                                      <p className="profile-card__value">{p.primaryPosition || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Created</p>
                                      <p className="profile-card__value">{p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}</p>
                                    </div>
                                  </div>
                                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                      className="button button--primary"
                                      type="button"
                                      onClick={() => void loadAdminPlayerProfile(p.id)}
                                      disabled={isLoadingSelectedPlayer}
                                    >
                                      View Profile
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="empty-state">
                              <p className="empty-state__title">No players found</p>
                              <p className="muted">Try clearing search.</p>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                            <button
                              className="button button--ghost"
                              type="button"
                              disabled={isLoadingAdminPlayers || playersPage <= 1}
                              onClick={() => setPlayersPage((p) => Math.max(1, p - 1))}
                            >
                              ← Prev
                            </button>
                            <button
                              className="button button--ghost"
                              type="button"
                              disabled={isLoadingAdminPlayers || playersPage >= playersTotalPages}
                              onClick={() => setPlayersPage((p) => Math.min(playersTotalPages, p + 1))}
                            >
                              Next →
                            </button>
                          </div>
                        </>
                      ) : isLoadingSelectedPlayer ? (
                        <div className="status status--info">Loading player profile...</div>
                      ) : (
                        <div className="profile-card">
                          <div className="profile-card__grid">
                            <div>
                              <p className="profile-card__label">Player ID</p>
                              <p className="profile-card__value">{selectedAdminPlayer.player?.playerId || '—'}</p>
                            </div>
                            <div>
                              <p className="profile-card__label">Name</p>
                              <p className="profile-card__value">{selectedAdminPlayer.player?.displayName || '—'}</p>
                            </div>
                            <div>
                              <p className="profile-card__label">Phone</p>
                              <p className="profile-card__value">{selectedAdminPlayer.player?.user?.phone || '—'}</p>
                            </div>
                            <div>
                              <p className="profile-card__label">Email</p>
                              <p className="profile-card__value">{selectedAdminPlayer.player?.user?.email || '—'}</p>
                            </div>
                            <div>
                              <p className="profile-card__label">Football Status</p>
                              <p className="profile-card__value">{selectedAdminPlayer.player?.footballStatus || '—'}</p>
                            </div>
                            <div>
                              <p className="profile-card__label">DOB</p>
                              <p className="profile-card__value">
                                {selectedAdminPlayer.player?.dateOfBirth ? new Date(selectedAdminPlayer.player.dateOfBirth).toLocaleDateString() : '—'}
                              </p>
                            </div>
                            <div>
                              <p className="profile-card__label">Gender</p>
                              <p className="profile-card__value">{selectedAdminPlayer.player?.gender || '—'}</p>
                            </div>
                            <div>
                              <p className="profile-card__label">Position</p>
                              <p className="profile-card__value">{selectedAdminPlayer.player?.primaryPosition || '—'}</p>
                            </div>
                            <div>
                              <p className="profile-card__label">Dominant Foot</p>
                              <p className="profile-card__value">{selectedAdminPlayer.player?.dominantFoot || '—'}</p>
                            </div>
                            <div>
                              <p className="profile-card__label">Location</p>
                              <p className="profile-card__value">
                                {[selectedAdminPlayer.player?.district, selectedAdminPlayer.player?.state, selectedAdminPlayer.player?.city]
                                  .filter(Boolean)
                                  .join(', ') || '—'}
                              </p>
                            </div>
                          </div>

                          <div style={{ marginTop: '16px' }}>
                            <h4 style={{ marginBottom: '8px' }}>Documents</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {Array.isArray(selectedAdminPlayer.documents) && selectedAdminPlayer.documents.length > 0 ? (
                                selectedAdminPlayer.documents.map((d: any) => (
                                  <div
                                    key={d.id || `${d.documentType}-${String(d.createdAt || '')}`}
                                    className="profile-card profile-card--compact"
                                    style={{ marginBottom: 0 }}
                                  >
                                    <div>
                                      <p className="profile-card__label">Type</p>
                                      <p className="profile-card__value">{d.documentType}</p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Owner</p>
                                      <p className="profile-card__value">{d.ownerType}</p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Status</p>
                                      <p className="profile-card__value">{d.verificationStatus}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                      <button
                                        className="button button--ghost"
                                        type="button"
                                        onClick={() => {
                                          if (!d.id) return
                                          openDocumentPreview(d.id).catch((e: any) => setError(e?.message || 'Failed to open document'))
                                        }}
                                        disabled={!d.id}
                                      >
                                        View
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="muted">No documents found for this player.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : activeModuleId === 'coach-invites' ? (
                    <div className="coach-invites-module">
                      {isLoadingCoaches ? (
                        <div className="status status--info">Loading coaches...</div>
                      ) : (
                        <>
                          <div className="module-actions" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Coach Invites</h3>
                              <p className="muted" style={{ margin: '4px 0 0' }}>Manage coach invitations and activations</p>
                            </div>
                            <button 
                              className="button button--primary" 
                              type="button"
                              onClick={() => setShowCoachModal(true)}
                            >
                              + Create Coach Invite
                            </button>
                          </div>

                          {activeTab === 'Active' && (
                            <div>
                              <h4 style={{ marginBottom: '16px' }}>Active Invites</h4>
                              {coaches.filter(c => c.status === 'INVITED' || c.status === 'VERIFIED').length > 0 ? (
                                <div className="coaches-list">
                                  {coaches.filter(c => c.status === 'INVITED' || c.status === 'VERIFIED').map((coach) => (
                                    <div key={coach.id} className="profile-card" style={{ marginBottom: '12px' }}>
                                      <div className="profile-card__grid">
                                        <div>
                                          <p className="profile-card__label">Coach ID</p>
                                          <p className="profile-card__value">{coach.coachId}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Phone</p>
                                          <p className="profile-card__value">{coach.user?.phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Email</p>
                                          <p className="profile-card__value">{coach.user?.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Sport</p>
                                          <p className="profile-card__value">{coach.sport}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Role</p>
                                          <p className="profile-card__value">{coach.coachingRole}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Status</p>
                                          <p className="profile-card__value" style={{ 
                                            color: coach.status === 'VERIFIED' ? '#10b981' : '#f59e0b',
                                            fontWeight: 'bold'
                                          }}>
                                            {coach.status}
                                          </p>
                                        </div>
                                      </div>
                                      {coach.status === 'VERIFIED' && (
                                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                                          <button
                                            className="button button--primary"
                                            type="button"
                                            onClick={async () => {
                                              if (!confirm('Activate this coach?')) return
                                              try {
                                                const res = await fetch(`${API_BASE_URL}/api/coach/${coach.coachId}/activate`, {
                                                  method: 'POST',
                                                  headers: { Authorization: `Bearer ${token}` },
                                                })
                                                const data = await res.json()
                                                if (res.ok && data?.success) {
                                                  setSuccessMessage('Coach activated successfully!')
                                                  setTimeout(() => setSuccessMessage(null), 3000)
                                                  void loadCoaches()
                                                } else {
                                                  setError(data?.message || 'Failed to activate coach')
                                                }
                                              } catch (err) {
                                                setError('Failed to activate coach')
                                              }
                                            }}
                                          >
                                            Activate Coach
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No active invites</p>
                                  <p className="muted">Create a coach invite to get started.</p>
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'Accepted' && (
                            <div>
                              <h4 style={{ marginBottom: '16px' }}>Accepted Coaches</h4>
                              {coaches.filter(c => c.status === 'ACTIVE').length > 0 ? (
                                <div className="coaches-list">
                                  {coaches.filter(c => c.status === 'ACTIVE').map((coach) => (
                                    <div key={coach.id} className="profile-card" style={{ marginBottom: '12px' }}>
                                      <div className="profile-card__grid">
                                        <div>
                                          <p className="profile-card__label">Coach ID</p>
                                          <p className="profile-card__value">{coach.coachId}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Phone</p>
                                          <p className="profile-card__value">{coach.user?.phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Email</p>
                                          <p className="profile-card__value">{coach.user?.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Sport</p>
                                          <p className="profile-card__value">{coach.sport}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Role</p>
                                          <p className="profile-card__value">{coach.coachingRole}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Status</p>
                                          <p className="profile-card__value" style={{ color: '#10b981', fontWeight: 'bold' }}>
                                            {coach.status}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No accepted coaches</p>
                                  <p className="muted">Coaches will appear here after activation.</p>
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'Expired' && (
                            <div>
                              <h4 style={{ marginBottom: '16px' }}>Expired/Suspended</h4>
                              {coaches.filter(c => c.status === 'SUSPENDED' || c.status === 'REMOVED').length > 0 ? (
                                <div className="coaches-list">
                                  {coaches.filter(c => c.status === 'SUSPENDED' || c.status === 'REMOVED').map((coach) => (
                                    <div key={coach.id} className="profile-card" style={{ marginBottom: '12px' }}>
                                      <div className="profile-card__grid">
                                        <div>
                                          <p className="profile-card__label">Coach ID</p>
                                          <p className="profile-card__value">{coach.coachId}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Phone</p>
                                          <p className="profile-card__value">{coach.user?.phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Status</p>
                                          <p className="profile-card__value" style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                            {coach.status}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No expired coaches</p>
                                  <p className="muted">Suspended or removed coaches will appear here.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : activeModuleId === 'applications' && me?.role === 'ADMIN' ? (
                    <div className="applications-module">
                      {isLoadingApplications ? (
                        <div className="status status--info">Loading applications...</div>
                      ) : selectedApplication ? (
                        <div>
                          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => setSelectedApplication(null)}
                            >
                              ← Back to Applications
                            </button>
                          </div>
                          <div className="profile-card">
                            <h3 style={{ marginBottom: '16px' }}>Application Details</h3>
                            <div className="profile-card__grid">
                              <div>
                                <p className="profile-card__label">Full Name</p>
                                <p className="profile-card__value">{selectedApplication.fullName}</p>
                              </div>
                              <div>
                                <p className="profile-card__label">Date of Birth</p>
                                <p className="profile-card__value">{new Date(selectedApplication.dateOfBirth).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="profile-card__label">Gender</p>
                                <p className="profile-card__value">{selectedApplication.gender}</p>
                              </div>
                              <div>
                                <p className="profile-card__label">Position</p>
                                <p className="profile-card__value">{selectedApplication.primaryPosition || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="profile-card__label">Status</p>
                                <p className="profile-card__value" style={{ 
                                  color: selectedApplication.status === 'APPROVED' ? '#10b981' : 
                                         selectedApplication.status === 'REJECTED' ? '#ef4444' : '#f59e0b',
                                  fontWeight: 'bold'
                                }}>
                                  {selectedApplication.status}
                                </p>
                              </div>
                              {selectedApplication.trial && (
                                <div>
                                  <p className="profile-card__label">Trial Outcome</p>
                                  <p className="profile-card__value" style={{ 
                                    color: selectedApplication.trial.outcome === 'RECOMMENDED' ? '#10b981' : '#ef4444',
                                    fontWeight: 'bold'
                                  }}>
                                    {selectedApplication.trial.outcome || 'N/A'}
                                  </p>
                                </div>
                              )}
                            </div>
                            {selectedApplication.trial?.outcome === 'RECOMMENDED' && selectedApplication.status !== 'APPROVED' && (
                              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                                <div className="status status--info" style={{ marginBottom: '16px' }}>
                                  <strong>Ready for Approval</strong>
                                  <p>Trial outcome is RECOMMENDED. You can approve this application to create a player profile.</p>
                                </div>
                                <div className="actions" style={{ gap: '12px' }}>
                                  <button
                                    className="button button--primary"
                                    type="button"
                                    onClick={async () => {
                                      if (!confirm('Approve this application and create player profile?')) return
                                      try {
                                        const res = await fetch(`${API_BASE_URL}/api/admin/applications/${selectedApplication.id}/approve`, {
                                          method: 'POST',
                                          headers: { Authorization: `Bearer ${token}` },
                                        })
                                        const data = await res.json()
                                        if (res.ok && data?.success) {
                                          setSuccessMessage(`Application approved! Player ID: ${data.data?.playerId || 'N/A'}`)
                                          setTimeout(() => setSuccessMessage(null), 5000)
                                          void loadApplications()
                                          setSelectedApplication(null)
                                        } else {
                                          setError(data?.message || 'Failed to approve application')
                                        }
                                      } catch (err) {
                                        setError('Failed to approve application')
                                      }
                                    }}
                                  >
                                    Approve Application
                                  </button>
                                  <button
                                    className="button"
                                    type="button"
                                    onClick={async () => {
                                      const reason = prompt('Enter rejection reason:')
                                      if (!reason) return
                                      try {
                                        const res = await fetch(`${API_BASE_URL}/api/admin/applications/${selectedApplication.id}/reject`, {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`,
                                          },
                                          body: JSON.stringify({ reason }),
                                        })
                                        const data = await res.json()
                                        if (res.ok && data?.success) {
                                          setSuccessMessage('Application rejected')
                                          setTimeout(() => setSuccessMessage(null), 3000)
                                          void loadApplications()
                                          setSelectedApplication(null)
                                        } else {
                                          setError(data?.message || 'Failed to reject application')
                                        }
                                      } catch (err) {
                                        setError('Failed to reject application')
                                      }
                                    }}
                                  >
                                    Reject
                                  </button>
                                  <button
                                    className="button button--ghost"
                                    type="button"
                                    onClick={async () => {
                                      const reason = prompt('Enter hold reason (optional):')
                                      try {
                                        const res = await fetch(`${API_BASE_URL}/api/admin/applications/${selectedApplication.id}/hold`, {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`,
                                          },
                                          body: JSON.stringify({ reason }),
                                        })
                                        const data = await res.json()
                                        if (res.ok && data?.success) {
                                          setSuccessMessage('Application put on hold')
                                          setTimeout(() => setSuccessMessage(null), 3000)
                                          void loadApplications()
                                          setSelectedApplication(null)
                                        } else {
                                          setError(data?.message || 'Failed to hold application')
                                        }
                                      } catch (err) {
                                        setError('Failed to hold application')
                                      }
                                    }}
                                  >
                                    Hold
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          {activeTab === 'Pending' && (
                            <div>
                              <h4 style={{ marginBottom: '16px' }}>Pending Applications</h4>
                              {applications.filter(a => a.status === 'SUBMITTED').length > 0 ? (
                                <div className="trials-list">
                                  {applications.filter(a => a.status === 'SUBMITTED').map((app) => (
                                    <div key={app.id} className="profile-card" style={{ marginBottom: '12px', cursor: 'pointer' }} onClick={() => setSelectedApplication(app)}>
                                      <div className="profile-card__grid">
                                        <div>
                                          <p className="profile-card__label">Player Name</p>
                                          <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{app.fullName}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Position</p>
                                          <p className="profile-card__value">{app.primaryPosition || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Status</p>
                                          <p className="profile-card__value" style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                                            {app.status}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Submitted</p>
                                          <p className="profile-card__value">{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                      </div>
                                      <p className="muted" style={{ marginTop: '8px', fontSize: '0.85rem' }}>Click to view details</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No pending applications</p>
                                  <p className="muted">Applications waiting for trial evaluation will appear here.</p>
                                </div>
                              )}
                            </div>
                          )}
                          {activeTab === 'Review' && (
                            <div>
                              <h4 style={{ marginBottom: '16px' }}>Under Review</h4>
                              {applications.filter(a => a.status === 'UNDER_REVIEW').length > 0 ? (
                                <div className="trials-list">
                                  {applications.filter(a => a.status === 'UNDER_REVIEW').map((app) => (
                                    <div key={app.id} className="profile-card" style={{ marginBottom: '12px', cursor: 'pointer' }} onClick={() => setSelectedApplication(app)}>
                                      <div className="profile-card__grid">
                                        <div>
                                          <p className="profile-card__label">Player Name</p>
                                          <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{app.fullName}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Position</p>
                                          <p className="profile-card__value">{app.primaryPosition || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Trial Outcome</p>
                                          <p className="profile-card__value" style={{ 
                                            color: app.trial?.outcome === 'RECOMMENDED' ? '#10b981' : '#ef4444',
                                            fontWeight: 'bold'
                                          }}>
                                            {app.trial?.outcome || 'N/A'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Status</p>
                                          <p className="profile-card__value" style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                                            {app.status}
                                          </p>
                                        </div>
                                      </div>
                                      <p className="muted" style={{ marginTop: '8px', fontSize: '0.85rem' }}>Click to review and approve/reject</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No applications under review</p>
                                  <p className="muted">Applications with RECOMMENDED trial outcomes will appear here for approval.</p>
                                </div>
                              )}
                            </div>
                          )}
                          {activeTab === 'Approved' && (
                            <div>
                              <h4 style={{ marginBottom: '16px' }}>Approved Applications</h4>
                              {applications.filter(a => a.status === 'APPROVED').length > 0 ? (
                                <div className="trials-list">
                                  {applications.filter(a => a.status === 'APPROVED').map((app) => (
                                    <div key={app.id} className="profile-card" style={{ marginBottom: '12px' }}>
                                      <div className="profile-card__grid">
                                        <div>
                                          <p className="profile-card__label">Player Name</p>
                                          <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{app.fullName}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Position</p>
                                          <p className="profile-card__value">{app.primaryPosition || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Status</p>
                                          <p className="profile-card__value" style={{ color: '#10b981', fontWeight: 'bold' }}>
                                            {app.status}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Reviewed</p>
                                          <p className="profile-card__value">{app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No approved applications</p>
                                  <p className="muted">Approved applications will appear here.</p>
                                </div>
                              )}
                            </div>
                          )}
                          {activeTab === 'Rejected' && (
                            <div>
                              <h4 style={{ marginBottom: '16px' }}>Rejected Applications</h4>
                              {applications.filter(a => a.status === 'REJECTED').length > 0 ? (
                                <div className="trials-list">
                                  {applications.filter(a => a.status === 'REJECTED').map((app) => (
                                    <div key={app.id} className="profile-card" style={{ marginBottom: '12px' }}>
                                      <div className="profile-card__grid">
                                        <div>
                                          <p className="profile-card__label">Player Name</p>
                                          <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{app.fullName}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Position</p>
                                          <p className="profile-card__value">{app.primaryPosition || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Status</p>
                                          <p className="profile-card__value" style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                            {app.status}
                                          </p>
                                        </div>
                                        {app.rejectionReason && (
                                          <div>
                                            <p className="profile-card__label">Rejection Reason</p>
                                            <p className="profile-card__value">{app.rejectionReason}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No rejected applications</p>
                                  <p className="muted">Rejected applications will appear here.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : activeModuleId === 'teams' && me?.role === 'ADMIN' ? (
                    <div className="trials-module">
                      {isLoadingAdminTeams ? (
                        <div className="status status--info">Loading teams...</div>
                      ) : (
                        <>
                          {activeTab === 'All Teams' && (
                            <div>
                              <h4 style={{ marginBottom: '16px' }}>All Teams</h4>
                              <p className="muted" style={{ marginBottom: '20px' }}>
                                View and manage all teams. Teams are created by coaches; admins can edit or delete existing teams.
                              </p>

                              {adminTeams.length > 0 ? (
                                <div className="trials-list">
                                  {adminTeams.map((team) => (
                                    <div
                                      key={team.id}
                                      className="profile-card"
                                      style={{ marginBottom: '12px', cursor: 'pointer' }}
                                      onClick={async () => {
                                        if (!token) return
                                        setSelectedTeam(team)
                                        setSelectedTeamPlayerProfile(null)
                                        setIsLoadingTeamPlayers(true)
                                        setError(null)
                                        try {
                                          const res = await fetch(`${API_BASE_URL}/api/teams/admin/${team.teamId}/players`, {
                                            headers: { Authorization: `Bearer ${token}` },
                                          })
                                          const data = await res.json()
                                          if (res.ok && data?.success) {
                                            setSelectedTeam(data.data?.team || team)
                                            setTeamPlayers(data.data?.players || [])
                                            setActiveTab('Team Players')
                                          } else {
                                            setError(data?.message || 'Failed to load team players')
                                          }
                                        } catch (err) {
                                          setError('Cannot reach backend. Make sure the server is running.')
                                        } finally {
                                          setIsLoadingTeamPlayers(false)
                                        }
                                      }}
                                    >
                                      <div className="profile-card__grid">
                                        <div>
                                          <p className="profile-card__label">Team Name</p>
                                          <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{team.name}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Team ID</p>
                                          <p className="profile-card__value">{team.teamId}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Location</p>
                                          <p className="profile-card__value">{team.location || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Created By</p>
                                          <p className="profile-card__value">
                                            {team.createdBy?.displayName || team.createdBy?.coachId || '—'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Status</p>
                                          <p className="profile-card__value" style={{
                                            color: team.status === 'ACTIVE' ? '#10b981' : '#f59e0b',
                                            fontWeight: 'bold',
                                          }}>
                                            {team.status}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Coaches</p>
                                          <p className="profile-card__value">
                                            {team.coaches && team.coaches.length > 0
                                              ? team.coaches.map((c: any) => c.coach?.displayName || c.coach?.coachId).join(', ')
                                              : 'No active coach'}
                                          </p>
                                        </div>
                                      </div>
                                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                        <button
                                          className="button button--ghost"
                                          type="button"
                                          onClick={async (event) => {
                                            event.stopPropagation()
                                            if (!token) return
                                            const newName = prompt('Update team name:', team.name || '')
                                            if (!newName) return
                                            const newLocation = prompt('Update location (leave blank for none):', team.location || '')
                                            setError(null)
                                            setIsLoadingAdminTeams(true)
                                            try {
                                              const res = await fetch(`${API_BASE_URL}/api/teams/admin/${team.teamId}`, {
                                                method: 'PUT',
                                                headers: {
                                                  'Content-Type': 'application/json',
                                                  Authorization: `Bearer ${token}`,
                                                },
                                                body: JSON.stringify({
                                                  name: newName,
                                                  location: newLocation ?? '',
                                                }),
                                              })
                                              const data = await res.json()
                                              if (!res.ok || !data?.success) {
                                                setError(data?.message || 'Failed to update team')
                                                return
                                              }
                                              await loadAdminTeams()
                                              setSuccessMessage('Team updated successfully')
                                              setTimeout(() => setSuccessMessage(null), 3000)
                                            } catch (err) {
                                              setError('Cannot reach backend. Make sure the server is running.')
                                            } finally {
                                              setIsLoadingAdminTeams(false)
                                            }
                                          }}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          className="button button--danger"
                                          type="button"
                                          onClick={async (event) => {
                                            event.stopPropagation()
                                            if (!token) return
                                            if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return
                                            setError(null)
                                            setIsLoadingAdminTeams(true)
                                            try {
                                              const res = await fetch(`${API_BASE_URL}/api/teams/admin/${team.teamId}`, {
                                                method: 'DELETE',
                                                headers: { Authorization: `Bearer ${token}` },
                                              })
                                              const data = await res.json()
                                              if (!res.ok || !data?.success) {
                                                setError(data?.message || 'Failed to delete team')
                                                return
                                              }
                                              await loadAdminTeams()
                                              setSelectedTeam(null)
                                              setTeamPlayers([])
                                              setSuccessMessage('Team deleted successfully')
                                              setTimeout(() => setSuccessMessage(null), 3000)
                                            } catch (err) {
                                              setError('Cannot reach backend. Make sure the server is running.')
                                            } finally {
                                              setIsLoadingAdminTeams(false)
                                            }
                                          }}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No teams yet</p>
                                  <p className="muted">Create the first team using the form above.</p>
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'Team Players' && (
                            <div>
                              <h4 style={{ marginBottom: '16px' }}>Team Players</h4>
                              {selectedTeam ? (
                                <>
                                  <div className="profile-card" style={{ marginBottom: '16px' }}>
                                    <div className="profile-card__grid">
                                      <div>
                                        <p className="profile-card__label">Team Name</p>
                                        <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{selectedTeam.name}</p>
                                      </div>
                                      <div>
                                        <p className="profile-card__label">Team ID</p>
                                        <p className="profile-card__value">{selectedTeam.teamId}</p>
                                      </div>
                                      <div>
                                        <p className="profile-card__label">Location</p>
                                        <p className="profile-card__value">{selectedTeam.location || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="profile-card__label">Created By</p>
                                        <p className="profile-card__value">
                                          {selectedTeam.createdBy?.displayName || selectedTeam.createdBy?.coachId || '—'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  {selectedTeamPlayerProfile ? (
                                    <div>
                                      <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <button
                                          className="button button--ghost"
                                          type="button"
                                          onClick={() => setSelectedTeamPlayerProfile(null)}
                                          disabled={isLoadingTeamPlayerProfile}
                                        >
                                          ← Back to Team Players
                                        </button>
                                      </div>
                                      {isLoadingTeamPlayerProfile ? (
                                        <div className="status status--info">Loading player profile...</div>
                                      ) : (
                                        <div className="profile-card">
                                          <div className="profile-card__grid">
                                            <div>
                                              <p className="profile-card__label">Player ID</p>
                                              <p className="profile-card__value">{selectedTeamPlayerProfile.player?.playerId || '—'}</p>
                                            </div>
                                            <div>
                                              <p className="profile-card__label">Name</p>
                                              <p className="profile-card__value">{selectedTeamPlayerProfile.player?.displayName || '—'}</p>
                                            </div>
                                            <div>
                                              <p className="profile-card__label">Phone</p>
                                              <p className="profile-card__value">{selectedTeamPlayerProfile.player?.user?.phone || '—'}</p>
                                            </div>
                                            <div>
                                              <p className="profile-card__label">Email</p>
                                              <p className="profile-card__value">{selectedTeamPlayerProfile.player?.user?.email || '—'}</p>
                                            </div>
                                            <div>
                                              <p className="profile-card__label">Football Status</p>
                                              <p className="profile-card__value">{selectedTeamPlayerProfile.player?.footballStatus || '—'}</p>
                                            </div>
                                            <div>
                                              <p className="profile-card__label">DOB</p>
                                              <p className="profile-card__value">
                                                {selectedTeamPlayerProfile.player?.dateOfBirth ? new Date(selectedTeamPlayerProfile.player.dateOfBirth).toLocaleDateString() : '—'}
                                              </p>
                                            </div>
                                          </div>

                                          <div style={{ marginTop: '16px' }}>
                                            <h4 style={{ marginBottom: '8px' }}>Documents</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                              {Array.isArray(selectedTeamPlayerProfile.documents) && selectedTeamPlayerProfile.documents.length > 0 ? (
                                                selectedTeamPlayerProfile.documents.map((d: any) => (
                                                  <div
                                                    key={d.id || `${d.documentType}-${String(d.createdAt || '')}`}
                                                    className="profile-card profile-card--compact"
                                                    style={{ marginBottom: 0 }}
                                                  >
                                                    <div>
                                                      <p className="profile-card__label">Type</p>
                                                      <p className="profile-card__value">{d.documentType}</p>
                                                    </div>
                                                    <div>
                                                      <p className="profile-card__label">Owner</p>
                                                      <p className="profile-card__value">{d.ownerType}</p>
                                                    </div>
                                                    <div>
                                                      <p className="profile-card__label">Status</p>
                                                      <p className="profile-card__value">{d.verificationStatus}</p>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                      <button
                                                        className="button button--ghost"
                                                        type="button"
                                                        onClick={() => {
                                                          if (!d.id) return
                                                          openDocumentPreview(d.id).catch((e: any) => setError(e?.message || 'Failed to open document'))
                                                        }}
                                                        disabled={!d.id}
                                                      >
                                                        View
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))
                                              ) : (
                                                <div className="muted">No documents found for this player.</div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : isLoadingTeamPlayers ? (
                                    <div className="status status--info">Loading team players...</div>
                                  ) : teamPlayers.length > 0 ? (
                                    <div className="trials-list">
                                      {teamPlayers.map((player) => (
                                        <div key={player.playerInternalId} className="profile-card" style={{ marginBottom: '12px' }}>
                                          <div className="profile-card__grid">
                                            <div>
                                              <p className="profile-card__label">Player ID</p>
                                              <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{player.playerId}</p>
                                            </div>
                                            <div>
                                              <p className="profile-card__label">Display Name</p>
                                              <p className="profile-card__value">{player.displayName || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <p className="profile-card__label">Football Status</p>
                                              <p className="profile-card__value" style={{
                                                color: player.footballStatus === 'ACTIVE' ? '#10b981' : '#f59e0b',
                                                fontWeight: 'bold',
                                              }}>
                                                {player.footballStatus || 'N/A'}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="profile-card__label">Phone</p>
                                              <p className="profile-card__value">{player.userPhone || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <p className="profile-card__label">Application Submitted</p>
                                              <p className="profile-card__value">
                                                {player.applicationSubmittedAt ? new Date(player.applicationSubmittedAt).toLocaleDateString() : 'N/A'}
                                              </p>
                                            </div>
                                          </div>
                                          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                              className="button button--primary"
                                              type="button"
                                              onClick={() => void loadTeamPlayerProfile(player.playerInternalId)}
                                              disabled={isLoadingTeamPlayerProfile}
                                            >
                                              View Player Profile
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="empty-state">
                                      <p className="empty-state__title">No players linked</p>
                                      <p className="muted">Approved players who preferred this team will appear here.</p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No team selected</p>
                                  <p className="muted">Select a team from the All Teams tab to view its players.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : activeModuleId === 'notifications' && me?.role === 'ADMIN' ? (
                    <div className="trials-module">
                      {isLoadingAdminTeamRequests ? (
                        <div className="status status--info">Loading notifications...</div>
                      ) : (
                        <>
                          {activeTab === 'Team Requests' && (
                            <div>
                              <h4 style={{ marginBottom: '16px' }}>Team Creation Requests</h4>
                              <p className="muted" style={{ marginBottom: '20px' }}>
                                When coaches create teams, requests appear here for your approval.
                              </p>
                              {adminTeamRequests.length > 0 ? (
                                <div className="trials-list">
                                  {adminTeamRequests.map((req) => (
                                    <div key={req.id} className="profile-card" style={{ marginBottom: '12px' }}>
                                      <div className="profile-card__grid">
                                        <div>
                                          <p className="profile-card__label">Team Name</p>
                                          <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{req.name}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Location</p>
                                          <p className="profile-card__value">{req.location || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Coach</p>
                                          <p className="profile-card__value">
                                            {req.coach?.displayName || req.coach?.coachId || 'N/A'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Coach Phone</p>
                                          <p className="profile-card__value">
                                            {req.coach?.user?.phone || 'N/A'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Status</p>
                                          <p className="profile-card__value" style={{ fontWeight: 'bold' }}>
                                            {req.status}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Requested At</p>
                                          <p className="profile-card__value">
                                            {req.createdAt ? new Date(req.createdAt).toLocaleString() : 'N/A'}
                                          </p>
                                        </div>
                                      </div>
                                      {req.status === 'PENDING' && (
                                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                          <button
                                            className="button button--primary"
                                            type="button"
                                            onClick={async () => {
                                              if (!token) return
                                              if (!confirm(`Approve team "${req.name}" and create it now?`)) return
                                              setError(null)
                                              setIsLoadingAdminTeamRequests(true)
                                              try {
                                                const res = await fetch(`${API_BASE_URL}/api/admin/team-requests/${req.id}/approve`, {
                                                  method: 'POST',
                                                  headers: { Authorization: `Bearer ${token}` },
                                                })
                                                const data = await res.json()
                                                if (!res.ok || !data?.success) {
                                                  setError(data?.message || 'Failed to approve team request')
                                                  return
                                                }
                                                setSuccessMessage('Team request approved and team created')
                                                setTimeout(() => setSuccessMessage(null), 3000)
                                                await loadAdminTeamRequests()
                                                await loadAdminTeams()
                                              } catch (err) {
                                                setError('Cannot reach backend. Make sure the server is running.')
                                              } finally {
                                                setIsLoadingAdminTeamRequests(false)
                                              }
                                            }}
                                          >
                                            Approve
                                          </button>
                                          <button
                                            className="button"
                                            type="button"
                                            onClick={async () => {
                                              if (!token) return
                                              const reason = prompt('Enter rejection reason (optional):') || ''
                                              setError(null)
                                              setIsLoadingAdminTeamRequests(true)
                                              try {
                                                const res = await fetch(`${API_BASE_URL}/api/admin/team-requests/${req.id}/reject`, {
                                                  method: 'POST',
                                                  headers: {
                                                    'Content-Type': 'application/json',
                                                    Authorization: `Bearer ${token}`,
                                                  },
                                                  body: JSON.stringify({ reason }),
                                                })
                                                const data = await res.json()
                                                if (!res.ok || !data?.success) {
                                                  setError(data?.message || 'Failed to reject team request')
                                                  return
                                                }
                                                setSuccessMessage('Team request rejected')
                                                setTimeout(() => setSuccessMessage(null), 3000)
                                                await loadAdminTeamRequests()
                                              } catch (err) {
                                                setError('Cannot reach backend. Make sure the server is running.')
                                              } finally {
                                                setIsLoadingAdminTeamRequests(false)
                                              }
                                            }}
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      )}
                                      {req.status === 'REJECTED' && req.rejectionReason && (
                                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                                          <p className="profile-card__label">Rejection Reason</p>
                                          <p className="profile-card__value">{req.rejectionReason}</p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No team requests</p>
                                  <p className="muted">New team requests from coaches will appear here.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : activeModuleId === 'application' ? (
                    <div className="application-module">
                      {isLoadingApplication ? (
                        <div className="status status--info">Loading application...</div>
                      ) : activeTab === 'Draft' ? (
                        <>
                          {!application || application.status === 'DRAFT' ? (
                            <div className="draft-view">
                              {application ? (
                                <div className="status status--info">
                                  <p>You have a draft application. Click the button below to edit it.</p>
                                </div>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No Application Yet</p>
                                  <p className="muted">Click the button below to start your player application.</p>
                                </div>
                              )}
              <div className="actions" style={{ justifyContent: 'center', marginTop: '24px' }}>
                <button 
                  className="button button--primary" 
                  type="button"
                  onClick={() => {
                    // Prefill player contact with signed-in phone if empty
                    if (me?.phone && !applicationForm.playerPhone) {
                      setApplicationForm((prev) => ({
                        ...prev,
                        playerPhone: prev.playerPhone || me.phone,
                      }))
                    }
                    setShowApplicationModal(true)
                  }}
                >
                                  {application ? 'Edit Application' : 'Apply Now'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="status status--info">
                              Your application is already submitted. View it in the "Submitted" or "Review" tab.
                            </div>
                          )}
                        </>
                      ) : activeTab === 'Submitted' ? (
                        <>
                          {application && application.status === 'SUBMITTED' ? (
                            <div className="application-view">
                              <div className="status status--success">
                                <strong>Application Submitted</strong>
                                <p>Submitted on: {application.submittedAt ? new Date(application.submittedAt).toLocaleString() : 'N/A'}</p>
                                <p>Trial Status: {application.trialStatus || 'PENDING'}</p>
                              </div>
                              <div className="profile-card">
                                <h3>Application Details</h3>
                                <div className="profile-card__grid">
                                  <div>
                                    <p className="profile-card__label">Full Name</p>
                                    <p className="profile-card__value">{application.fullName}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Date of Birth</p>
                                    <p className="profile-card__value">{new Date(application.dateOfBirth).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Gender</p>
                                    <p className="profile-card__value">{application.gender}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Position</p>
                                    <p className="profile-card__value">{application.primaryPosition || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Dominant Foot</p>
                                    <p className="profile-card__value">{application.dominantFoot || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Height</p>
                                    <p className="profile-card__value">{application.height ? `${application.height} cm` : 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Weight</p>
                                    <p className="profile-card__value">{application.weight ? `${application.weight} kg` : 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Location</p>
                                    <p className="profile-card__value">{application.city && application.state ? `${application.city}, ${application.state}` : 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Emergency Contact</p>
                                    <p className="profile-card__value">{application.emergencyContactName} ({application.emergencyContactPhone})</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="empty-state">
                              <p className="empty-state__title">No submitted application</p>
                              <p className="muted">Create and submit an application in the Draft tab.</p>
                            </div>
                          )}
                        </>
                      ) : activeTab === 'Review' ? (
                        <>
                          {application ? (
                            <div className="application-view">
                              <div className={`status ${application.status === 'APPROVED' ? 'status--success' : application.status === 'REJECTED' ? 'status--error' : 'status--info'}`}>
                                <strong>Status: {application.status}</strong>
                                {application.reviewedAt && (
                                  <p>Reviewed on: {new Date(application.reviewedAt).toLocaleString()}</p>
                                )}
                                {application.rejectionReason && (
                                  <p><strong>Rejection Reason:</strong> {application.rejectionReason}</p>
                                )}
                              </div>
                              {application.status === 'UNDER_REVIEW' && (
                                <div className="status status--info">
                                  Your application is currently under review by administrators.
                                </div>
                              )}
                              {application.status === 'APPROVED' && (
                                <div className="status status--success">
                                  <strong>Congratulations!</strong> Your application has been approved. You are now a registered player.
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="empty-state">
                              <p className="empty-state__title">No application found</p>
                              <p className="muted">Create an application in the Draft tab.</p>
                            </div>
                          )}
                        </>
                      ) : null}
                    </div>
                  ) : activeModuleId === 'assigned-trials' && me?.role === 'COACH' ? (
                    <div className="trials-module">
                      {isLoadingTrials ? (
                        <div className="status status--info">Loading trials...</div>
                      ) : selectedTrial ? (
                        <div>
                          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => setSelectedTrial(null)}
                            >
                              ← Back to Trials
                            </button>
                          </div>

                          {/* 1. Trial Summary (compact header) */}
                          <div className="coach-view-summary">
                            <span className={`coach-view-badge ${
                              selectedTrial.status === 'COMPLETED' ? 'coach-view-badge--completed' :
                              selectedTrial.outcome === 'NEEDS_RETEST' ? 'coach-view-badge--needs-retest' : 'coach-view-badge--pending'
                            }`}>
                              {selectedTrial.status}
                              {selectedTrial.outcome && selectedTrial.status === 'COMPLETED' ? ` · ${selectedTrial.outcome}` : ''}
                            </span>
                            <span className="muted" style={{ fontSize: '0.875rem' }}>
                              {selectedTrial.assignedCoach
                                ? `Assigned to ${selectedTrial.assignedCoach.displayName || selectedTrial.assignedCoach.coachId}${selectedTrial.assignedCoach.id === (me?.coach?.id || '') ? ' (You)' : ''}`
                                : selectedTrial.status === 'PENDING'
                                  ? 'Available — assign by evaluating'
                                  : ''}
                            </span>
                            {selectedTrial.scheduledDate && (
                              <span className="muted" style={{ fontSize: '0.875rem' }}>
                                Scheduled: {new Date(selectedTrial.scheduledDate).toLocaleDateString()}
                                {selectedTrial.scheduledTime ? ` at ${selectedTrial.scheduledTime}` : ''}
                                {selectedTrial.venue ? ` · ${selectedTrial.venue}` : ''}
                              </span>
                            )}
                            {selectedTrial.notes && (
                              <span className="muted" style={{ fontSize: '0.875rem', width: '100%', marginTop: '4px' }}>
                                Notes: {selectedTrial.notes}
                              </span>
                            )}
                          </div>

                          {selectedTrial.application && (
                            <>
                              {/* 2. Player Snapshot (top priority) */}
                              <div className="coach-view-section">
                                <h4 className="coach-view-section__title">Player Snapshot</h4>
                                <div className="coach-view-section__body">
                                  <div className="coach-view-snapshot">
                                    <div className="coach-view-snapshot__item">
                                      <span className="coach-view-snapshot__label">Full Name</span>
                                      <span className="coach-view-snapshot__value">{selectedTrial.application.fullName}</span>
                                    </div>
                                    <div className="coach-view-snapshot__item">
                                      <span className="coach-view-snapshot__label">Age</span>
                                      <span className="coach-view-snapshot__value">
                                        {(() => {
                                          const dob = new Date(selectedTrial.application.dateOfBirth)
                                          if (Number.isNaN(dob.getTime())) return '—'
                                          const today = new Date()
                                          let age = today.getFullYear() - dob.getFullYear()
                                          const m = today.getMonth() - dob.getMonth()
                                          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
                                          return age
                                        })()}
                                      </span>
                                    </div>
                                    <div className="coach-view-snapshot__item">
                                      <span className="coach-view-snapshot__label">Gender</span>
                                      <span className="coach-view-snapshot__value">{selectedTrial.application.gender}</span>
                                    </div>
                                    <div className="coach-view-snapshot__item">
                                      <span className="coach-view-snapshot__label">Nationality</span>
                                      <span className="coach-view-snapshot__value">{selectedTrial.application.nationality || '—'}</span>
                                    </div>
                                    <div className="coach-view-snapshot__item">
                                      <span className="coach-view-snapshot__label">Height</span>
                                      <span className="coach-view-snapshot__value">{selectedTrial.application.height ? `${selectedTrial.application.height} cm` : '—'}</span>
                                    </div>
                                    <div className="coach-view-snapshot__item">
                                      <span className="coach-view-snapshot__label">Weight</span>
                                      <span className="coach-view-snapshot__value">{selectedTrial.application.weight ? `${selectedTrial.application.weight} kg` : '—'}</span>
                                    </div>
                                    <div className="coach-view-snapshot__item">
                                      <span className="coach-view-snapshot__label">Dominant Foot</span>
                                      <span className="coach-view-snapshot__value">{selectedTrial.application.dominantFoot || '—'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 3. Playing Profile */}
                              <div className="coach-view-section">
                                <h4 className="coach-view-section__title">Playing Profile</h4>
                                <div className="coach-view-section__body">
                                  <div className="coach-view-snapshot">
                                    <div className="coach-view-snapshot__item">
                                      <span className="coach-view-snapshot__label">Sport</span>
                                      <span className="coach-view-snapshot__value">
                                        {(() => {
                                          const raw = (selectedTrial.application as any).sport
                                          const labels: Record<string, string> = { FOOTBALL: 'Football', CRICKET: 'Cricket', BASKETBALL: 'Basketball', OTHER: 'Other' }
                                          return labels[raw] || raw || 'Football'
                                        })()}
                                      </span>
                                    </div>
                                    <div className="coach-view-snapshot__item" style={{ gridColumn: '1 / -1' }}>
                                      <span className="coach-view-snapshot__label">Primary Position(s)</span>
                                      <span className="coach-view-snapshot__value">
                                        {(() => {
                                          const raw = selectedTrial.application.primaryPosition
                                          if (!raw) return '—'
                                          const labels: Record<string, string> = { GOALKEEPER: 'Goalkeeper', DEFENDER: 'Defender', MIDFIELDER: 'Midfielder', FORWARD: 'Forward' }
                                          try {
                                            const arr = typeof raw === 'string' && raw.startsWith('[') ? JSON.parse(raw) : [raw]
                                            const list = Array.isArray(arr) ? arr.map((x: string) => labels[x] || x).filter(Boolean) : [labels[raw] || raw]
                                            return list.length > 0 ? list.join(' · ') : '—'
                                          } catch {
                                            return labels[raw] || raw || '—'
                                          }
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 4. Location & Preferences */}
                              <div className="coach-view-section">
                                <h4 className="coach-view-section__title">Location & Preferences</h4>
                                <div className="coach-view-section__body">
                                  <div className="coach-view-snapshot">
                                    <div className="coach-view-snapshot__item">
                                      <span className="coach-view-snapshot__label">City, State</span>
                                      <span className="coach-view-snapshot__value">
                                        {[selectedTrial.application.city, selectedTrial.application.state].filter(Boolean).join(', ') || '—'}
                                      </span>
                                    </div>
                                    <div className="coach-view-snapshot__item">
                                      <span className="coach-view-snapshot__label">District / Pincode</span>
                                      <span className="coach-view-snapshot__value">
                                        {[selectedTrial.application.district, selectedTrial.application.pincode].filter(Boolean).join(' · ') || '—'}
                                      </span>
                                    </div>
                                    <div className="coach-view-snapshot__item" style={{ gridColumn: '1 / -1' }}>
                                      <span className="coach-view-snapshot__label">Preferred Team(s)</span>
                                      <span className="coach-view-snapshot__value">
                                        {(() => {
                                          const fromApi = (selectedTrial.application as any).preferredTeamNames
                                          if (Array.isArray(fromApi) && fromApi.length > 0) return fromApi.join(', ')
                                          const raw = selectedTrial.application.preferredTeamIds as string | null | undefined
                                          if (!raw) return '—'
                                          try {
                                            const ids = JSON.parse(raw) as string[]
                                            if (!Array.isArray(ids) || ids.length === 0) return '—'
                                            const resolved = ids.map((id) => {
                                              const team = teams.find((t) => t.id === id || t.teamId === id)
                                              return team?.name ?? null
                                            }).filter(Boolean)
                                            return resolved.length > 0 ? resolved.join(', ') : '—'
                                          } catch {
                                            return '—'
                                          }
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 5. Contact Information */}
                              <div className="coach-view-section">
                                <h4 className="coach-view-section__title">Contact Information</h4>
                                <div className="coach-view-section__body">
                                  <div className="coach-view-contact-group">
                                    <p className="coach-view-contact-group__title">Player contact</p>
                                    <div className="coach-view-snapshot">
                                      <div className="coach-view-snapshot__item">
                                        <span className="coach-view-snapshot__label">Mobile Number</span>
                                        <span className="coach-view-snapshot__value">{selectedTrial.application.playerPhone || selectedTrial.application.user?.phone || '—'}</span>
                                      </div>
                                      <div className="coach-view-snapshot__item">
                                        <span className="coach-view-snapshot__label">Email</span>
                                        <span className="coach-view-snapshot__value">{selectedTrial.application.user?.email || 'Not provided'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="coach-view-contact-group">
                                    <p className="coach-view-contact-group__title">Emergency contact</p>
                                    <div className="coach-view-snapshot">
                                      <div className="coach-view-snapshot__item">
                                        <span className="coach-view-snapshot__label">Contact Name</span>
                                        <span className="coach-view-snapshot__value">{selectedTrial.application.emergencyContactName || '—'}</span>
                                      </div>
                                      <div className="coach-view-snapshot__item">
                                        <span className="coach-view-snapshot__label">Phone</span>
                                        <span className="coach-view-snapshot__value">{selectedTrial.application.emergencyContactPhone || '—'}</span>
                                      </div>
                                      <div className="coach-view-snapshot__item">
                                        <span className="coach-view-snapshot__label">Relationship</span>
                                        <span className="coach-view-snapshot__value">{selectedTrial.application.emergencyContactRelation || '—'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 6. Documents (action-oriented) */}
                              <div className="coach-view-section">
                                <h4 className="coach-view-section__title">Documents</h4>
                                <div className="coach-view-section__body">
                                  {Array.isArray((selectedTrial.application as any).documents) && (selectedTrial.application as any).documents.length > 0 ? (
                                    (selectedTrial.application as any).documents.map((doc: any) => (
                                      <div key={doc.id} className="coach-view-doc-row">
                                        <div>
                                          <span className="coach-view-snapshot__value" style={{ display: 'block', marginBottom: '2px' }}>
                                            {({ ID_PROOF: 'ID Proof', DOB_PROOF: 'DOB Proof', PHOTO: 'Photo' })[doc.documentType] || doc.documentType}
                                            {doc.notes ? ` — ${doc.notes}` : ''}
                                          </span>
                                          <span className="muted" style={{ fontSize: '0.75rem' }}>
                                            {doc.fileName} · {(doc.fileSize / 1024).toFixed(1)} KB · {doc.verificationStatus}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          className="button button--primary"
                                          style={{ flexShrink: 0, padding: '6px 14px', fontSize: '0.875rem' }}
                                          onClick={() => {
                                            const base = doc.fileUrl?.startsWith('http') ? '' : API_BASE_URL
                                            const path = (doc.fileUrl || '').startsWith('/') ? doc.fileUrl : `/${doc.fileUrl || ''}`
                                            window.open(doc.fileUrl?.startsWith('http') ? doc.fileUrl : `${base}${path}`, '_blank', 'noopener,noreferrer')
                                          }}
                                        >
                                          View Document
                                        </button>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="muted" style={{ margin: 0 }}>No documents submitted for this application.</p>
                                  )}
                                </div>
                              </div>
                            </>
                          )}

                          {selectedTrial.status === 'PENDING' && (
                            <div className="profile-card" style={{ marginTop: '20px' }}>
                              <h3 style={{ marginBottom: '16px' }}>Evaluate Trial</h3>
                              <form className="form" onSubmit={async (e) => {
                                e.preventDefault()
                                const formData = new FormData(e.currentTarget)
                                const outcome = formData.get('outcome') as string
                                const notes = formData.get('notes') as string
                                
                                if (!outcome) {
                                  setError('Please select an outcome')
                                  return
                                }
                                
                                setIsLoadingTrials(true)
                                setError(null)
                                try {
                                  const res = await fetch(`${API_BASE_URL}/api/trial/${selectedTrial.id}/evaluate`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ outcome, notes }),
                                  })
                                  const data = await res.json()
                                  if (!res.ok || !data?.success) {
                                    setError(data?.message || 'Failed to evaluate trial')
                                    return
                                  }
                                  setSuccessMessage('Trial evaluated successfully!')
                                  setTimeout(() => {
                                    setSuccessMessage(null)
                                  }, 3000)
                                  void loadTrials()
                                  setSelectedTrial(null)
                                } catch (err) {
                                  setError('Cannot reach backend. Make sure the server is running.')
                                } finally {
                                  setIsLoadingTrials(false)
                                }
                              }}>
                                <label className="field">
                                  Outcome *
                                  <select className="input" name="outcome" required>
                                    <option value="">Select outcome</option>
                                    <option value="RECOMMENDED">Recommended</option>
                                    <option value="NOT_RECOMMENDED">Not Recommended</option>
                                    <option value="NEEDS_RETEST">Needs Retest</option>
                                  </select>
                                </label>
                                <label className="field">
                                  Notes
                                  <textarea
                                    className="input"
                                    name="notes"
                                    rows={4}
                                    placeholder="Add evaluation notes..."
                                  />
                                </label>
                                <div className="actions">
                                  <button className="button button--primary" type="submit" disabled={isLoadingTrials}>
                                    {isLoadingTrials ? 'Submitting...' : 'Submit Evaluation'}
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {activeTab === 'Pending' && (
                            <div>
                              <h4 style={{ marginBottom: '16px' }}>Pending Trials</h4>
                              {trials.filter(t => t.status === 'PENDING').length > 0 ? (
                                <table className="trials-table">
                                  <thead>
                                    <tr>
                                      <th>Player Name</th>
                                      <th>Application Date</th>
                                      <th>Status</th>
                                      <th>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {trials.filter(t => t.status === 'PENDING').map((trial) => (
                                      <tr key={trial.id}>
                                        <td style={{ fontWeight: '600' }}>{trial.application?.fullName || 'N/A'}</td>
                                        <td>{trial.application?.submittedAt ? new Date(trial.application.submittedAt).toLocaleDateString() : 'N/A'}</td>
                                        <td>
                                          <span style={{ color: '#f59e0b', fontWeight: '600' }}>{trial.status}</span>
                                          {trial.assignedCoach && (
                                            <span className="muted" style={{ display: 'block', fontSize: '0.8rem', marginTop: '2px' }}>
                                              {trial.assignedCoach.id === (me?.coach?.id || '') ? ' (You)' : ` (${trial.assignedCoach.displayName || trial.assignedCoach.coachId})`}
                                            </span>
                                          )}
                                        </td>
                                        <td className="trials-table__action">
                                          <button
                                            type="button"
                                            className="button button--primary"
                                            style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                                            onClick={() => setSelectedTrial(trial)}
                                          >
                                            Open application
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No pending trials</p>
                                  <p className="muted">When a user submits an application, the trial will automatically appear here for all active coaches to evaluate.</p>
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'Completed' && (
                            <div>
                              <h4 style={{ marginBottom: '16px' }}>Completed Trials</h4>
                              {trials.filter(t => t.status === 'COMPLETED').length > 0 ? (
                                <table className="trials-table">
                                  <thead>
                                    <tr>
                                      <th>Player Name</th>
                                      <th>Application Date</th>
                                      <th>Status</th>
                                      <th>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {trials.filter(t => t.status === 'COMPLETED').map((trial) => (
                                      <tr key={trial.id}>
                                        <td style={{ fontWeight: '600' }}>{trial.application?.fullName || 'N/A'}</td>
                                        <td>{trial.application?.submittedAt ? new Date(trial.application.submittedAt).toLocaleDateString() : 'N/A'}</td>
                                        <td>
                                          <span style={{ color: '#10b981', fontWeight: '600' }}>{trial.outcome || trial.status}</span>
                                          {trial.evaluatedAt && (
                                            <span className="muted" style={{ display: 'block', fontSize: '0.8rem', marginTop: '2px' }}>
                                              Evaluated {new Date(trial.evaluatedAt).toLocaleDateString()}
                                            </span>
                                          )}
                                        </td>
                                        <td className="trials-table__action">
                                          <button
                                            type="button"
                                            className="button button--primary"
                                            style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                                            onClick={() => setSelectedTrial(trial)}
                                          >
                                            Open application
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No completed trials</p>
                                  <p className="muted">Completed trial evaluations will appear here.</p>
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'Needs Retest' && (
                            <div>
                              <h4 style={{ marginBottom: '16px' }}>Trials Needing Retest</h4>
                              {trials.filter(t => t.outcome === 'NEEDS_RETEST').length > 0 ? (
                                <table className="trials-table">
                                  <thead>
                                    <tr>
                                      <th>Player Name</th>
                                      <th>Application Date</th>
                                      <th>Status</th>
                                      <th>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {trials.filter(t => t.outcome === 'NEEDS_RETEST').map((trial) => (
                                      <tr key={trial.id}>
                                        <td style={{ fontWeight: '600' }}>{trial.application?.fullName || 'N/A'}</td>
                                        <td>{trial.application?.submittedAt ? new Date(trial.application.submittedAt).toLocaleDateString() : 'N/A'}</td>
                                        <td>
                                          <span style={{ color: '#f59e0b', fontWeight: '600' }}>{trial.outcome}</span>
                                          {trial.evaluatedAt && (
                                            <span className="muted" style={{ display: 'block', fontSize: '0.8rem', marginTop: '2px' }}>
                                              Evaluated {new Date(trial.evaluatedAt).toLocaleDateString()}
                                            </span>
                                          )}
                                        </td>
                                        <td className="trials-table__action">
                                          <button
                                            type="button"
                                            className="button button--primary"
                                            style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                                            onClick={() => setSelectedTrial(trial)}
                                          >
                                            Open application
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No retests needed</p>
                                  <p className="muted">Trials marked as needing retest will appear here.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : activeModuleId === 'my-players' && me?.role === 'COACH' ? (
                    <div className="trials-module">
                      {isLoadingPlayers ? (
                        <div className="status status--info">Loading players...</div>
                      ) : (
                        <>
                          {activeTab === 'All Players' && (
                            <div>
                              <h4 style={{ marginBottom: '16px' }}>My Players</h4>
                              <p className="muted" style={{ marginBottom: '20px' }}>
                                Players assigned to your team(s). Use search to find a player by ID, name, phone, email, or team.
                              </p>
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                                <div style={{ flex: '1 1 280px' }}>
                                  <input
                                    className="input"
                                    placeholder="Search players..."
                                    value={myPlayersSearch}
                                    onChange={(e) => setMyPlayersSearch(e.target.value)}
                                  />
                                </div>
                                <button
                                  className="button button--ghost"
                                  type="button"
                                  onClick={() => setMyPlayersSearch('')}
                                  disabled={!myPlayersSearch}
                                >
                                  Clear
                                </button>
                                <button
                                  className="button button--ghost"
                                  type="button"
                                  onClick={() => void loadMyPlayers()}
                                  disabled={isLoadingPlayers}
                                >
                                  Refresh
                                </button>
                              </div>

                              {Array.isArray(myTeamsForPlayers) && myTeamsForPlayers.length > 0 && (
                                <div className="muted" style={{ marginBottom: '12px' }}>
                                  Your teams: {myTeamsForPlayers.map((t: any) => t.name || t.teamId).join(', ')}
                                </div>
                              )}
                              {selectedMyPlayer ? (
                                <div>
                                  <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <button
                                      className="button button--ghost"
                                      type="button"
                                      onClick={() => setSelectedMyPlayer(null)}
                                      disabled={isLoadingMyPlayerProfile}
                                    >
                                      ← Back to My Players
                                    </button>
                                  </div>
                                  {isLoadingMyPlayerProfile ? (
                                    <div className="status status--info">Loading player profile...</div>
                                  ) : (
                                    <div className="profile-card">
                                      <div className="profile-card__grid">
                                        <div>
                                          <p className="profile-card__label">Player ID</p>
                                          <p className="profile-card__value">{selectedMyPlayer.player?.playerId || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Player Name</p>
                                          <p className="profile-card__value" style={{ fontWeight: 'bold' }}>
                                            {selectedMyPlayer.application?.fullName || 'N/A'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Display Name</p>
                                          <p className="profile-card__value">{selectedMyPlayer.player?.displayName || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Phone</p>
                                          <p className="profile-card__value">{selectedMyPlayer.player?.user?.phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Email</p>
                                          <p className="profile-card__value">{selectedMyPlayer.player?.user?.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Football Status</p>
                                          <p className="profile-card__value">
                                            {selectedMyPlayer.player?.footballStatus || 'N/A'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Team(s)</p>
                                          <p className="profile-card__value">
                                            {Array.isArray(selectedMyPlayer.player?.teams) && selectedMyPlayer.player.teams.length > 0
                                              ? selectedMyPlayer.player.teams.map((t: any) => t.name || t.teamId).join(', ')
                                              : 'N/A'}
                                          </p>
                                        </div>
                                      </div>

                                      <div style={{ marginTop: '16px' }}>
                                        <h4 style={{ marginBottom: '8px' }}>Documents</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          {Array.isArray(selectedMyPlayer.documents) && selectedMyPlayer.documents.length > 0 ? (
                                            selectedMyPlayer.documents.map((d: any) => (
                                              <div
                                                key={d.id || `${d.documentType}-${String(d.createdAt || '')}`}
                                                className="profile-card profile-card--compact"
                                                style={{ marginBottom: 0 }}
                                              >
                                                <div>
                                                  <p className="profile-card__label">Type</p>
                                                  <p className="profile-card__value">{d.documentType}</p>
                                                </div>
                                                <div>
                                                  <p className="profile-card__label">Owner</p>
                                                  <p className="profile-card__value">{d.ownerType}</p>
                                                </div>
                                                <div>
                                                  <p className="profile-card__label">Status</p>
                                                  <p className="profile-card__value">{d.verificationStatus}</p>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                  <button
                                                    className="button button--ghost"
                                                    type="button"
                                                    onClick={() => {
                                                      if (!d.id) return
                                                      openDocumentPreview(d.id).catch((e: any) =>
                                                        setError(e?.message || 'Failed to open document'),
                                                      )
                                                    }}
                                                    disabled={!d.id}
                                                  >
                                                    View
                                                  </button>
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="muted">No documents found for this player.</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : myPlayers.length > 0 ? (
                                <div className="trials-list">
                                  {myPlayers.map((player) => (
                                    <div key={player.id} className="profile-card" style={{ marginBottom: '12px' }}>
                                      <div className="profile-card__grid">
                                        <div>
                                          <p className="profile-card__label">Player ID</p>
                                          <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{player.playerId || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Player Name</p>
                                          <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{player.application?.fullName || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Position</p>
                                          <p className="profile-card__value">{player.primaryPosition || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Display Name</p>
                                          <p className="profile-card__value">{player.displayName || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Football Status</p>
                                          <p className="profile-card__value" style={{ 
                                            color: player.footballStatus === 'ACTIVE' ? '#10b981' : '#f59e0b',
                                            fontWeight: 'bold'
                                          }}>
                                            {player.footballStatus || 'N/A'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Phone</p>
                                          <p className="profile-card__value">{player.user?.phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Team(s)</p>
                                          <p className="profile-card__value">
                                            {Array.isArray(player.matchedTeams) && player.matchedTeams.length > 0
                                              ? player.matchedTeams.map((t: any) => t.name || t.teamId).join(', ')
                                              : 'N/A'}
                                          </p>
                                        </div>
                                      </div>
                                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                          className="button button--primary"
                                          type="button"
                                          onClick={() => void loadMyPlayerProfile(player.id)}
                                          disabled={isLoadingMyPlayerProfile}
                                        >
                                          View Player Profile
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No players yet</p>
                                  <p className="muted">Players assigned to your teams will appear here.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : activeModuleId === 'my-teams' && me?.role === 'COACH' ? (
                    <div className="trials-module">
                      {isLoadingMyTeams ? (
                        <div className="status status--info">Loading teams...</div>
                      ) : (
                        <>
                          {activeTab === 'My Teams' && (
                            <div>
                              <h4 style={{ marginBottom: '16px' }}>My Teams</h4>
                              <p className="muted" style={{ marginBottom: '20px' }}>
                                Create and manage teams that you coach. These teams will appear in the Preferred Team(s) list for players once active.
                              </p>

                              <form
                                className="inline-form"
                                style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}
                                onSubmit={async (event) => {
                                  event.preventDefault()
                                  if (!token) return
                                  const formData = new FormData(event.currentTarget)
                                  const name = (formData.get('name') as string || '').trim()
                                  const location = (formData.get('location') as string || '').trim()
                                  if (!name) {
                                    setError('Team name is required')
                                    return
                                  }
                                  setError(null)
                                  setIsLoadingMyTeams(true)
                                  try {
                                    const res = await fetch(`${API_BASE_URL}/api/teams/coach/my-teams`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: JSON.stringify({ name, location: location || undefined }),
                                    })
                                    const data = await res.json()
                                    if (!res.ok || !data?.success) {
                                      setError(data?.message || 'Failed to create team')
                                      return
                                    }
                                    ;(event.target as HTMLFormElement).reset()
                                    await loadMyTeams()
                                    setSuccessMessage('Team created successfully')
                                    setTimeout(() => setSuccessMessage(null), 3000)
                                  } catch (err) {
                                    setError('Cannot reach backend. Make sure the server is running.')
                                  } finally {
                                    setIsLoadingMyTeams(false)
                                  }
                                }}
                              >
                                <input
                                  className="input"
                                  name="name"
                                  placeholder="Team name *"
                                  aria-label="Team name"
                                  required
                                />
                                <input
                                  className="input"
                                  name="location"
                                  placeholder="Location (optional)"
                                  aria-label="Team location"
                                />
                                <button className="button button--primary" type="submit">
                                  + Add Team
                                </button>
                              </form>

                              {myTeams.length > 0 ? (
                                <div className="trials-list">
                                  {myTeams.map((team) => (
                                    <div key={team.id} className="profile-card" style={{ marginBottom: '12px' }}>
                                      <div className="profile-card__grid">
                                        <div>
                                          <p className="profile-card__label">Team Name</p>
                                          <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{team.name}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Team ID</p>
                                          <p className="profile-card__value">{team.teamId}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Location</p>
                                          <p className="profile-card__value">{team.location || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Status</p>
                                          <p className="profile-card__value" style={{
                                            color: team.status === 'ACTIVE' ? '#10b981' : '#f59e0b',
                                            fontWeight: 'bold',
                                          }}>
                                            {team.status}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Role</p>
                                          <p className="profile-card__value">{team.coachRole || 'HEAD'}</p>
                                        </div>
                                      </div>
                                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                        <button
                                          className="button button--ghost"
                                          type="button"
                                          onClick={async () => {
                                            if (!token) return
                                            const newName = prompt('Update team name:', team.name || '')
                                            if (!newName) return
                                            const newLocation = prompt('Update location (leave blank for none):', team.location || '')
                                            setError(null)
                                            setIsLoadingMyTeams(true)
                                            try {
                                              const res = await fetch(`${API_BASE_URL}/api/teams/coach/my-teams/${team.teamId}`, {
                                                method: 'PUT',
                                                headers: {
                                                  'Content-Type': 'application/json',
                                                  Authorization: `Bearer ${token}`,
                                                },
                                                body: JSON.stringify({
                                                  name: newName,
                                                  location: newLocation ?? '',
                                                }),
                                              })
                                              const data = await res.json()
                                              if (!res.ok || !data?.success) {
                                                setError(data?.message || 'Failed to update team')
                                                return
                                              }
                                              await loadMyTeams()
                                              setSuccessMessage('Team updated successfully')
                                              setTimeout(() => setSuccessMessage(null), 3000)
                                            } catch (err) {
                                              setError('Cannot reach backend. Make sure the server is running.')
                                            } finally {
                                              setIsLoadingMyTeams(false)
                                            }
                                          }}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          className="button button--danger"
                                          type="button"
                                          onClick={async () => {
                                            if (!token) return
                                            if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return
                                            setError(null)
                                            setIsLoadingMyTeams(true)
                                            try {
                                              const res = await fetch(`${API_BASE_URL}/api/teams/coach/my-teams/${team.teamId}`, {
                                                method: 'DELETE',
                                                headers: { Authorization: `Bearer ${token}` },
                                              })
                                              const data = await res.json()
                                              if (!res.ok || !data?.success) {
                                                setError(data?.message || 'Failed to delete team')
                                                return
                                              }
                                              await loadMyTeams()
                                              setSuccessMessage('Team deleted successfully')
                                              setTimeout(() => setSuccessMessage(null), 3000)
                                            } catch (err) {
                                              setError('Cannot reach backend. Make sure the server is running.')
                                            } finally {
                                              setIsLoadingMyTeams(false)
                                            }
                                          }}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No teams yet</p>
                                  <p className="muted">Create your first team using the form above.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : activeModuleId === 'profile' && me?.role === 'COACH' ? (
                    <div className="profile-module">
                      {activeTab === 'About' ? (
                        <div>
                          <h3 style={{ marginBottom: '16px' }}>About</h3>
                          <div className="profile-card">
                            <div className="profile-card__grid">
                              <div>
                                <p className="profile-card__label">Coach ID</p>
                                <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{me.coach?.coachId || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="profile-card__label">Phone</p>
                                <p className="profile-card__value">{me.phone}</p>
                              </div>
                              <div>
                                <p className="profile-card__label">Email</p>
                                <p className="profile-card__value">{me.email || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="profile-card__label">Status</p>
                                <p className="profile-card__value" style={{ 
                                  color: me.status === 'ACTIVE' ? '#10b981' : me.status === 'VERIFIED' ? '#3b82f6' : '#f59e0b',
                                  fontWeight: 'bold'
                                }}>
                                  {me.status}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : activeTab === 'Credentials' ? (
                        <div>
                          <h3 style={{ marginBottom: '16px' }}>MPIN Management</h3>
                          {!me.mpinHash ? (
                            <div>
                              <div className="status status--info" style={{ marginBottom: '20px' }}>
                                <strong>Set Your MPIN</strong>
                                <p>You need to set a 4-6 digit MPIN to secure your account.</p>
                              </div>
                              <form className="form" onSubmit={async (e) => {
                                e.preventDefault()
                                if (!mpinForm.newMpin || !mpinForm.confirmMpin) {
                                  setError('Please fill all fields')
                                  return
                                }
                                if (mpinForm.newMpin !== mpinForm.confirmMpin) {
                                  setError('New MPIN and confirm MPIN do not match')
                                  return
                                }
                                if (!/^\d{4,6}$/.test(mpinForm.newMpin)) {
                                  setError('MPIN must be 4-6 digits')
                                  return
                                }
                                setIsUpdatingMpin(true)
                                setError(null)
                                try {
                                  const res = await fetch(`${API_BASE_URL}/api/auth/setup-mpin-authenticated`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ mpin: mpinForm.newMpin }),
                                  })
                                  const data = await res.json()
                                  if (!res.ok || !data?.success) {
                                    setError(data?.message || 'Failed to set MPIN')
                                    return
                                  }
                                  setSuccessMessage('MPIN set successfully! Your status is now VERIFIED.')
                                  // If this was set via invite link, hide coach login
                                  if (inviteToken) {
                                    setInviteToken(null)
                                  }
                                  setMpinForm({ currentMpin: '', newMpin: '', confirmMpin: '' })
                                  setTimeout(() => {
                                    void loadMe()
                                  }, 500)
                                } catch (err) {
                                  setError('Cannot reach backend. Make sure the server is running.')
                                } finally {
                                  setIsUpdatingMpin(false)
                                }
                              }}>
                                <label className="field">
                                  New MPIN *
                                  <input
                                    className="input"
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={mpinForm.newMpin}
                                    onChange={(e) => setMpinForm({ ...mpinForm, newMpin: e.target.value })}
                                    placeholder="1234"
                                    required
                                    maxLength={6}
                                  />
                                </label>
                                <label className="field">
                                  Confirm MPIN *
                                  <input
                                    className="input"
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={mpinForm.confirmMpin}
                                    onChange={(e) => setMpinForm({ ...mpinForm, confirmMpin: e.target.value })}
                                    placeholder="1234"
                                    required
                                    maxLength={6}
                                  />
                                </label>
                                <p className="form__hint">MPIN must be 4-6 digits.</p>
                                <div className="actions">
                                  <button className="button button--primary" type="submit" disabled={isUpdatingMpin}>
                                    {isUpdatingMpin ? 'Setting MPIN...' : 'Set MPIN'}
                                  </button>
                                </div>
                              </form>
                            </div>
                          ) : (
                            <div>
                              <div className="status status--success" style={{ marginBottom: '20px' }}>
                                <strong>MPIN is Set</strong>
                                <p>You can update your MPIN below.</p>
                              </div>
                              <form className="form" onSubmit={async (e) => {
                                e.preventDefault()
                                if (!mpinForm.currentMpin || !mpinForm.newMpin || !mpinForm.confirmMpin) {
                                  setError('Please fill all fields')
                                  return
                                }
                                if (mpinForm.newMpin !== mpinForm.confirmMpin) {
                                  setError('New MPIN and confirm MPIN do not match')
                                  return
                                }
                                if (!/^\d{4,6}$/.test(mpinForm.newMpin)) {
                                  setError('MPIN must be 4-6 digits')
                                  return
                                }
                                if (mpinForm.currentMpin === mpinForm.newMpin) {
                                  setError('New MPIN must be different from current MPIN')
                                  return
                                }
                                setIsUpdatingMpin(true)
                                setError(null)
                                try {
                                  const res = await fetch(`${API_BASE_URL}/api/auth/update-mpin`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                      currentMpin: mpinForm.currentMpin,
                                      newMpin: mpinForm.newMpin,
                                    }),
                                  })
                                  const data = await res.json()
                                  if (!res.ok || !data?.success) {
                                    setError(data?.message || 'Failed to update MPIN')
                                    return
                                  }
                                  setSuccessMessage('MPIN updated successfully!')
                                  setMpinForm({ currentMpin: '', newMpin: '', confirmMpin: '' })
                                  // If this was set via invite link, hide coach login
                                  if (inviteToken) {
                                    setInviteToken(null)
                                  }
                                  void loadMe()
                                } catch (err) {
                                  setError('Cannot reach backend. Make sure the server is running.')
                                } finally {
                                  setIsUpdatingMpin(false)
                                }
                              }}>
                                <label className="field">
                                  Current MPIN *
                                  <input
                                    className="input"
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={mpinForm.currentMpin}
                                    onChange={(e) => setMpinForm({ ...mpinForm, currentMpin: e.target.value })}
                                    placeholder="Enter current MPIN"
                                    required
                                    maxLength={6}
                                  />
                                </label>
                                <label className="field">
                                  New MPIN *
                                  <input
                                    className="input"
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={mpinForm.newMpin}
                                    onChange={(e) => setMpinForm({ ...mpinForm, newMpin: e.target.value })}
                                    placeholder="Enter new MPIN"
                                    required
                                    maxLength={6}
                                  />
                                </label>
                                <label className="field">
                                  Confirm New MPIN *
                                  <input
                                    className="input"
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={mpinForm.confirmMpin}
                                    onChange={(e) => setMpinForm({ ...mpinForm, confirmMpin: e.target.value })}
                                    placeholder="Confirm new MPIN"
                                    required
                                    maxLength={6}
                                  />
                                </label>
                                <p className="form__hint">MPIN must be 4-6 digits. New MPIN must be different from current MPIN.</p>
                                <div className="actions">
                                  <button className="button button--primary" type="submit" disabled={isUpdatingMpin}>
                                    {isUpdatingMpin ? 'Updating...' : 'Update MPIN'}
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : activeModuleId === 'profile' && me?.role === 'PLAYER' ? (
                    <div className="profile-module">
                      {activeTab === 'Personal' ? (
                        <div>
                          <h3 style={{ marginBottom: '16px' }}>Personal Profile</h3>
                          <div className="profile-card">
                            <div className="profile-card__grid">
                              {me.player && (
                                <>
                                  <div>
                                    <p className="profile-card__label">Player ID</p>
                                    <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{me.player.playerId || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Display Name</p>
                                    <p className="profile-card__value">{me.player.displayName || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Football Status</p>
                                    <p className="profile-card__value" style={{ 
                                      color: me.player.footballStatus === 'ACTIVE' ? '#10b981' : '#f59e0b',
                                      fontWeight: 'bold'
                                    }}>
                                      {me.player.footballStatus || 'N/A'}
                                    </p>
                                  </div>
                                </>
                              )}
                              <div>
                                <p className="profile-card__label">Phone</p>
                                <p className="profile-card__value">{me.phone}</p>
                              </div>
                              <div>
                                <p className="profile-card__label">Email</p>
                                <p className="profile-card__value">{me.email || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="profile-card__label">Status</p>
                                <p className="profile-card__value" style={{ 
                                  color: me.status === 'ACTIVE' ? '#10b981' : '#f59e0b',
                                  fontWeight: 'bold'
                                }}>
                                  {me.status}
                                </p>
                              </div>
                            </div>
                          </div>

                          {me.application && (
                            <div className="profile-card" style={{ marginTop: '20px' }}>
                              <h3 style={{ marginBottom: '16px' }}>Accepted Application</h3>
                              <div className="profile-card__grid">
                                <div>
                                  <p className="profile-card__label">Full Name</p>
                                  <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{me.application.fullName || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="profile-card__label">Application Status</p>
                                  <p className="profile-card__value" style={{ 
                                    color: me.application.status === 'APPROVED' ? '#10b981' : '#f59e0b',
                                    fontWeight: 'bold'
                                  }}>
                                    {me.application.status || 'N/A'}
                                  </p>
                                </div>
                                {me.application.submittedAt && (
                                  <div>
                                    <p className="profile-card__label">Submitted</p>
                                    <p className="profile-card__value">{new Date(me.application.submittedAt).toLocaleDateString()}</p>
                                  </div>
                                )}
                                {me.application.reviewedAt && (
                                  <div>
                                    <p className="profile-card__label">Approved</p>
                                    <p className="profile-card__value">{new Date(me.application.reviewedAt).toLocaleDateString()}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {me.application?.trial?.assignedCoach && (
                            <div className="profile-card" style={{ marginTop: '20px' }}>
                              <h3 style={{ marginBottom: '16px' }}>Assigned Coach</h3>
                              <div className="profile-card__grid">
                                <div>
                                  <p className="profile-card__label">Coach ID</p>
                                  <p className="profile-card__value" style={{ fontWeight: 'bold' }}>{me.application.trial.assignedCoach.coachId || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="profile-card__label">Coach Name</p>
                                  <p className="profile-card__value">{me.application.trial.assignedCoach.displayName || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="profile-card__label">Coach Status</p>
                                  <p className="profile-card__value" style={{ 
                                    color: me.application.trial.assignedCoach.status === 'ACTIVE' ? '#10b981' : '#f59e0b',
                                    fontWeight: 'bold'
                                  }}>
                                    {me.application.trial.assignedCoach.status || 'N/A'}
                                  </p>
                                </div>
                                {me.application.trial.outcome && (
                                  <div>
                                    <p className="profile-card__label">Trial Outcome</p>
                                    <p className="profile-card__value" style={{ 
                                      color: me.application.trial.outcome === 'RECOMMENDED' ? '#10b981' : '#ef4444',
                                      fontWeight: 'bold'
                                    }}>
                                      {me.application.trial.outcome}
                                    </p>
                                  </div>
                                )}
                                {me.application.trial.evaluatedAt && (
                                  <div>
                                    <p className="profile-card__label">Evaluated</p>
                                    <p className="profile-card__value">{new Date(me.application.trial.evaluatedAt).toLocaleDateString()}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : activeTab === 'Medical' ? (
                        <div>
                          <h3 style={{ marginBottom: '16px' }}>Medical Information</h3>
                          <div className="empty-state">
                            <p className="empty-state__title">Medical information</p>
                            <p className="muted">Medical information will be displayed here when available.</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p className="empty-state__title">No data loaded</p>
                      <p className="muted">Connect this module to backend endpoints to show real data.</p>
                    </div>
                  )}
                </section>
              </div>

              <div className="mobile-tabs">
                {availableModules.slice(0, 4).map((module) => (
                  <button
                    key={module.id}
                    className={`mobile-tabs__item ${activeModuleId === module.id ? 'mobile-tabs__item--active' : ''}`}
                    type="button"
                    onClick={() => {
                      setActiveModuleId(module.id)
                      setActiveTab(module.tabs[0] || '')
                    }}
                  >
                    {module.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="toggle">
                <button
                  className={`toggle__button ${mode === 'login' ? 'toggle__button--active' : ''}`}
                  type="button"
                  onClick={() => switchMode('login')}
                >
                  Login
                </button>
                <button
                  className={`toggle__button ${mode === 'signup' ? 'toggle__button--active' : ''}`}
                  type="button"
                  onClick={() => switchMode('signup')}
                >
                  Sign up
                </button>
              </div>
              <form className="form" onSubmit={handleSubmit}>
                {mode === 'login' ? (
                  <>
                    <label className="field">
                      Phone
                      <input
                        className="input"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter 10-digit phone number"
                        autoComplete="tel"
                      />
                    </label>
                    <label className="field">
                      MPIN
                      <input
                        className="input"
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={mpin}
                        onChange={(e) => setMpin(e.target.value)}
                        placeholder="Enter your MPIN"
                        autoComplete="current-password"
                      />
                    </label>
                    <p className="form__hint">MPIN is 4-6 digits and case sensitive.</p>
                    <div className="actions">
                      <button className="button" type="submit">
                        Login
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="field">
                      Phone
                      <input
                        className="input"
                        type="tel"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="Enter 10-digit phone number"
                        autoComplete="tel"
                        disabled={signupStep !== 'phone'}
                      />
                    </label>
                    {signupStep === 'otp' && (
                      <>
                        <label className="field">
                          OTP Code
                          <input
                            className="input"
                            type="text"
                            value={signupOtp}
                            onChange={(e) => setSignupOtp(e.target.value)}
                            placeholder="Enter OTP code"
                            inputMode="numeric"
                          />
                        </label>
                        <div className="actions">
                          <button className="button" type="submit">
                            Verify OTP
                          </button>
                          <button className="button button--link" type="button" onClick={resendSignupOtp}>
                            Resend OTP
                          </button>
                        </div>
                      </>
                    )}
                    {signupStep === 'mpin' && (
                      <>
                        <label className="field">
                          MPIN
                          <input
                            className="input"
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={signupMpin}
                            onChange={(e) => setSignupMpin(e.target.value)}
                            placeholder="Enter your MPIN"
                            autoComplete="new-password"
                          />
                        </label>
                        <p className="form__hint">MPIN must be 4-6 digits.</p>
                        <div className="actions">
                          <button className="button" type="submit">
                            Set MPIN
                          </button>
                        </div>
                      </>
                    )}
                    {signupStep === 'phone' && (
                      <div className="actions">
                        <button className="button" type="submit">
                          Send OTP
                        </button>
                      </div>
                    )}
                    {signupStep === 'done' && (
                      <div className="actions">
                        <button className="button" type="button" onClick={() => switchMode('login')}>
                          Go to Login
                        </button>
                      </div>
                    )}
                  </>
                )}
              </form>
              {mode === 'signup' && signupMessage && (
                <div className="status status--info">{signupMessage}</div>
              )}
            </>
          )}
          {error && (
            <div className="status status--error">
              <strong>Error:</strong> {error}
            </div>
          )}
          {successMessage && (
            <div className="status status--success">
              {successMessage}
            </div>
          )}
        </section>
      </main>

      {/* Application Form Modal */}
      {showApplicationModal && (
        <div className="modal-overlay" onClick={() => setShowApplicationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Player Application Form</h3>
              <button 
                className="modal-close" 
                type="button"
                onClick={() => setShowApplicationModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form className="form" onSubmit={(e) => {
                e.preventDefault()
                saveApplication(e).then(() => {
                  setShowApplicationModal(false)
                })
              }}>
                <p className="muted" style={{ marginBottom: '20px' }}>Fill in your details to apply as a player. Required fields are marked with *</p>
                
                <div className="form__section">
                  <h4>Basic Identity</h4>
                  <label className="field">
                    Full Name *
                    <input
                      className="input"
                      type="text"
                      value={applicationForm.fullName}
                      onChange={(e) => setApplicationForm({ ...applicationForm, fullName: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </label>
                  <label className="field">
                    Date of Birth *
                    <input
                      className="input"
                      type="date"
                      value={applicationForm.dateOfBirth}
                      onChange={(e) => setApplicationForm({ ...applicationForm, dateOfBirth: e.target.value })}
                      required
                    />
                  </label>
                  <label className="field">
                    Gender *
                    <select
                      className="input"
                      value={applicationForm.gender}
                      onChange={(e) => setApplicationForm({ ...applicationForm, gender: e.target.value })}
                      required
                    >
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>
                  <label className="field">
                    Nationality *
                    <select
                      className="input"
                      value={applicationForm.nationality}
                      onChange={(e) => setApplicationForm({ ...applicationForm, nationality: e.target.value })}
                      required
                    >
                      <option value="">Select nationality</option>
                      <option value="INDIAN">Indian</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>
                </div>

                <div className="form__section">
                  <h4>Player Contact</h4>
                  <label className="field">
                    Mobile Number *
                    <input
                      className="input"
                      type="tel"
                      value={applicationForm.playerPhone}
                      onChange={(e) => setApplicationForm({ ...applicationForm, playerPhone: e.target.value })}
                      placeholder="9876543210"
                      required
                    />
                  </label>
                  <label className="field">
                    Email
                    <input
                      className="input"
                      type="email"
                      value={applicationForm.playerEmail}
                      onChange={(e) => setApplicationForm({ ...applicationForm, playerEmail: e.target.value })}
                      placeholder="player@example.com"
                    />
                  </label>
                </div>

                <div className="form__section">
                  <h4>Sport Preference</h4>
                  <label className="field">
                    Sport you want to apply for *
                    <select
                      className="input"
                      value={applicationForm.sport}
                      onChange={(e) => setApplicationForm({ ...applicationForm, sport: e.target.value })}
                      required
                    >
                      <option value="">Select sport</option>
                      <option value="FOOTBALL">Football</option>
                      <option value="CRICKET">Cricket</option>
                      <option value="BASKETBALL">Basketball</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>
                </div>

                {applicationForm.sport === 'FOOTBALL' && (
                  <div className="form__section">
                    <h4>Football Basics</h4>
                  <div className="field">
                    <p className="profile-card__label" style={{ marginBottom: '8px' }}>Primary Position (select one or multiple)</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                      {[
                        { id: 'GOALKEEPER', label: 'Goalkeeper' },
                        { id: 'DEFENDER', label: 'Defender' },
                        { id: 'MIDFIELDER', label: 'Midfielder' },
                        { id: 'FORWARD', label: 'Forward' },
                      ].map((opt) => (
                        <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="checkbox"
                            checked={applicationForm.primaryPosition.includes(opt.id)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? Array.from(new Set([...applicationForm.primaryPosition, opt.id]))
                                : applicationForm.primaryPosition.filter((x) => x !== opt.id)
                              setApplicationForm({ ...applicationForm, primaryPosition: next })
                            }}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="field">
                    Dominant Foot *
                    <select
                      className="input"
                      value={applicationForm.dominantFoot}
                      onChange={(e) => setApplicationForm({ ...applicationForm, dominantFoot: e.target.value })}
                      required
                    >
                      <option value="">Select</option>
                      <option value="RIGHT">Right</option>
                      <option value="LEFT">Left</option>
                      <option value="BOTH">Both</option>
                    </select>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <label className="field">
                      Height (cm)
                      <input
                        className="input"
                        type="number"
                        value={applicationForm.height}
                        onChange={(e) => setApplicationForm({ ...applicationForm, height: e.target.value })}
                        placeholder="175"
                        min="0"
                      />
                    </label>
                    <label className="field">
                      Weight (kg)
                      <input
                        className="input"
                        type="number"
                        value={applicationForm.weight}
                        onChange={(e) => setApplicationForm({ ...applicationForm, weight: e.target.value })}
                        placeholder="70"
                        min="0"
                      />
                    </label>
                  </div>
                  </div>
                )}

                <div className="form__section">
                  <h4>Location & Preferences</h4>
                  <label className="field">
                    City
                    <input
                      className="input"
                      type="text"
                      value={applicationForm.city}
                      onChange={(e) => setApplicationForm({ ...applicationForm, city: e.target.value })}
                      placeholder="Mumbai"
                    />
                  </label>
                  <label className="field">
                    District
                    <input
                      className="input"
                      type="text"
                      value={applicationForm.district}
                      onChange={(e) => setApplicationForm({ ...applicationForm, district: e.target.value })}
                      placeholder="District"
                    />
                  </label>
                  <label className="field">
                    Pincode *
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={applicationForm.pincode}
                      onChange={(e) => setApplicationForm({ ...applicationForm, pincode: e.target.value })}
                      placeholder="6 digit pincode"
                      required
                    />
                  </label>
                  <label className="field">
                    State
                    <input
                      className="input"
                      type="text"
                      value={applicationForm.state}
                      onChange={(e) => setApplicationForm({ ...applicationForm, state: e.target.value })}
                      placeholder="Maharashtra"
                    />
                  </label>
                  <label className="field">
                    Preferred Team(s) * (dropdown)
                    <div
                      className="input"
                      style={{
                        position: 'relative',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        if (!showTeamsDropdown) {
                          if (teams.length === 0 && !isLoadingTeams) void loadActiveTeams()
                        }
                        setShowTeamsDropdown((open) => !open)
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '4px',
                          flex: 1,
                          minHeight: '20px',
                        }}
                      >
                        {applicationForm.preferredTeamIds.length === 0 ? (
                          <span className="muted" style={{ fontWeight: 400 }}>
                            Select preferred team(s)
                          </span>
                        ) : (
                          applicationForm.preferredTeamIds
                            .map((id) => teams.find((t) => t.id === id)?.name || 'Unknown team')
                            .filter(Boolean)
                            .map((name) => (
                              <span
                                key={name}
                                style={{
                                  background: '#e5f3ff',
                                  borderRadius: '999px',
                                  padding: '2px 8px',
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  color: '#0f172a',
                                }}
                              >
                                {name}
                              </span>
                            ))
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {showTeamsDropdown ? '▲' : '▼'}
                      </span>
                    </div>
                    {showTeamsDropdown && (
                      <div
                        className="dropdown"
                        style={{
                          position: 'relative',
                          marginTop: '6px',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            zIndex: 20,
                            top: 0,
                            left: 0,
                            right: 0,
                            background: '#ffffff',
                            borderRadius: '12px',
                            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)',
                            border: '1px solid #e2e8f0',
                            padding: '10px 10px 8px',
                          }}
                        >
                          <input
                            className="input"
                            type="text"
                            placeholder="Search team..."
                            value={teamSearch}
                            onChange={(e) => setTeamSearch(e.target.value)}
                            style={{ marginBottom: '8px' }}
                            autoFocus
                          />
                          <div
                            style={{
                              maxHeight: '180px',
                              overflowY: 'auto',
                              paddingRight: '4px',
                            }}
                          >
                            {isLoadingTeams ? (
                              <p className="muted" style={{ padding: '4px 6px' }}>
                                Loading teams...
                              </p>
                            ) : teams.length === 0 ? (
                              <p className="muted" style={{ padding: '4px 6px' }}>
                                No active teams found
                              </p>
                            ) : (
                              teams
                                .filter((t) =>
                                  t.name.toLowerCase().includes(teamSearch.trim().toLowerCase()),
                                )
                                .map((t) => {
                                  const selected = applicationForm.preferredTeamIds.includes(t.id)
                                  return (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => {
                                        setApplicationForm((prev) => {
                                          const already = prev.preferredTeamIds.includes(t.id)
                                          return {
                                            ...prev,
                                            preferredTeamIds: already
                                              ? prev.preferredTeamIds.filter((id) => id !== t.id)
                                              : [...prev.preferredTeamIds, t.id],
                                          }
                                        })
                                      }}
                                      style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        border: 'none',
                                        background: selected ? '#eff6ff' : 'transparent',
                                        padding: '6px 8px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <span>{t.name}</span>
                                      {selected && (
                                        <span
                                          style={{
                                            fontSize: '0.75rem',
                                            color: '#2563eb',
                                            fontWeight: 600,
                                          }}
                                        >
                                          Selected
                                        </span>
                                      )}
                                    </button>
                                  )
                                })
                            )}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: '6px',
                            }}
                          >
                            <p className="muted" style={{ fontSize: '0.75rem' }}>
                              {applicationForm.preferredTeamIds.length === 0
                                ? 'Select at least one team.'
                                : `${applicationForm.preferredTeamIds.length} team(s) selected.`}
                            </p>
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => setShowTeamsDropdown(false)}
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                <div className="form__section">
                  <h4>Emergency Contact</h4>
                  {emergencyContacts.map((c, idx) => (
                    <div key={idx} className="profile-card" style={{ marginBottom: '12px' }}>
                      <div className="profile-card__grid">
                        <label className="field" style={{ margin: 0 }}>
                          Contact Name {idx === 0 ? '*' : ''}
                          <input
                            className="input"
                            type="text"
                            value={c.name}
                            onChange={(e) => {
                              const next = emergencyContacts.slice()
                              next[idx] = { ...next[idx], name: e.target.value }
                              setEmergencyContacts(next)
                            }}
                            placeholder="Parent/Guardian Name"
                            required={idx === 0}
                          />
                        </label>
                        <label className="field" style={{ margin: 0 }}>
                          Phone {idx === 0 ? '*' : ''}
                          <input
                            className="input"
                            type="tel"
                            value={c.phone}
                            onChange={(e) => {
                              const next = emergencyContacts.slice()
                              next[idx] = { ...next[idx], phone: e.target.value }
                              setEmergencyContacts(next)
                            }}
                            placeholder="9876543210"
                            required={idx === 0}
                          />
                        </label>
                        <label className="field" style={{ margin: 0 }}>
                          Relationship
                          <input
                            className="input"
                            type="text"
                            value={c.relation}
                            onChange={(e) => {
                              const next = emergencyContacts.slice()
                              next[idx] = { ...next[idx], relation: e.target.value }
                              setEmergencyContacts(next)
                            }}
                            placeholder="Father/Mother/Guardian"
                          />
                        </label>
                      </div>
                      <div className="actions" style={{ marginBottom: 0 }}>
                        {idx === emergencyContacts.length - 1 && (
                          <button
                            className="button button--ghost"
                            type="button"
                            onClick={() => setEmergencyContacts([...emergencyContacts, { name: '', phone: '', relation: '' }])}
                          >
                            + Add Contact
                          </button>
                        )}
                        {emergencyContacts.length > 1 && idx > 0 && (
                          <button
                            className="button button--danger"
                            type="button"
                            onClick={() => setEmergencyContacts(emergencyContacts.filter((_, i) => i !== idx))}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="form__section">
                  <h4>Documents Upload</h4>
                  <label className="field">
                    Identity Proof (Required) *
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        className="input"
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setDocIdProof(e.target.files?.[0] || null)}
                        required
                      />
                      <button
                        className="button button--ghost"
                        type="button"
                        disabled={!docIdProof}
                        onClick={() => {
                          if (!docIdProof) return
                          const url = URL.createObjectURL(docIdProof)
                          window.open(url, '_blank', 'noopener,noreferrer')
                        }}
                      >
                        View
                      </button>
                    </div>
                  </label>

                  <label className="field">
                    Age Proof (Optional)
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        className="input"
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setDocAgeProof(e.target.files?.[0] || null)}
                      />
                      <button
                        className="button button--ghost"
                        type="button"
                        disabled={!docAgeProof}
                        onClick={() => {
                          if (!docAgeProof) return
                          const url = URL.createObjectURL(docAgeProof)
                          window.open(url, '_blank', 'noopener,noreferrer')
                        }}
                      >
                        View
                      </button>
                    </div>
                  </label>
                  <label className="field">
                    Passport Photo (Optional)
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        className="input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setDocPlayerPhoto(e.target.files?.[0] || null)}
                      />
                      <button
                        className="button button--ghost"
                        type="button"
                        disabled={!docPlayerPhoto}
                        onClick={() => {
                          if (!docPlayerPhoto) return
                          const url = URL.createObjectURL(docPlayerPhoto)
                          window.open(url, '_blank', 'noopener,noreferrer')
                        }}
                      >
                        View
                      </button>
                    </div>
                  </label>
                  <div className="form__section" style={{ marginTop: '12px' }}>
                    <h4 style={{ marginBottom: '8px' }}>Additional Documents</h4>
                    {extraDocuments.map((doc, idx) => (
                      <div key={doc.id} className="profile-card" style={{ marginBottom: '12px' }}>
                        <div className="profile-card__grid">
                          <label className="field" style={{ margin: 0 }}>
                            Document Type
                            <select
                              className="input"
                              value={doc.type}
                              onChange={(e) => {
                                const next = extraDocuments.slice()
                                next[idx] = { ...next[idx], type: e.target.value }
                                setExtraDocuments(next)
                              }}
                            >
                              <option value="">Select type</option>
                              <option value="ID_CARD">ID Card</option>
                              <option value="ADDRESS_PROOF">Address Proof</option>
                              <option value="MEDICAL_CERTIFICATE">Medical Certificate</option>
                              <option value="SCHOOL_CERTIFICATE">School Certificate</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </label>
                          <label className="field" style={{ margin: 0 }}>
                            Notes
                            <input
                              className="input"
                              type="text"
                              value={doc.notes}
                              onChange={(e) => {
                                const next = extraDocuments.slice()
                                next[idx] = { ...next[idx], notes: e.target.value }
                                setExtraDocuments(next)
                              }}
                              placeholder="Short description or notes"
                            />
                          </label>
                          <label className="field" style={{ margin: 0 }}>
                            File
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                className="input"
                                type="file"
                                accept=".pdf,image/*"
                                onChange={(e) => {
                                  const next = extraDocuments.slice()
                                  next[idx] = { ...next[idx], file: e.target.files?.[0] || null }
                                  setExtraDocuments(next)
                                }}
                              />
                              <button
                                className="button button--ghost"
                                type="button"
                                disabled={!doc.file}
                                onClick={() => {
                                  if (!doc.file) return
                                  const url = URL.createObjectURL(doc.file)
                                  window.open(url, '_blank', 'noopener,noreferrer')
                                }}
                              >
                                View
                              </button>
                            </div>
                          </label>
                        </div>
                        <div className="actions" style={{ marginBottom: 0 }}>
                          {extraDocuments.length > 1 && (
                            <button
                              className="button button--danger"
                              type="button"
                              onClick={() => setExtraDocuments(extraDocuments.filter((_, i) => i !== idx))}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="actions" style={{ marginTop: extraDocuments.length ? '4px' : 0 }}>
                      <button
                        className="button button--ghost"
                        type="button"
                        onClick={() =>
                          setExtraDocuments([
                            ...extraDocuments,
                            { id: `${Date.now()}-${extraDocuments.length}`, file: null, type: '', notes: '' },
                          ])
                        }
                      >
                        + Add Document
                      </button>
                    </div>
                  </div>
                  {application?.documents?.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <p className="muted" style={{ margin: '0 0 10px' }}>Uploaded documents</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {application.documents.map((d: any) => (
                          <div
                            key={d.id || `${d.documentType}-${String(d.createdAt || '')}`}
                            className="profile-card profile-card--compact"
                            style={{ marginBottom: 0 }}
                          >
                            <div>
                              <p className="profile-card__label">Type</p>
                              <p className="profile-card__value">{d.documentType}</p>
                            </div>
                            <div>
                              <p className="profile-card__label">Status</p>
                              <p className="profile-card__value">{d.verificationStatus}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                              <button
                                className="button button--ghost"
                                type="button"
                                onClick={() => {
                                  if (!d.id) return
                                  openDocumentPreview(d.id).catch((e: any) => setError(e?.message || 'Failed to open document'))
                                }}
                                disabled={!d.id}
                              >
                                View
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form__section">
                  <h4>Declaration & Submit</h4>
                  <label
                    style={{
                      display: 'inline-flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: '8px',
                      marginBottom: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={declarationAccepted}
                      onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    />
                    <span>I confirm the above information is accurate.</span>
                  </label>
                  <br />
                  <label
                    style={{
                      display: 'inline-flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: '8px',
                      marginBottom: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={declarationMedicallyFit}
                      onChange={(e) => setDeclarationMedicallyFit(e.target.checked)}
                    />
                    <span>I confirm that I am medically fit to participate in football activities.</span>
                  </label>
                  <br />
                  <label
                    style={{
                      display: 'inline-flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: '8px',
                      marginBottom: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={declarationConsentProfile}
                      onChange={(e) => setDeclarationConsentProfile(e.target.checked)}
                    />
                    <span>I consent to the creation of a player profile if my application is approved.</span>
                  </label>
                </div>

                <div className="actions" style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <button 
                    className="button button--ghost" 
                    type="button"
                    onClick={() => setShowApplicationModal(false)}
                    disabled={isLoadingApplication}
                  >
                    Cancel
                  </button>
                  <button
                    className="button"
                    type="submit"
                    disabled={isLoadingApplication}
                  >
                    {isLoadingApplication ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={() => {
                      if (isLoadingApplication) return
                      submitApplication().then(() => {
                        setShowApplicationModal(false)
                      })
                    }}
                    disabled={isLoadingApplication}
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewUrl && (
        <div className="modal-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="modal-content" style={{ maxWidth: '900px', width: '100%', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{previewTitle}</h3>
              <button
                className="modal-close"
                type="button"
                onClick={() => setPreviewUrl(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body" style={{ height: '70vh' }}>
              {previewMimeType && previewMimeType.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt={previewTitle}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                />
              ) : (
                <iframe
                  title={previewTitle}
                  src={previewUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Coach Invite Modal */}
      {showCoachModal && (
        <div className="modal-overlay" onClick={() => setShowCoachModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Coach Invite</h3>
              <button 
                className="modal-close" 
                type="button"
                onClick={() => setShowCoachModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form className="form" onSubmit={createCoachInvite}>
                <p className="muted" style={{ marginBottom: '20px' }}>Fill in the coach details to send an invitation. An OTP will be sent to their phone.</p>
                
                <div className="form__section">
                  <h4>Contact Information</h4>
                  <label className="field">
                    Phone Number *
                    <input
                      className="input"
                      type="tel"
                      value={coachForm.phone}
                      onChange={(e) => setCoachForm({ ...coachForm, phone: e.target.value })}
                      placeholder="9876543210"
                      required
                    />
                  </label>
                  <label className="field">
                    Email
                    <input
                      className="input"
                      type="email"
                      value={coachForm.email}
                      onChange={(e) => setCoachForm({ ...coachForm, email: e.target.value })}
                      placeholder="coach@example.com"
                    />
                  </label>
                </div>

                <div className="form__section">
                  <h4>Coaching Details</h4>
                  <label className="field">
                    Sport *
                    <select
                      className="input"
                      value={coachForm.sport}
                      onChange={(e) => setCoachForm({ ...coachForm, sport: e.target.value })}
                      required
                    >
                      <option value="FOOTBALL">Football</option>
                      <option value="CRICKET">Cricket</option>
                      <option value="BASKETBALL">Basketball</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>
                  <label className="field">
                    Coaching Role *
                    <select
                      className="input"
                      value={coachForm.coachingRole}
                      onChange={(e) => setCoachForm({ ...coachForm, coachingRole: e.target.value })}
                      required
                    >
                      <option value="ASSISTANT">Assistant Coach</option>
                      <option value="HEAD">Head Coach</option>
                    </select>
                  </label>
                  <label className="field">
                    Years of Experience
                    <input
                      className="input"
                      type="number"
                      value={coachForm.yearsExperience}
                      onChange={(e) => setCoachForm({ ...coachForm, yearsExperience: e.target.value })}
                      placeholder="5"
                      min="0"
                    />
                  </label>
                </div>

                <div className="actions" style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <button 
                    className="button button--ghost" 
                    type="button"
                    onClick={() => setShowCoachModal(false)}
                    disabled={isLoadingCoaches}
                  >
                    Cancel
                  </button>
                  <button 
                    className="button button--primary" 
                    type="submit" 
                    disabled={isLoadingCoaches}
                  >
                    {isLoadingCoaches ? 'Creating...' : 'Create Invite'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
