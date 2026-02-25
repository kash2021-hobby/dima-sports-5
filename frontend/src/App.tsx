import type { FormEvent } from 'react'
import React, { useEffect, useMemo, useState, useCallback, cloneElement } from 'react'
import {
  Trophy,
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  GraduationCap,
  UsersRound,
  FileText,
  ClipboardCheck,
  Bell,
  Award,
  UserCircle,
  ShieldCheck,
  RefreshCw,
  X,
  Eye,
  Plus,
  CheckCircle,
  Info,
  AlertCircle,
  Loader2,
  Phone,
} from 'lucide-react'
import { SignInCard } from '@/components/ui/sign-in'
import { Sidebar } from '@/components/ui/modern-side-bar'
import { MobileTopHeader } from '@/components/MobileTopHeader'
import { BottomNav } from '@/components/BottomNav'
import { DashboardContent } from '@/components/DashboardContent'
import { CoachDashboardContent } from '@/components/CoachDashboardContent'
import { UserManagementPage } from '@/components/UserManagementPage'
import { AdminPlayersPage } from '@/components/AdminPlayersPage'
import { TournamentAdminPage } from '@/components/TournamentAdminPage'
import { TournamentDetailPage } from '@/components/TournamentDetailPage'
import { RefereeManagementPage } from '@/components/RefereeManagementPage'
import type { RefereeListItem } from '@/components/RefereeManagementPage'
import { AddRefereeModal } from '@/components/AddRefereeModal'
import { StatusBadge } from '@/components/StatusBadge'
import { AadhaarVerificationModal } from '@/components/AadhaarVerificationModal'
import './App.css'

