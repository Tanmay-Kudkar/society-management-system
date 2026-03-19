import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useToast } from '../../context'
import { useConfirmDialog } from '../../context'
import { flatApi, societyApi, wingApi, userApi, tenantApi } from '../../../../api'
import { 
  Plus, Edit, Trash2, Search, X, Home, Store, Briefcase, Layers, 
  Users, UserPlus, UserCheck, UserX, Upload, Download, AlertCircle,
  Link, Unlink, UserCog, Building2, Shield, FileSpreadsheet, CheckCircle, XCircle, Info, Eye, EyeOff
} from 'lucide-react'
import clsx from 'clsx'
import { validateFlatForm, validateUserForm, parseApiError } from '../../utils'
import { SmartSelect, FormInput, NumberInput, PhoneInput, FormErrorSummary, InfoTooltip, NeonSweepButton, PaginationControls } from '../../components'
import { BulkImportModal as SharedBulkImportModal } from '../../components'
import { HeroSkeleton, TabsSkeleton, FiltersSkeleton, CardGridSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const unitTypeIcons = {
  FLAT: Home,
  SHOP: Store,
  OFFICE: Briefcase
}

const unitTypeClasses = {
  FLAT: 'text-[var(--text-secondary)]',
  SHOP: 'text-[#16a34a]',
  OFFICE: 'text-[#7c3aed]'
}

const ROLE_TAG_CLS = 'inline-flex items-center py-[5px] px-[11px] rounded-full text-[11px] font-[650] tracking-[0.03em] text-[var(--text-secondary)] dark:border-[rgba(148,163,184,0.18)] dark:bg-[rgba(148,163,184,0.10)] dark:text-[rgba(226,232,240,0.92)]'
const roleColors = {
  MASTER_ADMIN: ROLE_TAG_CLS,
  SOCIETY_ADMIN: ROLE_TAG_CLS,
  CHAIRMAN: ROLE_TAG_CLS,
  SECRETARY: ROLE_TAG_CLS,
  TREASURER: ROLE_TAG_CLS,
  COMMITTEE: ROLE_TAG_CLS,
  MEMBER: ROLE_TAG_CLS,
  TENANT: ROLE_TAG_CLS,
  default: ROLE_TAG_CLS,
}

const UNIT_ASSIGNABLE_ROLES = ['MEMBER', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE']

const formatRoleLabel = (role) => {
  if (role === 'MEMBER') return 'Member (Owner)'
  return role
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function UnitManagement() {
  const { user, isCommitteeLevel, canManageWings } = useAuth()
  const { showToast } = useToast()
  const confirmDialog = useConfirmDialog()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Get URL params early (before state init that depends on them)
  const societyIdFromUrl = searchParams.get('society')
  const unitTypeFromUrl = searchParams.get('unitType')
  const tabFromUrl = searchParams.get('tab')
  const parsedSocietyIdFromUrl = Number(societyIdFromUrl)
  const scopedSocietyId = Number.isInteger(parsedSocietyIdFromUrl) && parsedSocietyIdFromUrl > 0 ? parsedSocietyIdFromUrl : null
  const isScopedSocietyMode = user?.role === 'MASTER_ADMIN' && !!scopedSocietyId
  const isPlatformLevel = user?.role === 'MASTER_ADMIN' && !isScopedSocietyMode
  const effectiveSocietyId = isScopedSocietyMode ? scopedSocietyId : user?.societyId
  const currentUserSocietyId = effectiveSocietyId ? String(effectiveSocietyId) : (user?.societyId ? String(user.societyId) : '')

  // PO/OO are supervisory - they can view but not directly edit units/users within a society
  const canEditUnits = isCommitteeLevel() && !isPlatformLevel
  const canCreateWingsInline = canManageWings()

  // Active tab derived from URL
  const activeTab = tabFromUrl === 'users' ? 'users' : 'units'

  const switchTab = (tab) => {
    const params = new URLSearchParams(searchParams)
    if (tab === 'users') {
      params.set('tab', 'users')
    } else {
      params.delete('tab')
    }
    setSearchParams(params, { replace: true })
  }

  // User management state
  const [showStandaloneUserModal, setShowStandaloneUserModal] = useState(false)
  const [editingStandaloneUser, setEditingStandaloneUser] = useState(null)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterSociety, setFilterSociety] = useState(societyIdFromUrl || '')
  const [userError, setUserError] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [showStandalonePassword, setShowStandalonePassword] = useState(false)
  const fileInputRef = useRef(null)
  const [showUserBulkImportModal, setShowUserBulkImportModal] = useState(false)
  const [bulkImportFile, setBulkImportFile] = useState(null)
  const [bulkImportPreview, setBulkImportPreview] = useState(null)
  const [bulkImportError, setBulkImportError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  // Modal states
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  
  // Editing states
  const [editingUnit, setEditingUnit] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const filterType = unitTypeFromUrl || ''
  const [viewMode, setViewMode] = useState('units') // 'units' or 'table'
  const [unitPage, setUnitPage] = useState(1)
  const [unitPageSize, setUnitPageSize] = useState(12)
  const [tabUsersPage, setTabUsersPage] = useState(1)
  const [tabUsersPageSize, setTabUsersPageSize] = useState(10)
  
  // Form states
  const [unitFormErrors, setUnitFormErrors] = useState({})
  const [userFormErrors, setUserFormErrors] = useState({})
  const [apiError, setApiError] = useState('')

  // Derive effective filter society from state + user context
  const effectiveFilterSociety = filterSociety
    || (!isPlatformLevel && effectiveSocietyId ? String(effectiveSocietyId) : '')

  // Fetch flats/units
  // PO/OO must have effectiveSocietyId (from URL), otherwise skip
  const { data: flats = [], isLoading: flatsLoading, isError: flatsError } = useQuery({
    queryKey: ['flats', effectiveSocietyId],
    queryFn: () => effectiveSocietyId 
      ? flatApi.getBySociety(effectiveSocietyId).then(res => res.data)
      : flatApi.getAll(user.id).then(res => res.data),
    enabled: !!user?.id && (!!effectiveSocietyId || !isPlatformLevel),
  })

  // Fetch users in the society
  const { data: users = [] } = useQuery({
    queryKey: ['users', user?.id],
    queryFn: () => userApi.getAll().then(res => res.data).catch(() => []),
    enabled: !!user?.id,
  })

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants', effectiveSocietyId],
    queryFn: () => effectiveSocietyId
      ? tenantApi.getBySociety(effectiveSocietyId).then(res => res.data).catch(() => [])
      : tenantApi.getAll().then(res => res.data).catch(() => []),
    enabled: !!user?.id,
    refetchOnMount: 'always',
  })

  // Fetch societies (for MASTER_ADMIN)
  const { data: societies = [] } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data),
    enabled: isPlatformLevel,
  })

  // Fetch current society details for capacity limits
  const { data: currentSociety } = useQuery({
    queryKey: ['society', effectiveSocietyId],
    queryFn: () => societyApi.getById(effectiveSocietyId).then(res => res.data),
    enabled: !!effectiveSocietyId,
  })

  // Fetch wings
  const { data: wings = [] } = useQuery({
    queryKey: ['wings', effectiveSocietyId],
    queryFn: () => effectiveSocietyId 
      ? wingApi.getBySociety(effectiveSocietyId).then(res => res.data)
      : [],
    enabled: !!effectiveSocietyId,
  })

  const scopedUsers = useMemo(() => {
    let usersInScope = [...users]

    if (effectiveFilterSociety) {
      usersInScope = usersInScope.filter(u => String(u.societyId || '') === effectiveFilterSociety)
    } else if (!isPlatformLevel && currentUserSocietyId) {
      usersInScope = usersInScope.filter(u => String(u.societyId || '') === currentUserSocietyId)
    }

    return usersInScope
  }, [users, effectiveFilterSociety, isPlatformLevel, currentUserSocietyId])

  // Users that currently occupy a unit/property
  const memberUsers = useMemo(() => {
    return scopedUsers.filter(u => u.flatId && UNIT_ASSIGNABLE_ROLES.includes(u.role))
  }, [scopedUsers])

  const activeTenantByFlatId = useMemo(() => {
    const map = {}
    tenants
      .filter(t => t.isActive && t.flatId)
      .forEach((tenant) => {
        if (!map[tenant.flatId]) {
          map[tenant.flatId] = tenant
        }
      })
    return map
  }, [tenants])

  // Create unit-user mapping (1 user per unit)
  const unitUserMap = useMemo(() => {
    const map = {}
    flats.forEach(flat => {
      // Only one user should be assigned per unit. If legacy data has multiple, show the first one returned.
      const assignedUser = memberUsers.find(u => u.flatId === flat.id)
      const activeTenant = activeTenantByFlatId[flat.id] || null
      map[flat.id] = {
        flat,
        owner: flat.ownerEmail ? scopedUsers.find(u => u.email === flat.ownerEmail) : null,
        member: assignedUser || null,
        tenant: activeTenant,
      }
    })
    return map
  }, [flats, scopedUsers, memberUsers, activeTenantByFlatId])

  // Filtered data - search includes assigned user name
  const filteredUnits = useMemo(() => {
    return flats.filter(f => {
      const assignedUser = unitUserMap[f.id]?.member
      const matchesSearch = 
        f.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignedUser?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = !filterType || f.unitType === filterType
      return matchesSearch && matchesType
    })
  }, [flats, searchTerm, filterType, unitUserMap])

  const paginatedUnits = useMemo(() => {
    const start = (unitPage - 1) * unitPageSize
    return filteredUnits.slice(start, start + unitPageSize)
  }, [filteredUnits, unitPage, unitPageSize])

  // Unit CRUD mutations
  const createUnitMutation = useMutation({
    mutationFn: (data) => flatApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['flats'])
      setShowUnitModal(false)
      setUnitFormErrors({})
      setApiError('')
    },
    onError: (err) => {
      setApiError(parseApiError(err))
    },
  })

  const updateUnitMutation = useMutation({
    mutationFn: ({ id, data }) => flatApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['flats'])
      setShowUnitModal(false)
      setEditingUnit(null)
      setUnitFormErrors({})
      setApiError('')
    },
    onError: (err) => {
      setApiError(parseApiError(err))
    },
  })

  const deleteUnitMutation = useMutation({
    mutationFn: ({ id, force = false }) => flatApi.delete(id, user.id, force),
    onSuccess: () => queryClient.invalidateQueries(['flats']),
    onError: (err) => {
      setApiError(parseApiError(err))
    },
  })

  const createWingMutation = useMutation({
    mutationFn: (payload) => wingApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['wings'])
      queryClient.invalidateQueries(['society', effectiveSocietyId])
    },
  })

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: (data) => userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowUserModal(false)
      setUserFormErrors({})
      setApiError('')
    },
    onError: (err) => {
      setApiError(parseApiError(err))
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowUserModal(false)
      setShowEditUserModal(false)
      setEditingUser(null)
      setUserFormErrors({})
      setApiError('')
      showToast('User updated successfully', 'success')
    },
    onError: (err) => {
      setApiError(parseApiError(err))
    },
  })

  // ─── User Management Tab: queries & mutations ─────────────────────────

  // Fetch roles that current user can create/update/delete
  const { data: creatableRoles = [] } = useQuery({
    queryKey: ['creatable-roles', user?.id],
    queryFn: () => userApi.getCreatableRoles().then(res => res.data).catch(() => []),
    enabled: !!user?.id,
  })
  const { data: updatableRoles = [] } = useQuery({
    queryKey: ['updatable-roles', user?.id],
    queryFn: () => userApi.getUpdatableRoles().then(res => res.data).catch(() => []),
    enabled: !!user?.id,
  })

  const unitAssignableCreatableRoles = useMemo(() => {
    const allowed = creatableRoles.filter((role) => UNIT_ASSIGNABLE_ROLES.includes(role))
    if (allowed.length > 0) return allowed
    return ['MEMBER']
  }, [creatableRoles])

  const unitAssignableUpdatableRoles = useMemo(() => {
    const allowed = updatableRoles.filter((role) => UNIT_ASSIGNABLE_ROLES.includes(role))
    if (editingUser?.role && UNIT_ASSIGNABLE_ROLES.includes(editingUser.role) && !allowed.includes(editingUser.role)) {
      return [editingUser.role, ...allowed]
    }
    if (allowed.length > 0) return allowed
    return ['MEMBER']
  }, [updatableRoles, editingUser])

  const handleDeleteSuccess = (force = false) => {
    queryClient.invalidateQueries(['users'])
    queryClient.invalidateQueries(['flats'])
    showToast(force ? 'User force-deleted successfully' : 'User deleted successfully', 'success')
  }

  const verifyUserDeleted = async (userId) => {
    try {
      const response = await userApi.getAll()
      return !response.data.some((existingUser) => existingUser.id === userId)
    } catch {
      return false
    }
  }

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: ({ id, force = false }) => userApi.delete(id, force),
    onSuccess: (_, variables) => {
      handleDeleteSuccess(variables?.force)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || parseApiError(err)
      showToast(msg, 'error')
    },
  })

  // Standalone user update mutation (for Users tab)
  const standaloneUpdateUserMutation = useMutation({
    mutationFn: ({ id, data }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      queryClient.invalidateQueries(['flats'])
      setShowStandaloneUserModal(false)
      setEditingStandaloneUser(null)
      setShowStandalonePassword(false)
      setUserError('')
      showToast('User updated successfully', 'success')
    },
    onError: (err) => {
      setUserError(parseApiError(err))
    },
  })

  // Bulk validate import mutation (Users tab)
  const validateBulkImportMutation = useMutation({
    mutationFn: ({ file, societyId }) => userApi.validateBulkImport(file, societyId),
    onSuccess: (res) => {
      setBulkImportPreview(res.data)
      setBulkImportError('')
    },
    onError: (err) => {
      setBulkImportError(parseApiError(err))
      setBulkImportPreview(null)
    },
  })

  // Bulk process import mutation (Users tab)
  const processBulkImportMutation = useMutation({
    mutationFn: ({ file, societyId }) => userApi.processBulkImport(file, societyId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowUserBulkImportModal(false)
      setBulkImportFile(null)
      setBulkImportPreview(null)
      setBulkImportError('')
      showToast('Users imported successfully', 'success')
    },
    onError: (err) => {
      setBulkImportError(parseApiError(err))
    },
  })

  // Available flats for user assignment
  const availableFlats = useMemo(() => {
    return flats.filter(flat => {
      const hasAssignedUser = scopedUsers.some((existingUser) => (
        existingUser.flatId === flat.id
        && UNIT_ASSIGNABLE_ROLES.includes(existingUser.role)
        && existingUser.id !== editingStandaloneUser?.id
      ))
      const isAvailable = !hasAssignedUser || editingStandaloneUser?.flatId === flat.id
      return isAvailable
    })
  }, [flats, scopedUsers, editingStandaloneUser])

  // Filtered users for Users tab
  const filteredTabUsers = useMemo(() => {
    return scopedUsers.filter(u => {
      const matchesSearch = u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                           u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
      const matchesRole = !filterRole || u.role === filterRole
      return matchesSearch && matchesRole
    })
  }, [scopedUsers, userSearchTerm, filterRole])

  const paginatedTabUsers = useMemo(() => {
    const start = (tabUsersPage - 1) * tabUsersPageSize
    return filteredTabUsers.slice(start, start + tabUsersPageSize)
  }, [filteredTabUsers, tabUsersPage, tabUsersPageSize])

  useEffect(() => {
    setUnitPage(1)
  }, [searchTerm, filterType, activeTab])

  useEffect(() => {
    setTabUsersPage(1)
  }, [userSearchTerm, filterRole, filterSociety, activeTab])

  const societyOptions = useMemo(() => {
    return societies
  }, [societies])

  const roleFilterOptions = useMemo(() => {
    const roles = new Set(scopedUsers.map(u => u.role).filter(Boolean))
    return Array.from(roles).sort((a, b) => a.localeCompare(b))
  }, [scopedUsers])

  const standaloneRoleOptions = useMemo(() => {
    if (!editingStandaloneUser) return ['MEMBER']

    if (editingStandaloneUser.flatId) {
      const allowed = updatableRoles.filter((role) => UNIT_ASSIGNABLE_ROLES.includes(role))
      if (
        editingStandaloneUser.role
        && UNIT_ASSIGNABLE_ROLES.includes(editingStandaloneUser.role)
        && !allowed.includes(editingStandaloneUser.role)
      ) {
        return [editingStandaloneUser.role, ...allowed]
      }
      return allowed.length > 0 ? allowed : ['MEMBER']
    }

    const allowed = [...updatableRoles]
    if (editingStandaloneUser.role && !allowed.includes(editingStandaloneUser.role)) {
      allowed.unshift(editingStandaloneUser.role)
    }
    return allowed.length > 0 ? allowed : [editingStandaloneUser.role || 'MEMBER']
  }, [editingStandaloneUser, updatableRoles])

  const handleOpenStandaloneUserModal = (userToEdit = null) => {
    setEditingStandaloneUser(userToEdit)
    setSelectedRole(userToEdit?.role || updatableRoles[0] || 'MEMBER')
    setUserError('')
    setShowStandalonePassword(false)
    setShowStandaloneUserModal(true)
  }

  const effectiveStandaloneRole = selectedRole || editingStandaloneUser?.role || standaloneRoleOptions[0] || 'MEMBER'
  const isSelfRoleLocked = !!editingStandaloneUser && editingStandaloneUser.id === user?.id
  const isRoleSelectionLocked = isSelfRoleLocked || standaloneRoleOptions.length <= 1

  // Handle standalone user form submission (Users tab)
  const handleStandaloneUserSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const roleValue = formData.get('role') || selectedRole || editingStandaloneUser?.role || standaloneRoleOptions[0] || 'MEMBER'
    const passwordValue = (formData.get('password') || '').toString().trim()
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      // For edit flow, do not send an empty password string.
      password: editingStandaloneUser
        ? (passwordValue ? passwordValue : undefined)
        : passwordValue,
      role: roleValue,
      phone: formData.get('phone'),
      societyId: formData.get('societyId') ? parseInt(formData.get('societyId')) : (user?.societyId || null),
      flatId: formData.get('flatId') ? parseInt(formData.get('flatId')) : null,
    }

    // Frontend validation
    const validation = validateUserForm(data, !!editingStandaloneUser)
    if (!validation.isValid) {
      setUserError(Object.values(validation.errors).join(', '))
      return
    }

    // Validate flatId for unit-assigned roles
    if (UNIT_ASSIGNABLE_ROLES.includes(roleValue) && !data.flatId) {
      setUserError('Please select a property for the user')
      return
    }

    // Prevent duplicate restricted roles
    const restrictedRoles = ['CHAIRMAN', 'SECRETARY', 'TREASURER']
    if (restrictedRoles.includes(roleValue)) {
      const targetSocietyId = data.societyId || user?.societyId
      const existingRoleUser = users.find(u => 
        u.role === roleValue && 
        u.societyId === targetSocietyId &&
        u.id !== editingStandaloneUser?.id
      )
      if (existingRoleUser) {
        setUserError(`A ${roleValue} already exists in this society: ${existingRoleUser.name}`)
        return
      }
    }

    if (!editingStandaloneUser) {
      setUserError('User context missing for update')
      return
    }

    standaloneUpdateUserMutation.mutate({ id: editingStandaloneUser.id, data })
  }

  // ─── End User Management Tab ──────────────────────────────────────────

  // Handle unit form submission
  const handleUnitSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    const societyId = isPlatformLevel 
      ? parseInt(formData.get('societyId')) 
      : effectiveSocietyId

    const unitType = formData.get('unitType') || 'FLAT'

    const floorRaw = formData.get('floor')
    const areaRaw = formData.get('area')

    let resolvedWingId = formData.get('wingId') ? parseInt(formData.get('wingId')) : null

    const inlineWingName = formData.get('createWingName')?.trim()
    const inlineWingFloorsRaw = formData.get('createWingFloors')
    if (inlineWingName) {
      if (!canCreateWingsInline) {
        setApiError('You do not have permission to create wings.')
        return
      }

      if (currentSociety?.hasWings === false) {
        setUnitFormErrors({ capacity: 'This society is configured as single-tower and does not use wings.' })
        return
      }

      const maxWings = currentSociety?.totalWings || 0
      const hasWingLimit = maxWings > 0
      const currentWingCount = wings.length
      if (hasWingLimit && currentWingCount >= maxWings) {
        setUnitFormErrors({
          capacity: `Cannot create more wings. Society capacity reached: ${currentWingCount}/${maxWings}`,
        })
        return
      }

      const inlineWingFloors = parseInt(inlineWingFloorsRaw, 10)
      if (!Number.isInteger(inlineWingFloors) || inlineWingFloors < 1) {
        setUnitFormErrors({ createWingFloors: 'Wing floors must be at least 1' })
        return
      }

      try {
        const wingRes = await createWingMutation.mutateAsync({
          societyId,
          name: inlineWingName,
          totalFloors: inlineWingFloors,
        })
        resolvedWingId = wingRes?.data?.id || null
      } catch (error) {
        setApiError(parseApiError(error))
        return
      }
    }

    const data = {
      societyId,
      wingId: resolvedWingId,
      flatNumber: formData.get('flatNumber'),
      unitType: unitType,
      flatType: formData.get('flatType'),
      floor: floorRaw === null || floorRaw === '' ? null : parseInt(floorRaw, 10),
      area: areaRaw === null || areaRaw === '' ? null : parseFloat(areaRaw),
      // Owner/user will be added via 'Add User' button after creating the unit
    }

    // Validate
    const validation = validateFlatForm(data)
    if (!validation.isValid) {
      setUnitFormErrors(validation.errors)
      return
    }

    // Check capacity limits (only for new units)
    if (!editingUnit && currentSociety) {
      const currentCount = unitType === 'FLAT' 
        ? stats.flats 
        : unitType === 'SHOP' 
        ? stats.shops 
        : stats.offices
      const maxCount = unitType === 'FLAT' 
        ? stats.maxFlats 
        : unitType === 'SHOP' 
        ? stats.maxShops 
        : stats.maxOffices
      
      if (maxCount > 0 && currentCount >= maxCount) {
        setUnitFormErrors({ 
          capacity: `Society capacity limit exceeded. Maximum allowed ${unitType.toLowerCase()} units: ${maxCount}. Current: ${currentCount}` 
        })
        return
      }
    }

    if (editingUnit) {
      updateUnitMutation.mutate({ id: editingUnit.id, data })
    } else {
      createUnitMutation.mutate(data)
    }
  }

  // Handle user form submission for linking to unit
  const handleUserSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const passwordValue = (formData.get('password') || '').toString().trim()
    
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: passwordValue,
      role: formData.get('role') || 'MEMBER',
      phone: formData.get('phone'),
      societyId: effectiveSocietyId,
      flatId: selectedUnit?.id,
    }

    // Validate
    const validation = validateUserForm(data, false)
    if (!validation.isValid) {
      setUserFormErrors(validation.errors)
      return
    }

    createUserMutation.mutate(data)
  }

  // Handle edit user form submission
  const handleEditUserSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const passwordValue = (formData.get('password') || '').toString().trim()
    
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: passwordValue ? passwordValue : undefined,
      role: formData.get('role') || 'MEMBER',
      phone: formData.get('phone'),
      societyId: effectiveSocietyId,
      flatId: editingUser?.flatId,
    }

    // Validate (isEditing = true, so no password required)
    const validation = validateUserForm(data, true)
    if (!validation.isValid) {
      setUserFormErrors(validation.errors)
      return
    }

    updateUserMutation.mutate({ id: editingUser.id, data })
  }

  const openUnitModal = (unit = null) => {
    setEditingUnit(unit)
    setUnitFormErrors({})
    setApiError('')
    setShowUnitModal(true)
  }

  const openUserModal = (unit) => {
    setSelectedUnit(unit)
    setUserFormErrors({})
    setApiError('')
    setShowUserModal(true)
  }

  const confirmAndDeleteUser = async (targetUser, context = {}) => {
    const propertyValue = context?.property || context?.userFlat?.flatNumber || 'Unassigned'

    const confirmed = await confirmDialog({
      title: 'Delete User',
      message: `Are you sure you want to delete "${targetUser?.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      tone: 'danger',
      details: [
        { label: 'Name', value: targetUser?.name || '-' },
        { label: 'Email', value: targetUser?.email || '-' },
        { label: 'Role', value: targetUser?.role?.replace(/_/g, ' ') || '-' },
        { label: 'Property', value: propertyValue },
      ],
      impacts: [
        { label: 'User Account', count: 1 },
        { label: 'Property Link', count: context?.userFlat ? 1 : 0 },
      ],
      caution: 'This action permanently removes the user account.',
    })

    if (!confirmed) return

    try {
      await deleteUserMutation.mutateAsync({ id: targetUser.id, force: false })
    } catch (error) {
      if (!error?.response && await verifyUserDeleted(targetUser.id)) {
        handleDeleteSuccess(false)
        return
      }

      const serverMessage = error?.response?.data?.message || parseApiError(error)
      const shouldOfferForceDelete =
        error?.response?.status === 409 &&
        String(serverMessage).toLowerCase().includes('force delete')

      if (!shouldOfferForceDelete) {
        return
      }

      const forceConfirmed = await confirmDialog({
        title: 'Force Delete User',
        message: `${serverMessage}\n\nForce delete will remove or unlink linked records. Continue?`,
        confirmText: 'Force Delete',
        tone: 'danger',
        details: [
          { label: 'Name', value: targetUser?.name || '-' },
          { label: 'Role', value: targetUser?.role?.replace(/_/g, ' ') || '-' },
          { label: 'Property', value: propertyValue },
        ],
        caution: 'This will auto-clean linked references and cannot be undone.',
      })

      if (!forceConfirmed) return

      try {
        await deleteUserMutation.mutateAsync({ id: targetUser.id, force: true })
      } catch (forceError) {
        if (!forceError?.response && await verifyUserDeleted(targetUser.id)) {
          handleDeleteSuccess(true)
          return
        }
        showToast(forceError?.response?.data?.message || parseApiError(forceError), 'error')
      }
    }
  }

  const openEditUserModal = (user, unit) => {
    setEditingUser(user)
    setSelectedUnit(unit)
    setUserFormErrors({})
    setApiError('')
    setShowEditUserModal(true)
  }

  const getUnitIcon = (type) => unitTypeIcons[type] || Home
  const getUnitColor = (type) => unitTypeClasses[type] || unitTypeClasses.FLAT

  // Stats - count units with assigned user as occupied
  const occupiedUnits = flats.filter(f => {
    const hasAssignedUser = memberUsers.some(u => u.flatId === f.id)
    return hasAssignedUser || f.ownerName
  })
  const stats = {
    totalUnits: flats.length,
    flats: flats.filter(f => !f.unitType || f.unitType === 'FLAT').length,
    shops: flats.filter(f => f.unitType === 'SHOP').length,
    offices: flats.filter(f => f.unitType === 'OFFICE').length,
    occupied: occupiedUnits.length,
    vacant: flats.length - occupiedUnits.length,
    assignedUsers: memberUsers.filter(u => u.flatId).length,
    // Capacity limits from society
    maxFlats: currentSociety?.totalFlats || 0,
    maxShops: currentSociety?.totalShops || 0,
    maxOffices: currentSociety?.totalOffices || 0,
  }

  const showSkeleton = useMinLoadingTime(flatsLoading || flatsError)

  if (showSkeleton) return (
    <div>
      <WakeUpBanner />
      <HeroSkeleton statCount={0} />
      <TabsSkeleton tabCount={2} />
      <FiltersSkeleton />
      <CardGridSkeleton count={8} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col items-start gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between max-[360px]:mb-4 max-[360px]:gap-2.5">
        <div>
          <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-[var(--text-primary)]">
            <Home className="text-[var(--text-secondary)]" />
            Unit Management
            <InfoTooltip text="Manage units and their assigned users in one place" />
          </h1>
        </div>
        <div className="w-full sm:w-auto flex flex-wrap gap-3">
          {canEditUnits && activeTab === 'units' && (
            <>
              <NeonSweepButton
                tone="cyan"
                size="md"
                onClick={() => setShowBulkImportModal(true)}
                className="w-full sm:w-auto"
              >
                <Upload size={18} />
                Import Units
              </NeonSweepButton>
              <NeonSweepButton
                tone="violet"
                size="md"
                onClick={() => openUnitModal()}
                className="w-full sm:w-auto"
              >
                <Plus size={20} />
                Add Unit
              </NeonSweepButton>
            </>
          )}
          {activeTab === 'users' && (
            <>
              {['SECRETARY', 'COMMITTEE'].includes(user?.role) && (
                <>
                  <NeonSweepButton
                    tone="cyan"
                    size="md"
                    onClick={() => {
                      setBulkImportFile(null)
                      setBulkImportPreview(null)
                      setBulkImportError('')
                      setShowUserBulkImportModal(true)
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Upload size={18} />
                    Import Excel
                  </NeonSweepButton>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-7 p-[0.45rem] rounded-[14px] border border-[var(--border-default)] shadow-[var(--shadow-sm)] max-sm:p-[0.3rem] max-sm:gap-[0.3rem]" role="tablist" aria-label="Unit management sections" style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--bg-tertiary) 92%, transparent) 0%, color-mix(in srgb, var(--bg-secondary) 94%, transparent) 100%)' }}>
        <button
          onClick={() => switchTab('units')}
          type="button"
          className={clsx(
            'appearance-none border-none flex-1 min-h-[46px] flex items-center justify-center gap-2 py-[10px] px-4 rounded-[11px] font-semibold cursor-pointer transition-all max-sm:min-h-[40px] max-sm:py-2 max-sm:px-2 max-sm:text-[0.85rem]',
            activeTab === 'units'
              ? 'text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          )}
          style={activeTab === 'units' ? { background: 'color-mix(in srgb, var(--color-primary-100) 55%, var(--bg-card))', border: '1px solid color-mix(in srgb, var(--color-primary-200) 72%, transparent)' } : undefined}
          role="tab"
          aria-selected={activeTab === 'units'}
        >
          <Home size={18} />
          Units
          <span
            className={clsx('ml-[2px] px-[0.55rem] py-[0.15rem] rounded-full text-xs font-semibold border max-sm:hidden', activeTab === 'units' ? 'text-[#3b82f6]' : 'border-[var(--border-light)]')}
            style={{ background: activeTab === 'units' ? 'color-mix(in srgb, var(--color-primary-100) 40%, var(--bg-card))' : 'color-mix(in srgb, var(--bg-tertiary) 65%, var(--bg-card))', borderColor: activeTab === 'units' ? 'color-mix(in srgb, var(--color-primary-200) 70%, transparent)' : undefined }}
          >{flats.length}</span>
        </button>
        <button
          onClick={() => switchTab('users')}
          type="button"
          className={clsx(
            'appearance-none border-none flex-1 min-h-[46px] flex items-center justify-center gap-2 py-[10px] px-4 rounded-[11px] font-semibold cursor-pointer transition-all max-sm:min-h-[40px] max-sm:py-2 max-sm:px-2 max-sm:text-[0.85rem]',
            activeTab === 'users'
              ? 'text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          )}
          style={activeTab === 'users' ? { background: 'color-mix(in srgb, var(--color-primary-100) 55%, var(--bg-card))', border: '1px solid color-mix(in srgb, var(--color-primary-200) 72%, transparent)' } : undefined}
          role="tab"
          aria-selected={activeTab === 'users'}
        >
          <Users size={18} />
          Users
          <span
            className={clsx('ml-[2px] px-[0.55rem] py-[0.15rem] rounded-full text-xs font-semibold border max-sm:hidden', activeTab === 'users' ? 'text-[#3b82f6]' : 'border-[var(--border-light)]')}
            style={{ background: activeTab === 'users' ? 'color-mix(in srgb, var(--color-primary-100) 40%, var(--bg-card))' : 'color-mix(in srgb, var(--bg-tertiary) 65%, var(--bg-card))', borderColor: activeTab === 'users' ? 'color-mix(in srgb, var(--color-primary-200) 70%, transparent)' : undefined }}
          >{scopedUsers.length}</span>
        </button>
      </div>

      {/* ═══════════════════ UNITS TAB ═══════════════════ */}
      {activeTab === 'units' && (
      <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-[0.85rem] mb-6 max-[360px]:mb-4 max-[360px]:gap-2">
        <StatCard label="Total Units" value={stats.totalUnits} icon={Layers} color="blue" />
        <StatCard label="Flats" value={`${stats.flats}/${stats.maxFlats}`} icon={Home} color="indigo" />
        <StatCard label="Shops" value={`${stats.shops}/${stats.maxShops}`} icon={Store} color="green" />
        <StatCard label="Offices" value={`${stats.offices}/${stats.maxOffices}`} icon={Briefcase} color="purple" />
        <StatCard label="Occupied" value={stats.occupied} icon={UserCheck} color="teal" />
        <StatCard label="Vacant" value={stats.vacant} icon={UserX} color="orange" />
        <StatCard label="Assigned" value={stats.assignedUsers} icon={Users} color="pink" />
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="flex items-center justify-between gap-2 p-4 rounded-2xl mb-6 border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] text-[#dc2626]">
          <div className="inline-flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{apiError}</span>
          </div>
          <button onClick={() => setApiError('')} className="p-1 rounded-lg transition-colors hover:bg-[rgba(239,68,68,0.16)]">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="p-[0.9rem] rounded-[14px] bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] mb-6 max-[360px]:mb-4 max-[360px]:p-3 dark:border-[rgba(148,163,184,0.22)] dark:shadow-[0_10px_22px_rgba(2,6,23,0.45)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by unit number or user name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-[42px] py-[0.55rem] pl-10 pr-3 rounded-xl border border-[var(--border-default)] text-[var(--text-primary)] transition-all focus:outline-none"
              style={{ background: 'color-mix(in srgb, var(--bg-card) 86%, var(--bg-secondary))' }}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams)
              if (e.target.value) {
                params.set('unitType', e.target.value)
              } else {
                params.delete('unitType')
              }
              setSearchParams(params, { replace: true })
            }}
            className="w-full min-h-[42px] py-[0.55rem] px-3 rounded-xl border border-[var(--border-default)] text-[var(--text-primary)] transition-all focus:outline-none sm:w-[11rem] sm:flex-none"
            style={{ background: 'color-mix(in srgb, var(--bg-card) 86%, var(--bg-secondary))' }}
          >
            <option value="">All Types</option>
            <option value="FLAT">Flats</option>
            <option value="SHOP">Shops</option>
            <option value="OFFICE">Offices</option>
          </select>
          {/* View toggle */}
          <div className="inline-flex flex-none self-stretch rounded-xl border border-[var(--border-default)] overflow-hidden bg-[var(--bg-card)]">
            <button
              onClick={() => setViewMode('units')}
              className={clsx(
                'appearance-none border-none cursor-pointer min-w-[4.75rem] min-h-[42px] py-2 px-[0.9rem] text-[0.85rem] font-[650] transition-all',
                viewMode === 'units'
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] bg-[var(--bg-card)]'
              )}
              style={viewMode === 'units' ? { background: 'color-mix(in srgb, var(--color-primary-100) 62%, var(--bg-card))' } : undefined}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={clsx(
                'appearance-none border-none cursor-pointer min-w-[4.75rem] min-h-[42px] py-2 px-[0.9rem] text-[0.85rem] font-[650] transition-all',
                viewMode === 'table'
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] bg-[var(--bg-card)]'
              )}
              style={viewMode === 'table' ? { background: 'color-mix(in srgb, var(--color-primary-100) 62%, var(--bg-card))' } : undefined}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'units' ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedUnits.map((unit) => {
            const UnitIcon = getUnitIcon(unit.unitType)
            const unitColor = getUnitColor(unit.unitType)
            const assignedUser = unitUserMap[unit.id]?.member
            const linkedTenant = unitUserMap[unit.id]?.tenant
            const hasAssignedUser = !!assignedUser
            const isOccupied = !!assignedUser || !!linkedTenant
            
            return (
              <div key={unit.id} className="p-[1.15rem] rounded-[14px] bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] dark:border-[rgba(148,163,184,0.22)] dark:shadow-[0_10px_22px_rgba(2,6,23,0.45)]">
                {/* Unit Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={clsx('w-12 h-12 rounded-[0.9rem] flex items-center justify-center border', unitColor)} style={{ background: 'color-mix(in srgb, var(--color-primary-100) 40%, var(--bg-tertiary))', borderColor: 'color-mix(in srgb, var(--color-primary-200) 58%, transparent)' }}>
                      <UnitIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-[1.1rem] font-bold text-[var(--text-primary)]">{unit.flatNumber}</h3>
                      <div className="inline-flex items-center gap-2 text-[0.8rem] text-[var(--text-tertiary)]">
                        {unit.wingName && (
                          <span className="inline-flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {unit.wingName}
                          </span>
                        )}
                        <span>Floor {unit.floor}</span>
                      </div>
                    </div>
                  </div>
                  <span className={clsx(
                    'py-1 px-[0.7rem] rounded-full text-xs font-semibold',
                    isOccupied
                      ? 'text-[color-mix(in_srgb,var(--color-success)_80%,var(--text-primary))]'
                      : 'text-[var(--text-secondary)]'
                  )} style={{ background: isOccupied ? 'color-mix(in srgb, var(--color-success) 22%, transparent)' : 'color-mix(in srgb, var(--bg-tertiary) 80%, transparent)' }}>
                    {isOccupied ? 'Occupied' : 'Vacant'}
                  </span>
                </div>

                {/* Unit Details */}
                <div className="flex flex-col gap-2 text-[0.85rem] mb-4">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Type:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{unit.flatType || unit.unitType || 'FLAT'}</span>
                  </div>
                  {unit.area > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-tertiary)]">Area:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{unit.area} sq.ft</span>
                    </div>
                  )}
                </div>

                {/* Assigned User - single user per unit */}
                <div className="border-t border-[var(--border-default)] pt-4 mb-4">
                  <p className="text-[0.7rem] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-2">Assigned User</p>
                  {assignedUser ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(100,116,139,0.70) 0%, rgba(30,41,59,0.90) 100%)' }}>
                        <span className="text-white font-bold text-[0.85rem]">
                          {assignedUser.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--text-primary)] truncate">{assignedUser.name}</p>
                        <p className="text-xs text-[var(--text-tertiary)] truncate">{assignedUser.phone || assignedUser.email}</p>
                      </div>
                      <span className={clsx(
                        'inline-flex items-center justify-center leading-none text-[0.7rem] font-semibold py-1 px-[0.55rem] rounded-full',
                        assignedUser.role === 'MEMBER'
                          ? 'text-[var(--text-secondary)]'
                          : assignedUser.role === 'TENANT'
                          ? 'bg-[rgba(249,115,22,0.15)] text-[#c2410c]'
                          : null
                      )} style={assignedUser.role === 'MEMBER' ? { background: 'color-mix(in srgb, var(--text-tertiary) 18%, transparent)' } : undefined}>
                        {assignedUser.role === 'MEMBER' ? 'Owner' : formatRoleLabel(assignedUser.role)}
                      </span>
                      {canEditUnits && (
                        <button
                          onClick={() => openEditUserModal(assignedUser, unit)}
                          className="appearance-none w-7 h-7 inline-flex items-center justify-center p-0 rounded-lg border text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)] dark:border-[rgba(148,163,184,0.26)] dark:bg-[rgba(148,163,184,0.14)] dark:text-[rgba(241,245,249,0.94)] dark:hover:bg-[rgba(148,163,184,0.22)] dark:hover:text-white"
                          style={{ borderColor: 'color-mix(in srgb, var(--border-light) 75%, transparent)', background: 'color-mix(in srgb, var(--bg-tertiary) 60%, transparent)' }}
                          title="Edit User"
                        >
                          <Edit size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[var(--text-tertiary)] text-[0.85rem] italic">No user assigned</p>
                  )}
                  {linkedTenant && (
                    <div className="mt-3 rounded-xl border border-[var(--border-default)] px-3 py-2" style={{ background: 'color-mix(in srgb, var(--bg-tertiary) 70%, transparent)' }}>
                      <p className="text-[0.68rem] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Active Tenant</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[0.83rem] font-semibold text-[var(--text-primary)] truncate">{linkedTenant.name}</p>
                          <p className="text-[0.72rem] text-[var(--text-tertiary)] truncate">{linkedTenant.phone || linkedTenant.email || 'No contact'}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-semibold bg-[rgba(249,115,22,0.15)] text-[#c2410c]">
                          Tenant
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {canEditUnits && (
                  <div className="flex gap-2 pt-3 border-t border-[var(--border-default)]">
                    <button
                      onClick={() => openUnitModal(unit)}
                      className="appearance-none flex-1 inline-flex items-center justify-center gap-[0.35rem] py-2 px-3 rounded-xl border text-[0.85rem] font-semibold text-[var(--text-primary)] transition-all dark:border-[rgba(148,163,184,0.26)] dark:bg-[rgba(15,23,42,0.75)] dark:text-[rgba(241,245,249,0.96)] dark:hover:bg-[rgba(30,41,59,0.92)]"
                      style={{ borderColor: 'color-mix(in srgb, var(--border-light) 78%, transparent)', background: 'color-mix(in srgb, var(--bg-tertiary) 68%, transparent)' }}
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    {!hasAssignedUser && (
                      <button
                        onClick={() => openUserModal(unit)}
                        className="appearance-none flex-1 inline-flex items-center justify-center gap-[0.35rem] py-2 px-3 rounded-xl border text-[0.85rem] font-semibold text-[var(--text-primary)] transition-all dark:border-[rgba(148,163,184,0.26)] dark:bg-[rgba(15,23,42,0.75)] dark:text-[rgba(241,245,249,0.96)] dark:hover:bg-[rgba(30,41,59,0.92)]"
                        style={{ borderColor: 'color-mix(in srgb, var(--border-light) 78%, transparent)', background: 'color-mix(in srgb, var(--bg-tertiary) 85%, transparent)' }}
                      >
                        <UserPlus size={14} />
                        Assign Owner
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        const confirmed = await confirmDialog({
                          title: 'Delete Unit',
                          message: 'Are you sure you want to delete this unit? This action cannot be undone.',
                          confirmText: 'Delete',
                          tone: 'danger',
                          details: [
                            { label: 'Unit', value: unit.flatNumber || '-' },
                            { label: 'Type', value: unit.flatType || unit.unitType || 'FLAT' },
                            { label: 'Wing', value: unit.wingName || 'No Wing' },
                            { label: 'Floor', value: unit.floor ?? '-' },
                          ],
                          impacts: [
                            { label: 'Unit Record', count: 1 },
                            { label: 'User Link', count: hasAssignedUser ? 1 : 0 },
                          ],
                          caution: 'This action permanently removes this unit.',
                        })
                        if (!confirmed) return

                        try {
                          await deleteUnitMutation.mutateAsync({ id: unit.id, force: false })
                        } catch (error) {
                          const msg = error?.response?.data?.message || ''
                          if (error?.response?.status === 409 && msg.toLowerCase().includes('force delete')) {
                            const forceConfirmed = await confirmDialog({
                              title: 'Force Delete Unit',
                              message: `${msg}\n\nForce delete will remove all linked users and records. Continue?`,
                              confirmText: 'Force Delete',
                              tone: 'danger',
                            })
                            if (forceConfirmed) {
                              deleteUnitMutation.mutate({ id: unit.id, force: true })
                            }
                          }
                        }
                      }}
                      className="appearance-none w-9 h-9 inline-flex items-center justify-center p-0 rounded-xl border border-[rgba(239,68,68,0.35)] text-[#dc2626] bg-[rgba(239,68,68,0.1)] transition-all hover:bg-[rgba(239,68,68,0.16)] hover:border-[rgba(239,68,68,0.5)] dark:text-[rgba(252,165,165,0.98)] dark:bg-[rgba(127,29,29,0.34)] dark:border-[rgba(239,68,68,0.42)] dark:hover:bg-[rgba(127,29,29,0.5)]"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-[14px] bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] overflow-hidden dark:border-[rgba(148,163,184,0.22)] dark:shadow-[0_10px_22px_rgba(2,6,23,0.45)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead className="border-b border-[var(--border-default)] dark:border-b-[rgba(148,163,184,0.16)]" style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--bg-tertiary) 88%, transparent) 0%, color-mix(in srgb, var(--bg-secondary) 92%, transparent) 100%)' }}>
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Unit</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Wing</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Type</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Assigned User</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Contact</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Status</th>
                  {canEditUnits && (
                    <th className="py-3 px-6 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedUnits.map((unit) => {
                  const UnitIcon = getUnitIcon(unit.unitType)
                  const assignedUser = unitUserMap[unit.id]?.member
                  const linkedTenant = unitUserMap[unit.id]?.tenant
                  const hasAssignedUser = !!assignedUser
                  const isOccupied = !!assignedUser || !!linkedTenant
                  return (
                    <tr key={unit.id} className="transition-colors hover:bg-[rgba(30,41,59,0.04)] dark:hover:bg-[rgba(30,41,59,0.45)]">
                      <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)]">
                        <div className="flex items-center gap-3">
                          <div className={clsx('w-8 h-8 rounded-[0.6rem] flex items-center justify-center border', getUnitColor(unit.unitType))} style={{ background: 'color-mix(in srgb, var(--color-primary-100) 40%, var(--bg-tertiary))', borderColor: 'color-mix(in srgb, var(--color-primary-200) 58%, transparent)' }}>
                            <UnitIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold">{unit.flatNumber}</span>
                            <p className="text-xs text-[var(--text-tertiary)]">Floor {unit.floor}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)]">
                        {unit.wingName ? (
                          <span className="inline-flex items-center gap-[0.4rem] py-1 px-[0.6rem] rounded-full text-xs bg-[rgba(99,102,241,0.15)] text-[#4338ca]">
                            <Layers className="w-3 h-3" />
                            {unit.wingName}
                          </span>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">-</span>
                        )}
                      </td>
                      <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-tertiary)]">
                        {unit.flatType || unit.unitType || 'FLAT'}
                      </td>
                      <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)]">
                        <div className="flex flex-col gap-[0.2rem]">
                          <span className="font-semibold">{assignedUser?.name || '-'}</span>
                          {linkedTenant && (
                            <span className="text-[0.72rem] text-[#c2410c]">Tenant: {linkedTenant.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)]">
                        <div className="flex flex-col gap-[0.2rem] text-[0.8rem]">
                          <p className="text-[var(--text-tertiary)]">{assignedUser?.phone || linkedTenant?.phone || '-'}</p>
                          <p className="text-[var(--text-tertiary)] text-[0.7rem]">{assignedUser?.email || linkedTenant?.email || ''}</p>
                        </div>
                      </td>
                      <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)]">
                        <span className={clsx(
                          'py-1 px-[0.7rem] rounded-full text-xs font-semibold',
                          isOccupied
                            ? 'text-[color-mix(in_srgb,var(--color-success)_80%,var(--text-primary))]'
                            : 'text-[var(--text-secondary)]'
                        )} style={{ background: isOccupied ? 'color-mix(in srgb, var(--color-success) 22%, transparent)' : 'color-mix(in srgb, var(--bg-tertiary) 80%, transparent)' }}>
                          {isOccupied ? 'Occupied' : 'Vacant'}
                        </span>
                      </td>
                      {canEditUnits && (
                        <td className="py-[0.85rem] px-6 text-right text-[0.9rem] text-[var(--text-primary)]">
                          <button
                            onClick={() => openUnitModal(unit)}
                            className="p-[0.35rem] rounded-[0.6rem] text-[var(--text-tertiary)] transition-all border hover:text-[var(--text-primary)]" style={{ borderColor: 'color-mix(in srgb, var(--border-default) 78%, transparent)', background: 'color-mix(in srgb, var(--bg-tertiary) 55%, transparent)' }}
                          >
                            <Edit size={18} />
                          </button>
                          {!hasAssignedUser && (
                            <button
                              onClick={() => openUserModal(unit)}
                              className="p-[0.35rem] rounded-[0.6rem] text-[var(--text-tertiary)] transition-all border hover:text-[#16a34a] hover:bg-[rgba(22,163,74,0.12)]" style={{ borderColor: 'color-mix(in srgb, var(--border-default) 78%, transparent)', background: 'color-mix(in srgb, var(--bg-tertiary) 55%, transparent)' }}
                            >
                              <UserPlus size={18} />
                            </button>
                          )}
                          {hasAssignedUser && (
                            <button
                              onClick={() => openEditUserModal(assignedUser, unit)}
                              className="p-[0.35rem] rounded-[0.6rem] text-[var(--text-tertiary)] transition-all border hover:text-[#7c3aed] hover:bg-[rgba(124,58,237,0.12)]" style={{ borderColor: 'color-mix(in srgb, var(--border-default) 78%, transparent)', background: 'color-mix(in srgb, var(--bg-tertiary) 55%, transparent)' }}
                              title="Edit User"
                            >
                              <UserCog size={18} />
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              const confirmed = await confirmDialog({
                                title: 'Delete Unit',
                                message: 'Are you sure you want to delete this unit? This action cannot be undone.',
                                confirmText: 'Delete',
                                tone: 'danger',
                                details: [
                                  { label: 'Unit', value: unit.flatNumber || '-' },
                                  { label: 'Type', value: unit.flatType || unit.unitType || 'FLAT' },
                                  { label: 'Wing', value: unit.wingName || 'No Wing' },
                                  { label: 'Floor', value: unit.floor ?? '-' },
                                ],
                                impacts: [
                                  { label: 'Unit Record', count: 1 },
                                  { label: 'User Link', count: hasAssignedUser ? 1 : 0 },
                                ],
                                caution: 'This action permanently removes this unit.',
                              })
                              if (!confirmed) return

                              try {
                                await deleteUnitMutation.mutateAsync({ id: unit.id, force: false })
                              } catch (error) {
                                const msg = error?.response?.data?.message || ''
                                if (error?.response?.status === 409 && msg.toLowerCase().includes('force delete')) {
                                  const forceConfirmed = await confirmDialog({
                                    title: 'Force Delete Unit',
                                    message: `${msg}\n\nForce delete will remove all linked users and records. Continue?`,
                                    confirmText: 'Force Delete',
                                    tone: 'danger',
                                  })
                                  if (forceConfirmed) {
                                    deleteUnitMutation.mutate({ id: unit.id, force: true })
                                  }
                                }
                              }
                            }}
                            className="p-[0.35rem] rounded-[0.6rem] text-[var(--text-tertiary)] transition-all border hover:text-[#dc2626] hover:bg-[rgba(239,68,68,0.12)]" style={{ borderColor: 'color-mix(in srgb, var(--border-default) 78%, transparent)', background: 'color-mix(in srgb, var(--bg-tertiary) 55%, transparent)' }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PaginationControls
        totalItems={filteredUnits.length}
        currentPage={unitPage}
        pageSize={unitPageSize}
        onPageChange={setUnitPage}
        onPageSizeChange={(nextSize) => {
          setUnitPageSize(nextSize)
          setUnitPage(1)
        }}
      />
      </>
      )}

      {/* ═══════════════════ USERS TAB ═══════════════════ */}
      {activeTab === 'users' && (
      <>
        {/* Role Permissions Info */}
        {!['MASTER_ADMIN', 'SOCIETY_ADMIN'].includes(user?.role) && (
          <div className="mb-6 p-4 rounded-[14px] border shadow-[var(--shadow-sm)] dark:border-[rgba(59,130,246,0.38)]" style={{ borderColor: 'color-mix(in srgb, var(--color-primary-200) 55%, var(--border-default))', background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary-100) 35%, var(--bg-card)) 0%, color-mix(in srgb, var(--bg-tertiary) 88%, transparent) 100%)' }}>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 mt-0.5 text-[var(--text-secondary)]" />
              <div className="flex-1">
                <h3 className="font-medium text-[var(--text-primary)]">Your Permissions ({user?.role?.replace('_', ' ')})</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Access scope is based on your current role and selected society.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {creatableRoles.length > 0 && (
                    <div className="text-xs text-[var(--text-secondary)]">
                      <span className="font-semibold text-[var(--text-primary)]">Can create:</span>{' '}
                      <span>{creatableRoles.map(r => r.replace('_', ' ')).join(', ')}</span>
                    </div>
                  )}
                  {updatableRoles.length > 0 && creatableRoles.length > 0 && (
                    <span className="text-[var(--text-tertiary)]">|</span>
                  )}
                  {updatableRoles.length > 0 && (
                    <div className="text-xs text-[var(--text-secondary)]">
                      <span className="font-semibold text-[var(--text-primary)]">Can edit/delete:</span>{' '}
                      <span>{updatableRoles.map(r => r.replace('_', ' ')).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Error Alert */}
        {userError && !showStandaloneUserModal && (
          <div className="flex items-center justify-between gap-2 mb-6 p-4 rounded-xl border border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.10)] text-[#b91c1c] dark:border-[rgba(239,68,68,0.32)] dark:bg-[rgba(185,28,28,0.22)] dark:text-[rgba(252,165,165,0.98)]">
            <div className="inline-flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{userError}</span>
            </div>
            <button onClick={() => setUserError('')} className="p-1 rounded-[0.45rem] transition-colors hover:bg-[rgba(239,68,68,0.16)] dark:hover:bg-[rgba(239,68,68,0.22)]">
              <X size={18} />
            </button>
          </div>
        )}

        {/* User Filters */}
        <div className="p-[0.9rem] rounded-[14px] bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] mb-6 max-[360px]:mb-4 max-[360px]:p-3 dark:border-[rgba(148,163,184,0.22)] dark:shadow-[0_10px_22px_rgba(2,6,23,0.45)]">
          <div className="flex flex-col gap-[0.85rem] sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full min-h-[42px] py-[0.55rem] pl-10 pr-3 rounded-xl border border-[var(--border-default)] text-[var(--text-primary)] transition-all focus:outline-none"
                style={{ background: 'color-mix(in srgb, var(--bg-card) 86%, var(--bg-secondary))' }}
              />
            </div>

            {isPlatformLevel && (
              <select
                value={filterSociety}
                onChange={(e) => setFilterSociety(e.target.value)}
                className="w-full min-h-[42px] py-[0.55rem] px-3 rounded-xl border border-[var(--border-default)] text-[var(--text-primary)] transition-all focus:outline-none sm:w-[10.5rem] sm:flex-none"
                style={{ background: 'color-mix(in srgb, var(--bg-card) 86%, var(--bg-secondary))' }}
              >
                <option value="">All Societies</option>
                {societyOptions.map(society => (
                  <option key={society.id} value={String(society.id)}>{society.name}</option>
                ))}
              </select>
            )}

            {roleFilterOptions.length > 0 && (
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full min-h-[42px] py-[0.55rem] px-3 rounded-xl border border-[var(--border-default)] text-[var(--text-primary)] transition-all focus:outline-none sm:w-[10.5rem] sm:flex-none"
                style={{ background: 'color-mix(in srgb, var(--bg-card) 86%, var(--bg-secondary))' }}
              >
                <option value="">All Roles</option>
                {roleFilterOptions.map(role => (
                  <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-[14px] bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] overflow-hidden dark:bg-[rgba(2,6,23,0.55)] dark:border-[rgba(148,163,184,0.18)] dark:shadow-[0_10px_22px_rgba(2,6,23,0.45)]">
          {!filteredTabUsers.length ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-[#cbd5e1] dark:text-[#475569]" />
              <p className="text-[#64748b] dark:text-[#94a3b8]">No users found</p>
            </div>
          ) : (
            <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead className="border-b border-[var(--border-default)] dark:border-b-[rgba(148,163,184,0.16)]" style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--bg-tertiary) 88%, transparent) 0%, color-mix(in srgb, var(--bg-secondary) 92%, transparent) 100%)' }}>
                  <tr>
                    <th className="py-[14px] px-6 text-left text-[11.5px] font-[650] text-[var(--text-secondary)] tracking-[0.05em] uppercase">Name</th>
                    <th className="py-[14px] px-6 text-left text-[11.5px] font-[650] text-[var(--text-secondary)] tracking-[0.05em] uppercase">Email</th>
                    <th className="py-[14px] px-6 text-left text-[11.5px] font-[650] text-[var(--text-secondary)] tracking-[0.05em] uppercase">Role</th>
                    <th className="py-[14px] px-6 text-left text-[11.5px] font-[650] text-[var(--text-secondary)] tracking-[0.05em] uppercase">Property</th>
                    <th className="py-[14px] px-6 text-left text-[11.5px] font-[650] text-[var(--text-secondary)] tracking-[0.05em] uppercase">Phone</th>
                    <th className="py-[14px] px-6 text-right text-[11.5px] font-[650] text-[var(--text-secondary)] tracking-[0.05em] uppercase w-[118px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTabUsers.map((u) => {
                    const canEdit = u.id === user?.id || updatableRoles.includes(u.role)
                    const canDelete = u.role !== 'MASTER_ADMIN' && u.id !== user?.id && updatableRoles.includes(u.role)
                    const isSelf = u.id === user?.id
                    const userFlat = flats.find(f => f.id === u.flatId)

                    return (
                      <tr key={u.id} className="border-t transition-colors dark:border-t-[rgba(148,163,184,0.14)] dark:hover:bg-[rgba(148,163,184,0.06)]" style={{ borderTopColor: 'color-mix(in srgb, var(--border-light) 50%, transparent)' }}>
                        <td className="py-[14px] px-6 whitespace-nowrap text-[13px] text-[var(--text-primary)]">
                          <div className="flex items-center gap-3">
                            <div className="w-[34px] h-[34px] rounded-full grid place-items-center dark:bg-none" style={{ background: 'linear-gradient(135deg, rgba(100,116,139,0.70) 0%, rgba(30,41,59,0.90) 100%)' }}>
                              <span className="text-[13px] font-[650] text-white/95">
                                {u.name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="font-[650]">{u.name}</span>
                              {isSelf && <span className="text-[11px] py-[2px] px-2 rounded-full border text-[var(--text-secondary)] dark:border-[rgba(148,163,184,0.22)] dark:text-[rgba(203,213,225,0.95)]" style={{ borderColor: 'color-mix(in srgb, var(--border-light) 70%, transparent)' }}>You</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-[14px] px-6 whitespace-nowrap text-[13px] text-[var(--text-secondary)]">{u.email}</td>
                        <td className="py-[14px] px-6 whitespace-nowrap text-[13px] text-[var(--text-primary)]">
                          <span className={clsx(roleColors[u.role] || roleColors.default)} style={{ border: '1px solid color-mix(in srgb, var(--border-light) 70%, transparent)', background: 'color-mix(in srgb, var(--bg-tertiary) 55%, transparent)' }}>
                            {u.role?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-[14px] px-6 whitespace-nowrap text-[13px] text-[var(--text-primary)]">
                          {userFlat ? (
                            <span className="inline-flex items-center gap-[6px]">
                              <Home className="w-[14px] h-[14px] text-[var(--text-tertiary)]" />
                              {userFlat.flatNumber}
                              {userFlat.wingName && <span className="text-[var(--text-tertiary)] text-xs">({userFlat.wingName})</span>}
                            </span>
                          ) : (
                            <span className="text-[var(--text-tertiary)]">-</span>
                          )}
                        </td>
                        <td className="py-[14px] px-6 whitespace-nowrap text-[13px] text-[var(--text-primary)]">{u.phone || '-'}</td>
                        <td className="py-[14px] px-6 whitespace-nowrap text-[13px] text-right text-[var(--text-primary)]">
                          <div className="inline-flex items-center justify-end gap-1 min-w-[78px]">
                            {canEdit ? (
                              <button
                                onClick={() => handleOpenStandaloneUserModal(u)}
                                className="appearance-none w-[30px] h-[30px] inline-flex items-center justify-center p-[6px] rounded-lg border bg-transparent transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:border-[rgba(148,163,184,0.28)] dark:bg-[rgba(15,23,42,0.35)] dark:hover:bg-[rgba(148,163,184,0.10)] dark:hover:text-[rgba(248,250,252,0.95)]"
                                style={{ borderColor: 'color-mix(in srgb, var(--border-light) 78%, transparent)' }}
                                title={isSelf ? 'Edit your profile' : 'Edit user'}
                              >
                                <Edit size={16} />
                              </button>
                            ) : (
                              <button disabled className="appearance-none w-[30px] h-[30px] inline-flex items-center justify-center p-[6px] rounded-lg border bg-transparent text-[var(--text-secondary)] opacity-50 cursor-not-allowed dark:border-[rgba(148,163,184,0.28)] dark:bg-[rgba(51,65,85,0.45)]" style={{ borderColor: 'color-mix(in srgb, var(--border-light) 78%, transparent)' }} title="No permission to edit">
                                <Edit size={16} />
                              </button>
                            )}
                            {canDelete ? (
                              <button
                                onClick={() => confirmAndDeleteUser(u, { userFlat })}
                                className="appearance-none w-[30px] h-[30px] inline-flex items-center justify-center p-[6px] rounded-lg border bg-transparent transition-all text-[var(--text-secondary)] hover:bg-[rgba(239,68,68,0.12)] hover:text-[#b91c1c] dark:border-[rgba(148,163,184,0.28)] dark:bg-[rgba(15,23,42,0.35)] dark:hover:bg-[rgba(239,68,68,0.14)] dark:hover:text-[rgba(252,165,165,0.95)]"
                                style={{ borderColor: 'color-mix(in srgb, var(--border-light) 78%, transparent)' }}
                                title="Delete user"
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <button disabled className="appearance-none w-[30px] h-[30px] inline-flex items-center justify-center p-[6px] rounded-lg border bg-transparent text-[var(--text-secondary)] opacity-50 cursor-not-allowed dark:border-[rgba(148,163,184,0.28)] dark:bg-[rgba(51,65,85,0.45)]" style={{ borderColor: 'color-mix(in srgb, var(--border-light) 78%, transparent)' }} title={isSelf ? "Cannot delete yourself" : "No permission"}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-[var(--border-light)] lg:hidden">
              {paginatedTabUsers.map((u) => {
                const canEdit = u.id === user?.id || updatableRoles.includes(u.role)
                const canDelete = u.role !== 'MASTER_ADMIN' && u.id !== user?.id && updatableRoles.includes(u.role)
                const isSelf = u.id === user?.id
                const userFlat = flats.find(f => f.id === u.flatId)

                return (
                  <div key={u.id} className="p-3 sm:p-4 max-[360px]:p-2.5">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="w-[34px] h-[34px] rounded-full grid place-items-center" style={{ background: 'linear-gradient(135deg, rgba(100,116,139,0.70) 0%, rgba(30,41,59,0.90) 100%)' }}>
                          <span className="text-[13px] font-[650] text-white/95">{u.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-[650] text-[var(--text-primary)] max-[360px]:text-xs">{u.name}</p>
                          <p className="truncate text-[11px] text-[var(--text-secondary)]">{u.email}</p>
                        </div>
                      </div>
                      {isSelf && (
                        <span className="text-[10px] py-[2px] px-2 rounded-full border text-[var(--text-secondary)]" style={{ borderColor: 'color-mix(in srgb, var(--border-light) 70%, transparent)' }}>You</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] sm:text-xs">
                      <p className="text-[var(--text-secondary)]">Role</p>
                      <p className="text-right text-[var(--text-primary)]">{u.role?.replace(/_/g, ' ')}</p>
                      <p className="text-[var(--text-secondary)]">Property</p>
                      <p className="text-right text-[var(--text-primary)]">{userFlat ? `${userFlat.flatNumber}${userFlat.wingName ? ` (${userFlat.wingName})` : ''}` : '-'}</p>
                      <p className="text-[var(--text-secondary)]">Phone</p>
                      <p className="text-right text-[var(--text-primary)]">{u.phone || '-'}</p>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      {canEdit ? (
                        <button
                          onClick={() => handleOpenStandaloneUserModal(u)}
                          className="appearance-none w-[30px] h-[30px] inline-flex items-center justify-center p-[6px] rounded-lg border bg-transparent text-[var(--text-secondary)]"
                          style={{ borderColor: 'color-mix(in srgb, var(--border-light) 78%, transparent)' }}
                          title={isSelf ? 'Edit your profile' : 'Edit user'}
                        >
                          <Edit size={16} />
                        </button>
                      ) : (
                        <button disabled className="appearance-none w-[30px] h-[30px] inline-flex items-center justify-center p-[6px] rounded-lg border bg-transparent text-[var(--text-secondary)] opacity-50 cursor-not-allowed" style={{ borderColor: 'color-mix(in srgb, var(--border-light) 78%, transparent)' }} title="No permission to edit">
                          <Edit size={16} />
                        </button>
                      )}
                      {canDelete ? (
                        <button
                          onClick={() => confirmAndDeleteUser(u, { userFlat })}
                          className="appearance-none w-[30px] h-[30px] inline-flex items-center justify-center p-[6px] rounded-lg border bg-transparent text-[var(--text-secondary)]"
                          style={{ borderColor: 'color-mix(in srgb, var(--border-light) 78%, transparent)' }}
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <button disabled className="appearance-none w-[30px] h-[30px] inline-flex items-center justify-center p-[6px] rounded-lg border bg-transparent text-[var(--text-secondary)] opacity-50 cursor-not-allowed" style={{ borderColor: 'color-mix(in srgb, var(--border-light) 78%, transparent)' }} title={isSelf ? 'Cannot delete yourself' : 'No permission'}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            </>
          )}
        </div>

        {/* Standalone User Modal (Users tab) */}
        {showStandaloneUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.6)]">
            <div className="w-full max-w-[28rem] max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_24px_48px_rgba(15,23,42,0.24)]">
              <div className="sticky top-0 flex items-center justify-between p-4 px-5 border-b border-[var(--border-light)] bg-[var(--bg-card)] z-[1]">
                <h3 className="text-[1.1rem] font-semibold text-[var(--text-primary)]">Edit User</h3>
                <button onClick={() => { setShowStandaloneUserModal(false); setUserError(''); setShowStandalonePassword(false); }} className="p-[0.35rem] rounded-[0.6rem] text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleStandaloneUserSubmit} className="p-5 flex flex-col gap-4">
                <FormErrorSummary message={userError} />
                <FormInput label="Name" name="name" defaultValue={editingStandaloneUser?.name} required placeholder="Full name" />
                <FormInput label="Email" name="email" type="email" defaultValue={editingStandaloneUser?.email} required placeholder="user@example.com" />
                <div className="relative">
                  <FormInput
                    label="New Password (optional)"
                    name="password"
                    type={showStandalonePassword ? 'text' : 'password'}
                    required={false}
                    placeholder="Leave blank to keep current"
                  />
                  <button
                    type="button"
                    className="absolute right-[10px] top-[36px] inline-flex items-center justify-center border-none bg-transparent text-[var(--text-tertiary)] p-1 rounded-lg cursor-pointer hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                    onClick={() => setShowStandalonePassword(!showStandalonePassword)}
                    title={showStandalonePassword ? 'Hide password' : 'Show password'}
                  >
                    {showStandalonePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {isRoleSelectionLocked ? (
                  <>
                    <FormInput
                      label="Role"
                      name="roleDisplay"
                      defaultValue={formatRoleLabel(effectiveStandaloneRole)}
                      readOnly
                    />
                    <input type="hidden" name="role" value={effectiveStandaloneRole} />
                  </>
                ) : (
                  <SmartSelect
                    label="Role"
                    name="role"
                    value={effectiveStandaloneRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    options={standaloneRoleOptions.map(role => ({ value: role, label: formatRoleLabel(role) }))}
                    required
                    icon={Shield}
                    emptyMessage="No roles available"
                  />
                )}
                {/* Property selection for unit-assigned roles */}
                {UNIT_ASSIGNABLE_ROLES.includes(effectiveStandaloneRole) && (
                  <SmartSelect
                    label="Property"
                    name="flatId"
                    defaultValue={editingStandaloneUser?.flatId || ''}
                    options={availableFlats.map(flat => ({
                      value: flat.id,
                      label: `${flat.flatNumber} ${flat.wingName ? `(${flat.wingName})` : ''} - ${flat.unitType || 'FLAT'}`
                    }))}
                    required
                    icon={Home}
                    placeholder="Select Property"
                    emptyMessage="No available properties"
                  />
                )}
                <PhoneInput label="Phone" name="phone" defaultValue={editingStandaloneUser?.phone} required />
                
                <div className="flex gap-3 pt-3 border-t border-[var(--border-light)]">
                  <NeonSweepButton type="button" tone="slate" size="md" onClick={() => { setShowStandaloneUserModal(false); setUserError(''); setShowStandalonePassword(false); }} className="flex-1">
                    Cancel
                  </NeonSweepButton>
                  <NeonSweepButton
                    type="submit"
                    tone="cyan"
                    size="md"
                    className="flex-1"
                    disabled={standaloneUpdateUserMutation.isPending}
                  >
                    {standaloneUpdateUserMutation.isPending ? 'Saving...' : 'Update'}
                  </NeonSweepButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Bulk Import Modal */}
        {showUserBulkImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.6)]">
            <div className="w-full max-w-[42rem] max-h-[90vh] overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_24px_48px_rgba(15,23,42,0.24)]">
              <div className="sticky top-0 flex items-center justify-between p-4 px-5 border-b border-[var(--border-light)] bg-[var(--bg-card)] z-[1]">
                <h3 className="text-[1.1rem] font-semibold text-[var(--text-primary)]">Bulk Import Users</h3>
                <button onClick={() => { setShowUserBulkImportModal(false); setBulkImportFile(null); setBulkImportPreview(null); setBulkImportError(''); }}
                  className="p-[0.35rem] rounded-[0.6rem] text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                {bulkImportError && (
                  <div className="flex items-center justify-between gap-2 mb-4 p-3 rounded-xl border border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.10)] text-[#b91c1c]">
                    <AlertCircle size={18} />{bulkImportError}
                  </div>
                )}
                {!bulkImportPreview ? (
                  <>
                    <div
                      className={clsx(
                        'border-2 border-dashed rounded-xl p-8 text-center transition-all dark:bg-[rgba(15,23,42,0.3)]',
                        isDragOver
                          ? 'border-[rgba(100,116,139,0.8)]'
                          : 'border-[rgba(148,163,184,0.5)] hover:border-[rgba(100,116,139,0.7)] dark:border-[rgba(148,163,184,0.38)]'
                      )}
                      style={isDragOver ? { background: 'color-mix(in srgb, var(--bg-tertiary) 70%, transparent)' } : undefined}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) { setBulkImportFile(file); setBulkImportError('') } }}
                    >
                      <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-[#94a3b8]" />
                      <p className="mb-2 text-[var(--text-secondary)]">
                        {bulkImportFile ? bulkImportFile.name : 'Drag & drop Excel file here'}
                      </p>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="py-2 px-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm transition-all dark:border-[rgba(148,163,184,0.22)] dark:bg-[#f8fafc] dark:text-[#0f172a] dark:hover:bg-white">
                        {bulkImportFile ? 'Change File' : 'Select File'}
                      </button>
                      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden"
                        onChange={(e) => { if (e.target.files[0]) { setBulkImportFile(e.target.files[0]); setBulkImportError('') } }} />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const response = await userApi.downloadImportTemplate()
                            const blob = response.data
                            const url = window.URL.createObjectURL(blob)
                            const link = document.createElement('a')
                            link.href = url
                            link.download = 'user-import-template.xlsx'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            window.URL.revokeObjectURL(url)
                          } catch (error) {
                            console.error('Failed to download template:', error)
                          }
                        }}
                        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <Download size={16} />Download Template
                      </button>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="rounded-lg p-3 text-center bg-[rgba(22,163,74,0.10)]">

              <PaginationControls
                totalItems={filteredTabUsers.length}
                currentPage={tabUsersPage}
                pageSize={tabUsersPageSize}
                onPageChange={setTabUsersPage}
                onPageSizeChange={(nextSize) => {
                  setTabUsersPageSize(nextSize)
                  setTabUsersPage(1)
                }}
              />
                        <p className="text-2xl font-bold leading-tight text-[var(--text-primary)]">{bulkImportPreview.validCount || 0}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Valid</p>
                      </div>
                      <div className="rounded-lg p-3 text-center bg-[rgba(239,68,68,0.10)]">
                        <p className="text-2xl font-bold leading-tight text-[var(--text-primary)]">{bulkImportPreview.invalidCount || 0}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Invalid</p>
                      </div>
                      <div className="rounded-lg p-3 text-center" style={{ background: 'color-mix(in srgb, var(--bg-tertiary) 70%, transparent)' }}>
                        <p className="text-2xl font-bold leading-tight text-[var(--text-primary)]">{bulkImportPreview.totalRows || 0}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Total</p>
                      </div>
                    </div>
                    {bulkImportPreview.rows?.length > 0 && (
                      <div className="mb-4 border border-[var(--border-light)] rounded-lg overflow-hidden max-h-64 overflow-y-auto dark:border-[rgba(148,163,184,0.24)]">
                        <table className="w-full text-sm border-collapse">
                          <thead className="sticky top-0" style={{ background: 'color-mix(in srgb, var(--bg-tertiary) 75%, transparent)' }}>
                            <tr>
                              <th className="py-2 px-3 text-left text-[var(--text-primary)]">Row</th>
                              <th className="py-2 px-3 text-left text-[var(--text-primary)]">Name</th>
                              <th className="py-2 px-3 text-left text-[var(--text-primary)]">Email</th>
                              <th className="py-2 px-3 text-left text-[var(--text-primary)]">Role</th>
                              <th className="py-2 px-3 text-left text-[var(--text-primary)]">Status</th>
                            </tr>
                          </thead>
                          <tbody className="border-t" style={{ borderTopColor: 'color-mix(in srgb, var(--border-light) 65%, transparent)' }}>
                            {bulkImportPreview.rows.map((row, idx) => (
                              <tr key={idx} className={clsx('border-b', row.valid === false && 'bg-[rgba(239,68,68,0.08)] dark:bg-[rgba(127,29,29,0.22)]')} style={{ borderBottomColor: 'color-mix(in srgb, var(--border-light) 55%, transparent)' }}>
                                <td className="py-2 px-3 text-[var(--text-secondary)]">{row.rowNumber || idx + 1}</td>
                                <td className="py-2 px-3 text-[var(--text-secondary)]">{row.name}</td>
                                <td className="py-2 px-3 text-[var(--text-secondary)]">{row.email}</td>
                                <td className="py-2 px-3 text-[var(--text-secondary)]">{row.role}</td>
                                <td className="py-2 px-3 text-[var(--text-secondary)]">
                                  {row.valid === false ? (
                                    <span className="text-xs text-[#dc2626]">{row.error || 'Invalid'}</span>
                                  ) : (
                                    <CheckCircle size={16} className="text-xs text-[#16a34a]" />
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3 p-4 border-t border-[var(--border-light)] dark:border-t-[rgba(148,163,184,0.22)]">
                {!bulkImportPreview ? (
                  <button
                    onClick={() => { if (bulkImportFile) validateBulkImportMutation.mutate({ file: bulkImportFile, societyId: effectiveSocietyId }) }}
                    disabled={!bulkImportFile || validateBulkImportMutation.isPending}
                    className="flex-1 py-2 px-4 rounded-lg border border-[var(--border-default)] font-semibold bg-[var(--bg-card)] text-[var(--text-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validateBulkImportMutation.isPending ? 'Validating...' : 'Validate'}
                  </button>
                ) : (
                  <>
                    <button onClick={() => { setBulkImportPreview(null); setBulkImportFile(null) }}
                      className="flex-1 py-2 px-4 rounded-lg border border-[var(--border-default)] font-semibold bg-[var(--bg-card)] text-[var(--text-secondary)] transition-all">
                      Back
                    </button>
                    <button
                      onClick={() => processBulkImportMutation.mutate({ file: bulkImportFile, societyId: effectiveSocietyId })}
                      disabled={(bulkImportPreview.invalidCount > 0) || processBulkImportMutation.isPending}
                      className="flex-1 py-2 px-4 rounded-lg border border-[#16a34a] font-semibold bg-[#16a34a] text-white transition-all hover:bg-[#15803d] hover:border-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processBulkImportMutation.isPending ? 'Importing...' : 'Import All'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </>
      )}

      {/* Unit Modal */}
      {showUnitModal && (
        <UnitFormModal
          unit={editingUnit}
          flats={flats}
          societies={societies}
          wings={wings}
          currentSociety={currentSociety}
          hasWingsEnabled={currentSociety?.hasWings !== false}
          canCreateWingsInline={canCreateWingsInline}
          isPlatformLevel={isPlatformLevel}
          userSocietyId={effectiveSocietyId}
          errors={unitFormErrors}
          apiError={apiError}
          onSubmit={handleUnitSubmit}
          onClose={() => {
            setShowUnitModal(false)
            setEditingUnit(null)
            setUnitFormErrors({})
            setApiError('')
          }}
          isLoading={createUnitMutation.isPending || updateUnitMutation.isPending || createWingMutation.isPending}
        />
      )}

      {/* User Modal for linking to unit */}
      {showUserModal && selectedUnit && (
        <UserFormModal
          unit={selectedUnit}
          roleOptions={unitAssignableCreatableRoles}
          errors={userFormErrors}
          apiError={apiError}
          onSubmit={handleUserSubmit}
          onClose={() => {
            setShowUserModal(false)
            setSelectedUnit(null)
            setUserFormErrors({})
            setApiError('')
          }}
          isLoading={createUserMutation.isPending}
        />
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && selectedUnit && (
        <EditUserFormModal
          user={editingUser}
          unit={selectedUnit}
          roleOptions={unitAssignableUpdatableRoles}
          errors={userFormErrors}
          apiError={apiError}
          onSubmit={handleEditUserSubmit}
          onClose={() => {
            setShowEditUserModal(false)
            setEditingUser(null)
            setSelectedUnit(null)
            setUserFormErrors({})
            setApiError('')
          }}
          isLoading={updateUserMutation.isPending}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <SharedBulkImportModal
          title="Bulk Import Units"
          entityName="Units"
          templateFilename="unit_import_template.xlsx"
          columns={[
            { letter: 'A', label: 'Unit Type', required: true, description: 'FLAT, SHOP, or OFFICE' },
            { letter: 'B', label: 'Wing', required: false, description: 'Wing name/code' },
            { letter: 'C', label: 'Unit Number', required: true, description: 'e.g., A-101, S-01' },
            { letter: 'D', label: 'Configuration', required: false, description: 'e.g., 2BHK, RETAIL' },
            { letter: 'E', label: 'Floor', required: true, description: 'Floor number' },
            { letter: 'F', label: 'Area', required: false, description: 'Size in sq.ft' },
          ]}
          tableColumns={[
            { key: 'flatNumber', label: 'Unit' },
            { key: 'unitType', label: 'Type' },
            { key: 'wingCode', label: 'Wing' },
          ]}
          apiValidate={(file, societyId) => flatApi.validateBulkImport(file, societyId, user?.id)}
          apiProcess={(file, societyId, currentUserId) => flatApi.processBulkImport(file, societyId, currentUserId || user?.id)}
          apiTemplate={() => flatApi.downloadImportTemplate(user?.id)}
          onClose={() => setShowBulkImportModal(false)}
          societyId={effectiveSocietyId}
          userId={user?.id}
          onSuccess={() => {
            queryClient.invalidateQueries(['flats'])
            queryClient.invalidateQueries(['users'])
            setShowBulkImportModal(false)
          }}
        />
      )}

    </div>
  )
}

// Stat Card Component
// eslint-disable-next-line no-unused-vars
function StatCard({ label, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-[rgba(59,130,246,0.15)] text-[#3b82f6]',
    indigo: 'bg-[rgba(99,102,241,0.15)] text-[#6366f1]',
    green: 'bg-[rgba(22,163,74,0.15)] text-[#16a34a]',
    purple: 'bg-[rgba(147,51,234,0.15)] text-[#9333ea]',
    teal: 'bg-[rgba(20,184,166,0.15)] text-[#14b8a6]',
    orange: 'bg-[rgba(249,115,22,0.15)] text-[#f97316]',
    pink: 'bg-[rgba(236,72,153,0.15)] text-[#ec4899]',
  }
  
  return (
    <div className="p-4 rounded-[14px] bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[var(--shadow-sm)] dark:border-[rgba(148,163,184,0.22)] dark:shadow-[0_10px_22px_rgba(2,6,23,0.45)]">
      <div className="flex items-center gap-3">
        <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center', colorClasses[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
          <p className="text-xs font-medium text-[var(--text-tertiary)]">{label}</p>
        </div>
      </div>
    </div>
  )
}

// Unit Form Modal
function UnitFormModal({ unit, flats, societies, wings, currentSociety, hasWingsEnabled, canCreateWingsInline, isPlatformLevel, userSocietyId, errors, apiError, onSubmit, onClose, isLoading }) {
  const totalWizardSteps = 3
  const wizardStepLabels = ['Basics', 'Wing & Location', 'Review']
  const [wizardStep, setWizardStep] = useState(unit ? 3 : 1)
  const [wizardError, setWizardError] = useState('')
  const [transitionDirection, setTransitionDirection] = useState('forward')
  const stepBodyRef = useRef(null)
  const [selectedUnitType, setSelectedUnitType] = useState(unit?.unitType || 'FLAT')
  const [selectedWingId, setSelectedWingId] = useState(unit?.wingId ? String(unit.wingId) : '')
  const [showInlineWingCreate, setShowInlineWingCreate] = useState(false)
  const [selectedSocietyId, setSelectedSocietyId] = useState(unit?.societyId ? String(unit.societyId) : String(userSocietyId || ''))
  const [unitNumber, setUnitNumber] = useState(unit?.flatNumber || '')
  const [floorValue, setFloorValue] = useState(unit?.floor ?? 0)
  const [selectedRoomNo, setSelectedRoomNo] = useState('')
  const [areaValue, setAreaValue] = useState(unit?.area ?? '')
  const [newWingName, setNewWingName] = useState('')
  const [newWingFloors, setNewWingFloors] = useState(1)
  const [wingSyncAttempted, setWingSyncAttempted] = useState(false)
  const selectedSocietyIdNumber = selectedSocietyId ? parseInt(selectedSocietyId, 10) : null
  const modalWingSocietyId = isPlatformLevel ? selectedSocietyIdNumber : userSocietyId
  const { data: modalWings = [], refetch: refetchModalWings } = useQuery({
    queryKey: ['unit-modal-wings', modalWingSocietyId],
    queryFn: () => wingApi.getBySociety(modalWingSocietyId).then((res) => res.data).catch(() => []),
    enabled: !!modalWingSocietyId && !!hasWingsEnabled,
  })
  const selectedSociety = useMemo(() => {
    if (isPlatformLevel) {
      return societies.find((society) => String(society.id) === String(selectedSocietyId)) || null
    }
    return currentSociety || null
  }, [isPlatformLevel, societies, selectedSocietyId, currentSociety])

  const availableWings = useMemo(() => {
    const source = isPlatformLevel ? modalWings : wings
    const seen = new Set()
    const deduped = source
      .filter((wing) => {
        if (!wing?.id || seen.has(wing.id)) return false
        seen.add(wing.id)
        return true
      })
      .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))

    const totalWingsLimit = selectedSociety?.totalWings || 0
    if (totalWingsLimit > 0) {
      return deduped.slice(0, totalWingsLimit)
    }
    return deduped
  }, [isPlatformLevel, modalWings, wings, selectedSociety?.totalWings])

  useEffect(() => {
    setWingSyncAttempted(false)
  }, [modalWingSocietyId])
  const getDefaultFlatType = (unitType) => {
    if (unitType === 'FLAT') return '2BHK'
    if (unitType === 'SHOP') return 'RETAIL'
    if (unitType === 'OFFICE') return 'STANDARD'
    return ''
  }
  const [selectedFlatType, setSelectedFlatType] = useState(unit?.flatType || getDefaultFlatType(selectedUnitType))

  useEffect(() => {
    if (!stepBodyRef.current) return

    const startX = transitionDirection === 'forward' ? 18 : -18
    stepBodyRef.current.animate(
      [
        { opacity: 0, transform: `translateX(${startX}px) scale(0.985)` },
        { opacity: 1, transform: 'translateX(0) scale(1)' },
      ],
      {
        duration: 220,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }
    )
  }, [wizardStep, transitionDirection])

  const handleUnitTypeChange = (e) => {
    const newType = e.target.value
    setSelectedUnitType(newType)
    if (!unit) setSelectedFlatType(getDefaultFlatType(newType))
  }

  // Get max floor from selected wing
  const selectedWing = availableWings.find(w => w.id === parseInt(selectedWingId))
  const societyFloorLimit = selectedSociety?.totalFloors || 0
  const wingFloorLimit = selectedWing?.totalFloors || 0
  const maxFloor = societyFloorLimit > 0
    ? (wingFloorLimit > 0 ? Math.min(societyFloorLimit, wingFloorLimit) : societyFloorLimit)
    : (wingFloorLimit > 0 ? wingFloorLimit : 100)

  const selectedFloorNumber = Number(floorValue)
  const wingNamePrefix = selectedWing?.name
    ? String(selectedWing.name).trim().replace(/\s+/g, '').toUpperCase()
    : null

  const parseRoomNoFromUnit = (flatNumber, floorNumber) => {
    const value = String(flatNumber || '')
    const segmented = value.match(/^[^-]+-(\d+)-(\d{1,3})$/)
    if (segmented) {
      const parsedFloor = Number(segmented[1])
      const parsedRoom = Number(segmented[2])
      if (Number.isInteger(parsedRoom) && parsedRoom > 0 && (!Number.isInteger(floorNumber) || floorNumber < 0 || parsedFloor === floorNumber)) {
        return parsedRoom
      }
    }

    const legacy = value.match(/^[^-]+-(\d+)$/)
    if (legacy && Number.isInteger(floorNumber) && floorNumber >= 0) {
      const numeric = String(legacy[1])
      // Supports merged format like A-101 where floor and room are concatenated.
      if (numeric.startsWith(String(floorNumber))) {
        const suffix = numeric.slice(String(floorNumber).length)
        const parsed = Number(suffix)
        if (Number.isInteger(parsed) && parsed > 0) return parsed
      }
    }

    return null
  }

  const getUnitPrefixByType = (unitType) => {
    if (unitType === 'SHOP') return 'S'
    if (unitType === 'OFFICE') return 'O'
    return 'F'
  }

  const occupiedRoomsOnSelectedFloor = useMemo(() => {
    if (!Number.isInteger(selectedFloorNumber) || selectedFloorNumber < 0) return new Set()

    const occupied = new Set()
    flats
      .filter((item) => {
        if (!item || item.id === unit?.id) return false
        if ((item.unitType || 'FLAT') !== selectedUnitType) return false
        if (Number(item.floor) !== selectedFloorNumber) return false

        if (selectedWingId) {
          return String(item.wingId || '') === String(selectedWingId)
        }

        return !item.wingId
      })
      .forEach((item) => {
        const roomNo = parseRoomNoFromUnit(item.flatNumber, selectedFloorNumber)
        if (Number.isInteger(roomNo) && roomNo > 0) {
          occupied.add(roomNo)
        }
      })

    return occupied
  }, [flats, unit?.id, selectedUnitType, selectedFloorNumber, selectedWingId])

  const generatedUnitNumber = useMemo(() => {
    if (!Number.isInteger(selectedFloorNumber) || selectedFloorNumber < 0) return ''
    const roomNo = Number(selectedRoomNo)
    if (!Number.isInteger(roomNo) || roomNo < 1) return ''

    const prefix = wingNamePrefix || getUnitPrefixByType(selectedUnitType)
    return `${prefix}-${selectedFloorNumber}${String(roomNo).padStart(2, '0')}`
  }, [selectedFloorNumber, selectedRoomNo, wingNamePrefix, selectedUnitType])

  useEffect(() => {
    if (isPlatformLevel) {
      setSelectedWingId('')
      setShowInlineWingCreate(false)
      setNewWingName('')
      setNewWingFloors(1)
    }
  }, [selectedSocietyId, isPlatformLevel])

  useEffect(() => {
    if (!hasWingsEnabled) return
    if (availableWings.length === 0) {
      setSelectedWingId('')
      return
    }
    const existsInList = availableWings.some((wing) => String(wing.id) === String(selectedWingId))
    if (!existsInList) {
      setSelectedWingId(String(availableWings[0].id))
    }
  }, [availableWings, selectedWingId, hasWingsEnabled])

  useEffect(() => {
    if (unit) {
      const roomNo = parseRoomNoFromUnit(unit.flatNumber, Number(unit.floor))
      setSelectedRoomNo(roomNo ? String(roomNo) : '')
    } else {
      setSelectedRoomNo('')
    }
  }, [unit])

  useEffect(() => {
    if (unit) return
    setUnitNumber(generatedUnitNumber)
  }, [generatedUnitNumber, unit])

  useEffect(() => {
    const expectedWings = selectedSociety?.totalWings || 0
    if (!modalWingSocietyId || !hasWingsEnabled || expectedWings <= 0) return
    if (availableWings.length > 0 || wingSyncAttempted) return

    setWingSyncAttempted(true)
    wingApi
      .syncWithSocietyConfig(modalWingSocietyId, false)
      .catch(() => null)
      .finally(() => {
        refetchModalWings()
      })
  }, [modalWingSocietyId, hasWingsEnabled, selectedSociety?.totalWings, availableWings.length, wingSyncAttempted, refetchModalWings])

  const validateWizardStep = (step) => {
    if (step === 1) {
      if (isPlatformLevel && !selectedSocietyId) {
        setWizardError('Please select a society before continuing.')
        return false
      }
      if (!selectedFlatType) {
        setWizardError('Configuration is required.')
        return false
      }
    }

    if (step === 2) {
      if (floorValue === '' || floorValue === null || Number.isNaN(Number(floorValue))) {
        setWizardError('Please enter a valid floor value.')
        return false
      }
      if (Number(floorValue) < 0) {
        setWizardError('Floor must be 0 or greater.')
        return false
      }
      if (Number(floorValue) > maxFloor) {
        setWizardError(`Floor cannot exceed ${maxFloor} for selected wing.`)
        return false
      }
      if (!unit && !selectedRoomNo) {
        setWizardError('Please enter room number for this floor.')
        return false
      }
      if (!unit) {
        const roomNo = Number(selectedRoomNo)
        if (!Number.isInteger(roomNo) || roomNo < 1) {
          setWizardError('Room number must be a positive whole number.')
          return false
        }
        if (occupiedRoomsOnSelectedFloor.has(roomNo)) {
          setWizardError(`Room ${String(roomNo).padStart(2, '0')} on floor ${selectedFloorNumber} is already occupied. Choose another room number.`)
          return false
        }
      }
      if (!unit && !generatedUnitNumber) {
        setWizardError('Unable to generate unit number. Check floor and room number.')
        return false
      }
      if (areaValue === '' || areaValue === null || Number.isNaN(Number(areaValue))) {
        setWizardError('Please enter a valid area.')
        return false
      }
      if (Number(areaValue) <= 0) {
        setWizardError('Area must be greater than 0.')
        return false
      }

      if (showInlineWingCreate && newWingName.trim()) {
        if (!newWingFloors || Number(newWingFloors) < 1) {
          setWizardError('New wing floors must be at least 1.')
          return false
        }
      }
    }

    setWizardError('')
    return true
  }

  const handleNext = () => {
    if (!validateWizardStep(wizardStep)) return
    setTransitionDirection('forward')
    setWizardStep((prev) => Math.min(prev + 1, totalWizardSteps))
  }

  const handleBack = () => {
    setWizardError('')
    setTransitionDirection('backward')
    setWizardStep((prev) => Math.max(prev - 1, 1))
  }

  const progressPercent = ((wizardStep - 1) / (totalWizardSteps - 1)) * 100
  const currentStepLabel = wizardStepLabels[wizardStep - 1]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.6)]">
      <div className="w-full max-w-[36rem] max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_24px_48px_rgba(15,23,42,0.24)]">
        <div className="sticky top-0 flex items-center justify-between p-4 px-5 border-b border-[var(--border-light)] bg-[var(--bg-card)] z-[1]">
          <h3 className="text-[1.1rem] font-semibold text-[var(--text-primary)]">{unit ? 'Edit Unit' : 'Add Unit'}</h3>
          <button onClick={onClose} className="p-[0.35rem] rounded-[0.6rem] text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
            <X size={20} />
          </button>
        </div>

        {apiError && <div className="px-5 pt-3"><FormErrorSummary message={apiError} /></div>}
        {wizardError && <div className="px-5 pt-3"><FormErrorSummary message={wizardError} /></div>}
        {errors.capacity && <div className="px-5 pt-3"><FormErrorSummary message={errors.capacity} /></div>}

        <form onSubmit={onSubmit} className="p-5 flex flex-col gap-4">
          {/* Hidden payload fields preserved across wizard steps */}
          <input type="hidden" name="societyId" value={isPlatformLevel ? selectedSocietyId : (userSocietyId || '')} />
          <input type="hidden" name="unitType" value={selectedUnitType} />
          <input type="hidden" name="wingId" value={selectedWingId} />
          <input type="hidden" name="createWingName" value={newWingName} />
          <input type="hidden" name="createWingFloors" value={newWingFloors} />
          <input type="hidden" name="flatNumber" value={unitNumber} />
          <input type="hidden" name="flatType" value={selectedFlatType} />
          <input type="hidden" name="floor" value={floorValue} />
          <input type="hidden" name="area" value={areaValue} />

          <div className="mb-1 space-y-1.5">
            <div className="flex items-center justify-between text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
              <span>Step {wizardStep} of {totalWizardSteps}</span>
              <span>{currentStepLabel}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[color-mix(in_srgb,var(--bg-tertiary)_88%,transparent)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, color-mix(in srgb, var(--color-primary-400) 88%, #3b82f6) 0%, color-mix(in srgb, var(--color-primary-600) 90%, #1d4ed8) 100%)',
                  transition: 'width 220ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </div>
          </div>

          <div ref={stepBodyRef}>
          {wizardStep === 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isPlatformLevel && (
                <SmartSelect
                  label="Society"
                  value={selectedSocietyId}
                  onChange={(e) => setSelectedSocietyId(e.target.value)}
                  required
                  icon={Building2}
                  placeholder="Select Society"
                  options={societies.map(s => ({ value: s.id, label: s.name }))}
                  error={errors.societyId}
                />
              )}

              <SmartSelect
                label="Unit Type"
                value={selectedUnitType}
                onChange={handleUnitTypeChange}
                icon={Home}
                required
                error={errors.unitType}
                options={[
                  { value: 'FLAT', label: '🏠 Flat' },
                  { value: 'SHOP', label: '🏪 Shop' },
                  { value: 'OFFICE', label: '🏢 Office' },
                ]}
              />

              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2.5 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">Generated Unit Number</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{unit ? unitNumber : (generatedUnitNumber || 'Will be generated after selecting floor and room')}</p>
              </div>

              <SmartSelect
                label={selectedUnitType === 'FLAT' ? 'Configuration' : selectedUnitType === 'SHOP' ? 'Shop Type' : 'Office Type'}
                value={selectedFlatType}
                onChange={(e) => setSelectedFlatType(e.target.value)}
                required
                error={errors.flatType}
                options={[
                  ...(selectedUnitType === 'FLAT' ? [
                    { value: '1RK', label: '1 RK' },
                    { value: '1BHK', label: '1 BHK' },
                    { value: '2BHK', label: '2 BHK' },
                    { value: '3BHK', label: '3 BHK' },
                    { value: '4BHK', label: '4 BHK' },
                    { value: '5BHK', label: '5 BHK' },
                    { value: 'PENTHOUSE', label: 'Penthouse' },
                    { value: 'DUPLEX', label: 'Duplex' },
                    { value: 'STUDIO', label: 'Studio' },
                  ] : selectedUnitType === 'SHOP' ? [
                    { value: 'RETAIL', label: 'Retail Shop' },
                    { value: 'SHOWROOM', label: 'Showroom' },
                    { value: 'KIOSK', label: 'Kiosk' },
                    { value: 'FOOD', label: 'Food Court' },
                    { value: 'PHARMACY', label: 'Pharmacy' },
                    { value: 'SALON', label: 'Salon/Spa' },
                    { value: 'SMALL', label: 'Small Shop' },
                    { value: 'MEDIUM', label: 'Medium Shop' },
                    { value: 'LARGE', label: 'Large Shop' },
                  ] : [
                    { value: 'STANDARD', label: 'Standard Office' },
                    { value: 'CABIN', label: 'Cabin' },
                    { value: 'CUBICLE', label: 'Cubicle' },
                    { value: 'SHARED', label: 'Shared Space' },
                    { value: 'COWORKING', label: 'Co-working' },
                    { value: 'EXECUTIVE', label: 'Executive Office' },
                    { value: 'SMALL', label: 'Small Office' },
                    { value: 'MEDIUM', label: 'Medium Office' },
                    { value: 'LARGE', label: 'Large Office' },
                  ]),
                  { value: 'OTHER', label: 'Other' },
                ]}
              />
            </div>
          )}

          {wizardStep === 2 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {hasWingsEnabled ? (
                <div className="space-y-3 sm:col-span-2">
                  <SmartSelect
                    label={`Wing (Optional)${selectedWingId && selectedWing?.totalFloors ? ` (Max Floor: ${selectedWing.totalFloors})` : ''}`}
                    value={selectedWingId}
                    onChange={(e) => setSelectedWingId(e.target.value)}
                    placeholder="Select Wing"
                    showPlaceholder={false}
                    options={availableWings.map(w => ({ value: w.id, label: `${w.name}${w.totalFloors ? ` (${w.totalFloors} floors)` : ''}` }))}
                  />
                  {availableWings.length === 0 && (
                    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm text-[var(--text-secondary)]">
                      {isPlatformLevel
                        ? 'No wings found for selected society. Please create wings from wing management first.'
                        : 'No wings available for this society.'}
                    </div>
                  )}
                  {canCreateWingsInline && !isPlatformLevel && (
                    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] p-3">
                      <button
                        type="button"
                        onClick={() => setShowInlineWingCreate((prev) => !prev)}
                        className="text-xs font-semibold text-[var(--accent-primary)]"
                      >
                        {showInlineWingCreate ? 'Hide new wing form' : 'Create new wing inline'}
                      </button>
                      {showInlineWingCreate && (
                        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <FormInput
                            label="New Wing Name"
                            value={newWingName}
                            onChange={(e) => setNewWingName(e.target.value)}
                            placeholder="e.g., C Wing"
                            maxLength={50}
                            error={errors.createWingName}
                          />
                          <NumberInput
                            label="New Wing Floors"
                            value={newWingFloors}
                            onChange={(e) => setNewWingFloors(e.target.value)}
                            min={1}
                            max={200}
                            error={errors.createWingFloors}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="sm:col-span-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm text-[var(--text-secondary)]">
                  This society uses single-tower mode. Units are created without wing mapping.
                </div>
              )}

              <NumberInput
                label={`Floor${selectedWingId && selectedWing?.totalFloors ? ` (0 to ${selectedWing.totalFloors})` : ''}`}
                value={floorValue}
                onChange={(e) => setFloorValue(e.target.value)}
                required
                min={0}
                max={maxFloor}
                error={errors.floor}
                icon={Layers}
              />
              {!unit && (
                <FormInput
                  label="Room Number On This Floor"
                  value={selectedRoomNo}
                  onChange={(e) => setSelectedRoomNo(String(e.target.value || '').replace(/\D/g, ''))}
                  required
                  placeholder="e.g., 01"
                  error={!selectedRoomNo ? 'Enter room number' : ''}
                />
              )}
              <NumberInput
                label="Area (sq.ft)"
                value={areaValue}
                onChange={(e) => setAreaValue(e.target.value)}
                min={0}
                max={100000}
                step={0.01}
                placeholder={selectedUnitType === 'SHOP' ? 'e.g., 500' : selectedUnitType === 'OFFICE' ? 'e.g., 800' : 'e.g., 1200'}
                required
                error={errors.area}
              />
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)] p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">Summary</p>
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <div className="absolute inset-0 rounded-full bg-[var(--color-primary-500)] dark:bg-[var(--color-primary-400)] opacity-30 animate-ping" style={{ animationDuration: '2s' }}></div>
                    <CheckCircle size={16} className="text-[var(--color-primary-500)] dark:text-[var(--color-primary-400)] relative z-10" />
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-[var(--text-primary)]">
                  <p><span className="text-[var(--text-tertiary)]">Unit:</span> {unitNumber || '-'}</p>
                  <p><span className="text-[var(--text-tertiary)]">Type:</span> {selectedUnitType}</p>
                  <p><span className="text-[var(--text-tertiary)]">Config:</span> {selectedFlatType || '-'}</p>
                  <p><span className="text-[var(--text-tertiary)]">Floor:</span> {floorValue}</p>
                  <p><span className="text-[var(--text-tertiary)]">Area:</span> {areaValue} sq.ft</p>
                  <p><span className="text-[var(--text-tertiary)]">Wing:</span> {newWingName?.trim() ? `${newWingName} (new)` : (selectedWing?.name || 'No Wing')}</p>
                </div>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                Review details and create the unit. User assignment can be done right after creation.
              </p>
            </div>
          )}
          </div>

          <div className="flex gap-3 pt-3 border-t border-[var(--border-light)]">
            <NeonSweepButton type="button" tone="slate" size="md" onClick={onClose} className="flex-1">
              Cancel
            </NeonSweepButton>

            {wizardStep > 1 && (
              <NeonSweepButton type="button" tone="slate" size="md" onClick={handleBack} className="flex-1">
                Back
              </NeonSweepButton>
            )}

            {wizardStep < totalWizardSteps ? (
              <NeonSweepButton type="button" tone="violet" size="md" onClick={handleNext} className="flex-1">
                Next
              </NeonSweepButton>
            ) : (
              <NeonSweepButton type="submit" tone="cyan" size="md" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Saving...' : (unit ? 'Update Unit' : 'Create Unit')}
              </NeonSweepButton>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// User Form Modal for linking user to unit
function UserFormModal({ unit, roleOptions, errors, apiError, onSubmit, onClose, isLoading }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.6)]">
      <div className="w-full max-w-[28rem] max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_24px_48px_rgba(15,23,42,0.24)]">
        <div className="sticky top-0 flex items-center justify-between p-4 px-5 border-b border-[var(--border-light)] bg-[var(--bg-card)] z-[1]">
          <div>
            <h3 className="text-[1.1rem] font-semibold text-[var(--text-primary)]">Assign User to Unit</h3>
            <p className="text-[0.8rem] text-[var(--text-tertiary)]">Unit: {unit.flatNumber}</p>
          </div>
          <button onClick={onClose} className="p-[0.35rem] rounded-[0.6rem] text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
            <X size={20} />
          </button>
        </div>

        {apiError && <div className="px-5 pt-3"><FormErrorSummary message={apiError} /></div>}

        <form onSubmit={onSubmit} className="p-5 flex flex-col gap-4">

          <FormInput
            label="Name"
            name="name"
            required
            placeholder="Enter full name"
            error={errors.name}
          />

          <FormInput
            label="Email"
            name="email"
            type="email"
            required
            placeholder="email@example.com"
            error={errors.email}
          />

          <div className="flex flex-col gap-1.5 min-w-0">
            <label htmlFor="unit-user-password" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)]">
              Password
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative min-w-0">
              <input
                id="unit-user-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Minimum 6 characters"
                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-2.5 pl-3 pr-11 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--placeholder-color)] focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.12)]"
              />
              <button
                type="button"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-light)] bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-amber-700">{errors.password}</p>}
          </div>

          <PhoneInput
            label="Phone"
            name="phone"
            error={errors.phone}
            required
          />

          <SmartSelect
            label="Role"
            name="role"
            defaultValue={roleOptions?.[0] || 'MEMBER'}
            required
            options={(roleOptions || ['MEMBER']).map((role) => ({ value: role, label: formatRoleLabel(role) }))}
          />

          <div className="flex gap-3 pt-3 border-t border-[var(--border-light)]">
            <NeonSweepButton
              type="button"
              tone="slate"
              size="md"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </NeonSweepButton>
            <NeonSweepButton
              type="submit"
              tone="cyan"
              size="md"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </NeonSweepButton>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit User Form Modal for editing user linked to unit
function EditUserFormModal({ user, unit, roleOptions, errors, apiError, onSubmit, onClose, isLoading }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.6)]">
      <div className="w-full max-w-[28rem] max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_24px_48px_rgba(15,23,42,0.24)]">
        <div className="sticky top-0 flex items-center justify-between p-4 px-5 border-b border-[var(--border-light)] bg-[var(--bg-card)] z-[1]">
          <div>
            <h3 className="text-[1.1rem] font-semibold text-[var(--text-primary)]">Edit User</h3>
            <p className="text-[0.8rem] text-[var(--text-tertiary)]">Unit: {unit.flatNumber}</p>
          </div>
          <button onClick={onClose} className="p-[0.35rem] rounded-[0.6rem] text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
            <X size={20} />
          </button>
        </div>

        {apiError && <div className="px-5 pt-3"><FormErrorSummary message={apiError} /></div>}

        <form onSubmit={onSubmit} className="p-5 flex flex-col gap-4">
          <FormInput
            label="Name"
            name="name"
            defaultValue={user.name}
            required
            placeholder="Enter full name"
            error={errors.name}
          />

          <FormInput
            label="Email"
            name="email"
            type="email"
            defaultValue={user.email}
            required
            placeholder="email@example.com"
            error={errors.email}
          />

          <div className="flex flex-col gap-1.5 min-w-0">
            <label htmlFor="unit-edit-user-password" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)]">
              New Password (optional)
            </label>
            <div className="relative min-w-0">
              <input
                id="unit-edit-user-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Leave blank to keep current password"
                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-2.5 pl-3 pr-11 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--placeholder-color)] focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.12)]"
              />
              <button
                type="button"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-light)] bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-amber-700">{errors.password}</p>}
          </div>

          <PhoneInput
            label="Phone"
            name="phone"
            defaultValue={user.phone}
            error={errors.phone}
            required
          />

          <SmartSelect
            label="Role (Ownership Type)"
            name="role"
            defaultValue={user.role}
            required
            options={(roleOptions || ['MEMBER']).map((role) => ({ value: role, label: formatRoleLabel(role) }))}
          />

          <div className="flex gap-3 pt-3 border-t border-[var(--border-light)]">
            <NeonSweepButton
              type="button"
              tone="slate"
              size="md"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </NeonSweepButton>
            <NeonSweepButton
              type="submit"
              tone="cyan"
              size="md"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Update User'}
            </NeonSweepButton>
          </div>
        </form>
      </div>
    </div>
  )
}