function formatDate(value?: string | null): string {
  if (!value) return '—'
  try {
    const d = new Date(value)
    return Number.isNaN(d.getTime())
      ? value
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return value ?? '—'
  }
}

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
    aadhaarNumber: '',
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
  const [primaryEmergencyPhoneConflict, setPrimaryEmergencyPhoneConflict] = useState(false)
  const [docIdProof, setDocIdProof] = useState<File | null>(null)
  const [docAgeProof, setDocAgeProof] = useState<File | null>(null)
  const [docPlayerPhoto, setDocPlayerPhoto] = useState<File | null>(null)
  const [docAadhaarCard, setDocAadhaarCard] = useState<File | null>(null)
  type ExtraDocument = { id: string; file: File | null; type: string; notes: string }
  const [extraDocuments, setExtraDocuments] = useState<ExtraDocument[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState<string>('Document preview')
  const [previewMimeType, setPreviewMimeType] = useState<string | null>(null)

  // Admin Applications state
  const [applications, setApplications] = useState<any[]>([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null)

  // Admin Users state (name/avatarUrl derived from player/coach/application in loadUsers)
  type AdminUser = {
    id: string
    phone: string
    email?: string | null
    role: string
    status: string
    createdAt: string
    lastLoginAt?: string | null
    application?: { status?: string | null; submittedAt?: string | null; fullName?: string | null } | null
    player?: { playerId?: string | null; photo?: string | null; displayName?: string | null } | null
    coach?: { coachId?: string | null; photo?: string | null; displayName?: string | null } | null
    name?: string | null
    avatarUrl?: string | null
  }
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [usersPage, setUsersPage] = useState(1)
  const [usersLimit] = useState(20)
  const [usersTotalPages, setUsersTotalPages] = useState(1)
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersSearch, setUsersSearch] = useState('')

  // Coach management state (admin – direct account creation)
  const [coaches, setCoaches] = useState<any[]>([])
  const [isLoadingCoaches, setIsLoadingCoaches] = useState(false)
  const [isCreatingCoach, setIsCreatingCoach] = useState(false)
  const [showCreateCoachModal, setShowCreateCoachModal] = useState(false)
  const [showUsersFilterSheet, setShowUsersFilterSheet] = useState(false)
  const [createCoachForm, setCreateCoachForm] = useState({
    fullName: '',
    phone: '',
    mpin: '',
  })

  // Admin dashboard stats (admin-only dashboard)
  type DashboardStats = {
    totalPlayers: number
    pendingApplications: number
    activeTrialsCount: number
    coachesCount: number
    recentApplications: Array<{
      id: string
      fullName: string
      preferredTeamNames?: string[]
      status: string
      submittedAt?: string | null
      createdAt: string
    }>
  }
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

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
  const [isAadhaarModalOpen, setIsAadhaarModalOpen] = useState(false)
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false)
  const [physicalTestDate, setPhysicalTestDate] = useState('')
  const [physicalTestLocation, setPhysicalTestLocation] = useState('')
  const todayIso = new Date().toISOString().slice(0, 10)
  const [medicalCheck, setMedicalCheck] = useState({
    q1Yes: false,
    q1No: false,
    q2Yes: false,
    q2No: false,
    q3Yes: false,
    q3No: false,
  })
  const isPastDate = (value: string) => {
    if (!value) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return false
    d.setHours(0, 0, 0, 0)
    return d < today
  }
  const [isUploadingMedicalReport, setIsUploadingMedicalReport] = useState(false)

  useEffect(() => {
    setIsAadhaarModalOpen(false)
    if (!selectedTrial) {
      setIsAadhaarVerified(false)
      return
    }
    setIsAadhaarVerified(Boolean((selectedTrial as any).aadhaarVerified))
  }, [selectedTrial?.id])

  useEffect(() => {
    if (!selectedTrial) return
    const updated = trials.find((t) => t.id === selectedTrial.id)
    if (updated && updated !== selectedTrial) {
      setSelectedTrial(updated)
    }
  }, [trials, selectedTrial])

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

  // Coach Tournaments state
  const [coachTournaments, setCoachTournaments] = useState<any[]>([])
  const [isLoadingCoachTournaments, setIsLoadingCoachTournaments] = useState(false)
  const [selectedCoachTournament, setSelectedCoachTournament] = useState<any | null>(null)
  const [tournamentApplicationForm, setTournamentApplicationForm] = useState<{
    teamName: string
    notes: string
    playerIds: string[]
    captainPlayerId: string | null
  }>({
    teamName: '',
    notes: '',
    playerIds: [],
    captainPlayerId: null,
  })

  // Admin Teams state
  const [adminTeams, setAdminTeams] = useState<any[]>([])
  const [isLoadingAdminTeams, setIsLoadingAdminTeams] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<any[]>([])
  const [isLoadingTeamPlayers, setIsLoadingTeamPlayers] = useState(false)
  const [openTeamMenuId, setOpenTeamMenuId] = useState<string | null>(null)

  // Admin Tournaments state
  type AdminTournamentListItem = {
    id: string
    tournamentId: string
    name: string
    sport: string
    level: string
    genderCategory?: string | null
    ageCategory?: string | null
    status: string
    startDate?: string | null
    endDate?: string | null
    registrationDeadline?: string | null
    minSquadSize?: number | null
    maxSquadSize?: number | null
  }
  const [adminTournaments, setAdminTournaments] = useState<AdminTournamentListItem[]>([])
  const [isLoadingAdminTournaments, setIsLoadingAdminTournaments] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null)
  const [isLoadingTournamentDetail, setIsLoadingTournamentDetail] = useState(false)
  const [isCreatingTournament, setIsCreatingTournament] = useState(false)
  const [isSavingTournament, setIsSavingTournament] = useState(false)

  // Team Players -> Player profile detail (inline)
  const [selectedTeamPlayerProfile, setSelectedTeamPlayerProfile] = useState<any | null>(null)
  const [isLoadingTeamPlayerProfile, setIsLoadingTeamPlayerProfile] = useState(false)

  // Player Profile module: active tab (shared across Admin / Coach My Players / Team profile views)
  type PlayerProfileTabId = 'core' | 'personal' | 'documents' | 'medical' | 'career' | 'tournament'
  const [playerProfileTab, setPlayerProfileTab] = useState<PlayerProfileTabId>('core')

  // Admin: Referee management
  const [referees, setReferees] = useState<RefereeListItem[]>([])
  const [isLoadingReferees, setIsLoadingReferees] = useState(false)
  const [showRefereeModal, setShowRefereeModal] = useState(false)
  const [editingReferee, setEditingReferee] = useState<RefereeListItem | null>(null)

  // Player's own Profile module: full profile data (fetched when opening Profile)
  const [myProfileData, setMyProfileData] = useState<{ player: any; application: any; documents: any[] } | null>(null)
  const [isLoadingMyProfile, setIsLoadingMyProfile] = useState(false)

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
      aadhaarNumber: '',
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
          const raw = data.data.users as AdminUser[]
          setAdminUsers(
            raw.map((u) => ({
              ...u,
              name: u.player?.displayName ?? u.coach?.displayName ?? u.application?.fullName ?? null,
              avatarUrl: u.player?.photo ?? u.coach?.photo ?? null,
            }))
          )
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
            aadhaarNumber: (app as any)?.aadhaarNumber || '',
            playerEmail: (app as any)?.playerEmail || (app as any)?.user?.email || '',
            // Normalize to a single preferred team on the client
            preferredTeamIds: parseStringOrJsonArray(app.preferredTeamIds).slice(0, 1),
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
      setError(data?.message || `Failed to upload ${documentType}`)
      throw new Error(data?.message || `Failed to upload ${documentType}`)
    }
    setSuccessMessage('Upload successful')
    setTimeout(() => {
      setSuccessMessage(null)
    }, 3000)
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

  const normalizePhoneForCompare = (value: string): string => {
    return String(value || '').replace(/\D/g, '')
  }

  const [aadhaarError, setAadhaarError] = useState<string | null>(null)
  const [isCheckingAadhaar, setIsCheckingAadhaar] = useState(false)

  const checkAadhaar = useCallback(
    async (value: string) => {
      if (!token) return
      const normalized = String(value || '').replace(/\D/g, '')
      if (!normalized) {
        setAadhaarError(null)
        return
      }
      if (!/^\d{12}$/.test(normalized)) {
        setAadhaarError('Aadhaar number must be exactly 12 digits.')
        return
      }
      setAadhaarError(null)
      setIsCheckingAadhaar(true)
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/application/check-aadhaar?number=${encodeURIComponent(normalized)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        const data = await res.json()
        if (!res.ok || !data?.success) {
          setAadhaarError(data?.message || 'Failed to verify Aadhaar number.')
          return
        }
        const alreadyRegistered =
          data.data?.alreadyRegistered === true ||
          data.data?.available === false ||
          data.alreadyRegistered === true ||
          data.available === false
        if (alreadyRegistered) {
          setAadhaarError('This Aadhaar number is already registered.')
        } else {
          setAadhaarError(null)
        }
      } catch {
        setAadhaarError('Failed to verify Aadhaar number. Please try again.')
      } finally {
        setIsCheckingAadhaar(false)
      }
    },
    [API_BASE_URL, token],
  )

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

    // Emergency contact phone validation (client-side)
    const playerPhoneNorm = normalizePhoneForCompare(applicationForm.playerPhone)
    const contactPhones = emergencyContacts.map((c) => c.phone).filter((p) => p && p.trim().length > 0)
    const contactPhonesNorm = contactPhones.map((p) => normalizePhoneForCompare(p))

    if (playerPhoneNorm && contactPhonesNorm.some((p) => p === playerPhoneNorm)) {
      setError('Emergency contact phone numbers must be different from the player mobile number.')
      return Promise.resolve()
    }

    const nonEmptyContacts = contactPhonesNorm.filter((p) => p.length > 0)
    const uniqueContacts = new Set(nonEmptyContacts)
    if (uniqueContacts.size !== nonEmptyContacts.length) {
      setError('Emergency contact phone numbers must be different from each other.')
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
      !applicationForm.aadhaarNumber ||
      applicationForm.preferredTeamIds.length === 0 ||
      !emergencyContacts[0]?.name ||
      !emergencyContacts[0]?.phone
    ) {
      setError('Please complete all required fields before submitting.')
      return Promise.resolve()
    }

    // Emergency contact phone validation (client-side)
    const playerPhoneNorm = normalizePhoneForCompare(applicationForm.playerPhone)
    const contactPhones = emergencyContacts.map((c) => c.phone).filter((p) => p && p.trim().length > 0)
    const contactPhonesNorm = contactPhones.map((p) => normalizePhoneForCompare(p))

    if (playerPhoneNorm && contactPhonesNorm.some((p) => p === playerPhoneNorm)) {
      setError('Emergency contact phone numbers must be different from the player mobile number.')
      return Promise.resolve()
    }

    const nonEmptyContacts = contactPhonesNorm.filter((p) => p.length > 0)
    const uniqueContacts = new Set(nonEmptyContacts)
    if (uniqueContacts.size !== nonEmptyContacts.length) {
      setError('Emergency contact phone numbers must be different from each other.')
      return Promise.resolve()
    }

    if (!/^\d{6}$/.test(applicationForm.pincode)) {
      setError('Pincode must be 6 digits.')
      return Promise.resolve()
    }

    if (!applicationForm.aadhaarNumber || !/^\d{12}$/.test(applicationForm.aadhaarNumber)) {
      setError('Aadhaar number must be exactly 12 digits.')
      return Promise.resolve()
    }

    if (aadhaarError) {
      setError(aadhaarError)
      return Promise.resolve()
    }

    if (!docIdProof) {
      setError('Identity proof (ID Proof) is required before submitting.')
      return Promise.resolve()
    }

    if (!docAadhaarCard) {
      setError('Aadhaar Card Photo is required before submitting.')
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

      // Upload documents (ID proof and Aadhaar card required; others optional)
      if (docIdProof) await uploadApplicationDocument(docIdProof, 'ID_PROOF')
      if (docAadhaarCard) await uploadApplicationDocument(docAadhaarCard, 'AADHAAR_CARD')
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
    if (nextMode === 'login' && signupStep === 'done') {
      setSignupStep('phone')
      setSignupPhone('')
      setSignupOtp('')
      setSignupMpin('')
      setSignupUserId(null)
    }
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
      { id: 'dashboard', label: 'Dashboard', tabs: [] },
      { id: 'users', label: 'User Management', tabs: ['All', 'Users', 'Players', 'Coaches', 'Admins'] },
      { id: 'players', label: 'Players', tabs: ['All Players'] },
      { id: 'applications', label: 'Applications', tabs: ['Pending', 'Review', 'Approved', 'Rejected'] },
      { id: 'coach-management', label: 'Coach Management', tabs: [] },
      { id: 'teams', label: 'Teams', tabs: ['All Teams'] },
      { id: 'tournaments', label: 'Tournaments', tabs: ['All', 'Drafts', 'Published', 'Completed'] },
      { id: 'referees', label: 'Referee Management', tabs: [] },
      { id: 'documents', label: 'Documents', tabs: ['Pending', 'Verified', 'Rejected'] },
      { id: 'trials', label: 'Trials', tabs: ['Assigned', 'Completed', 'Retest'] },
      { id: 'notifications', label: 'Notifications', tabs: ['Team Requests'] },
    ],
    COACH: [
      { id: 'dashboard', label: 'Dashboard', tabs: [] },
      { id: 'assigned-trials', label: 'Assigned Trials', tabs: ['Pending', 'Completed', 'Needs Retest'] },
      { id: 'my-teams', label: 'My Teams', tabs: ['My Teams'] },
      { id: 'my-players', label: 'My Players', tabs: ['All Players'] },
      { id: 'tournament', label: 'Tournament', tabs: [] },
      { id: 'profile', label: 'Profile', tabs: ['About', 'Credentials'] },
    ],
    PLAYER: [
      { id: 'dashboard', label: 'Dashboard', tabs: [] },
      { id: 'profile', label: 'Profile', tabs: ['Core', 'Personal', 'Documents', 'Medical', 'Career', 'Tournament'] },
      { id: 'documents', label: 'Documents', tabs: ['Pending', 'Verified'] },
      { id: 'eligibility', label: 'Eligibility', tabs: ['Status', 'History'] },
    ],
    USER: [
      { id: 'application', label: 'My Application', tabs: ['Draft', 'Submitted', 'Review'] },
      { id: 'profile', label: 'Profile', tabs: [] },
      { id: 'notifications', label: 'Notifications', tabs: ['All', 'Unread'] },
    ],
  }

  const moduleIcons: Record<string, React.ReactNode> = {
    dashboard: <LayoutDashboard size={20} strokeWidth={1.5} />,
    users: <Users size={20} strokeWidth={1.5} />,
    players: <UserCheck size={20} strokeWidth={1.5} />,
    applications: <ClipboardList size={20} strokeWidth={1.5} />,
    'coach-management': <GraduationCap size={20} strokeWidth={1.5} />,
    teams: <UsersRound size={20} strokeWidth={1.5} />,
    documents: <FileText size={20} strokeWidth={1.5} />,
    trials: <ClipboardCheck size={20} strokeWidth={1.5} />,
    notifications: <Bell size={20} strokeWidth={1.5} />,
    'assigned-trials': <ClipboardCheck size={20} strokeWidth={1.5} />,
    'my-teams': <UsersRound size={20} strokeWidth={1.5} />,
    'my-players': <UserCheck size={20} strokeWidth={1.5} />,
    tournament: <Trophy size={20} strokeWidth={1.5} />,
    tournaments: <Trophy size={20} strokeWidth={1.5} />,
    referees: <UserCheck size={20} strokeWidth={1.5} />,
    profile: <UserCircle size={20} strokeWidth={1.5} />,
    eligibility: <ShieldCheck size={20} strokeWidth={1.5} />,
    application: <ClipboardList size={20} strokeWidth={1.5} />,
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

  const sidebarNavigationItems = useMemo(
    () =>
      availableModules.map((m) => ({
        id: m.id,
        name: m.label,
        icon: moduleIcons[m.id],
        badge: undefined as string | undefined,
      })),
    [availableModules]
  )

  const [activeModuleId, setActiveModuleId] = useState<string>('dashboard')
  const [activeTab, setActiveTab] = useState<string>('')

  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  )
  useEffect(() => {
    const m = window.matchMedia('(min-width: 768px)')
    const handler = () => setIsDesktop(m.matches)
    m.addEventListener('change', handler)
    return () => m.removeEventListener('change', handler)
  }, [])

  const handleModuleNav = useCallback(
    (id: string) => {
      const mod = availableModules.find((x) => x.id === id)
      setActiveModuleId(id)
      setActiveTab(mod?.tabs[0] ?? '')
      setError(null)
      setSuccessMessage(null)
    },
    [availableModules]
  )

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

  const loadMyProfileData = useCallback(async () => {
    if (!token || me?.role !== 'PLAYER') return
    setError(null)
    setIsLoadingMyProfile(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/player/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && data.data) {
        setMyProfileData(data.data)
      } else {
        setMyProfileData(null)
      }
    } catch (err) {
      setMyProfileData(null)
    } finally {
      setIsLoadingMyProfile(false)
    }
  }, [token, me?.role, API_BASE_URL])

  useEffect(() => {
    if (activeModuleId === 'profile' && me?.role === 'PLAYER') {
      void loadMyProfileData()
      setActiveTab('Core')
    } else if (activeModuleId !== 'profile') {
      setMyProfileData(null)
    }
  }, [activeModuleId, me?.role, loadMyProfileData])

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

  const loadCoachTournaments = useCallback(async () => {
    if (!token) return
    setError(null)
    setIsLoadingCoachTournaments(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/coach/tournaments/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && Array.isArray(data.data?.tournaments)) {
        setCoachTournaments(data.data.tournaments)
      } else {
        setError(data?.message || 'Failed to load tournaments')
      }
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    } finally {
      setIsLoadingCoachTournaments(false)
    }
  }, [token, API_BASE_URL])

  const handleSubmitTournamentApplication = useCallback(
    async (tournamentId: string) => {
      if (!token) return
      const { teamName, notes, playerIds, captainPlayerId } = tournamentApplicationForm
      setError(null)
      setSuccessMessage(null)
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/coach/tournaments/${encodeURIComponent(tournamentId)}/apply`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              teamName,
              notes,
              playerIds,
              captainPlayerId,
            }),
          }
        )
        const data = await res.json()
        if (res.ok && data?.success) {
          setSuccessMessage('Tournament application submitted')
          await loadCoachTournaments()
        } else {
          setError(data?.message || 'Failed to submit tournament application')
        }
      } catch (err) {
        setError('Cannot reach backend. Make sure the server is running.')
      }
    },
    [API_BASE_URL, token, tournamentApplicationForm, loadCoachTournaments]
  )

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

  const loadAdminTournaments = useCallback(async () => {
    if (!token) return
    setError(null)
    setIsLoadingAdminTournaments(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/tournaments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && Array.isArray(data.data?.tournaments)) {
        setAdminTournaments(data.data.tournaments)
      } else {
        setError(data?.message || 'Failed to load tournaments')
      }
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
    } finally {
      setIsLoadingAdminTournaments(false)
    }
  }, [token, API_BASE_URL])

  const loadReferees = useCallback(async () => {
    if (!token) return
    setIsLoadingReferees(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/referees`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && Array.isArray(data.data?.referees)) {
        const list: RefereeListItem[] = data.data.referees.map((r: any) => ({
          id: r.id,
          name: r.displayName ?? null,
          phone: r.phone,
          status: r.status,
          createdAt: r.createdAt,
        }))
        setReferees(list)
      }
    } catch {
      // keep silent; main error surface via global error if needed
    } finally {
      setIsLoadingReferees(false)
    }
  }, [API_BASE_URL, token])

  const handleOpenTournamentDetail = useCallback(
    async (tournamentId: string) => {
      if (!token) return
      setError(null)
      setIsLoadingTournamentDetail(true)
      setIsCreatingTournament(false)
      setSelectedTournament(null)
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/admin/tournaments/${encodeURIComponent(tournamentId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        const data = await res.json()
        if (res.ok && data?.success && data.data?.tournament) {
          setSelectedTournament(data.data)
        } else {
          setError(data?.message || 'Failed to load tournament')
        }
      } catch (err) {
        setError('Cannot reach backend. Make sure the server is running.')
      } finally {
        setIsLoadingTournamentDetail(false)
      }
    },
    [API_BASE_URL, token]
  )

  const handlePublishTournament = useCallback(
    async (tournamentId: string) => {
      if (!token) return
      setError(null)
      setSuccessMessage(null)
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/admin/tournaments/${encodeURIComponent(tournamentId)}/publish`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        const data = await res.json()
        if (res.ok && data?.success) {
          setSuccessMessage('Tournament published successfully')
          await loadAdminTournaments()
        } else {
          setError(data?.message || 'Failed to publish tournament')
        }
      } catch (err) {
        setError('Cannot reach backend. Make sure the server is running.')
      }
    },
    [API_BASE_URL, token, loadAdminTournaments]
  )

  const handleOpenRefereeModal = useCallback(
    (ref?: RefereeListItem) => {
      setEditingReferee(ref ?? null)
      setShowRefereeModal(true)
    },
    [],
  )

  const handleSaveReferee = useCallback(
    async (payload: { id?: string; phone: string; name?: string; mpin?: string }) => {
      if (!token) return
      const { id, phone, name, mpin } = payload
      try {
        const url = id
          ? `${API_BASE_URL}/api/admin/referees/${encodeURIComponent(id)}`
          : `${API_BASE_URL}/api/admin/referees`
        const method = id ? 'PATCH' : 'POST'
        const body: any = id ? { name } : { phone, name, mpin }
        const res = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok || !data?.success) {
          setError(data?.message || 'Failed to save referee')
          return
        }
        setShowRefereeModal(false)
        setEditingReferee(null)
        await loadReferees()
        setSuccessMessage(id ? 'Referee updated successfully' : 'Referee created successfully')
      } catch {
        setError('Cannot reach backend. Make sure the server is running.')
      }
    },
    [API_BASE_URL, token, loadReferees],
  )

  const handleSaveTournamentDraft = useCallback(
    async (payload: any) => {
      if (!token) return
      setError(null)
      setSuccessMessage(null)
      setIsSavingTournament(true)
      try {
        if (isCreatingTournament) {
          const res = await fetch(`${API_BASE_URL}/api/admin/tournaments`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          })
          const data = await res.json()
          if (res.ok && data?.success && data.data?.tournament) {
            setIsCreatingTournament(false)
            await loadAdminTournaments()
            const createdId = data.data.tournament.tournamentId as string
            if (createdId) {
              await handleOpenTournamentDetail(createdId)
            }
            setSuccessMessage('Tournament saved as draft')
          } else {
            setError(data?.message || 'Failed to save tournament')
          }
        } else if (selectedTournament?.tournament?.tournamentId) {
          const tournamentId: string = selectedTournament.tournament.tournamentId
          const res = await fetch(
            `${API_BASE_URL}/api/admin/tournaments/${encodeURIComponent(tournamentId)}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            }
          )
          const data = await res.json()
          if (res.ok && data?.success && data.data?.tournament) {
            await loadAdminTournaments()
            await handleOpenTournamentDetail(tournamentId)
            setSuccessMessage('Tournament updated')
          } else {
            setError(data?.message || 'Failed to update tournament')
          }
        } else {
          setError('No tournament selected')
        }
      } catch (err) {
        setError('Cannot reach backend. Make sure the server is running.')
      } finally {
        setIsSavingTournament(false)
      }
    },
    [
      API_BASE_URL,
      token,
      isCreatingTournament,
      selectedTournament,
      loadAdminTournaments,
      handleOpenTournamentDetail,
    ]
  )

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

  const loadDashboardStats = useCallback(async () => {
    if (!token) return
    setDashboardError(null)
    setIsLoadingDashboard(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data?.success && data.data) {
        setDashboardStats({
          totalPlayers: data.data.totalPlayers ?? 0,
          pendingApplications: data.data.pendingApplications ?? 0,
          activeTrialsCount: data.data.activeTrialsCount ?? 0,
          coachesCount: data.data.coachesCount ?? 0,
          recentApplications: data.data.recentApplications ?? [],
        })
      } else {
        setDashboardError(data?.message || 'Failed to load dashboard stats')
      }
    } catch (err) {
      setDashboardError('Cannot reach backend. Make sure the server is running.')
    } finally {
      setIsLoadingDashboard(false)
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
    if (token && activeModuleId === 'tournaments' && me?.role === 'ADMIN') {
      void loadAdminTournaments()
    }
    if (token && activeModuleId === 'notifications' && me?.role === 'ADMIN') {
      void loadAdminTeamRequests()
    }
    if (token && activeModuleId === 'players' && me?.role === 'ADMIN') {
      void loadAdminPlayers()
    }
    if (token && activeModuleId === 'coach-management' && me?.role === 'ADMIN') {
      void loadCoaches()
    }
    if (token && activeModuleId === 'dashboard' && me?.role === 'ADMIN') {
      void loadDashboardStats()
    }
    if (token && activeModuleId === 'dashboard' && me?.role === 'COACH') {
      void loadTrials()
      void loadMyPlayers()
      void loadMyTeams()
    }
    if (token && activeModuleId === 'assigned-trials') {
      void loadTrials()
      if (me?.role === 'COACH' && teams.length === 0) void loadActiveTeams()
    }
    if (token && activeModuleId === 'my-players' && me?.role === 'COACH') {
      void loadMyPlayers()
    }
    if (token && activeModuleId === 'my-teams' && me?.role === 'COACH') {
      void loadMyTeams()
    }
    if (token && activeModuleId === 'tournament' && me?.role === 'COACH') {
      void loadCoachTournaments()
      if (myPlayers.length === 0) {
        void loadMyPlayers()
      }
    }
    if (token && activeModuleId === 'referees' && me?.role === 'ADMIN') {
      void loadReferees()
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
    loadAdminTournaments,
    loadCoaches,
    loadDashboardStats,
    loadTrials,
    loadMyPlayers,
    loadMyTeams,
    loadActiveTeams,
    loadCoachTournaments,
    loadReferees,
    teams.length,
    myPlayers.length,
    me?.role,
  ])

  async function createCoach(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return Promise.resolve()
    setError(null)
    const { fullName, phone, mpin } = createCoachForm
    if (!fullName?.trim()) {
      setError('Full name is required')
      return Promise.resolve()
    }
    if (!phone?.trim()) {
      setError('Phone number is required')
      return Promise.resolve()
    }
    if (!mpin) {
      setError('MPIN is required (4–6 digits)')
      return Promise.resolve()
    }
    if (!/^\d{4,6}$/.test(mpin)) {
      setError('MPIN must be 4–6 digits')
      return Promise.resolve()
    }

    setIsCreatingCoach(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/coaches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim(), mpin }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to create coach')
        return Promise.resolve()
      }
      setError(null)
      setSuccessMessage(`Coach created successfully. ${data.data?.coachId || ''} — they appear in User Management with role Coach and status Active.`)
      setTimeout(() => setSuccessMessage(null), 6000)
      setCreateCoachForm({ fullName: '', phone: '', mpin: '' })
      setShowCreateCoachModal(false)
      void loadCoaches()
      return Promise.resolve()
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running.')
      return Promise.resolve()
    } finally {
      setIsCreatingCoach(false)
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
        if (showCreateCoachModal) setShowCreateCoachModal(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showApplicationModal, showCreateCoachModal])

  const activeModule = availableModules.find((module) => module.id === activeModuleId)

  if (!token) {
    return (
      <SignInCard
        mode={mode}
        onSwitchMode={switchMode}
        phone={phone}
        setPhone={setPhone}
        mpin={mpin}
        setMpin={setMpin}
        signupPhone={signupPhone}
        setSignupPhone={setSignupPhone}
        signupOtp={signupOtp}
        setSignupOtp={setSignupOtp}
        signupMpin={signupMpin}
        setSignupMpin={setSignupMpin}
        signupStep={signupStep}
        signupMessage={signupMessage}
        error={error}
        onSubmit={handleSubmit}
        onResendOtp={resendSignupOtp}
      />
    )
  }

  const sidebarProps = {
    navigationItems: sidebarNavigationItems,
    activeItem: activeModuleId,
    onItemClick: handleModuleNav,
    user: {
      displayName: me?.phone,
      role: me?.role,
      status: me?.status,
      avatarInitials: me?.role?.slice(0, 1) ?? 'U',
    },
    onLogout: logout,
    branding: {
      logo: <Trophy size={20} strokeWidth={1.5} />,
      title: 'DHSA Sports',
      subtitle: me?.role ? `${me.role} access` : undefined,
    },
  }

  const authContent = (
    <>
        {isLoadingMe && <div className="status status--info"><Info size={18} className="status__icon" />Loading profile...</div>}

        {me && me.role === 'COACH' && me.status === 'INVITED' && !me.mpinHash && (
          <div className="status status--info">
            <Info size={18} className="status__icon" />
            <span><strong>Action Required:</strong> Please set your MPIN to complete your account setup. Go to <strong>Profile → Credentials</strong> tab to set your MPIN. After setting MPIN, your status will change to VERIFIED, and you'll need to wait for admin activation to become ACTIVE.</span>
          </div>
        )}

        {me && me.role === 'COACH' && me.status === 'VERIFIED' && (
          <div className="status status--info">
            <Info size={18} className="status__icon" />
            <span><strong>Waiting for Activation:</strong> Your account is verified. Please wait for an administrator to activate your account. Once activated, your status will change to ACTIVE and you'll have full access.</span>
          </div>
        )}

        {me && !userRole && (
          <div className="status status--error">
            <AlertCircle size={18} className="status__icon" />
            <span><strong>Warning:</strong> User role not recognized. Please refresh or contact support.</span>
          </div>
        )}

        <section className="content" data-module={activeModuleId}>
                  {activeModuleId !== 'users' && activeModuleId !== 'players' && activeModuleId !== 'assigned-trials' && activeModuleId !== 'tournaments' && (
                    <div className="content__header">
                      <div>
                        <p className="content__title">{activeModuleId === 'application' ? 'My Application' : (activeModule?.label || 'Module')}</p>
                        <p className="muted">
                          {activeModuleId === 'application'
                            ? 'Complete your application'
                            : activeModuleId === 'dashboard'
                              ? me?.role === 'ADMIN'
                                ? 'Manage users, players, teams, and applications'
                                : 'View your profile and activity'
                              : activeModuleId === 'documents'
                                ? 'View and manage your documents'
                                : activeModuleId === 'notifications'
                                  ? 'Stay updated with notifications'
                                  : me?.role === 'ADMIN'
                                    ? 'Manage users, players, teams, and applications'
                                    : me?.role === 'COACH'
                                      ? 'Manage your teams and trials'
                                      : me?.role === 'PLAYER'
                                        ? 'View your profile and documents'
                                        : me?.role === 'USER'
                                          ? 'Complete your application'
                                          : 'View'}
                        </p>
                      </div>
                      {(activeModule?.tabs?.length ?? 0) > 0 && activeModuleId !== 'application' && (
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
                      )}
                      {activeModuleId === 'application' && (activeModule?.tabs?.length ?? 0) > 0 && (
                        <div className="segmented-control">
                          <div className="segmented-control__track">
                            <div
                              className="segmented-control__indicator"
                              style={{
                                width: `${100 / (activeModule?.tabs?.length ?? 1)}%`,
                                left: `${(Math.max(0, activeModule?.tabs?.indexOf(activeTab) ?? 0) / (activeModule?.tabs?.length ?? 1)) * 100}%`,
                              }}
                            />
                            {(activeModule?.tabs || []).map((tab) => (
                              <button
                                key={tab}
                                type="button"
                                className={`segmented-control__option ${activeTab === tab ? 'segmented-control__option--active' : ''}`}
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
                      )}
                    </div>
                  )}

                  {activeModuleId === 'dashboard' && me?.role === 'ADMIN' ? (
                    <DashboardContent
                      apiBaseUrl={API_BASE_URL}
                      stats={dashboardStats ? { totalPlayers: dashboardStats.totalPlayers, pendingApplications: dashboardStats.pendingApplications, activeTrialsCount: dashboardStats.activeTrialsCount, coachesCount: dashboardStats.coachesCount } : undefined}
                      recentApplications={dashboardStats?.recentApplications}
                      isLoading={isLoadingDashboard}
                      error={dashboardError}
                      onNavigate={(moduleId) => setActiveModuleId(moduleId)}
                      onCreateCoach={() => setShowCreateCoachModal(true)}
                      onActiveTeams={() => setActiveModuleId('teams')}
                    />
                  ) : activeModuleId === 'dashboard' && me?.role === 'COACH' ? (
                    <CoachDashboardContent
                      trials={trials}
                      myPlayers={myPlayers}
                      myTeams={myTeams}
                      isLoading={isLoadingTrials || isLoadingPlayers || isLoadingMyTeams}
                      apiBaseUrl={API_BASE_URL}
                      onNavigate={handleModuleNav}
                      onSelectTrial={(t) => {
                        setSelectedTrial(t)
                        handleModuleNav('assigned-trials')
                      }}
                    />
                  ) : activeModuleId === 'dashboard' ? (
                    <div className="empty-state">
                      <p className="empty-state__title">Dashboard</p>
                      <p className="muted">View your profile and activity.</p>
                    </div>
                  ) : activeModuleId === 'users' && me?.role === 'ADMIN' ? (
                    <>
                      <UserManagementPage
                        users={adminUsers}
                        isLoading={isLoadingUsers}
                        usersSearch={usersSearch}
                        onSearchChange={setUsersSearch}
                        activeTab={activeTab}
                        onTabChange={(tab) => {
                          setActiveTab(tab)
                          setUsersPage(1)
                          setError(null)
                          setSuccessMessage(null)
                        }}
                        onFilterClick={() => setShowUsersFilterSheet(true)}
                        onAddUser={() => setShowCreateCoachModal(true)}
                        usersPage={usersPage}
                        usersTotalPages={usersTotalPages}
                        usersTotal={usersTotal}
                        onPrevPage={() => setUsersPage((p) => Math.max(1, p - 1))}
                        onNextPage={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
                        apiBaseUrl={API_BASE_URL}
                        authToken={token}
                        onUserUpdated={() => {
                          void loadUsers({
                            role: getUsersRoleFilter(activeTab),
                            page: usersPage,
                            search: usersSearch.trim() || undefined,
                          })
                        }}
                      />
                      {showUsersFilterSheet && (
                        <div className="filter-sheet-overlay" onClick={() => setShowUsersFilterSheet(false)} aria-hidden="false">
                          <div className="filter-sheet" onClick={(e) => e.stopPropagation()}>
                            <div className="filter-sheet__header">
                              <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Filter by Role</h4>
                              <button type="button" className="modal-close" onClick={() => setShowUsersFilterSheet(false)} aria-label="Close"><X size={20} strokeWidth={2} /></button>
                            </div>
                            <div className="filter-sheet__body">
                              {(activeModule?.tabs || []).map((tab) => (
                                <button
                                  key={tab}
                                  type="button"
                                  className={`button ${activeTab === tab ? 'button--primary' : 'button--ghost'}`}
                                  onClick={() => {
                                    setActiveTab(tab)
                                    setShowUsersFilterSheet(false)
                                    setUsersPage(1)
                                    void loadUsers({ role: getUsersRoleFilter(tab), page: 1, search: usersSearch.trim() || undefined })
                                  }}
                                >
                                  {tab}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : activeModuleId === 'players' && me?.role === 'ADMIN' ? (
                    selectedAdminPlayer ? (
                      <div className="min-h-0 flex flex-col rounded-xl p-4 sm:p-6 bg-gray-50 overflow-auto" style={{ background: 'var(--color-bg-body)' }}>
                        <div className="flex items-center gap-3 mb-6">
                          <button
                            type="button"
                            className="button button--ghost"
                            onClick={() => { setSelectedAdminPlayer(null); setPlayerProfileTab('core') }}
                            disabled={isLoadingSelectedPlayer}
                          >
                            ← Back to Players
                          </button>
                        </div>
                        {isLoadingSelectedPlayer ? (
                          <div className="status status--info"><Info size={18} className="status__icon" />Loading player profile...</div>
                        ) : (() => {
                        const pd = selectedAdminPlayer
                        const pl = pd?.player
                        const app = pd?.application
                        const docs = Array.isArray(pd?.documents) ? pd.documents : []
                        const normImgUrl = (url: string | null | undefined) => {
                          if (!url) return null
                          if (url.startsWith('http')) return url
                          return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`
                        }
                        const photoDoc = docs.find((d: any) => d.documentType === 'PHOTO') || docs.find((d: any) => d.documentType === 'ID_PROOF') || docs.find((d: any) => d.documentType === 'ID_CARD')
                        const profilePhotoUrl = normImgUrl(photoDoc?.fileUrl) || normImgUrl(pl?.photo) || null
                        const fullName = app?.fullName || pl?.displayName || '—'
                        const playerDocs = docs.filter((d: any) => d.ownerType === 'PLAYER')
                        const applicationDocs = docs.filter((d: any) => d.ownerType === 'PLAYER_APPLICATION')
                        return (
                          <div className="player-profile-module">
                            <div className="tabs" style={{ marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                              {(['core', 'personal', 'documents', 'medical', 'career', 'tournament'] as const).map((tabId) => (
                                <button
                                  key={tabId}
                                  type="button"
                                  className={`tab ${playerProfileTab === tabId ? 'tab--active' : ''}`}
                                  onClick={() => setPlayerProfileTab(tabId)}
                                >
                                  {tabId === 'core' && 'Core Football Identity'}
                                  {tabId === 'personal' && 'Personal Profile'}
                                  {tabId === 'documents' && 'Player Documents'}
                                  {tabId === 'medical' && 'Medical'}
                                  {tabId === 'career' && 'Player Career Stats'}
                                  {tabId === 'tournament' && 'Tournament Stats'}
                                </button>
                              ))}
                            </div>
                            {playerProfileTab === 'core' && (
                              <div className="profile-card player-profile-section">
                                <div className="player-profile-header" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap' }}>
                                  {profilePhotoUrl ? (
                                    <img src={profilePhotoUrl} alt="Profile" style={{ width: '96px', height: '96px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                                  ) : (
                                    <div style={{ width: '96px', height: '96px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}><UserCircle size={48} strokeWidth={1.5} /></div>
                                  )}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p className="profile-card__value" style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: 700 }}>{fullName}</p>
                                    <div className="profile-card__grid" style={{ marginTop: 0 }}>
                                      <div><p className="profile-card__label">Player ID</p><p className="profile-card__value">{pl?.playerId || '—'}</p></div>
                                      <div><p className="profile-card__label">Gender</p><p className="profile-card__value">{pl?.gender || '—'}</p></div>
                                      <div><p className="profile-card__label">Date of Birth</p><p className="profile-card__value">{pl?.dateOfBirth ? new Date(pl.dateOfBirth).toLocaleDateString() : '—'}</p></div>
                                    </div>
                                  </div>
                                </div>
                                <h4 className="player-profile-section__title">Football Classification</h4>
                                <div className="profile-card__grid">
                                  <div><p className="profile-card__label">Primary Position</p><p className="profile-card__value">{typeof pl?.primaryPosition === 'string' && pl.primaryPosition.startsWith('[') ? (() => { try { const arr = JSON.parse(pl.primaryPosition); return Array.isArray(arr) ? arr.join(', ') : pl.primaryPosition; } catch { return pl.primaryPosition; } })() : (pl?.primaryPosition || '—')}</p></div>
                                  <div><p className="profile-card__label">Dominant Foot</p><p className="profile-card__value">{pl?.dominantFoot || '—'}</p></div>
                                </div>
                                <h4 className="player-profile-section__title" style={{ marginTop: '20px' }}>Status</h4>
                                <p className="profile-card__value" style={{ fontWeight: 600, color: pl?.footballStatus === 'ACTIVE' ? '#10b981' : pl?.footballStatus === 'SUSPENDED' ? '#dc2626' : '#f59e0b' }}>
                                  {pl?.footballStatus || '—'}
                                </p>
                              </div>
                            )}
                            {playerProfileTab === 'personal' && (
                              <div className="profile-card player-profile-section personal-tab">
                                <div className="personal-tab__block">
                                  <h4 className="personal-tab__block-title">Physical attributes</h4>
                                  <div className="profile-card__grid">
                                    <div><p className="profile-card__label">Height (cm)</p><p className="profile-card__value">{app?.height ?? pl?.height ?? '—'}</p></div>
                                    <div><p className="profile-card__label">Weight (kg)</p><p className="profile-card__value">{app?.weight ?? pl?.weight ?? '—'}</p></div>
                                  </div>
                                </div>
                                <div className="personal-tab__block">
                                  <h4 className="personal-tab__block-title">Location & preferences</h4>
                                  <div className="profile-card__grid">
                                    <div><p className="profile-card__label">Nationality</p><p className="profile-card__value">{pl?.nationality || app?.nationality || '—'}</p></div>
                                    <div><p className="profile-card__label">City</p><p className="profile-card__value">{pl?.city || app?.city || '—'}</p></div>
                                    <div><p className="profile-card__label">State</p><p className="profile-card__value">{pl?.state || app?.state || '—'}</p></div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {playerProfileTab === 'documents' && (
                              <div className="profile-card player-profile-section">
                                <h4 className="player-profile-section__title">Uploaded Documents</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {(playerDocs.length > 0 ? playerDocs : docs).map((d: any) => (
                                    <div key={d.id || `${d.documentType}-${String(d.createdAt || '')}`} className="profile-card profile-card--compact" style={{ marginBottom: 0 }}>
                                      <div className="profile-card__grid">
                                        <div><p className="profile-card__label">Type</p><p className="profile-card__value">{d.documentType}</p></div>
                                        <div><p className="profile-card__label">Status</p><p className="profile-card__value">{d.verificationStatus}</p></div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                          <button className="button button--ghost" type="button" onClick={() => d.id && openDocumentPreview(d.id).catch((e: any) => setError(e?.message || 'Failed to open document'))} disabled={!d.id}><Eye size={16} strokeWidth={2} /> View</button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {docs.length === 0 && <div className="muted">No documents found.</div>}
                                </div>
                                {applicationDocs.length > 0 && (
                                  <>
                                    <h4 className="player-profile-section__title" style={{ marginTop: '24px' }}>Approved Application Files</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {applicationDocs.map((d: any) => (
                                        <div key={d.id || `${d.documentType}-${String(d.createdAt || '')}`} className="profile-card profile-card--compact" style={{ marginBottom: 0 }}>
                                          <div className="profile-card__grid">
                                            <div><p className="profile-card__label">Type</p><p className="profile-card__value">{d.documentType}</p></div>
                                            <div><p className="profile-card__label">Status</p><p className="profile-card__value">{d.verificationStatus}</p></div>
                                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                              <button className="button button--ghost" type="button" onClick={() => d.id && openDocumentPreview(d.id).catch((e: any) => setError(e?.message || 'Failed to open document'))} disabled={!d.id}><Eye size={16} strokeWidth={2} /> View</button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                            {playerProfileTab === 'medical' && (
                              <div className="profile-card player-profile-section">
                                <h4 className="player-profile-section__title">Emergency Contact</h4>
                                <div className="profile-card__grid">
                                  {(() => {
                                    const raw = (app as any)?.emergencyContactsJson as string | undefined
                                    if (typeof raw === 'string' && raw.trim().startsWith('[')) {
                                      try {
                                        const parsed = JSON.parse(raw) as unknown
                                        if (Array.isArray(parsed) && parsed.length > 0) {
                                          const contacts = parsed
                                            .map((c: any) => ({
                                              name: String(c?.name || '').trim(),
                                              phone: String(c?.phone || '').trim(),
                                              relation: String(c?.relation || '').trim(),
                                            }))
                                            .filter((c) => c.name || c.phone || c.relation)

                                          if (contacts.length > 0) {
                                            return contacts.map((c, idx) => (
                                              <div key={`${c.phone || c.name || idx}-${idx}`} style={{ gridColumn: '1 / -1' }}>
                                                <p className="profile-card__label">
                                                  {contacts.length > 1 ? `Emergency Contact ${idx + 1}` : 'Emergency Contact'}
                                                </p>
                                                <p className="profile-card__value">
                                                  {[c.name, c.phone, c.relation].filter(Boolean).join(' · ') || '—'}
                                                </p>
                                              </div>
                                            ))
                                          }
                                        }
                                      } catch {
                                        // fall through to single-contact view
                                      }
                                    }

                                    return (
                                      <>
                                        <div>
                                          <p className="profile-card__label">Emergency Contact Name</p>
                                          <p className="profile-card__value">{pl?.emergencyContactName || app?.emergencyContactName || '—'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Emergency Contact Phone</p>
                                          <p className="profile-card__value">{pl?.emergencyContactPhone || app?.emergencyContactPhone || '—'}</p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Relationship</p>
                                          <p className="profile-card__value">{pl?.emergencyContactRelation || app?.emergencyContactRelation || '—'}</p>
                                        </div>
                                      </>
                                    )
                                  })()}
                                </div>
                              </div>
                            )}
                            {playerProfileTab === 'career' && (
                              <div className="profile-card player-profile-section">
                                <h4 className="player-profile-section__title">Lifetime Summary</h4>
                                <div className="profile-card__grid" style={{ marginBottom: '16px' }}>
                                  <div><p className="profile-card__label">Matches Played</p><p className="profile-card__value">{pl?.matchesPlayed ?? 0}</p></div>
                                  <div><p className="profile-card__label">Minutes Played</p><p className="profile-card__value">{pl?.minutesPlayed ?? 0}</p></div>
                                  <div><p className="profile-card__label">Goals</p><p className="profile-card__value">{pl?.goals ?? 0}</p></div>
                                  <div><p className="profile-card__label">Assists</p><p className="profile-card__value">{pl?.assists ?? 0}</p></div>
                                  <div><p className="profile-card__label">Yellow Cards</p><p className="profile-card__value">{pl?.yellowCards ?? 0}</p></div>
                                  <div><p className="profile-card__label">Red Cards</p><p className="profile-card__value">{pl?.redCards ?? 0}</p></div>
                                </div>
                                <h4 className="player-profile-section__title">Context Strip</h4>
                                <p className="muted" style={{ marginBottom: '16px' }}>Career Span — · 0 Tournaments · 0 Teams · 0 Seasons</p>
                                <h4 className="player-profile-section__title">Discipline Snapshot</h4>
                                <div className="profile-card__grid">
                                  <div><p className="profile-card__label">Total Yellow Cards</p><p className="profile-card__value">{pl?.yellowCards ?? 0}</p></div>
                                  <div><p className="profile-card__label">Total Red Cards</p><p className="profile-card__value">{pl?.redCards ?? 0}</p></div>
                                </div>
                              </div>
                            )}
                            {playerProfileTab === 'tournament' && (
                              <div className="profile-card player-profile-section">
                                <h4 className="player-profile-section__title">Tournament Summary</h4>
                                <div className="profile-card__grid">
                                  <div><p className="profile-card__label">Matches Played</p><p className="profile-card__value">{0}</p></div>
                                  <div><p className="profile-card__label">Minutes Played</p><p className="profile-card__value">{0}</p></div>
                                  <div><p className="profile-card__label">Goals</p><p className="profile-card__value">{0}</p></div>
                                  <div><p className="profile-card__label">Assists</p><p className="profile-card__value">{0}</p></div>
                                  <div><p className="profile-card__label">Yellow Cards</p><p className="profile-card__value">{0}</p></div>
                                  <div><p className="profile-card__label">Red Cards</p><p className="profile-card__value">{0}</p></div>
                                </div>
                                <p className="muted" style={{ marginTop: '12px' }}>Competition-specific stats will appear when tournament data is available.</p>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  ) : (
                    <AdminPlayersPage
                      players={adminPlayers.map((p: any) => ({
                        id: p.id,
                        name: p.user?.application?.fullName || p.displayName || '—',
                        team: Array.isArray(p.assignedTeamNames) && p.assignedTeamNames.length > 0 ? p.assignedTeamNames.join(', ') : '—',
                        status: (p.user?.status ?? p.footballStatus ?? 'ACTIVE').toString().toUpperCase(),
                        avatar: p.photo ? (p.photo.startsWith('http') ? p.photo : `${API_BASE_URL}${p.photo.startsWith('/') ? p.photo : `/${p.photo}`}`) : null,
                        phone: p.user?.phone ?? null,
                        date: p.createdAt || p.user?.createdAt || null,
                      }))}
                      playersSearch={playersSearch}
                      onSearchChange={setPlayersSearch}
                      onFilter={() => {}}
                      onRefresh={() => void loadAdminPlayers()}
                      onViewPlayer={(id) => void loadAdminPlayerProfile(id)}
                      isLoading={isLoadingAdminPlayers}
                      isLoadingProfile={isLoadingSelectedPlayer}
                      playersPage={playersPage}
                      playersTotalPages={playersTotalPages}
                      playersTotal={playersTotal}
                      onPrevPage={() => setPlayersPage((p) => Math.max(1, p - 1))}
                      onNextPage={() => setPlayersPage((p) => Math.min(playersTotalPages, p + 1))}
                    />
                  )
                  ) : activeModuleId === 'coach-management' ? (
                    <div className="coach-management-module">
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
                          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Coach Management</h3>
                          <p className="muted" style={{ margin: '4px 0 0' }}>
                            View active coaches and create new coach accounts. Admin-controlled, invite-free flow.
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            className="button button--ghost"
                            type="button"
                            onClick={() => {
                              if (isLoadingCoaches) return
                              void loadCoaches()
                            }}
                            disabled={isLoadingCoaches}
                          >
                            <RefreshCw size={16} strokeWidth={2} /> Refresh
                          </button>
                          <button
                            className="button button--primary"
                            type="button"
                            onClick={() => setShowCreateCoachModal(true)}
                          >
                            <Plus size={16} strokeWidth={2} /> Create Coach
                          </button>
                        </div>
                      </div>

                      {isLoadingCoaches ? (
                        <div className="status status--info"><Info size={18} className="status__icon" />Loading coaches...</div>
                      ) : (
                        <>
                          {coaches.filter((c: any) => c.status === 'ACTIVE').length > 0 ? (
                            <div className="admin-players-list">
                              {coaches
                                .filter((c: any) => c.status === 'ACTIVE')
                                .map((coach: any) => {
                                  const displayName =
                                    coach.displayName || coach.user?.phone || coach.coachId || '—'
                                  const initial =
                                    displayName !== '—'
                                      ? displayName.trim().charAt(0).toUpperCase()
                                      : '?'
                                  const statusClass =
                                    coach.status === 'ACTIVE'
                                      ? 'admin-player-card__status--active'
                                      : coach.status === 'SUSPENDED'
                                      ? 'admin-player-card__status--suspended'
                                      : 'admin-player-card__status--inactive'
                                  return (
                                    <div key={coach.id} className="admin-player-card">
                                      <div className="admin-player-card__photo">
                                        <span>{initial}</span>
                                      </div>
                                      <div className="admin-player-card__name">
                                        {displayName}
                                      </div>
                                      <div className="admin-player-card__team">
                                        <span style={{ fontWeight: 500 }}>Coach ID:</span>{' '}
                                        <span>{coach.coachId}</span>
                                      </div>
                                      <div className="admin-player-card__date">
                                        <span style={{ fontWeight: 500 }}>Phone:</span>{' '}
                                        <span>{coach.user?.phone || '—'}</span>
                                      </div>
                                      <div
                                        className={`admin-player-card__status ${statusClass}`}
                                      >
                                        {coach.status}
                                      </div>
                                      <div className="admin-player-card__action">
                                        <button
                                          className="button button--primary"
                                          type="button"
                                        >
                                          View Coach Profile
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                          ) : (
                            <div className="empty-state">
                              <p className="empty-state__title">No active coaches</p>
                              <p className="muted">
                                Active coach accounts will appear here after you create them. Use the Create Coach button
                                to add your first coach.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : activeModuleId === 'applications' && me?.role === 'ADMIN' ? (
                    <div className="applications-module">
                      {isLoadingApplications ? (
                        <div className="status status--info"><Info size={18} className="status__icon" />Loading applications...</div>
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
                            {(() => {
                              const snapshot = selectedApplication.evaluationSnapshot as any | undefined
                              const playerSnapshot = snapshot?.playerSnapshot || {}
                              const playingProfile = snapshot?.playingProfile || {}
                              const locationAndPreferences = snapshot?.locationAndPreferences || {}
                              const contactInformation = snapshot?.contactInformation || {}
                              const medicalCheck = snapshot?.medicalCheck || {}
                              const trialEvaluation = snapshot?.trialEvaluation || {}
                              const docs = (snapshot?.documents as any[]) || selectedApplication.documents || []

                              return (
                                <>
                                  {/* Player Snapshot */}
                                  <h4 style={{ marginBottom: '8px' }}>Player Snapshot</h4>
                                  <div className="profile-card__grid" style={{ marginBottom: '16px' }}>
                                    <div>
                                      <p className="profile-card__label">Full Name</p>
                                      <p className="profile-card__value">{playerSnapshot.fullName || selectedApplication.fullName}</p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Date of Birth</p>
                                      <p className="profile-card__value">
                                        {playerSnapshot.dateOfBirth
                                          ? new Date(playerSnapshot.dateOfBirth).toLocaleDateString()
                                          : selectedApplication.dateOfBirth
                                            ? new Date(selectedApplication.dateOfBirth).toLocaleDateString()
                                            : 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Gender</p>
                                      <p className="profile-card__value">{playerSnapshot.gender || selectedApplication.gender || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Height</p>
                                      <p className="profile-card__value">
                                        {playerSnapshot.height || selectedApplication.height
                                          ? `${playerSnapshot.height || selectedApplication.height} cm`
                                          : 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Weight</p>
                                      <p className="profile-card__value">
                                        {playerSnapshot.weight || selectedApplication.weight
                                          ? `${playerSnapshot.weight || selectedApplication.weight} kg`
                                          : 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Nationality</p>
                                      <p className="profile-card__value">
                                        {playerSnapshot.nationality || selectedApplication.nationality || 'N/A'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Playing Profile */}
                                  <h4 style={{ marginBottom: '8px' }}>Playing Profile</h4>
                                  <div className="profile-card__grid" style={{ marginBottom: '16px' }}>
                                    <div>
                                      <p className="profile-card__label">Sport</p>
                                      <p className="profile-card__value">{playingProfile.sport || selectedApplication.sport || 'Football'}</p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Position(s)</p>
                                      <p className="profile-card__value">
                                        {(() => {
                                          const raw = playingProfile.primaryPosition || selectedApplication.primaryPosition
                                          if (!raw) return 'N/A'
                                          try {
                                            const arr = JSON.parse(raw)
                                            if (Array.isArray(arr)) return arr.join(', ')
                                          } catch {
                                            /* ignore */
                                          }
                                          return raw
                                        })()}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Dominant Foot</p>
                                      <p className="profile-card__value">
                                        {playingProfile.dominantFoot || selectedApplication.dominantFoot || 'N/A'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Location & Preferences */}
                                  <h4 style={{ marginBottom: '8px' }}>Location & Preferences</h4>
                                  <div className="profile-card__grid" style={{ marginBottom: '16px' }}>
                                    <div>
                                      <p className="profile-card__label">City</p>
                                      <p className="profile-card__value">
                                        {locationAndPreferences.city || selectedApplication.city || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">District</p>
                                      <p className="profile-card__value">
                                        {locationAndPreferences.district || selectedApplication.district || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">State</p>
                                      <p className="profile-card__value">
                                        {locationAndPreferences.state || selectedApplication.state || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Pincode</p>
                                      <p className="profile-card__value">
                                        {locationAndPreferences.pincode || selectedApplication.pincode || 'N/A'}
                                      </p>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                      <p className="profile-card__label">Preferred Teams</p>
                                      <p className="profile-card__value">
                                        {(() => {
                                          const names = locationAndPreferences.preferredTeamNames || (selectedApplication as any).preferredTeamNames
                                          if (Array.isArray(names) && names.length > 0) return names.join(', ')
                                          const raw = locationAndPreferences.preferredTeamIds || selectedApplication.preferredTeamIds
                                          if (!raw) return 'N/A'
                                          try {
                                            const arr = Array.isArray(raw) ? raw : JSON.parse(raw)
                                            if (Array.isArray(arr) && arr.length > 0) return arr.join(', ')
                                          } catch {
                                            /* ignore */
                                          }
                                          return typeof raw === 'string' ? raw : 'N/A'
                                        })()}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Contact Information */}
                                  <h4 style={{ marginBottom: '8px' }}>Contact Information</h4>
                                  <div className="profile-card__grid" style={{ marginBottom: '16px' }}>
                                    <div>
                                      <p className="profile-card__label">Player Phone</p>
                                      <p className="profile-card__value">
                                        {contactInformation.playerPhone || selectedApplication.playerPhone || selectedApplication.user?.phone || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Player Email</p>
                                      <p className="profile-card__value">
                                        {contactInformation.playerEmail || (selectedApplication as any).playerEmail || selectedApplication.user?.email || 'N/A'}
                                      </p>
                                    </div>
                                    {(() => {
                                      const raw = (selectedApplication as any).emergencyContactsJson as string | undefined
                                      if (typeof raw === 'string' && raw.trim().startsWith('[')) {
                                        try {
                                          const parsed = JSON.parse(raw) as unknown
                                          if (Array.isArray(parsed) && parsed.length > 0) {
                                            const contacts = parsed
                                              .map((c: any) => ({
                                                name: String(c?.name || '').trim(),
                                                phone: String(c?.phone || '').trim(),
                                                relation: String(c?.relation || '').trim(),
                                              }))
                                              .filter((c) => c.name || c.phone || c.relation)

                                            if (contacts.length > 0) {
                                              return contacts.map((c, idx) => (
                                                <div key={`${c.phone || c.name || idx}-${idx}`} style={{ gridColumn: '1 / -1' }}>
                                                  <p className="profile-card__label">
                                                    {contacts.length > 1 ? `Emergency Contact ${idx + 1}` : 'Emergency Contact'}
                                                  </p>
                                                  <p className="profile-card__value">
                                                    {[c.name, c.phone, c.relation].filter(Boolean).join(' · ') || 'N/A'}
                                                  </p>
                                                </div>
                                              ))
                                            }
                                          }
                                        } catch {
                                          // fall back below
                                        }
                                      }

                                      return (
                                        <>
                                          <div>
                                            <p className="profile-card__label">Emergency Contact</p>
                                            <p className="profile-card__value">
                                              {contactInformation.emergencyContactName || selectedApplication.emergencyContactName || 'N/A'}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="profile-card__label">Emergency Phone</p>
                                            <p className="profile-card__value">
                                              {contactInformation.emergencyContactPhone || selectedApplication.emergencyContactPhone || 'N/A'}
                                            </p>
                                          </div>
                                        </>
                                      )
                                    })()}
                                  </div>

                                  {/* Documents */}
                                  <h4 style={{ marginBottom: '8px' }}>Documents</h4>
                                  {docs.length > 0 ? (
                                    <div style={{ marginBottom: '16px' }}>
                                      {docs.map((doc) => (
                                        <div
                                          key={doc.id || `${doc.ownerId}-${doc.documentType}`}
                                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}
                                          className="muted"
                                        >
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <span style={{ fontWeight: 600 }}>{doc.documentType}</span>
                                            {doc.fileName ? ` – ${doc.fileName}` : ''}
                                          </div>
                                          {doc.fileUrl && (
                                            <button
                                              type="button"
                                              className="button button--primary"
                                              style={{ padding: '4px 10px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                              onClick={() => {
                                                const base = doc.fileUrl.startsWith('http') ? '' : API_BASE_URL
                                                const path = doc.fileUrl.startsWith('/') ? doc.fileUrl : `/${doc.fileUrl}`
                                                window.open(doc.fileUrl.startsWith('http') ? doc.fileUrl : `${base}${path}`, '_blank', 'noopener,noreferrer')
                                              }}
                                            >
                                              View
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="muted" style={{ marginBottom: '16px' }}>No documents linked to this application.</p>
                                  )}

                                  {/* Medical Check */}
                                  <h4 style={{ marginBottom: '8px' }}>Medical Check (Football)</h4>
                                  <div className="profile-card__grid" style={{ marginBottom: '16px' }}>
                                    <div>
                                      <p className="profile-card__label">Checklist Verified by Coach</p>
                                      <p className="profile-card__value">
                                        {medicalCheck.verified === true
                                          ? 'Yes'
                                          : medicalCheck.verified === false
                                            ? 'No'
                                            : trialEvaluation.status
                                              ? 'No medical checklist submitted'
                                              : 'N/A'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Checklist details (separate section) */}
                                  {medicalCheck.checklist && (
                                    <div style={{ marginBottom: '16px' }}>
                                      <p className="profile-card__label">Checklist Responses</p>
                                      <div className="medical-checklist">
                                        {(() => {
                                          const entries = Object.entries(
                                            medicalCheck.checklist as Record<
                                              string,
                                              { question?: string; yes?: boolean; no?: boolean }
                                            >
                                          );

                                          if (entries.length === 0) {
                                            return (
                                              <p className="muted" style={{ margin: 0 }}>
                                                No checklist answers recorded.
                                              </p>
                                            );
                                          }

                                          return entries.map(([key, item]) => {
                                            const label = item.question || key;
                                            const answeredYes = item.yes === true;
                                            const answeredNo = item.no === true;

                                            return (
                                              <div className="medical-checklist__row" key={key}>
                                                <div className="medical-checklist__question">
                                                  <span className="medical-checklist__q-label">
                                                    {key.toUpperCase()}
                                                  </span>
                                                  <span className="medical-checklist__q-text">
                                                    {label}
                                                  </span>
                                                </div>
                                                <div className="medical-checklist__answers">
                                                  <span
                                                    className={
                                                      'pill pill--yes' +
                                                      (answeredYes ? ' pill--active' : ' pill--muted')
                                                    }
                                                  >
                                                    Yes
                                                  </span>
                                                  <span
                                                    className={
                                                      'pill pill--no' +
                                                      (answeredNo ? ' pill--active' : ' pill--muted')
                                                    }
                                                  >
                                                    No
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          });
                                        })()}
                                      </div>
                                    </div>
                                  )}

                                  <div className="profile-card__grid" style={{ marginBottom: '16px' }}>
                                    <div>
                                      <p className="profile-card__label">Medical Report</p>
                                      {medicalCheck.medicalReport?.fileUrl ? (
                                        <button
                                          type="button"
                                          className="button button--primary"
                                          style={{ padding: '6px 14px', fontSize: '0.875rem' }}
                                          onClick={() => {
                                            const doc = medicalCheck.medicalReport as any
                                            const base = doc.fileUrl?.startsWith('http') ? '' : API_BASE_URL
                                            const path = (doc.fileUrl || '').startsWith('/') ? doc.fileUrl : `/${doc.fileUrl || ''}`
                                            window.open(doc.fileUrl?.startsWith('http') ? doc.fileUrl : `${base}${path}`, '_blank', 'noopener,noreferrer')
                                          }}
                                        >
                                          View Medical Report
                                        </button>
                                      ) : (
                                        <p className="profile-card__value">
                                          {medicalCheck.medicalReport?.fileName || medicalCheck.medicalReport?.documentType
                                            ? medicalCheck.medicalReport.fileName || medicalCheck.medicalReport.documentType
                                            : 'Not uploaded'}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Trial Evaluation */}
                                  <h4 style={{ marginBottom: '8px' }}>Trial Evaluation</h4>
                                  <div className="profile-card__grid">
                                    <div>
                                      <p className="profile-card__label">Status</p>
                                      <p className="profile-card__value">
                                        {trialEvaluation.status || selectedApplication.trialStatus || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Outcome</p>
                                      <p className="profile-card__value" style={{
                                        color: (trialEvaluation.outcome || selectedApplication.trial?.outcome) === 'RECOMMENDED' ? '#10b981' : '#ef4444',
                                        fontWeight: 'bold',
                                      }}>
                                        {trialEvaluation.outcome || selectedApplication.trial?.outcome || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="profile-card__label">Evaluated At</p>
                                      <p className="profile-card__value">
                                        {trialEvaluation.evaluatedAt
                                          ? new Date(trialEvaluation.evaluatedAt).toLocaleString()
                                          : selectedApplication.trial?.evaluatedAt
                                            ? new Date(selectedApplication.trial.evaluatedAt).toLocaleString()
                                            : 'N/A'}
                                      </p>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                      <p className="profile-card__label">Coach</p>
                                      <p className="profile-card__value">
                                        {trialEvaluation.assignedCoach
                                          ? `${trialEvaluation.assignedCoach.displayName || trialEvaluation.assignedCoach.coachId || 'Coach'} (${trialEvaluation.assignedCoach.phone || 'No phone'})`
                                          : selectedApplication.trial?.assignedCoach
                                            ? selectedApplication.trial.assignedCoach.displayName || selectedApplication.trial.assignedCoach.coachId
                                            : 'N/A'}
                                      </p>
                                    </div>
                                    {trialEvaluation.notes && (
                                      <div style={{ gridColumn: '1 / -1' }}>
                                        <p className="profile-card__label">Coach Remarks</p>
                                        <p className="profile-card__value">{trialEvaluation.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )
                            })()}
                            {selectedApplication.trial?.outcome === 'RECOMMENDED' && selectedApplication.status !== 'APPROVED' && (
                              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                                <div className="status status--info" style={{ marginBottom: '16px' }}>
                                  <Info size={18} className="status__icon" />
                                  <div><strong>Ready for Approval</strong><p>Trial outcome is RECOMMENDED. You can approve this application to create a player profile.</p></div>
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
                                <table className="trials-table">
                                  <thead>
                                    <tr>
                                      <th>Player Name</th>
                                      <th>Team</th>
                                      <th>Coach</th>
                                      <th>Trial Outcome</th>
                                      <th>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {applications.filter(a => a.status === 'SUBMITTED').map((app) => (
                                      <tr key={app.id}>
                                        <td style={{ fontWeight: 600 }}>
                                          {app.fullName}
                                        </td>
                                        <td>
                                          {(() => {
                                            const fromApi = (app as any).preferredTeamNames as string[] | undefined
                                            if (fromApi && fromApi.length > 0) return fromApi.join(', ')
                                            const raw = app.preferredTeamIds as string | string[] | null | undefined
                                            if (!raw) return '—'
                                            try {
                                              if (Array.isArray(raw)) {
                                                return raw.length > 0 ? raw.join(', ') : '—'
                                              }
                                              const parsed = JSON.parse(raw) as string[]
                                              if (Array.isArray(parsed) && parsed.length > 0) {
                                                return parsed.join(', ')
                                              }
                                            } catch {
                                              // fall through
                                            }
                                            return typeof raw === 'string' && raw.trim().length > 0 ? raw : '—'
                                          })()}
                                        </td>
                                        <td>
                                          {app.trial?.assignedCoach
                                            ? app.trial.assignedCoach.displayName ||
                                              app.trial.assignedCoach.coachId ||
                                              'Assigned coach'
                                            : 'Unassigned'}
                                        </td>
                                        <td>
                                          {(() => {
                                            const outcome = app.trial?.outcome
                                            const color =
                                              outcome === 'RECOMMENDED'
                                                ? '#10b981'
                                                : outcome
                                                  ? '#ef4444'
                                                  : '#6b7280'
                                            return (
                                              <span style={{ color, fontWeight: 600 }}>
                                                {outcome || 'Pending'}
                                              </span>
                                            )
                                          })()}
                                        </td>
                                        <td className="trials-table__action">
                                          <button
                                            type="button"
                                            className="button button--primary"
                                            style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                                            onClick={() => setSelectedApplication(app)}
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
                                <table className="trials-table">
                                  <thead>
                                    <tr>
                                      <th>Player Name</th>
                                      <th>Team</th>
                                      <th>Coach</th>
                                      <th>Trial Outcome</th>
                                      <th>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {applications.filter(a => a.status === 'UNDER_REVIEW').map((app) => (
                                      <tr key={app.id}>
                                        <td style={{ fontWeight: 600 }}>
                                          {app.fullName}
                                        </td>
                                        <td>
                                          {(() => {
                                            const fromApi = (app as any).preferredTeamNames as string[] | undefined
                                            if (fromApi && fromApi.length > 0) return fromApi.join(', ')
                                            const raw = app.preferredTeamIds as string | string[] | null | undefined
                                            if (!raw) return '—'
                                            try {
                                              if (Array.isArray(raw)) {
                                                return raw.length > 0 ? raw.join(', ') : '—'
                                              }
                                              const parsed = JSON.parse(raw) as string[]
                                              if (Array.isArray(parsed) && parsed.length > 0) {
                                                return parsed.join(', ')
                                              }
                                            } catch {
                                            }
                                            return typeof raw === 'string' && raw.trim().length > 0 ? raw : '—'
                                          })()}
                                        </td>
                                        <td>
                                          {app.trial?.assignedCoach
                                            ? app.trial.assignedCoach.displayName ||
                                              app.trial.assignedCoach.coachId ||
                                              'Assigned coach'
                                            : 'Unassigned'}
                                        </td>
                                        <td>
                                          {(() => {
                                            const outcome = app.trial?.outcome
                                            const color =
                                              outcome === 'RECOMMENDED'
                                                ? '#10b981'
                                                : outcome
                                                  ? '#ef4444'
                                                  : '#6b7280'
                                            return (
                                              <span style={{ color, fontWeight: 600 }}>
                                                {outcome || 'Pending'}
                                              </span>
                                            )
                                          })()}
                                        </td>
                                        <td className="trials-table__action">
                                          <button
                                            type="button"
                                            className="button button--primary"
                                            style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                                            onClick={() => setSelectedApplication(app)}
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
                                <table className="trials-table">
                                  <thead>
                                    <tr>
                                      <th>Player Name</th>
                                      <th>Team</th>
                                      <th>Coach</th>
                                      <th>Trial Outcome</th>
                                      <th>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {applications.filter(a => a.status === 'APPROVED').map((app) => (
                                      <tr key={app.id}>
                                        <td style={{ fontWeight: 600 }}>
                                          {app.fullName}
                                        </td>
                                        <td>
                                          {(() => {
                                            const fromApi = (app as any).preferredTeamNames as string[] | undefined
                                            if (fromApi && fromApi.length > 0) return fromApi.join(', ')
                                            const raw = app.preferredTeamIds as string | string[] | null | undefined
                                            if (!raw) return '—'
                                            try {
                                              if (Array.isArray(raw)) {
                                                return raw.length > 0 ? raw.join(', ') : '—'
                                              }
                                              const parsed = JSON.parse(raw) as string[]
                                              if (Array.isArray(parsed) && parsed.length > 0) {
                                                return parsed.join(', ')
                                              }
                                            } catch {
                                            }
                                            return typeof raw === 'string' && raw.trim().length > 0 ? raw : '—'
                                          })()}
                                        </td>
                                        <td>
                                          {app.trial?.assignedCoach
                                            ? app.trial.assignedCoach.displayName ||
                                              app.trial.assignedCoach.coachId ||
                                              'Assigned coach'
                                            : 'Unassigned'}
                                        </td>
                                        <td>
                                          {(() => {
                                            const outcome = app.trial?.outcome
                                            const color =
                                              outcome === 'RECOMMENDED'
                                                ? '#10b981'
                                                : outcome
                                                  ? '#ef4444'
                                                  : '#6b7280'
                                            return (
                                              <span style={{ color, fontWeight: 600 }}>
                                                {outcome || 'Pending'}
                                              </span>
                                            )
                                          })()}
                                        </td>
                                        <td className="trials-table__action">
                                          <button
                                            type="button"
                                            className="button"
                                            style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                                            onClick={() => setSelectedApplication(app)}
                                          >
                                            View details
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
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
                                <table className="trials-table">
                                  <thead>
                                    <tr>
                                      <th>Player Name</th>
                                      <th>Team</th>
                                      <th>Coach</th>
                                      <th>Trial Outcome</th>
                                      <th>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {applications.filter(a => a.status === 'REJECTED').map((app) => (
                                      <tr key={app.id}>
                                        <td style={{ fontWeight: 600 }}>
                                          {app.fullName}
                                        </td>
                                        <td>
                                          {(() => {
                                            const fromApi = (app as any).preferredTeamNames as string[] | undefined
                                            if (fromApi && fromApi.length > 0) return fromApi.join(', ')
                                            const raw = app.preferredTeamIds as string | string[] | null | undefined
                                            if (!raw) return '—'
                                            try {
                                              if (Array.isArray(raw)) {
                                                return raw.length > 0 ? raw.join(', ') : '—'
                                              }
                                              const parsed = JSON.parse(raw) as string[]
                                              if (Array.isArray(parsed) && parsed.length > 0) {
                                                return parsed.join(', ')
                                              }
                                            } catch {
                                            }
                                            return typeof raw === 'string' && raw.trim().length > 0 ? raw : '—'
                                          })()}
                                        </td>
                                        <td>
                                          {app.trial?.assignedCoach
                                            ? app.trial.assignedCoach.displayName ||
                                              app.trial.assignedCoach.coachId ||
                                              'Assigned coach'
                                            : 'Unassigned'}
                                        </td>
                                        <td>
                                          {(() => {
                                            const outcome = app.trial?.outcome
                                            const color =
                                              outcome === 'RECOMMENDED'
                                                ? '#10b981'
                                                : outcome
                                                  ? '#ef4444'
                                                  : '#6b7280'
                                            return (
                                              <span style={{ color, fontWeight: 600 }}>
                                                {outcome || 'Pending'}
                                              </span>
                                            )
                                          })()}
                                          {app.rejectionReason && (
                                            <span className="muted" style={{ display: 'block', fontSize: '0.8rem', marginTop: '2px' }}>
                                              Reason: {app.rejectionReason}
                                            </span>
                                          )}
                                        </td>
                                        <td className="trials-table__action">
                                          <button
                                            type="button"
                                            className="button"
                                            style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                                            onClick={() => setSelectedApplication(app)}
                                          >
                                            View details
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
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
                        <div className="status status--info"><Info size={18} className="status__icon" />Loading teams...</div>
                      ) : (
                        <>
                          {activeTab === 'All Teams' && (
                            <div>
                              {selectedTeam ? (
                                <>
                                  <div style={{ marginBottom: '16px' }}>
                                    <button
                                      className="button button--ghost"
                                      type="button"
                                      onClick={() => { setSelectedTeam(null); setSelectedTeamPlayerProfile(null) }}
                                    >
                                      ← Back to all teams
                                    </button>
                                  </div>
                                  <div className="manage-team-header">
                                    <p className="manage-team-header__section-label">Team Players</p>
                                    <div className="manage-team-header__card">
                                      <div className="manage-team-header__row">
                                        <div className="manage-team-header__identity">
                                          <h2 className="manage-team-header__title">{selectedTeam.name}</h2>
                                          <span className={`manage-team-header__status ${selectedTeam.status === 'ACTIVE' ? 'manage-team-header__status--active' : 'manage-team-header__status--inactive'}`}>
                                            {selectedTeam.status || '—'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="manage-team-header__meta">
                                        <span>{selectedTeam.location || 'No location'}</span>
                                        <span className="manage-team-header__meta-sep">·</span>
                                        <span>{selectedTeam.teamId}</span>
                                        <span className="manage-team-header__meta-sep">·</span>
                                        <span>Coach: {selectedTeam.createdBy?.displayName || selectedTeam.createdBy?.coachId || '—'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {selectedTeamPlayerProfile ? (
                                    <div>
                                      <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <button
                                          className="button button--ghost"
                                          type="button"
                                          onClick={() => { setSelectedTeamPlayerProfile(null); setPlayerProfileTab('core') }}
                                          disabled={isLoadingTeamPlayerProfile}
                                        >
                                          ← Back to players
                                        </button>
                                      </div>
                                      {isLoadingTeamPlayerProfile ? (
                                        <div className="status status--info"><Info size={18} className="status__icon" />Loading player profile...</div>
                                      ) : (() => {
                                        const pd = selectedTeamPlayerProfile
                                        const pl = pd?.player
                                        const app = pd?.application
                                        const docs = Array.isArray(pd?.documents) ? pd.documents : []
                                        const normImgUrl = (url: string | null | undefined) => { if (!url) return null; if (url.startsWith('http')) return url; return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}` }
                                        const photoDoc = docs.find((d: any) => d.documentType === 'PHOTO') || docs.find((d: any) => d.documentType === 'ID_PROOF') || docs.find((d: any) => d.documentType === 'ID_CARD')
                                        const profilePhotoUrl = normImgUrl(photoDoc?.fileUrl) || normImgUrl(pl?.photo) || null
                                        const fullName = app?.fullName || pl?.displayName || '—'
                                        const playerDocs = docs.filter((d: any) => d.ownerType === 'PLAYER')
                                        const applicationDocs = docs.filter((d: any) => d.ownerType === 'PLAYER_APPLICATION')
                                        return (
                                          <div className="player-profile-module">
                                            <div className="tabs" style={{ marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                              {(['core', 'personal', 'documents', 'medical', 'career', 'tournament'] as const).map((tabId) => (
                                                <button key={tabId} type="button" className={`tab ${playerProfileTab === tabId ? 'tab--active' : ''}`} onClick={() => setPlayerProfileTab(tabId)}>
                                                  {tabId === 'core' && 'Core Football Identity'}
                                                  {tabId === 'personal' && 'Personal Profile'}
                                                  {tabId === 'documents' && 'Player Documents'}
                                                  {tabId === 'medical' && 'Medical'}
                                                  {tabId === 'career' && 'Player Career Stats'}
                                                  {tabId === 'tournament' && 'Tournament Stats'}
                                                </button>
                                              ))}
                                            </div>
                                            {playerProfileTab === 'core' && (
                                              <div className="profile-card player-profile-section">
                                                <div className="player-profile-header" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap' }}>
                                                  {profilePhotoUrl ? <img src={profilePhotoUrl} alt="Profile" style={{ width: '96px', height: '96px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' }} /> : <div style={{ width: '96px', height: '96px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}><UserCircle size={48} strokeWidth={1.5} /></div>}
                                                  <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p className="profile-card__value" style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: 700 }}>{fullName}</p>
                                                    <div className="profile-card__grid" style={{ marginTop: 0 }}>
                                                      <div><p className="profile-card__label">Player ID</p><p className="profile-card__value">{pl?.playerId || '—'}</p></div>
                                                      <div><p className="profile-card__label">Gender</p><p className="profile-card__value">{pl?.gender || '—'}</p></div>
                                                      <div><p className="profile-card__label">Date of Birth</p><p className="profile-card__value">{pl?.dateOfBirth ? new Date(pl.dateOfBirth).toLocaleDateString() : '—'}</p></div>
                                                    </div>
                                                  </div>
                                                </div>
                                                <h4 className="player-profile-section__title">Football Classification</h4>
                                                <div className="profile-card__grid">
                                                  <div><p className="profile-card__label">Primary Position</p><p className="profile-card__value">{typeof pl?.primaryPosition === 'string' && pl.primaryPosition.startsWith('[') ? (() => { try { const arr = JSON.parse(pl.primaryPosition); return Array.isArray(arr) ? arr.join(', ') : pl.primaryPosition; } catch { return pl.primaryPosition; } })() : (pl?.primaryPosition || '—')}</p></div>
                                                  <div><p className="profile-card__label">Dominant Foot</p><p className="profile-card__value">{pl?.dominantFoot || '—'}</p></div>
                                                </div>
                                                <h4 className="player-profile-section__title" style={{ marginTop: '20px' }}>Status</h4>
                                                <p className="profile-card__value" style={{ fontWeight: 600, color: pl?.footballStatus === 'ACTIVE' ? '#10b981' : pl?.footballStatus === 'SUSPENDED' ? '#dc2626' : '#f59e0b' }}>{pl?.footballStatus || '—'}</p>
                                              </div>
                                            )}
                                            {playerProfileTab === 'personal' && (
                                              <div className="profile-card player-profile-section personal-tab">
                                                <div className="personal-tab__block">
                                                  <h4 className="personal-tab__block-title">Physical attributes</h4>
                                                  <div className="profile-card__grid">
                                                    <div><p className="profile-card__label">Height (cm)</p><p className="profile-card__value">{app?.height ?? pl?.height ?? '—'}</p></div>
                                                    <div><p className="profile-card__label">Weight (kg)</p><p className="profile-card__value">{app?.weight ?? pl?.weight ?? '—'}</p></div>
                                                  </div>
                                                </div>
                                                <div className="personal-tab__block">
                                                  <h4 className="personal-tab__block-title">Location & preferences</h4>
                                                  <div className="profile-card__grid">
                                                    <div><p className="profile-card__label">Nationality</p><p className="profile-card__value">{pl?.nationality || app?.nationality || '—'}</p></div>
                                                    <div><p className="profile-card__label">City</p><p className="profile-card__value">{pl?.city || app?.city || '—'}</p></div>
                                                    <div><p className="profile-card__label">State</p><p className="profile-card__value">{pl?.state || app?.state || '—'}</p></div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                            {playerProfileTab === 'documents' && (
                                              <div className="profile-card player-profile-section">
                                                <h4 className="player-profile-section__title">Uploaded Documents</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                  {(playerDocs.length > 0 ? playerDocs : docs).map((d: any) => (
                                                    <div key={d.id || `${d.documentType}-${String(d.createdAt || '')}`} className="profile-card profile-card--compact" style={{ marginBottom: 0 }}>
                                                      <div className="profile-card__grid">
                                                        <div><p className="profile-card__label">Type</p><p className="profile-card__value">{d.documentType}</p></div>
                                                        <div><p className="profile-card__label">Status</p><p className="profile-card__value">{d.verificationStatus}</p></div>
                                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}><button className="button button--ghost" type="button" onClick={() => d.id && openDocumentPreview(d.id).catch((e: any) => setError(e?.message || 'Failed to open document'))} disabled={!d.id}><Eye size={16} strokeWidth={2} /> View</button></div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                  {docs.length === 0 && <div className="muted">No documents found.</div>}
                                                </div>
                                                {applicationDocs.length > 0 && (
                                                  <>
                                                    <h4 className="player-profile-section__title" style={{ marginTop: '24px' }}>Approved Application Files</h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                      {applicationDocs.map((d: any) => (
                                                        <div key={d.id || `${d.documentType}-${String(d.createdAt || '')}`} className="profile-card profile-card--compact" style={{ marginBottom: 0 }}>
                                                          <div className="profile-card__grid">
                                                            <div><p className="profile-card__label">Type</p><p className="profile-card__value">{d.documentType}</p></div>
                                                            <div><p className="profile-card__label">Status</p><p className="profile-card__value">{d.verificationStatus}</p></div>
                                                            <div style={{ display: 'flex', alignItems: 'flex-end' }}><button className="button button--ghost" type="button" onClick={() => d.id && openDocumentPreview(d.id).catch((e: any) => setError(e?.message || 'Failed to open document'))} disabled={!d.id}><Eye size={16} strokeWidth={2} /> View</button></div>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </>
                                                )}
                                              </div>
                                            )}
                                            {playerProfileTab === 'medical' && (
                                              <div className="profile-card player-profile-section">
                                                <h4 className="player-profile-section__title">Emergency Contact</h4>
                                                <div className="profile-card__grid">
                                                  <div><p className="profile-card__label">Emergency Contact Name</p><p className="profile-card__value">{pl?.emergencyContactName || app?.emergencyContactName || '—'}</p></div>
                                                  <div><p className="profile-card__label">Emergency Contact Phone</p><p className="profile-card__value">{pl?.emergencyContactPhone || app?.emergencyContactPhone || '—'}</p></div>
                                                  <div><p className="profile-card__label">Relationship</p><p className="profile-card__value">{pl?.emergencyContactRelation || app?.emergencyContactRelation || '—'}</p></div>
                                                </div>
                                              </div>
                                            )}
                                            {playerProfileTab === 'career' && (
                                              <div className="profile-card player-profile-section">
                                                <h4 className="player-profile-section__title">Lifetime Summary</h4>
                                                <div className="profile-card__grid" style={{ marginBottom: '16px' }}>
                                                  <div><p className="profile-card__label">Matches Played</p><p className="profile-card__value">{pl?.matchesPlayed ?? 0}</p></div>
                                                  <div><p className="profile-card__label">Minutes Played</p><p className="profile-card__value">{pl?.minutesPlayed ?? 0}</p></div>
                                                  <div><p className="profile-card__label">Goals</p><p className="profile-card__value">{pl?.goals ?? 0}</p></div>
                                                  <div><p className="profile-card__label">Assists</p><p className="profile-card__value">{pl?.assists ?? 0}</p></div>
                                                  <div><p className="profile-card__label">Yellow Cards</p><p className="profile-card__value">{pl?.yellowCards ?? 0}</p></div>
                                                  <div><p className="profile-card__label">Red Cards</p><p className="profile-card__value">{pl?.redCards ?? 0}</p></div>
                                                </div>
                                                <h4 className="player-profile-section__title">Context Strip</h4>
                                                <p className="muted" style={{ marginBottom: '16px' }}>Career Span — · 0 Tournaments · 0 Teams · 0 Seasons</p>
                                                <h4 className="player-profile-section__title">Discipline Snapshot</h4>
                                                <div className="profile-card__grid">
                                                  <div><p className="profile-card__label">Total Yellow Cards</p><p className="profile-card__value">{pl?.yellowCards ?? 0}</p></div>
                                                  <div><p className="profile-card__label">Total Red Cards</p><p className="profile-card__value">{pl?.redCards ?? 0}</p></div>
                                                </div>
                                              </div>
                                            )}
                                            {playerProfileTab === 'tournament' && (
                                              <div className="profile-card player-profile-section">
                                                <h4 className="player-profile-section__title">Tournament Summary</h4>
                                                <div className="profile-card__grid">
                                                  <div><p className="profile-card__label">Matches Played</p><p className="profile-card__value">{0}</p></div>
                                                  <div><p className="profile-card__label">Minutes Played</p><p className="profile-card__value">{0}</p></div>
                                                  <div><p className="profile-card__label">Goals</p><p className="profile-card__value">{0}</p></div>
                                                  <div><p className="profile-card__label">Assists</p><p className="profile-card__value">{0}</p></div>
                                                  <div><p className="profile-card__label">Yellow Cards</p><p className="profile-card__value">{0}</p></div>
                                                  <div><p className="profile-card__label">Red Cards</p><p className="profile-card__value">{0}</p></div>
                                                </div>
                                                <p className="muted" style={{ marginTop: '12px' }}>Competition-specific stats will appear when tournament data is available.</p>
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })()}
                                    </div>
                                  ) : isLoadingTeamPlayers ? (
                                    <div className="status status--info"><Info size={18} className="status__icon" />Loading team players...</div>
                                  ) : teamPlayers.length > 0 ? (
                                    <div className="admin-players-list">
                                      {teamPlayers.map((player: any) => {
                                        const displayName = player.fullName || player.displayName || '—'
                                        const initial = displayName !== '—' ? displayName.trim().charAt(0).toUpperCase() : '?'
                                        const statusClass = player.footballStatus === 'ACTIVE' ? 'admin-player-card__status--active' : player.footballStatus === 'SUSPENDED' ? 'admin-player-card__status--suspended' : 'admin-player-card__status--inactive'
                                        const assignedTeam = selectedTeam?.name || selectedTeam?.teamId || '—'
                                        const appSubmitted = player.applicationSubmittedAt ? new Date(player.applicationSubmittedAt).toLocaleDateString() : '—'
                                        return (
                                          <div key={player.playerInternalId} className="admin-player-card">
                                            <div className="admin-player-card__photo">
                                              {player.photo ? <img src={player.photo.startsWith('http') ? player.photo : `${API_BASE_URL}${player.photo.startsWith('/') ? player.photo : `/${player.photo}`}`} alt="" /> : <span>{initial}</span>}
                                            </div>
                                            <div className="admin-player-card__name">{displayName}</div>
                                            <div className="admin-player-card__team" title={assignedTeam}>{assignedTeam}</div>
                                            <div className="admin-player-card__date">{appSubmitted}</div>
                                            <div className={`admin-player-card__status ${statusClass}`}>{player.footballStatus || '—'}</div>
                                            <div className="admin-player-card__action">
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
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <div className="empty-state">
                                      <p className="empty-state__title">No players linked</p>
                                      <p className="muted">Approved players who preferred this team will appear here.</p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <h4 style={{ marginBottom: '16px' }}>All Teams</h4>
                                  <p className="muted" style={{ marginBottom: '20px' }}>
                                    View and manage all teams. Teams are created by coaches; admins can edit or delete existing teams.
                                  </p>
                                  {adminTeams.length > 0 ? (
                                    <div className="trials-list">
                                      {openTeamMenuId && (
                                        <div
                                          role="presentation"
                                          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                                          onClick={() => setOpenTeamMenuId(null)}
                                        />
                                      )}
                                      {adminTeams.map((team) => {
                                    const coachLabel = team.coaches?.length > 0
                                      ? team.coaches.map((c: any) => c.coach?.displayName || c.coach?.coachId).join(', ')
                                      : '—'
                                    const loadTeamPlayers = async () => {
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
                                        } else {
                                          setError(data?.message || 'Failed to load team players')
                                        }
                                      } catch (err) {
                                        setError('Cannot reach backend. Make sure the server is running.')
                                      } finally {
                                        setIsLoadingTeamPlayers(false)
                                      }
                                    }
                                    return (
                                      <div key={team.id} className="team-card">
                                        <div className="team-card__header">
                                          <div className="team-card__title-row">
                                            <h3 className="team-card__name">{team.name}</h3>
                                            <p className="team-card__location">{team.location || 'No location'}</p>
                                          </div>
                                          <span className={`team-card__status ${team.status === 'ACTIVE' ? 'team-card__status--active' : 'team-card__status--inactive'}`}>
                                            {team.status || '—'}
                                          </span>
                                        </div>
                                        <div className="team-card__meta">
                                          <span className="team-card__meta-item">
                                            <span className="team-card__meta-label">Team ID</span>
                                            <span>{team.teamId}</span>
                                          </span>
                                          <span className="team-card__meta-item">
                                            <span className="team-card__meta-label">Coach</span>
                                            <span>{team.createdBy?.displayName || team.createdBy?.coachId || coachLabel}</span>
                                          </span>
                                        </div>
                                        <div className="team-card__actions">
                                          <button
                                            className="button button--primary"
                                            type="button"
                                            onClick={() => void loadTeamPlayers()}
                                            disabled={isLoadingAdminTeams}
                                          >
                                            Manage Team
                                          </button>
                                          <div className="team-card__menu-wrap">
                                            <button
                                              type="button"
                                              className="team-card__menu-btn"
                                              aria-label="Team actions"
                                              onClick={(e) => { e.stopPropagation(); setOpenTeamMenuId(openTeamMenuId === team.id ? null : team.id) }}
                                            >
                                              ⋮
                                            </button>
                                            {openTeamMenuId === team.id && (
                                              <div className="team-card__dropdown">
                                                <button
                                                  type="button"
                                                  className="team-card__dropdown-item"
                                                  onClick={async (e) => {
                                                    e.stopPropagation()
                                                    setOpenTeamMenuId(null)
                                                    if (!token) return
                                                    const newName = prompt('Update team name:', team.name || '')
                                                    if (!newName) return
                                                    const newLocation = prompt('Update location (leave blank for none):', team.location || '')
                                                    setError(null)
                                                    setIsLoadingAdminTeams(true)
                                                    try {
                                                      const res = await fetch(`${API_BASE_URL}/api/teams/admin/${team.teamId}`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                        body: JSON.stringify({ name: newName, location: newLocation ?? '' }),
                                                      })
                                                      const data = await res.json()
                                                      if (!res.ok || !data?.success) setError(data?.message || 'Failed to update team')
                                                      else {
                                                        await loadAdminTeams()
                                                        setSuccessMessage('Team updated successfully')
                                                        setTimeout(() => setSuccessMessage(null), 3000)
                                                      }
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
                                                  type="button"
                                                  className="team-card__dropdown-item team-card__dropdown-item--danger"
                                                  onClick={async (e) => {
                                                    e.stopPropagation()
                                                    setOpenTeamMenuId(null)
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
                                                      if (!res.ok || !data?.success) setError(data?.message || 'Failed to delete team')
                                                      else {
                                                        await loadAdminTeams()
                                                        setSelectedTeam(null)
                                                        setTeamPlayers([])
                                                        setSuccessMessage('Team deleted successfully')
                                                        setTimeout(() => setSuccessMessage(null), 3000)
                                                      }
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
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">No teams yet</p>
                                  <p className="muted">Create the first team using the form above.</p>
                                </div>
                              )}
                                </>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : activeModuleId === 'notifications' && me?.role === 'ADMIN' ? (
                    <div className="trials-module">
                      {isLoadingAdminTeamRequests ? (
                        <div className="status status--info"><Info size={18} className="status__icon" />Loading notifications...</div>
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
                        <div className="status status--info"><Info size={18} className="status__icon" />Loading application...</div>
                      ) : activeTab === 'Draft' ? (
                        <>
                          {!application || application.status === 'DRAFT' ? (
                            <div className="draft-view">
                              {application ? (
                                <>
                                  <div className="status status--info">
                                    <Info size={18} className="status__icon" />
                                    <div><p>You have a draft application. Click the button below to edit it.</p></div>
                                  </div>
                                  <div className="actions" style={{ justifyContent: 'center', marginTop: '24px' }}>
                                    <button
                                      className="button button--primary button--primary-mobile"
                                      type="button"
                                      onClick={() => {
                                        if (me?.phone && !applicationForm.playerPhone) {
                                          setApplicationForm((prev) => ({
                                            ...prev,
                                            playerPhone: prev.playerPhone || me.phone,
                                          }))
                                        }
                                        setShowApplicationModal(true)
                                      }}
                                    >
                                      Edit Application
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="application-empty-card">
                                  <div className="application-empty-card__inner">
                                    <div className="application-empty-card__illustration">
                                      <ClipboardList size={56} strokeWidth={1.25} />
                                    </div>
                                    <h2 className="application-empty-card__title">No Application Yet</h2>
                                    <p className="application-empty-card__subtext">
                                      You haven&apos;t started any applications. Click the button below to begin.
                                    </p>
                                    <button
                                      className="button--primary-royal"
                                      type="button"
                                      onClick={() => {
                                        if (me?.phone && !applicationForm.playerPhone) {
                                          setApplicationForm((prev) => ({
                                            ...prev,
                                            playerPhone: prev.playerPhone || me.phone,
                                          }))
                                        }
                                        setShowApplicationModal(true)
                                      }}
                                    >
                                      Apply Now
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="status status--info">
                              <Info size={18} className="status__icon" />
                              <span>Your application is already submitted. View it in the "Submitted" or "Review" tab.</span>
                            </div>
                          )}
                        </>
                      ) : activeTab === 'Submitted' ? (
                        <>
                          {application && application.status === 'SUBMITTED' ? (
                            <div className="application-view">
                              <div className="status status--success">
                                <CheckCircle size={18} className="status__icon" />
                                <div>
                                  <strong>Application Submitted</strong>
                                  <p>Submitted on: {application.submittedAt ? new Date(application.submittedAt).toLocaleString() : 'N/A'}</p>
                                  <p>Trial Status: {application.trialStatus || 'PENDING'}</p>
                                </div>
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
                                    <p className="profile-card__value">
                                      {application.dateOfBirth ? new Date(application.dateOfBirth).toLocaleDateString() : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Gender</p>
                                    <p className="profile-card__value">{application.gender || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Sport</p>
                                    <p className="profile-card__value">{(application as any).sport || 'Football'}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Position(s)</p>
                                    <p className="profile-card__value">
                                      {(() => {
                                        const raw = (application as any).primaryPosition as unknown
                                        if (!raw) return 'N/A'
                                        if (Array.isArray(raw)) {
                                          const arr = raw.filter((v) => typeof v === 'string') as string[]
                                          return arr.length > 0 ? arr.join(', ') : 'N/A'
                                        }
                                        if (typeof raw === 'string') {
                                          const trimmed = raw.trim()
                                          if (!trimmed) return 'N/A'
                                          if (trimmed.startsWith('[')) {
                                            try {
                                              const parsed = JSON.parse(trimmed) as unknown
                                              if (Array.isArray(parsed)) {
                                                const arr = parsed.filter((v) => typeof v === 'string') as string[]
                                                return arr.length > 0 ? arr.join(', ') : 'N/A'
                                              }
                                            } catch {
                                              // ignore malformed JSON and fall through
                                            }
                                          }
                                          return trimmed
                                        }
                                        return 'N/A'
                                      })()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Dominant Foot</p>
                                    <p className="profile-card__value">{(application as any).dominantFoot || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Height</p>
                                    <p className="profile-card__value">
                                      {application.height ? `${application.height} cm` : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Weight</p>
                                    <p className="profile-card__value">
                                      {application.weight ? `${application.weight} kg` : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Location</p>
                                    <p className="profile-card__value">
                                      {(() => {
                                        const parts = [
                                          application.city || '',
                                          (application as any).district || '',
                                          application.state || '',
                                        ]
                                          .map((p) => String(p || '').trim())
                                          .filter(Boolean)
                                        return parts.length > 0 ? parts.join(', ') : 'N/A'
                                      })()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Pincode</p>
                                    <p className="profile-card__value">{application.pincode || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Nationality</p>
                                    <p className="profile-card__value">{application.nationality || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Aadhaar Number</p>
                                    <p className="profile-card__value">{(application as any).aadhaarNumber || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Player Phone</p>
                                    <p className="profile-card__value">{application.playerPhone || (application as any).user?.phone || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="profile-card__label">Email</p>
                                    <p className="profile-card__value">{(application as any).user?.email || (application as any).email || 'N/A'}</p>
                                  </div>
                                  <div style={{ gridColumn: '1 / -1' }}>
                                    <p className="profile-card__label">Preferred Teams</p>
                                    <p className="profile-card__value">
                                      {(() => {
                                        const names = (application as any).preferredTeamNames as string[] | undefined
                                        if (Array.isArray(names) && names.length > 0) {
                                          return names.join(', ')
                                        }

                                        const raw = (application as any).preferredTeamIds as unknown
                                        if (!raw) return 'N/A'
                                        if (Array.isArray(raw)) {
                                          const arr = raw.filter((v) => typeof v === 'string') as string[]
                                          return arr.length > 0 ? arr.join(', ') : 'N/A'
                                        }
                                        if (typeof raw === 'string') {
                                          const trimmed = raw.trim()
                                          if (!trimmed) return 'N/A'
                                          if (trimmed.startsWith('[')) {
                                            try {
                                              const parsed = JSON.parse(trimmed) as unknown
                                              if (Array.isArray(parsed)) {
                                                const arr = parsed.filter((v) => typeof v === 'string') as string[]
                                                return arr.length > 0 ? arr.join(', ') : 'N/A'
                                              }
                                            } catch {
                                              // ignore malformed JSON
                                            }
                                          }
                                          const split = trimmed.split(',').map((s) => s.trim()).filter(Boolean)
                                          return split.length > 0 ? split.join(', ') : trimmed
                                        }
                                        return 'N/A'
                                      })()}
                                    </p>
                                  </div>
                                  {(() => {
                                    const raw = (application as any).emergencyContactsJson as string | undefined
                                    if (typeof raw === 'string' && raw.trim().startsWith('[')) {
                                      try {
                                        const parsed = JSON.parse(raw) as unknown
                                        if (Array.isArray(parsed) && parsed.length > 0) {
                                          const contacts = parsed
                                            .map((c: any) => ({
                                              name: String(c?.name || '').trim(),
                                              phone: String(c?.phone || '').trim(),
                                              relation: String(c?.relation || '').trim(),
                                            }))
                                            .filter((c) => c.name || c.phone || c.relation)

                                          if (contacts.length > 0) {
                                            return contacts.map((c, idx) => (
                                              <div key={`${c.phone || c.name || idx}-${idx}`} style={{ gridColumn: '1 / -1' }}>
                                                <p className="profile-card__label">
                                                  {contacts.length > 1 ? `Emergency Contact ${idx + 1}` : 'Emergency Contact'}
                                                </p>
                                                <p className="profile-card__value">
                                                  {[c.name, c.phone, c.relation].filter(Boolean).join(' · ') || 'N/A'}
                                                </p>
                                              </div>
                                            ))
                                          }
                                        }
                                      } catch {
                                        // fall through to legacy single-contact view
                                      }
                                    }

                                    return (
                                      <>
                                        <div>
                                          <p className="profile-card__label">Emergency Contact Name</p>
                                          <p className="profile-card__value">
                                            {application.emergencyContactName || 'N/A'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Emergency Contact Phone</p>
                                          <p className="profile-card__value">
                                            {application.emergencyContactPhone || 'N/A'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="profile-card__label">Emergency Contact Relationship</p>
                                          <p className="profile-card__value">
                                            {application.emergencyContactRelation || 'N/A'}
                                          </p>
                                        </div>
                                      </>
                                    )
                                  })()}
                                </div>

                                {/* Documents */}
                                <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Documents</h4>
                                {Array.isArray((application as any).documents) && (application as any).documents.length > 0 ? (
                                  <div style={{ marginBottom: '16px' }}>
                                    {(application as any).documents.map((doc: any) => (
                                      <div
                                        key={doc.id || `${doc.documentType}-${doc.createdAt}`}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          gap: '12px',
                                          marginBottom: '6px',
                                        }}
                                        className="muted"
                                      >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <span style={{ fontWeight: 600 }}>{doc.documentType}</span>
                                          {doc.fileName ? ` – ${doc.fileName}` : ''}
                                        </div>
                                        {doc.id && (
                                          <button
                                            type="button"
                                            className="button button--primary"
                                            style={{ padding: '4px 10px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                            onClick={() => {
                                              void openDocumentPreview(doc.id)
                                            }}
                                          >
                                            View
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="muted" style={{ marginBottom: '16px' }}>
                                    No documents uploaded for this application.
                                  </p>
                                )}
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
                                {application.status === 'APPROVED' ? <CheckCircle size={18} className="status__icon" /> : application.status === 'REJECTED' ? <AlertCircle size={18} className="status__icon" /> : <Info size={18} className="status__icon" />}
                                <div><strong>Status: {application.status}</strong>
                                {application.reviewedAt && (
                                  <p>Reviewed on: {new Date(application.reviewedAt).toLocaleString()}</p>
                                )}
                                {application.rejectionReason && (
                                  <p><strong>Rejection Reason:</strong> {application.rejectionReason}</p>
                                )}</div>
                              </div>
                              {application.status === 'UNDER_REVIEW' && (
                                <div className="status status--info">
                                  <Info size={18} className="status__icon" />
                                  <span>Your application is currently under review by administrators.</span>
                                </div>
                              )}
                              {application.status === 'APPROVED' && (
                                <div className="status status--success">
                                  <CheckCircle size={18} className="status__icon" />
                                  <span><strong>Congratulations!</strong> Your application has been approved. You are now a registered player.</span>
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
                    <div className="min-h-0 flex flex-col rounded-xl p-4 sm:p-6 bg-gray-50 overflow-auto" style={{ background: 'var(--color-bg-body)' }}>
                      {selectedTrial ? (
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => setSelectedTrial(null)}
                            >
                              ← Back to Assigned Trials
                            </button>
                            <h1 className="text-2xl font-bold m-0 shrink-0" style={{ color: 'var(--color-text-main)' }}>
                              Application Details
                            </h1>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge
                              variant={
                                selectedTrial.status === 'PENDING'
                                  ? 'pending'
                                  : selectedTrial.status === 'COMPLETED' && selectedTrial.outcome === 'NEEDS_RETEST'
                                    ? 'needs-retest'
                                    : 'completed'
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h1 className="text-2xl font-bold m-0 mb-4 shrink-0" style={{ color: 'var(--color-text-main)' }}>Assigned Trials</h1>
                          <div className="tabs mb-4 shrink-0" role="tablist">
                            {['Pending', 'Completed', 'Needs Retest'].map((tab) => (
                              <button
                                key={tab}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab}
                                className={`tab ${activeTab === tab ? 'tab--active' : ''}`}
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
                        </>
                      )}
                      {selectedTrial && selectedTrial.application && (() => {
                        const docs = (selectedTrial.application as any).documents as any[] | undefined
                        const aadhaarDoc = Array.isArray(docs)
                          ? docs.find((d) => d.documentType === 'AADHAAR_CARD')
                          : null

                        const aadhaarDocumentUrl =
                          aadhaarDoc && aadhaarDoc.fileUrl
                            ? (() => {
                                const url = aadhaarDoc.fileUrl as string
                                if (url.startsWith('http')) return url
                                const base = API_BASE_URL
                                const path = url.startsWith('/') ? url : `/${url}`
                                return `${base}${path}`
                              })()
                            : ''

                        return (
                          <AadhaarVerificationModal
                            isOpen={isAadhaarModalOpen}
                            aadhaarNumber={(selectedTrial.application as any)?.aadhaarNumber || ''}
                            aadhaarDocumentUrl={aadhaarDocumentUrl}
                            onClose={() => setIsAadhaarModalOpen(false)}
                            onMarkVerified={() => setIsAadhaarVerified(true)}
                          />
                        )
                      })()}
                      <div className="trials-module min-w-0 flex-1 flex flex-col">
                            {isLoadingTrials ? (
                              <div className="status status--info"><Info size={18} className="status__icon" />Loading trials...</div>
                            ) : selectedTrial ? (
                              <div>
                                {/* 1. Trial Meta (assignment, schedule, notes) */}
                                {(selectedTrial.assignedCoach || selectedTrial.scheduledDate || selectedTrial.notes) && (
                                  <div className="flex flex-col gap-1 mb-4">
                                    {selectedTrial.assignedCoach && (
                                      <p className="muted" style={{ fontSize: '0.875rem' }}>
                                        Assigned to {selectedTrial.assignedCoach.displayName || selectedTrial.assignedCoach.coachId}
                                        {selectedTrial.assignedCoach.id === (me?.coach?.id || '') ? ' (You)' : ''}
                                      </p>
                                    )}
                                    {selectedTrial.scheduledDate && (
                                      <p className="muted" style={{ fontSize: '0.875rem' }}>
                                        Scheduled: {new Date(selectedTrial.scheduledDate).toLocaleDateString()}
                                        {selectedTrial.scheduledTime ? ` at ${selectedTrial.scheduledTime}` : ''}
                                        {selectedTrial.venue ? ` · ${selectedTrial.venue}` : ''}
                                      </p>
                                    )}
                                    {selectedTrial.notes && (
                                      <p className="muted" style={{ fontSize: '0.875rem' }}>
                                        Notes: {selectedTrial.notes}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {selectedTrial.application && (
                                  <div className="mt-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                      {/* Left column – Applicant profile + documents */}
                                      <div className="col-span-1 lg:col-span-7 flex flex-col gap-6">
                                        {/* Applicant Profile Card */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                          <h2 className="coach-card__title">Applicant Profile</h2>
                                          <div className="space-y-4">
                                            {/* Player Snapshot */}
                                            <div>
                                              <h4 className="coach-view-section__title">Player Snapshot</h4>
                                              <div className="coach-view-section__body">
                                                <div className="coach-view-snapshot grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
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
                                                    <span className="coach-view-snapshot__value">
                                                      {selectedTrial.application.nationality || '—'}
                                                    </span>
                                                  </div>
                                                  <div className="coach-view-snapshot__item">
                                                    <span className="coach-view-snapshot__label">Height</span>
                                                    <span className="coach-view-snapshot__value">
                                                      {selectedTrial.application.height ? `${selectedTrial.application.height} cm` : '—'}
                                                    </span>
                                                  </div>
                                                  <div className="coach-view-snapshot__item">
                                                    <span className="coach-view-snapshot__label">Weight</span>
                                                    <span className="coach-view-snapshot__value">
                                                      {selectedTrial.application.weight ? `${selectedTrial.application.weight} kg` : '—'}
                                                    </span>
                                                  </div>
                                                  <div className="coach-view-snapshot__item">
                                                    <span className="coach-view-snapshot__label">Dominant Foot</span>
                                                    <span className="coach-view-snapshot__value">
                                                      {selectedTrial.application.dominantFoot || '—'}
                                                    </span>
                                                  </div>
                                                  <div className="coach-view-snapshot__item" style={{ gridColumn: '1 / -1' }}>
                                                    <span className="coach-view-snapshot__label">Aadhaar Number</span>
                                                    <span className="coach-view-snapshot__value">
                                                      {(selectedTrial.application as any).aadhaarNumber || '—'}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Playing Profile */}
                                            <div>
                                              <h4 className="coach-view-section__title">Playing Profile</h4>
                                              <div className="coach-view-section__body">
                                                <div className="coach-view-snapshot grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                                                  <div className="coach-view-snapshot__item">
                                                    <span className="coach-view-snapshot__label">Sport</span>
                                                    <span className="coach-view-snapshot__value">
                                                      {(() => {
                                                        const raw = (selectedTrial.application as any).sport
                                                        const labels: Record<string, string> = {
                                                          FOOTBALL: 'Football',
                                                          CRICKET: 'Cricket',
                                                          BASKETBALL: 'Basketball',
                                                          OTHER: 'Other',
                                                        }
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
                                                        const labels: Record<string, string> = {
                                                          GOALKEEPER: 'Goalkeeper',
                                                          DEFENDER: 'Defender',
                                                          MIDFIELDER: 'Midfielder',
                                                          FORWARD: 'Forward',
                                                        }
                                                        try {
                                                          const arr =
                                                            typeof raw === 'string' && raw.startsWith('[')
                                                              ? JSON.parse(raw)
                                                              : [raw]
                                                          const list = Array.isArray(arr)
                                                            ? arr.map((x: string) => labels[x] || x).filter(Boolean)
                                                            : [labels[raw] || raw]
                                                          return list.length > 0 ? list.join(' · ') : '—'
                                                        } catch {
                                                          return labels[raw] || raw || '—'
                                                        }
                                                      })()}
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
                                                          const resolved = ids
                                                            .map((id) => {
                                                              const team = teams.find((t) => t.id === id || t.teamId === id)
                                                              return team?.name ?? null
                                                            })
                                                            .filter(Boolean)
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

                                            {/* Location & Preferences */}
                                            <div>
                                              <h4 className="coach-view-section__title">Location & Preferences</h4>
                                              <div className="coach-view-section__body">
                                                <div className="coach-view-snapshot grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                                                  <div className="coach-view-snapshot__item">
                                                    <span className="coach-view-snapshot__label">City, State</span>
                                                    <span className="coach-view-snapshot__value">
                                                      {[selectedTrial.application.city, selectedTrial.application.state]
                                                        .filter(Boolean)
                                                        .join(', ') || '—'}
                                                    </span>
                                                  </div>
                                                  <div className="coach-view-snapshot__item">
                                                    <span className="coach-view-snapshot__label">District / Pincode</span>
                                                    <span className="coach-view-snapshot__value">
                                                      {[
                                                        selectedTrial.application.district,
                                                        selectedTrial.application.pincode,
                                                      ]
                                                        .filter(Boolean)
                                                        .join(' · ') || '—'}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Documents Card */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                          <h2 className="coach-card__title">Documents</h2>
                                          {Array.isArray((selectedTrial.application as any).documents) &&
                                          (selectedTrial.application as any).documents.filter(
                                            (d: any) => d.documentType !== 'MEDICAL_REPORT_FOOTBALL',
                                          ).length > 0 ? (
                                            <div className="space-y-3">
                                              {(selectedTrial.application as any).documents
                                                .filter((doc: any) => doc.documentType !== 'MEDICAL_REPORT_FOOTBALL')
                                                .map((doc: any) => {
                                                  const isAadhaarDoc = doc.documentType === 'AADHAAR_CARD'
                                                  return (
                                                    <div
                                                      key={doc.id}
                                                      className="flex items-center justify-between gap-3 py-2"
                                                    >
                                                      <div className="flex items-center gap-3 min-w-0">
                                                        <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-gray-100">
                                                          <FileText size={18} className="text-gray-400" />
                                                        </div>
                                                        <div className="min-w-0">
                                                          <p className="text-sm font-medium text-gray-900 truncate">
                                                            {(
                                                              {
                                                                ID_PROOF: 'ID Proof',
                                                                DOB_PROOF: 'DOB Proof',
                                                                PHOTO: 'Photo',
                                                                AADHAAR_CARD: 'Aadhaar Card',
                                                              } as Record<string, string>
                                                            )[doc.documentType] || doc.documentType}
                                                            {doc.notes ? ` — ${doc.notes}` : ''}
                                                          </p>
                                                          <p className="text-xs text-gray-500 truncate">
                                                            {doc.fileName} · {(doc.fileSize / 1024).toFixed(1)} KB
                                                          </p>
                                                        </div>
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                        <button
                                                          type="button"
                                                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                          onClick={() => {
                                                            const base = doc.fileUrl?.startsWith('http')
                                                              ? ''
                                                              : API_BASE_URL
                                                            const path = (doc.fileUrl || '').startsWith('/')
                                                              ? doc.fileUrl
                                                              : `/${doc.fileUrl || ''}`
                                                            window.open(
                                                              doc.fileUrl?.startsWith('http')
                                                                ? doc.fileUrl
                                                                : `${base}${path}`,
                                                              '_blank',
                                                              'noopener,noreferrer',
                                                            )
                                                          }}
                                                        >
                                                          View
                                                        </button>
                                                        {isAadhaarDoc &&
                                                          (isAadhaarVerified ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                              Verified ✓
                                                            </span>
                                                          ) : (
                                                            <button
                                                              type="button"
                                                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                                              onClick={() => setIsAadhaarModalOpen(true)}
                                                            >
                                                              Verify
                                                            </button>
                                                          ))}
                                                      </div>
                                                    </div>
                                                  )
                                                })}
                                            </div>
                                          ) : (
                                            <p className="muted" style={{ margin: 0 }}>
                                              No documents submitted for this application.
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Right column – Contact, schedule, medical, evaluation */}
                                      <div className="col-span-1 lg:col-span-5 flex flex-col gap-6">
                                        {/* Contact Card */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                          <h2 className="coach-card__title">Contact</h2>
                                          <div className="space-y-4">
                                            {/* Player contact */}
                                            <div>
                                              <div className="flex items-center justify-between gap-3">
                                                <div>
                                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Player Phone
                                                  </p>
                                                  <p className="text-sm font-medium text-gray-900 mt-1">
                                                    {selectedTrial.application.playerPhone ||
                                                      selectedTrial.application.user?.phone ||
                                                      '—'}
                                                  </p>
                                                </div>
                                                <button
                                                  type="button"
                                                  className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                  aria-label="Call player"
                                                  onClick={() => {
                                                    const playerPhone =
                                                      selectedTrial.application.playerPhone ||
                                                      selectedTrial.application.user?.phone ||
                                                      ''
                                                    if (!playerPhone) {
                                                      setError('No mobile number available for this player.')
                                                      return
                                                    }
                                                    window.location.href = `tel:${playerPhone}`
                                                  }}
                                                >
                                                  <Phone size={18} />
                                                </button>
                                              </div>
                                              <div className="mt-3">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                  Player Email
                                                </p>
                                                <p className="text-sm font-medium text-gray-900 mt-1">
                                                  {selectedTrial.application.user?.email || 'Not provided'}
                                                </p>
                                              </div>
                                            </div>

                                            {/* Emergency contact */}
                                            <div>
                                              <p className="coach-view-contact-group__title">Emergency contact</p>
                                              <div className="coach-view-snapshot">
                                                {(() => {
                                                  const raw = (selectedTrial.application as any)
                                                    .emergencyContactsJson as string | undefined
                                                  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
                                                    try {
                                                      const parsed = JSON.parse(raw) as unknown
                                                      if (Array.isArray(parsed) && parsed.length > 0) {
                                                        const contacts = parsed
                                                          .map((c: any) => ({
                                                            name: String(c?.name || '').trim(),
                                                            phone: String(c?.phone || '').trim(),
                                                            relation: String(c?.relation || '').trim(),
                                                          }))
                                                          .filter((c) => c.name || c.phone || c.relation)

                                                        if (contacts.length > 0) {
                                                          return contacts.map((c, idx) => (
                                                            <div
                                                              key={`${c.phone || c.name || idx}-${idx}`}
                                                              className="coach-view-snapshot__item"
                                                              style={{ gridColumn: '1 / -1' }}
                                                            >
                                                              <span className="coach-view-snapshot__label">
                                                                {contacts.length > 1
                                                                  ? `Emergency Contact ${idx + 1}`
                                                                  : 'Emergency Contact'}
                                                              </span>
                                                              <span className="coach-view-snapshot__value">
                                                                {[c.name, c.phone, c.relation]
                                                                  .filter(Boolean)
                                                                  .join(' · ') || '—'}
                                                              </span>
                                                            </div>
                                                          ))
                                                        }
                                                      }
                                                    } catch {
                                                      // ignore and fall back to single contact fields
                                                    }
                                                  }

                                                  return (
                                                    <>
                                                      <div className="coach-view-snapshot__item">
                                                        <span className="coach-view-snapshot__label">Contact Name</span>
                                                        <span className="coach-view-snapshot__value">
                                                          {selectedTrial.application.emergencyContactName || '—'}
                                                        </span>
                                                      </div>
                                                      <div className="coach-view-snapshot__item">
                                                        <span className="coach-view-snapshot__label">Phone</span>
                                                        <span className="coach-view-snapshot__value">
                                                          {selectedTrial.application.emergencyContactPhone || '—'}
                                                        </span>
                                                      </div>
                                                      <div className="coach-view-snapshot__item">
                                                        <span className="coach-view-snapshot__label">Relationship</span>
                                                        <span className="coach-view-snapshot__value">
                                                          {selectedTrial.application.emergencyContactRelation || '—'}
                                                        </span>
                                                      </div>
                                                    </>
                                                  )
                                                })()}
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Schedule Verification Card */}
                                        {selectedTrial.application.submittedAt && (
                                          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                            <h2 className="coach-card__title">
                                              Schedule Verification
                                            </h2>
                                            <div className="space-y-4">
                                              <div className="field">
                                                <label className="profile-card__label" htmlFor="physical-test-date">
                                                  Date
                                                </label>
                                                <input
                                                  id="physical-test-date"
                                                  className="input"
                                                  type="date"
                                                  min={todayIso}
                                                  value={physicalTestDate}
                                                  onChange={(e) => {
                                                    setPhysicalTestDate(e.target.value)
                                                    setError(null)
                                                  }}
                                                />
                                              </div>
                                              <div className="field">
                                                <label
                                                  className="profile-card__label"
                                                  htmlFor="physical-test-location"
                                                >
                                                  Location
                                                </label>
                                                <input
                                                  id="physical-test-location"
                                                  className="input"
                                                  type="text"
                                                  placeholder="Enter venue location"
                                                  value={physicalTestLocation}
                                                  onChange={(e) => {
                                                    setPhysicalTestLocation(e.target.value)
                                                    setError(null)
                                                  }}
                                                />
                                              </div>
                                              <button
                                                type="button"
                                                className="button button--brand w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={
                                                  !physicalTestDate ||
                                                  !physicalTestLocation ||
                                                  isPastDate(physicalTestDate)
                                                }
                                                onClick={() => {
                                                  const phoneNumber =
                                                    selectedTrial.application.playerPhone ||
                                                    selectedTrial.application.user?.phone ||
                                                    ''
                                                  if (!phoneNumber) {
                                                    setError('No mobile number available for this player.')
                                                    return
                                                  }
                                                  if (!physicalTestDate) {
                                                    setError(
                                                      'Please select a date for the physical test before sending a WhatsApp message.',
                                                    )
                                                    return
                                                  }
                                                  if (isPastDate(physicalTestDate)) {
                                                    setError(
                                                      'Please select today or a future date for the physical test.',
                                                    )
                                                    return
                                                  }

                                                  const fullName = selectedTrial.application.fullName || 'Player'

                                                  // Derive primary team name
                                                  let teamName = 'your preferred team'
                                                  const fromApi = (
                                                    selectedTrial.application as any
                                                  ).preferredTeamNames as string[] | undefined
                                                  if (Array.isArray(fromApi) && fromApi.length > 0) {
                                                    teamName = fromApi[0]
                                                  } else {
                                                    const raw =
                                                      selectedTrial.application.preferredTeamIds as
                                                        | string
                                                        | null
                                                        | undefined
                                                    if (raw) {
                                                      try {
                                                        const ids = JSON.parse(raw) as string[]
                                                        const firstId =
                                                          Array.isArray(ids) && ids.length > 0 ? ids[0] : null
                                                        if (firstId) {
                                                          const team = teams.find(
                                                            (t) => t.id === firstId || t.teamId === firstId,
                                                          )
                                                          if (team?.name) teamName = team.name
                                                        }
                                                      } catch {
                                                        // ignore
                                                      }
                                                    }
                                                  }

                                                  // Location from application fields
                                                  let location = physicalTestLocation.trim()
                                                  if (!location) {
                                                    const locationParts = [
                                                      selectedTrial.application.city,
                                                      selectedTrial.application.district,
                                                      selectedTrial.application.state,
                                                      selectedTrial.application.pincode,
                                                    ].filter(Boolean)
                                                    location = locationParts.join(', ') || 'TBD'
                                                  }

                                                  const messageLines = [
                                                    `Hello ${fullName},`,
                                                    `This is to inform you that you have been requested to attend a physical test for your application with ${teamName}.`,
                                                    '',
                                                    `Location: ${location}`,
                                                    `Date: ${physicalTestDate}`,
                                                    '',
                                                    'Please be available at the given location and time.',
                                                  ]
                                                  const message = messageLines.join('\n')

                                                  const whatsappNumber = (phoneNumber as string).replace(
                                                    /[^0-9]/g,
                                                    '',
                                                  )
                                                  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                                                    message,
                                                  )}`
                                                  window.open(url, '_blank', 'noopener,noreferrer')
                                                }}
                                              >
                                                Send WhatsApp Invite
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Medical Check (Football) */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                          <h2 className="coach-card__title">
                                            Medical Check (Football)
                                          </h2>
                                          <p className="muted" style={{ marginBottom: '12px' }}>
                                            Quick medical checklist for football activity. Select all statements that
                                            apply.
                                          </p>
                                          <div
                                            className="form__section"
                                            style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}
                                          >
                                            {/* Q1 */}
                                            <div className="field">
                                              <span>
                                                Have you had any muscle, ligament, or joint injury in the last 6 months?
                                              </span>
                                              <div
                                                className="mt-2 inline-flex rounded-lg border border-gray-200 bg-gray-50 text-xs font-medium overflow-hidden"
                                                role="radiogroup"
                                                aria-label="Injury in last 6 months"
                                              >
                                                <button
                                                  type="button"
                                                  className={`px-4 py-2 ${
                                                    medicalCheck.q1Yes
                                                      ? 'bg-emerald-600 text-white'
                                                      : 'text-gray-700 hover:bg-white'
                                                  }`}
                                                  role="radio"
                                                  aria-checked={medicalCheck.q1Yes}
                                                  disabled={selectedTrial.status === 'COMPLETED'}
                                                  onClick={() => {
                                                    if (selectedTrial.status === 'COMPLETED') return
                                                    setMedicalCheck((prev) => ({
                                                      ...prev,
                                                      q1Yes: true,
                                                      q1No: false,
                                                    }))
                                                  }}
                                                >
                                                  Yes
                                                </button>
                                                <button
                                                  type="button"
                                                  className={`px-4 py-2 ${
                                                    medicalCheck.q1No
                                                      ? 'bg-emerald-600 text-white'
                                                      : 'text-gray-700 hover:bg-white'
                                                  }`}
                                                  role="radio"
                                                  aria-checked={medicalCheck.q1No}
                                                  disabled={selectedTrial.status === 'COMPLETED'}
                                                  onClick={() => {
                                                    if (selectedTrial.status === 'COMPLETED') return
                                                    setMedicalCheck((prev) => ({
                                                      ...prev,
                                                      q1Yes: false,
                                                      q1No: true,
                                                    }))
                                                  }}
                                                >
                                                  No
                                                </button>
                                              </div>
                                            </div>

                                            {/* Q2 */}
                                            <div className="field">
                                              <span>
                                                Do you currently feel pain, discomfort, or restricted movement while
                                                running, jumping, or kicking?
                                              </span>
                                              <div
                                                className="mt-2 inline-flex rounded-lg border border-gray-200 bg-gray-50 text-xs font-medium overflow-hidden"
                                                role="radiogroup"
                                                aria-label="Current pain or discomfort"
                                              >
                                                <button
                                                  type="button"
                                                  className={`px-4 py-2 ${
                                                    medicalCheck.q2Yes
                                                      ? 'bg-emerald-600 text-white'
                                                      : 'text-gray-700 hover:bg-white'
                                                  }`}
                                                  role="radio"
                                                  aria-checked={medicalCheck.q2Yes}
                                                  disabled={selectedTrial.status === 'COMPLETED'}
                                                  onClick={() => {
                                                    if (selectedTrial.status === 'COMPLETED') return
                                                    setMedicalCheck((prev) => ({
                                                      ...prev,
                                                      q2Yes: true,
                                                      q2No: false,
                                                    }))
                                                  }}
                                                >
                                                  Yes
                                                </button>
                                                <button
                                                  type="button"
                                                  className={`px-4 py-2 ${
                                                    medicalCheck.q2No
                                                      ? 'bg-emerald-600 text-white'
                                                      : 'text-gray-700 hover:bg-white'
                                                  }`}
                                                  role="radio"
                                                  aria-checked={medicalCheck.q2No}
                                                  disabled={selectedTrial.status === 'COMPLETED'}
                                                  onClick={() => {
                                                    if (selectedTrial.status === 'COMPLETED') return
                                                    setMedicalCheck((prev) => ({
                                                      ...prev,
                                                      q2Yes: false,
                                                      q2No: true,
                                                    }))
                                                  }}
                                                >
                                                  No
                                                </button>
                                              </div>
                                            </div>

                                            {/* Q3 */}
                                            <div className="field">
                                              <span>
                                                Are you currently taking any medication or undergoing medical treatment?
                                              </span>
                                              <div
                                                className="mt-2 inline-flex rounded-lg border border-gray-200 bg-gray-50 text-xs font-medium overflow-hidden"
                                                role="radiogroup"
                                                aria-label="Medication or medical treatment"
                                              >
                                                <button
                                                  type="button"
                                                  className={`px-4 py-2 ${
                                                    medicalCheck.q3Yes
                                                      ? 'bg-emerald-600 text-white'
                                                      : 'text-gray-700 hover:bg-white'
                                                  }`}
                                                  role="radio"
                                                  aria-checked={medicalCheck.q3Yes}
                                                  disabled={selectedTrial.status === 'COMPLETED'}
                                                  onClick={() => {
                                                    if (selectedTrial.status === 'COMPLETED') return
                                                    setMedicalCheck((prev) => ({
                                                      ...prev,
                                                      q3Yes: true,
                                                      q3No: false,
                                                    }))
                                                  }}
                                                >
                                                  Yes
                                                </button>
                                                <button
                                                  type="button"
                                                  className={`px-4 py-2 ${
                                                    medicalCheck.q3No
                                                      ? 'bg-emerald-600 text-white'
                                                      : 'text-gray-700 hover:bg-white'
                                                  }`}
                                                  role="radio"
                                                  aria-checked={medicalCheck.q3No}
                                                  disabled={selectedTrial.status === 'COMPLETED'}
                                                  onClick={() => {
                                                    if (selectedTrial.status === 'COMPLETED') return
                                                    setMedicalCheck((prev) => ({
                                                      ...prev,
                                                      q3Yes: false,
                                                      q3No: true,
                                                    }))
                                                  }}
                                                >
                                                  No
                                                </button>
                                              </div>
                                            </div>

                                            {/* Medical report upload */}
                                            <div className="field">
                                              <span>Medical Report (optional)</span>
                                              <p className="muted" style={{ marginBottom: '6px' }}>
                                                You may upload a supporting medical report (PDF or image). This is
                                                optional and not required to evaluate the trial.
                                              </p>
                                              <input
                                                className="input"
                                                type="file"
                                                accept=".pdf,image/*"
                                                disabled={
                                                  selectedTrial.status === 'COMPLETED' || isUploadingMedicalReport
                                                }
                                                onChange={async (e) => {
                                                  const file =
                                                    e.target.files && e.target.files[0] ? e.target.files[0] : null
                                                  if (!file || !selectedTrial) {
                                                    return
                                                  }

                                                  const formData = new FormData()
                                                  formData.append('medicalReport', file)

                                                  try {
                                                    setIsUploadingMedicalReport(true)
                                                    setError(null)

                                                    const res = await fetch(
                                                      `${API_BASE_URL}/api/trial/${selectedTrial.id}/medical-report`,
                                                      {
                                                        method: 'POST',
                                                        headers: {
                                                          Authorization: `Bearer ${token}`,
                                                        },
                                                        body: formData,
                                                      },
                                                    )

                                                    const data = await res.json()
                                                    if (!res.ok || !data?.success) {
                                                      setError(data?.message || 'Failed to upload medical report')
                                                      return
                                                    }

                                                    setSuccessMessage('Medical report uploaded successfully!')
                                                    setTimeout(() => {
                                                      setSuccessMessage(null)
                                                    }, 3000)

                                                    // Refresh trials so medical report appears in application documents
                                                    void loadTrials()
                                                  } catch (err) {
                                                    setError('Cannot reach backend. Make sure the server is running.')
                                                  } finally {
                                                    setIsUploadingMedicalReport(false)
                                                    e.target.value = ''
                                                  }
                                                }}
                                              />

                                              {Array.isArray((selectedTrial.application as any).documents) &&
                                                (selectedTrial.application as any).documents.filter(
                                                  (d: any) => d.documentType === 'MEDICAL_REPORT_FOOTBALL',
                                                ).length > 0 && (
                                                  <div style={{ marginTop: '10px' }}>
                                                    {(selectedTrial.application as any).documents
                                                      .filter(
                                                        (doc: any) =>
                                                          doc.documentType === 'MEDICAL_REPORT_FOOTBALL',
                                                      )
                                                      .map((doc: any) => (
                                                        <div
                                                          key={doc.id}
                                                          className="coach-view-doc-row"
                                                          style={{ paddingTop: '8px' }}
                                                        >
                                                          <div>
                                                            <span
                                                              className="coach-view-snapshot__value"
                                                              style={{ display: 'block', marginBottom: '2px' }}
                                                            >
                                                              Medical Report
                                                              {doc.notes ? ` — ${doc.notes}` : ''}
                                                            </span>
                                                            <span className="muted" style={{ fontSize: '0.75rem' }}>
                                                              {doc.fileName} ·{' '}
                                                              {(doc.fileSize / 1024).toFixed(1)} KB ·{' '}
                                                              {doc.verificationStatus}
                                                            </span>
                                                          </div>
                                                          <button
                                                            type="button"
                                                            className="button button--primary"
                                                            style={{
                                                              flexShrink: 0,
                                                              padding: '6px 14px',
                                                              fontSize: '0.875rem',
                                                            }}
                                                            onClick={() => {
                                                              const base = doc.fileUrl?.startsWith('http')
                                                                ? ''
                                                                : API_BASE_URL
                                                              const path = (doc.fileUrl || '').startsWith('/')
                                                                ? doc.fileUrl
                                                                : `/${doc.fileUrl || ''}`
                                                              window.open(
                                                                doc.fileUrl?.startsWith('http')
                                                                  ? doc.fileUrl
                                                                  : `${base}${path}`,
                                                                '_blank',
                                                                'noopener,noreferrer',
                                                              )
                                                            }}
                                                          >
                                                            View Report
                                                          </button>
                                                        </div>
                                                      ))}
                                                  </div>
                                                )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Evaluate Trial Card */}
                                        {selectedTrial.status === 'PENDING' && (
                                          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                            <h2 className="coach-card__title">
                                              Evaluate Trial
                                            </h2>
                                            <form
                                              className="form"
                                              onSubmit={async (e) => {
                                                e.preventDefault()
                                                const formData = new FormData(e.currentTarget)
                                                const outcome = formData.get('outcome') as string
                                                const notes = formData.get('notes') as string

                                                if (!outcome) {
                                                  setError('Please select an outcome')
                                                  return
                                                }

                                                // Validate medical checklist before submitting evaluation
                                                const allAnswered =
                                                  (medicalCheck.q1Yes || medicalCheck.q1No) &&
                                                  (medicalCheck.q2Yes || medicalCheck.q2No) &&
                                                  (medicalCheck.q3Yes || medicalCheck.q3No)

                                                if (!allAnswered) {
                                                  setError(
                                                    'Please complete the medical checklist (Yes/No for all questions) before submitting the evaluation.',
                                                  )
                                                  return
                                                }

                                                setIsLoadingTrials(true)
                                                setError(null)
                                                try {
                                                  // 1) Submit medical checklist (no file) so admin gets full medical data
                                                  if (selectedTrial) {
                                                    const answers = {
                                                      q1: {
                                                        question: 'Injury in last 6 months',
                                                        yes: medicalCheck.q1Yes,
                                                        no: medicalCheck.q1No,
                                                      },
                                                      q2: {
                                                        question: 'Current pain/discomfort while activity',
                                                        yes: medicalCheck.q2Yes,
                                                        no: medicalCheck.q2No,
                                                      },
                                                      q3: {
                                                        question: 'Medication/medical treatment ongoing',
                                                        yes: medicalCheck.q3Yes,
                                                        no: medicalCheck.q3No,
                                                      },
                                                    }

                                                    const medicalForm = new FormData()
                                                    medicalForm.append('answersJson', JSON.stringify(answers))
                                                    medicalForm.append('verified', 'true')

                                                    const medicalRes = await fetch(
                                                      `${API_BASE_URL}/api/trial/${selectedTrial.id}/medical-form`,
                                                      {
                                                        method: 'POST',
                                                        headers: {
                                                          Authorization: `Bearer ${token}`,
                                                        },
                                                        body: medicalForm,
                                                      },
                                                    )

                                                    const medicalData = await medicalRes.json()
                                                    if (!medicalRes.ok || !medicalData?.success) {
                                                      setError(
                                                        medicalData?.message || 'Failed to save medical checklist',
                                                      )
                                                      setIsLoadingTrials(false)
                                                      return
                                                    }
                                                  }

                                                  // 2) Submit trial evaluation
                                                  const res = await fetch(
                                                    `${API_BASE_URL}/api/trial/${selectedTrial.id}/evaluate`,
                                                    {
                                                      method: 'POST',
                                                      headers: {
                                                        'Content-Type': 'application/json',
                                                        Authorization: `Bearer ${token}`,
                                                      },
                                                      body: JSON.stringify({
                                                        outcome,
                                                        notes,
                                                        isAadhaarVerified,
                                                      }),
                                                    },
                                                  )
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
                                              }}
                                            >
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
                                              <div className="mt-4 flex justify-end">
                                                <button
                                                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                  type="submit"
                                                  disabled={isLoadingTrials}
                                                >
                                                  {isLoadingTrials ? (
                                                    <>
                                                      <Loader2
                                                        size={18}
                                                        className="animate-spin"
                                                        strokeWidth={2}
                                                      />{' '}
                                                      Submitting...
                                                    </>
                                                  ) : (
                                                    'Submit Evaluation'
                                                  )}
                                                </button>
                                              </div>
                                            </form>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                        <>
                          {activeTab === 'Pending' && (
                            <div>
                              {trials.filter(t => t.status === 'PENDING').length > 0 ? (
                                <div className="rounded-xl border overflow-hidden shadow-sm min-w-0" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border-subtle)' }}>
                                  <div className="overflow-x-auto">
                                    <table className="w-full min-w-[640px] border-collapse">
                                      <thead>
                                        <tr style={{ background: 'var(--color-surface-soft)', color: 'var(--color-text-muted)' }}>
                                          <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Player Name</th>
                                          <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Phone</th>
                                          <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Date</th>
                                          <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Status</th>
                                          <th className="text-right text-xs font-medium uppercase tracking-wider px-6 py-3">Action</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {trials.filter(t => t.status === 'PENDING').map((trial) => {
                                          const name = trial.application?.fullName || 'N/A'
                                          const initials = name !== 'N/A' ? name.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase() : '?'
                                          const phone =
                                            trial.application?.playerPhone ||
                                            (trial.application as any)?.user?.phone ||
                                            '—'
                                          return (
                                            <tr key={trial.id} className="border-b transition-colors hover:bg-[var(--color-surface-soft)]" style={{ borderBottomColor: 'var(--color-border-subtle)' }}>
                                              <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 overflow-hidden" style={{ background: 'var(--color-surface-soft)', color: 'var(--color-text-muted)' }}>{initials}</div>
                                                  <p className="font-medium truncate min-w-0" style={{ color: 'var(--color-text-main)' }}>{name}</p>
                                                </div>
                                              </td>
                                              <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>{phone}</td>
                                              <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>{trial.application?.submittedAt ? new Date(trial.application.submittedAt).toLocaleDateString() : 'N/A'}</td>
                                              <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                  <span className="w-2 h-2 rounded-full shrink-0 bg-orange-500" aria-hidden />
                                                  <span className="text-sm" style={{ color: 'var(--color-text-main)' }}>Pending</span>
                                                </div>
                                                {trial.assignedCoach && (
                                                  <span className="muted block text-xs mt-0.5">
                                                    {trial.assignedCoach.id === (me?.coach?.id || '') ? ' (You)' : ` (${trial.assignedCoach.displayName || trial.assignedCoach.coachId})`}
                                                  </span>
                                                )}
                                              </td>
                                              <td className="px-6 py-4 text-right">
                                                <button type="button" className="text-sm font-medium text-[#82C91E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#82C91E]/40 rounded disabled:opacity-50" onClick={() => setSelectedTrial(trial)} disabled={isLoadingTrials}>View Application</button>
                                              </td>
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
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
                              {trials.filter(t => t.status === 'COMPLETED').length > 0 ? (
                                <div className="rounded-xl border overflow-hidden shadow-sm min-w-0" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border-subtle)' }}>
                                  <div className="overflow-x-auto">
                                    <table className="w-full min-w-[640px] border-collapse">
                                      <thead>
                                        <tr style={{ background: 'var(--color-surface-soft)', color: 'var(--color-text-muted)' }}>
                                          <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Player Name</th>
                                          <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Phone</th>
                                          <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Date</th>
                                          <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Status</th>
                                          <th className="text-right text-xs font-medium uppercase tracking-wider px-6 py-3">Action</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {trials.filter(t => t.status === 'COMPLETED').map((trial) => {
                                          const name = trial.application?.fullName || 'N/A'
                                          const initials = name !== 'N/A' ? name.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase() : '?'
                                          const phone =
                                            trial.application?.playerPhone ||
                                            (trial.application as any)?.user?.phone ||
                                            '—'
                                          return (
                                            <tr key={trial.id} className="border-b transition-colors hover:bg-[var(--color-surface-soft)]" style={{ borderBottomColor: 'var(--color-border-subtle)' }}>
                                              <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 overflow-hidden" style={{ background: 'var(--color-surface-soft)', color: 'var(--color-text-muted)' }}>{initials}</div>
                                                  <p className="font-medium truncate min-w-0" style={{ color: 'var(--color-text-main)' }}>{name}</p>
                                                </div>
                                              </td>
                                              <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>{phone}</td>
                                              <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>{trial.application?.submittedAt ? new Date(trial.application.submittedAt).toLocaleDateString() : 'N/A'}</td>
                                              <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                  <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" aria-hidden />
                                                  <span className="text-sm" style={{ color: 'var(--color-text-main)' }}>{trial.outcome || trial.status}</span>
                                                </div>
                                                {trial.evaluatedAt && (
                                                  <span className="muted block text-xs mt-0.5">Evaluated {new Date(trial.evaluatedAt).toLocaleDateString()}</span>
                                                )}
                                              </td>
                                              <td className="px-6 py-4 text-right">
                                                <button type="button" className="text-sm font-medium text-[#82C91E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#82C91E]/40 rounded disabled:opacity-50" onClick={() => setSelectedTrial(trial)} disabled={isLoadingTrials}>View Application</button>
                                              </td>
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
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
                              {trials.filter(t => t.outcome === 'NEEDS_RETEST').length > 0 ? (
                                <div className="rounded-xl border overflow-hidden shadow-sm min-w-0" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border-subtle)' }}>
                                  <div className="overflow-x-auto">
                                    <table className="w-full min-w-[640px] border-collapse">
                                      <thead>
                                        <tr style={{ background: 'var(--color-surface-soft)', color: 'var(--color-text-muted)' }}>
                                          <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Player Name</th>
                                          <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Phone</th>
                                          <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Date</th>
                                          <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Status</th>
                                          <th className="text-right text-xs font-medium uppercase tracking-wider px-6 py-3">Action</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {trials.filter(t => t.outcome === 'NEEDS_RETEST').map((trial) => {
                                          const name = trial.application?.fullName || 'N/A'
                                          const initials = name !== 'N/A' ? name.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase() : '?'
                                          const phone =
                                            trial.application?.playerPhone ||
                                            (trial.application as any)?.user?.phone ||
                                            '—'
                                          return (
                                            <tr key={trial.id} className="border-b transition-colors hover:bg-[var(--color-surface-soft)]" style={{ borderBottomColor: 'var(--color-border-subtle)' }}>
                                              <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 overflow-hidden" style={{ background: 'var(--color-surface-soft)', color: 'var(--color-text-muted)' }}>{initials}</div>
                                                  <p className="font-medium truncate min-w-0" style={{ color: 'var(--color-text-main)' }}>{name}</p>
                                                </div>
                                              </td>
                                              <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>{phone}</td>
                                              <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>{trial.application?.submittedAt ? new Date(trial.application.submittedAt).toLocaleDateString() : 'N/A'}</td>
                                              <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                  <span className="w-2 h-2 rounded-full shrink-0 bg-amber-500" aria-hidden />
                                                  <span className="text-sm" style={{ color: 'var(--color-text-main)' }}>Needs Retest</span>
                                                </div>
                                                {trial.evaluatedAt && (
                                                  <span className="muted block text-xs mt-0.5">Evaluated {new Date(trial.evaluatedAt).toLocaleDateString()}</span>
                                                )}
                                              </td>
                                              <td className="px-6 py-4 text-right">
                                                <button type="button" className="text-sm font-medium text-[#82C91E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#82C91E]/40 rounded disabled:opacity-50" onClick={() => setSelectedTrial(trial)} disabled={isLoadingTrials}>View Application</button>
                                              </td>
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
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
                    </div>
                  ) : activeModuleId === 'my-players' && me?.role === 'COACH' ? (
                    <div className="trials-module">
                      {isLoadingPlayers ? (
                        <div className="status status--info"><Info size={18} className="status__icon" />Loading players...</div>
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
                                  <RefreshCw size={16} strokeWidth={2} /> Refresh
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
                                      onClick={() => { setSelectedMyPlayer(null); setPlayerProfileTab('core') }}
                                      disabled={isLoadingMyPlayerProfile}
                                    >
                                      ← Back to My Players
                                    </button>
                                  </div>
                                  {isLoadingMyPlayerProfile ? (
                                    <div className="status status--info"><Info size={18} className="status__icon" />Loading player profile...</div>
                                  ) : (() => {
                                    const pd = selectedMyPlayer
                                    const pl = pd?.player
                                    const app = pd?.application
                                    const docs = Array.isArray(pd?.documents) ? pd.documents : []
                                    const normImgUrl = (url: string | null | undefined) => { if (!url) return null; if (url.startsWith('http')) return url; return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}` }
                                    const photoDoc = docs.find((d: any) => d.documentType === 'PHOTO') || docs.find((d: any) => d.documentType === 'ID_PROOF') || docs.find((d: any) => d.documentType === 'ID_CARD')
                                    const profilePhotoUrl = normImgUrl(photoDoc?.fileUrl) || normImgUrl(pl?.photo) || null
                                    const fullName = app?.fullName || pl?.displayName || '—'
                                    const playerDocs = docs.filter((d: any) => d.ownerType === 'PLAYER')
                                    const applicationDocs = docs.filter((d: any) => d.ownerType === 'PLAYER_APPLICATION')
                                    return (
                                      <div className="player-profile-module">
                                        <div className="tabs" style={{ marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                          {(['core', 'personal', 'documents', 'medical', 'career', 'tournament'] as const).map((tabId) => (
                                            <button key={tabId} type="button" className={`tab ${playerProfileTab === tabId ? 'tab--active' : ''}`} onClick={() => setPlayerProfileTab(tabId)}>
                                              {tabId === 'core' && 'Core Football Identity'}
                                              {tabId === 'personal' && 'Personal Profile'}
                                              {tabId === 'documents' && 'Player Documents'}
                                              {tabId === 'medical' && 'Medical'}
                                              {tabId === 'career' && 'Player Career Stats'}
                                              {tabId === 'tournament' && 'Tournament Stats'}
                                            </button>
                                          ))}
                                        </div>
                                        {playerProfileTab === 'core' && (
                                          <div className="profile-card player-profile-section">
                                            <div className="player-profile-header" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap' }}>
                                              {profilePhotoUrl ? <img src={profilePhotoUrl} alt="Profile" style={{ width: '96px', height: '96px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' }} /> : <div style={{ width: '96px', height: '96px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}><UserCircle size={48} strokeWidth={1.5} /></div>}
                                              <div style={{ flex: 1, minWidth: 0 }}>
                                                <p className="profile-card__value" style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: 700 }}>{fullName}</p>
                                                <div className="profile-card__grid" style={{ marginTop: 0 }}>
                                                  <div><p className="profile-card__label">Player ID</p><p className="profile-card__value">{pl?.playerId || '—'}</p></div>
                                                  <div><p className="profile-card__label">Gender</p><p className="profile-card__value">{pl?.gender || '—'}</p></div>
                                                  <div><p className="profile-card__label">Date of Birth</p><p className="profile-card__value">{pl?.dateOfBirth ? new Date(pl.dateOfBirth).toLocaleDateString() : '—'}</p></div>
                                                </div>
                                              </div>
                                            </div>
                                            <h4 className="player-profile-section__title">Football Classification</h4>
                                            <div className="profile-card__grid">
                                              <div><p className="profile-card__label">Primary Position</p><p className="profile-card__value">{typeof pl?.primaryPosition === 'string' && pl.primaryPosition.startsWith('[') ? (() => { try { const arr = JSON.parse(pl.primaryPosition); return Array.isArray(arr) ? arr.join(', ') : pl.primaryPosition; } catch { return pl.primaryPosition; } })() : (pl?.primaryPosition || '—')}</p></div>
                                              <div><p className="profile-card__label">Dominant Foot</p><p className="profile-card__value">{pl?.dominantFoot || '—'}</p></div>
                                            </div>
                                            <h4 className="player-profile-section__title" style={{ marginTop: '20px' }}>Status</h4>
                                            <p className="profile-card__value" style={{ fontWeight: 600, color: pl?.footballStatus === 'ACTIVE' ? '#10b981' : pl?.footballStatus === 'SUSPENDED' ? '#dc2626' : '#f59e0b' }}>{pl?.footballStatus || '—'}</p>
                                            {Array.isArray(pl?.teams) && pl.teams.length > 0 && (
                                              <p className="muted" style={{ marginTop: '8px' }}>Teams: {pl.teams.map((t: any) => t.name || t.teamId).join(', ')}</p>
                                            )}
                                          </div>
                                        )}
                                        {playerProfileTab === 'personal' && (
                                          <div className="profile-card player-profile-section personal-tab">
                                            <div className="personal-tab__block">
                                              <h4 className="personal-tab__block-title">Physical attributes</h4>
                                              <div className="profile-card__grid">
                                                <div><p className="profile-card__label">Height (cm)</p><p className="profile-card__value">{app?.height ?? pl?.height ?? '—'}</p></div>
                                                <div><p className="profile-card__label">Weight (kg)</p><p className="profile-card__value">{app?.weight ?? pl?.weight ?? '—'}</p></div>
                                              </div>
                                            </div>
                                            <div className="personal-tab__block">
                                              <h4 className="personal-tab__block-title">Location & preferences</h4>
                                              <div className="profile-card__grid">
                                                <div><p className="profile-card__label">Nationality</p><p className="profile-card__value">{pl?.nationality || app?.nationality || '—'}</p></div>
                                                <div><p className="profile-card__label">City</p><p className="profile-card__value">{pl?.city || app?.city || '—'}</p></div>
                                                <div><p className="profile-card__label">State</p><p className="profile-card__value">{pl?.state || app?.state || '—'}</p></div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        {playerProfileTab === 'documents' && (
                                          <div className="profile-card player-profile-section">
                                            <h4 className="player-profile-section__title">Uploaded Documents</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                              {(playerDocs.length > 0 ? playerDocs : docs).map((d: any) => (
                                                <div key={d.id || `${d.documentType}-${String(d.createdAt || '')}`} className="profile-card profile-card--compact" style={{ marginBottom: 0 }}>
                                                  <div className="profile-card__grid">
                                                    <div><p className="profile-card__label">Type</p><p className="profile-card__value">{d.documentType}</p></div>
                                                    <div><p className="profile-card__label">Status</p><p className="profile-card__value">{d.verificationStatus}</p></div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}><button className="button button--ghost" type="button" onClick={() => d.id && openDocumentPreview(d.id).catch((e: any) => setError(e?.message || 'Failed to open document'))} disabled={!d.id}><Eye size={16} strokeWidth={2} /> View</button></div>
                                                  </div>
                                                </div>
                                              ))}
                                              {docs.length === 0 && <div className="muted">No documents found.</div>}
                                            </div>
                                            {applicationDocs.length > 0 && (
                                              <>
                                                <h4 className="player-profile-section__title" style={{ marginTop: '24px' }}>Approved Application Files</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                  {applicationDocs.map((d: any) => (
                                                    <div key={d.id || `${d.documentType}-${String(d.createdAt || '')}`} className="profile-card profile-card--compact" style={{ marginBottom: 0 }}>
                                                      <div className="profile-card__grid">
                                                        <div><p className="profile-card__label">Type</p><p className="profile-card__value">{d.documentType}</p></div>
                                                        <div><p className="profile-card__label">Status</p><p className="profile-card__value">{d.verificationStatus}</p></div>
                                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}><button className="button button--ghost" type="button" onClick={() => d.id && openDocumentPreview(d.id).catch((e: any) => setError(e?.message || 'Failed to open document'))} disabled={!d.id}><Eye size={16} strokeWidth={2} /> View</button></div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        )}
                                        {playerProfileTab === 'medical' && (
                                          <div className="profile-card player-profile-section">
                                            <h4 className="player-profile-section__title">Emergency Contact</h4>
                                            <div className="profile-card__grid">
                                              <div><p className="profile-card__label">Emergency Contact Name</p><p className="profile-card__value">{pl?.emergencyContactName || app?.emergencyContactName || '—'}</p></div>
                                              <div><p className="profile-card__label">Emergency Contact Phone</p><p className="profile-card__value">{pl?.emergencyContactPhone || app?.emergencyContactPhone || '—'}</p></div>
                                              <div><p className="profile-card__label">Relationship</p><p className="profile-card__value">{pl?.emergencyContactRelation || app?.emergencyContactRelation || '—'}</p></div>
                                            </div>
                                          </div>
                                        )}
                                        {playerProfileTab === 'career' && (
                                          <div className="profile-card player-profile-section">
                                            <h4 className="player-profile-section__title">Lifetime Summary</h4>
                                            <div className="profile-card__grid" style={{ marginBottom: '16px' }}>
                                              <div><p className="profile-card__label">Matches Played</p><p className="profile-card__value">{pl?.matchesPlayed ?? 0}</p></div>
                                              <div><p className="profile-card__label">Minutes Played</p><p className="profile-card__value">{pl?.minutesPlayed ?? 0}</p></div>
                                              <div><p className="profile-card__label">Goals</p><p className="profile-card__value">{pl?.goals ?? 0}</p></div>
                                              <div><p className="profile-card__label">Assists</p><p className="profile-card__value">{pl?.assists ?? 0}</p></div>
                                              <div><p className="profile-card__label">Yellow Cards</p><p className="profile-card__value">{pl?.yellowCards ?? 0}</p></div>
                                              <div><p className="profile-card__label">Red Cards</p><p className="profile-card__value">{pl?.redCards ?? 0}</p></div>
                                            </div>
                                            <h4 className="player-profile-section__title">Context Strip</h4>
                                            <p className="muted" style={{ marginBottom: '16px' }}>Career Span — · 0 Tournaments · 0 Teams · 0 Seasons</p>
                                            <h4 className="player-profile-section__title">Discipline Snapshot</h4>
                                            <div className="profile-card__grid">
                                              <div><p className="profile-card__label">Total Yellow Cards</p><p className="profile-card__value">{pl?.yellowCards ?? 0}</p></div>
                                              <div><p className="profile-card__label">Total Red Cards</p><p className="profile-card__value">{pl?.redCards ?? 0}</p></div>
                                            </div>
                                          </div>
                                        )}
                                        {playerProfileTab === 'tournament' && (
                                          <div className="profile-card player-profile-section">
                                            <h4 className="player-profile-section__title">Tournament Summary</h4>
                                            <div className="profile-card__grid">
                                              <div><p className="profile-card__label">Matches Played</p><p className="profile-card__value">{0}</p></div>
                                              <div><p className="profile-card__label">Minutes Played</p><p className="profile-card__value">{0}</p></div>
                                              <div><p className="profile-card__label">Goals</p><p className="profile-card__value">{0}</p></div>
                                              <div><p className="profile-card__label">Assists</p><p className="profile-card__value">{0}</p></div>
                                              <div><p className="profile-card__label">Yellow Cards</p><p className="profile-card__value">{0}</p></div>
                                              <div><p className="profile-card__label">Red Cards</p><p className="profile-card__value">{0}</p></div>
                                            </div>
                                            <p className="muted" style={{ marginTop: '12px' }}>Competition-specific stats will appear when tournament data is available.</p>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })()}
                                </div>
                              ) : myPlayers.length > 0 ? (
                                <div className="admin-players-list">
                                  {myPlayers.map((player) => {
                                    const fullName = player.application?.fullName || player.displayName || 'N/A'
                                    const initial =
                                      fullName !== 'N/A'
                                        ? fullName.trim().charAt(0).toUpperCase()
                                        : '?'
                                    const statusClass =
                                      player.footballStatus === 'ACTIVE'
                                        ? 'admin-player-card__status--active'
                                        : player.footballStatus === 'SUSPENDED'
                                        ? 'admin-player-card__status--suspended'
                                        : 'admin-player-card__status--inactive'
                                    return (
                                      <div key={player.id} className="admin-player-card">
                                        <div className="admin-player-card__photo">
                                          <span>{initial}</span>
                                        </div>
                                        <div className="admin-player-card__name">
                                          {fullName}
                                        </div>
                                        <div className="admin-player-card__team">
                                          <span style={{ fontWeight: 500 }}>Player ID:</span>{' '}
                                          <span>{player.playerId || 'N/A'}</span>
                                        </div>
                                        <div className="admin-player-card__date">
                                          <span style={{ fontWeight: 500 }}>Phone:</span>{' '}
                                          <span>{player.user?.phone || 'N/A'}</span>
                                        </div>
                                        <div className={`admin-player-card__status ${statusClass}`}>
                                          {player.footballStatus || 'N/A'}
                                        </div>
                                        <div className="admin-player-card__action">
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
                                    )
                                  })}
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
                        <div className="status status--info"><Info size={18} className="status__icon" />Loading teams...</div>
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
                                  <Plus size={18} strokeWidth={2} />
                                  Add Team
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
                  ) : activeModuleId === 'tournaments' && me?.role === 'ADMIN' ? (
                    selectedTournament || isCreatingTournament ? (
                      <TournamentDetailPage
                        mode={isCreatingTournament ? 'create' : 'edit'}
                        data={selectedTournament}
                        isSaving={isSavingTournament}
                        isLoading={isLoadingTournamentDetail}
                        onBack={() => {
                          setSelectedTournament(null)
                          setIsCreatingTournament(false)
                        }}
                        onSaveDraft={(payload) => {
                          void handleSaveTournamentDraft(payload)
                        }}
                        onPublish={(tournamentId) => {
                          void handlePublishTournament(tournamentId)
                        }}
                        apiBaseUrl={API_BASE_URL}
                        authToken={token}
                      />
                    ) : (
                      <TournamentAdminPage
                        tournaments={adminTournaments}
                        activeTab={activeTab}
                        isLoading={isLoadingAdminTournaments}
                        error={error}
                        onRefresh={() => {
                          void loadAdminTournaments()
                        }}
                        onCreateTournament={() => {
                          setSelectedTournament(null)
                          setIsCreatingTournament(true)
                        }}
                        onViewTournament={(tournamentId) => {
                          void handleOpenTournamentDetail(tournamentId)
                        }}
                        onPublishTournament={(tournamentId) => {
                          void handlePublishTournament(tournamentId)
                        }}
                        onTabChange={(tab) => {
                          setActiveTab(tab)
                          setError(null)
                          setSuccessMessage(null)
                        }}
                      />
                    )
                  ) : activeModuleId === 'referees' && me?.role === 'ADMIN' ? (
                    <>
                      <RefereeManagementPage
                        referees={referees}
                        isLoading={isLoadingReferees}
                        onRefresh={loadReferees}
                        onAddReferee={() => handleOpenRefereeModal()}
                        onEditReferee={(ref) => handleOpenRefereeModal(ref)}
                      />
                      <AddRefereeModal
                        isOpen={showRefereeModal}
                        initialData={
                          editingReferee
                            ? {
                                id: editingReferee.id,
                                name: editingReferee.name,
                                phone: editingReferee.phone,
                                status: editingReferee.status,
                              }
                            : null
                        }
                        isSaving={false}
                        onClose={() => {
                          setShowRefereeModal(false)
                          setEditingReferee(null)
                        }}
                        onSave={handleSaveReferee}
                      />
                    </>
                  ) : activeModuleId === 'tournament' && me?.role === 'COACH' ? (
                    <div className="trials-module">
                      {isLoadingCoachTournaments ? (
                        <div className="status status--info">
                          <Info size={18} className="status__icon" />
                          Loading tournaments...
                        </div>
                      ) : (
                        <>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '16px',
                              gap: '12px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div>
                              <h4 style={{ margin: 0 }}>Tournament Hub</h4>
                              <p className="muted" style={{ margin: 0 }}>
                                View tournament announcements and submit your squad.
                              </p>
                            </div>
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => void loadCoachTournaments()}
                              disabled={isLoadingCoachTournaments}
                            >
                              <RefreshCw size={16} strokeWidth={2} /> Refresh
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              {coachTournaments.length === 0 ? (
                                <div className="empty-state">
                                  <p className="empty-state__title">No tournaments yet</p>
                                  <p className="muted">
                                    Published tournaments that match your sport will appear here.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {coachTournaments.map((t: any) => {
                                    const isSelected =
                                      selectedCoachTournament &&
                                      selectedCoachTournament.tournamentId === t.tournamentId
                                    const isOpen = t.isRegistrationOpen !== false
                                    return (
                                      <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedCoachTournament(t)
                                          setTournamentApplicationForm({
                                            teamName:
                                              tournamentApplicationForm.teamName ||
                                              `${t.name} Squad`,
                                            notes: '',
                                            playerIds: [],
                                            captainPlayerId: null,
                                          })
                                        }}
                                        className="w-full text-left"
                                      >
                                        <div
                                          className="profile-card"
                                          style={{
                                            border:
                                              isSelected && isOpen
                                                ? '1px solid var(--color-primary)'
                                                : undefined,
                                          }}
                                        >
                                          <div className="profile-card__header">
                                            <div>
                                              <p className="profile-card__title">{t.name}</p>
                                              <p className="profile-card__subtitle">
                                                {t.sport} • {t.level}
                                              </p>
                                            </div>
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
                                              {t.applicationStatus === 'NOT_APPLIED'
                                                ? 'Not applied'
                                                : t.applicationStatus}
                                            </span>
                                          </div>
                                          <div className="profile-card__body">
                                            <p className="muted" style={{ marginBottom: '4px' }}>
                                              Window: {formatDate(t.startDate)} –{' '}
                                              {formatDate(t.endDate)}
                                            </p>
                                            <p className="muted" style={{ marginBottom: 0 }}>
                                              Register by {formatDate(t.registrationDeadline)}
                                            </p>
                                          </div>
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            <div>
                              {selectedCoachTournament ? (
                                <div className="profile-card">
                                  <div className="profile-card__header">
                                    <div>
                                      <p className="profile-card__title">
                                        {selectedCoachTournament.name}
                                      </p>
                                      <p className="profile-card__subtitle">
                                        Submit your squad and captain for this tournament.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="profile-card__body">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <div className="field">
                                          <label className="field__label" htmlFor="squad-name">
                                            Squad name
                                          </label>
                                          <input
                                            id="squad-name"
                                            className="input"
                                            type="text"
                                            value={tournamentApplicationForm.teamName}
                                            onChange={(e) =>
                                              setTournamentApplicationForm((prev) => ({
                                                ...prev,
                                                teamName: e.target.value,
                                              }))
                                            }
                                          />
                                        </div>
                                        <div className="field">
                                          <label className="field__label" htmlFor="coach-notes">
                                            Notes for organizer
                                          </label>
                                          <textarea
                                            id="coach-notes"
                                            className="input"
                                            rows={4}
                                            value={tournamentApplicationForm.notes}
                                            onChange={(e) =>
                                              setTournamentApplicationForm((prev) => ({
                                                ...prev,
                                                notes: e.target.value,
                                              }))
                                            }
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <p
                                          className="profile-card__label"
                                          style={{ marginBottom: '8px' }}
                                        >
                                          Select squad & captain
                                        </p>
                                        <div
                                          className="muted"
                                          style={{ marginBottom: '8px', fontSize: 'var(--text-xs)' }}
                                        >
                                          Squad size must be between{' '}
                                          {selectedCoachTournament.minSquadSize || 'min'} and{' '}
                                          {selectedCoachTournament.maxSquadSize || 'max'} players.
                                        </div>
                                        <div
                                          style={{
                                            maxHeight: '260px',
                                            overflowY: 'auto',
                                            border: '1px solid var(--color-border-subtle)',
                                            borderRadius: '12px',
                                            padding: '8px',
                                          }}
                                        >
                                          {myPlayers.length === 0 ? (
                                            <p
                                              className="muted"
                                              style={{ fontSize: 'var(--text-sm)', margin: 0 }}
                                            >
                                              No players in your roster yet.
                                            </p>
                                          ) : (
                                            myPlayers.map((p: any) => {
                                              const playerId = p.playerId || p.id
                                              const selected =
                                                tournamentApplicationForm.playerIds.includes(
                                                  playerId,
                                                )
                                              const isCaptain =
                                                tournamentApplicationForm.captainPlayerId ===
                                                playerId
                                              return (
                                                <div
                                                  key={playerId}
                                                  className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg"
                                                  style={{
                                                    marginBottom: '4px',
                                                    background: selected
                                                      ? 'var(--color-surface-soft)'
                                                      : 'transparent',
                                                  }}
                                                >
                                                  <label className="flex items-center gap-2 flex-1">
                                                    <input
                                                      type="checkbox"
                                                      checked={selected}
                                                      onChange={(e) => {
                                                        const checked = e.target.checked
                                                        setTournamentApplicationForm((prev) => {
                                                          const nextIds = new Set(prev.playerIds)
                                                          if (checked) {
                                                            nextIds.add(playerId)
                                                          } else {
                                                            nextIds.delete(playerId)
                                                            if (
                                                              prev.captainPlayerId === playerId
                                                            ) {
                                                              return {
                                                                ...prev,
                                                                playerIds: Array.from(nextIds),
                                                                captainPlayerId: null,
                                                              }
                                                            }
                                                          }
                                                          return {
                                                            ...prev,
                                                            playerIds: Array.from(nextIds),
                                                          }
                                                        })
                                                      }}
                                                    />
                                                    <span>
                                                      <span
                                                        style={{
                                                          display: 'block',
                                                          fontSize: 'var(--text-sm)',
                                                          color: 'var(--color-text-main)',
                                                        }}
                                                      >
                                                        {p.displayName || p.fullName || playerId}
                                                      </span>
                                                      {p.playerId && (
                                                        <span
                                                          className="muted"
                                                          style={{ fontSize: 'var(--text-xs)' }}
                                                        >
                                                          {p.playerId}
                                                        </span>
                                                      )}
                                                    </span>
                                                  </label>
                                                  <button
                                                    type="button"
                                                    className="button button--ghost"
                                                    disabled={!selected}
                                                    onClick={() =>
                                                      setTournamentApplicationForm((prev) => ({
                                                        ...prev,
                                                        captainPlayerId: playerId,
                                                      }))
                                                    }
                                                  >
                                                    {isCaptain ? 'Captain' : 'Make captain'}
                                                  </button>
                                                </div>
                                              )
                                            })
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div
                                      style={{
                                        marginTop: '16px',
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                      }}
                                    >
                                      <button
                                        className="button button--primary"
                                        type="button"
                                        disabled={
                                          !selectedCoachTournament ||
                                          tournamentApplicationForm.playerIds.length === 0 ||
                                          !tournamentApplicationForm.captainPlayerId
                                        }
                                        onClick={() =>
                                          void handleSubmitTournamentApplication(
                                            selectedCoachTournament.tournamentId,
                                          )
                                        }
                                      >
                                        Submit application
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="empty-state">
                                  <p className="empty-state__title">Select a tournament</p>
                                  <p className="muted">
                                    Choose a tournament from the left to apply with your squad.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
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
                                <Info size={18} className="status__icon" />
                                <div><strong>Set Your MPIN</strong><p>You need to set a 4-6 digit MPIN to secure your account.</p></div>
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
                                    {isUpdatingMpin ? <><Loader2 size={18} className="animate-spin" strokeWidth={2} /> Setting MPIN...</> : 'Set MPIN'}
                                  </button>
                                </div>
                              </form>
                            </div>
                          ) : (
                            <div>
                              <div className="status status--success" style={{ marginBottom: '20px' }}>
                                <CheckCircle size={18} className="status__icon" />
                                <div><strong>MPIN is Set</strong><p>You can update your MPIN below.</p></div>
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
                                    {isUpdatingMpin ? <><Loader2 size={18} className="animate-spin" strokeWidth={2} /> Updating...</> : 'Update MPIN'}
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : activeModuleId === 'profile' && me?.role === 'USER' ? (
                    <div className="profile-module">
                      <div className="card">
                        <div className="profile-card">
                          <div>
                            <p className="profile-card__label">Login phone</p>
                            <p className="profile-card__value">{me?.phone || '—'}</p>
                          </div>
                        </div>
                        <div className="actions">
                          <button
                            className="button button--danger"
                            type="button"
                            onClick={logout}
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : activeModuleId === 'profile' && me?.role === 'PLAYER' ? (
                    <div className="profile-module player-profile-module">
                      {isLoadingMyProfile ? (
                        <div className="status status--info"><Info size={18} className="status__icon" />Loading profile...</div>
                      ) : (() => {
                        const pd = myProfileData || {
                          player: me?.player ? { ...me.player, user: { phone: me.phone, email: me.email } } : null,
                          application: me?.application || null,
                          documents: [] as any[],
                        }
                        const pl = pd?.player
                        const app = pd?.application
                        const docs = Array.isArray(pd?.documents) ? pd.documents : []
                                    const normImgUrl = (url: string | null | undefined) => { if (!url) return null; if (url.startsWith('http')) return url; return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}` }
                                    const photoDoc = docs.find((d: any) => d.documentType === 'PHOTO') || docs.find((d: any) => d.documentType === 'ID_PROOF') || docs.find((d: any) => d.documentType === 'ID_CARD')
                                    const profilePhotoUrl = normImgUrl(photoDoc?.fileUrl) || normImgUrl(pl?.photo) || null
                                    const fullName = app?.fullName || pl?.displayName || '—'
                                    const playerDocs = docs.filter((d: any) => d.ownerType === 'PLAYER')
                                    const applicationDocs = docs.filter((d: any) => d.ownerType === 'PLAYER_APPLICATION')
                                    const currentTab = activeTab || 'Core'
                        return (
                          <>
                            {currentTab === 'Core' && (
                              <div className="profile-card player-profile-section">
                                <div className="player-profile-header" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap' }}>
                                  {profilePhotoUrl ? <img src={profilePhotoUrl} alt="Profile" style={{ width: '96px', height: '96px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' }} /> : <div style={{ width: '96px', height: '96px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}><UserCircle size={48} strokeWidth={1.5} /></div>}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p className="profile-card__value" style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: 700 }}>{fullName}</p>
                                    <div className="profile-card__grid" style={{ marginTop: 0 }}>
                                      <div><p className="profile-card__label">Player ID</p><p className="profile-card__value">{pl?.playerId || '—'}</p></div>
                                      <div><p className="profile-card__label">Gender</p><p className="profile-card__value">{pl?.gender || '—'}</p></div>
                                      <div><p className="profile-card__label">Date of Birth</p><p className="profile-card__value">{pl?.dateOfBirth ? new Date(pl.dateOfBirth).toLocaleDateString() : '—'}</p></div>
                                    </div>
                                  </div>
                                </div>
                                <h4 className="player-profile-section__title">Football Classification</h4>
                                <div className="profile-card__grid">
                                  <div><p className="profile-card__label">Primary Position</p><p className="profile-card__value">{typeof pl?.primaryPosition === 'string' && pl.primaryPosition.startsWith('[') ? (() => { try { const arr = JSON.parse(pl.primaryPosition); return Array.isArray(arr) ? arr.join(', ') : pl.primaryPosition; } catch { return pl.primaryPosition; } })() : (pl?.primaryPosition || '—')}</p></div>
                                  <div><p className="profile-card__label">Dominant Foot</p><p className="profile-card__value">{pl?.dominantFoot || '—'}</p></div>
                                </div>
                                <h4 className="player-profile-section__title" style={{ marginTop: '20px' }}>Status</h4>
                                <p className="profile-card__value" style={{ fontWeight: 600, color: pl?.footballStatus === 'ACTIVE' ? '#10b981' : pl?.footballStatus === 'SUSPENDED' ? '#dc2626' : '#f59e0b' }}>{pl?.footballStatus || '—'}</p>
                              </div>
                            )}
                            {currentTab === 'Personal' && (
                              <div className="profile-card player-profile-section personal-tab">
                                <div className="personal-tab__block">
                                  <h4 className="personal-tab__block-title">Physical attributes</h4>
                                  <div className="profile-card__grid">
                                    <div><p className="profile-card__label">Height (cm)</p><p className="profile-card__value">{app?.height ?? pl?.height ?? '—'}</p></div>
                                    <div><p className="profile-card__label">Weight (kg)</p><p className="profile-card__value">{app?.weight ?? pl?.weight ?? '—'}</p></div>
                                  </div>
                                </div>
                                <div className="personal-tab__block">
                                  <h4 className="personal-tab__block-title">Location & preferences</h4>
                                  <div className="profile-card__grid">
                                    <div><p className="profile-card__label">Nationality</p><p className="profile-card__value">{pl?.nationality || app?.nationality || '—'}</p></div>
                                    <div><p className="profile-card__label">City</p><p className="profile-card__value">{pl?.city || app?.city || '—'}</p></div>
                                    <div><p className="profile-card__label">State</p><p className="profile-card__value">{pl?.state || app?.state || '—'}</p></div>
                                  </div>
                                </div>
                                <div className="personal-tab__block">
                                  <h4 className="personal-tab__block-title">Contact</h4>
                                  <div className="profile-card__grid">
                                    <div><p className="profile-card__label">Phone</p><p className="profile-card__value">{pl?.user?.phone ?? me?.phone ?? '—'}</p></div>
                                    <div><p className="profile-card__label">Email</p><p className="profile-card__value">{pl?.user?.email ?? me?.email ?? '—'}</p></div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {currentTab === 'Documents' && (
                              <div className="profile-card player-profile-section">
                                <h4 className="player-profile-section__title">Uploaded Documents</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {(playerDocs.length > 0 ? playerDocs : docs).map((d: any) => (
                                    <div key={d.id || `${d.documentType}-${String(d.createdAt || '')}`} className="profile-card profile-card--compact" style={{ marginBottom: 0 }}>
                                      <div className="profile-card__grid">
                                        <div><p className="profile-card__label">Type</p><p className="profile-card__value">{d.documentType}</p></div>
                                        <div><p className="profile-card__label">Status</p><p className="profile-card__value">{d.verificationStatus}</p></div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}><button className="button button--ghost" type="button" onClick={() => d.id && openDocumentPreview(d.id).catch((e: any) => setError(e?.message || 'Failed to open document'))} disabled={!d.id}><Eye size={16} strokeWidth={2} /> View</button></div>
                                      </div>
                                    </div>
                                  ))}
                                  {docs.length === 0 && <div className="muted">No documents found.</div>}
                                </div>
                                {applicationDocs.length > 0 && (
                                  <>
                                    <h4 className="player-profile-section__title" style={{ marginTop: '24px' }}>Approved Application Files</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {applicationDocs.map((d: any) => (
                                        <div key={d.id || `${d.documentType}-${String(d.createdAt || '')}`} className="profile-card profile-card--compact" style={{ marginBottom: 0 }}>
                                          <div className="profile-card__grid">
                                            <div><p className="profile-card__label">Type</p><p className="profile-card__value">{d.documentType}</p></div>
                                            <div><p className="profile-card__label">Status</p><p className="profile-card__value">{d.verificationStatus}</p></div>
                                            <div style={{ display: 'flex', alignItems: 'flex-end' }}><button className="button button--ghost" type="button" onClick={() => d.id && openDocumentPreview(d.id).catch((e: any) => setError(e?.message || 'Failed to open document'))} disabled={!d.id}><Eye size={16} strokeWidth={2} /> View</button></div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                            {currentTab === 'Medical' && (
                              <div className="profile-card player-profile-section">
                                <h4 className="player-profile-section__title">Emergency Contact</h4>
                                <div className="profile-card__grid">
                                  <div><p className="profile-card__label">Emergency Contact Name</p><p className="profile-card__value">{pl?.emergencyContactName || app?.emergencyContactName || '—'}</p></div>
                                  <div><p className="profile-card__label">Emergency Contact Phone</p><p className="profile-card__value">{pl?.emergencyContactPhone || app?.emergencyContactPhone || '—'}</p></div>
                                  <div><p className="profile-card__label">Relationship</p><p className="profile-card__value">{pl?.emergencyContactRelation || app?.emergencyContactRelation || '—'}</p></div>
                                </div>
                              </div>
                            )}
                            {currentTab === 'Career' && (
                              <div className="profile-card player-profile-section">
                                <h4 className="player-profile-section__title">Lifetime Summary</h4>
                                <div className="profile-card__grid" style={{ marginBottom: '16px' }}>
                                  <div><p className="profile-card__label">Matches Played</p><p className="profile-card__value">{pl?.matchesPlayed ?? 0}</p></div>
                                  <div><p className="profile-card__label">Minutes Played</p><p className="profile-card__value">{pl?.minutesPlayed ?? 0}</p></div>
                                  <div><p className="profile-card__label">Goals</p><p className="profile-card__value">{pl?.goals ?? 0}</p></div>
                                  <div><p className="profile-card__label">Assists</p><p className="profile-card__value">{pl?.assists ?? 0}</p></div>
                                  <div><p className="profile-card__label">Yellow Cards</p><p className="profile-card__value">{pl?.yellowCards ?? 0}</p></div>
                                  <div><p className="profile-card__label">Red Cards</p><p className="profile-card__value">{pl?.redCards ?? 0}</p></div>
                                </div>
                                <h4 className="player-profile-section__title">Context Strip</h4>
                                <p className="muted" style={{ marginBottom: '16px' }}>Career Span — · 0 Tournaments · 0 Teams · 0 Seasons</p>
                                <h4 className="player-profile-section__title">Discipline Snapshot</h4>
                                <div className="profile-card__grid">
                                  <div><p className="profile-card__label">Total Yellow Cards</p><p className="profile-card__value">{pl?.yellowCards ?? 0}</p></div>
                                  <div><p className="profile-card__label">Total Red Cards</p><p className="profile-card__value">{pl?.redCards ?? 0}</p></div>
                                </div>
                              </div>
                            )}
                            {currentTab === 'Tournament' && (
                              <div className="profile-card player-profile-section">
                                <h4 className="player-profile-section__title">Tournament Summary</h4>
                                <div className="profile-card__grid">
                                  <div><p className="profile-card__label">Matches Played</p><p className="profile-card__value">{0}</p></div>
                                  <div><p className="profile-card__label">Minutes Played</p><p className="profile-card__value">{0}</p></div>
                                  <div><p className="profile-card__label">Goals</p><p className="profile-card__value">{0}</p></div>
                                  <div><p className="profile-card__label">Assists</p><p className="profile-card__value">{0}</p></div>
                                  <div><p className="profile-card__label">Yellow Cards</p><p className="profile-card__value">{0}</p></div>
                                  <div><p className="profile-card__label">Red Cards</p><p className="profile-card__value">{0}</p></div>
                                </div>
                                <p className="muted" style={{ marginTop: '12px' }}>Competition-specific stats will appear when tournament data is available.</p>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p className="empty-state__title">No data loaded</p>
                      <p className="muted">Connect this module to backend endpoints to show real data.</p>
                    </div>
                  )}
                </section>
        {error && (
            <div className="status status--error">
              <AlertCircle size={18} className="status__icon" />
              <span><strong>Error:</strong> {error}</span>
            </div>
          )}
          {successMessage && (
            <div className="status status--success">
              <CheckCircle size={18} className="status__icon" />
              <span>{successMessage}</span>
            </div>
          )}
    </>
  )

  return (
    <>
    <div className={`app-fullscreen ${!isDesktop ? 'app-shell-mobile' : ''}`}>
      {isDesktop ? (
        <Sidebar {...sidebarProps}>
          {authContent}
        </Sidebar>
      ) : (
        <>
          <MobileTopHeader user={sidebarProps.user} onLogout={logout} pageTitle={activeModule?.label ?? 'Dashboard'} />
          <main className="mobile-main">
            <div className="mobile-main__content w-full max-w-md mx-auto px-4">
              {authContent}
            </div>
          </main>
          <BottomNav
            activeItem={activeModuleId}
            onItemClick={handleModuleNav}
            items={sidebarNavigationItems.map((n) => ({
              id: n.id,
              name: n.name,
              icon: cloneElement(n.icon as React.ReactElement<{ size?: number }>, { size: 24 }),
            }))}
          />
        </>
      )}
    </div>

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
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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
                  <label className="field">
                    Aadhaar Number *
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      value={applicationForm.aadhaarNumber}
                      onChange={(e) =>
                        setApplicationForm({
                          ...applicationForm,
                          aadhaarNumber: e.target.value.replace(/\D/g, ''),
                        })
                      }
                      onBlur={(e) => {
                        void checkAadhaar(e.target.value)
                      }}
                      placeholder="12-digit Aadhaar number"
                      required
                    />
                    {isCheckingAadhaar && <p className="muted">Checking Aadhaar number...</p>}
                    {aadhaarError && (
                      <div className="status status--error" style={{ marginTop: '4px' }}>
                        <AlertCircle size={18} className="status__icon" />
                        <span>{aadhaarError}</span>
                      </div>
                    )}
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
                      onChange={(e) => {
                        const nextPhone = e.target.value
                        setApplicationForm({ ...applicationForm, playerPhone: nextPhone })
                        if (emergencyContacts[0]) {
                          const playerNorm = normalizePhoneForCompare(nextPhone)
                          const contactNorm = normalizePhoneForCompare(emergencyContacts[0].phone)
                          setPrimaryEmergencyPhoneConflict(
                            Boolean(playerNorm) && Boolean(contactNorm) && playerNorm === contactNorm,
                          )
                        }
                      }}
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
                    Preferred Team * (dropdown)
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
                            Select preferred team
                          </span>
                        ) : (
                          applicationForm.preferredTeamIds
                            .slice(0, 1)
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
                                            // Allow selecting at most one preferred team; clicking again clears selection
                                            preferredTeamIds: already ? [] : [t.id],
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
                                ? 'Select one preferred team.'
                                : '1 team selected.'}
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
                            className={idx === 0 && primaryEmergencyPhoneConflict ? 'input input--error' : 'input'}
                            type="tel"
                            value={c.phone}
                            onChange={(e) => {
                              const next = emergencyContacts.slice()
                              next[idx] = { ...next[idx], phone: e.target.value }
                              setEmergencyContacts(next)
                              if (idx === 0) {
                                const playerNorm = normalizePhoneForCompare(applicationForm.playerPhone)
                                const contactNorm = normalizePhoneForCompare(e.target.value)
                                setPrimaryEmergencyPhoneConflict(
                                  Boolean(playerNorm) && Boolean(contactNorm) && playerNorm === contactNorm,
                                )
                              }
                            }}
                            placeholder={
                              idx === 0 && primaryEmergencyPhoneConflict
                                ? 'Cannot be same as player mobile'
                                : '9876543210'
                            }
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
                    Upload Profile Photo (Required) *
                    <p className="muted">Must be a passport-size photo.</p>
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
                  <label className="field">
                    Aadhaar Card Photo *
                    <p className="muted">Please upload both the front and back of your Aadhaar card.</p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        className="input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setDocAadhaarCard(e.target.files?.[0] || null)}
                        required
                      />
                      <button
                        className="button button--ghost"
                        type="button"
                        disabled={!docAadhaarCard}
                        onClick={() => {
                          if (!docAadhaarCard) return
                          const url = URL.createObjectURL(docAadhaarCard)
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
                <X size={20} strokeWidth={2} />
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

      {/* Create Coach Modal */}
      {showCreateCoachModal && (
        <div className="modal-overlay" onClick={() => setShowCreateCoachModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Coach Account</h3>
              <button
                className="modal-close"
                type="button"
                onClick={() => setShowCreateCoachModal(false)}
                aria-label="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body">
              <form className="form" onSubmit={createCoach}>
                <p className="muted" style={{ marginBottom: '16px' }}>
                  Enter coach identity and login details. The new coach will appear in User Management with role COACH
                  and status ACTIVE.
                </p>
                <label className="field">
                  Full Name *
                  <input
                    className="input"
                    type="text"
                    value={createCoachForm.fullName}
                    onChange={(e) => setCreateCoachForm({ ...createCoachForm, fullName: e.target.value })}
                    placeholder="Coach full name"
                    required
                  />
                </label>
                <label className="field">
                  Phone Number *
                  <input
                    className="input"
                    type="tel"
                    value={createCoachForm.phone}
                    onChange={(e) => setCreateCoachForm({ ...createCoachForm, phone: e.target.value })}
                    placeholder="9876543210"
                    required
                  />
                </label>
                <label className="field">
                  MPIN (4–6 digits) *
                  <input
                    className="input"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={createCoachForm.mpin}
                    onChange={(e) => setCreateCoachForm({ ...createCoachForm, mpin: e.target.value })}
                    placeholder="••••"
                    required
                  />
                </label>
                <div className="field">
                  <span className="profile-card__label">Role</span>
                  <p className="profile-card__value" style={{ margin: '4px 0 0', fontWeight: 'bold' }}>COACH</p>
                  <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.9rem' }}>Fixed for new coach accounts.</p>
                </div>
                <div className="actions" style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <button
                    className="button button--ghost"
                    type="button"
                    onClick={() => setShowCreateCoachModal(false)}
                    disabled={isCreatingCoach}
                  >
                    Cancel
                  </button>
                  <button
                    className="button button--primary"
                    type="submit"
                    disabled={isCreatingCoach}
                  >
                    {isCreatingCoach ? 'Creating...' : 'Create Coach'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App
