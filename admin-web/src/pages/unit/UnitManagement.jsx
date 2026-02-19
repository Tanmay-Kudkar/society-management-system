import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context'
import { useToast } from '../../context'
import { useConfirmDialog } from '../../context'
import { flatApi, societyApi, wingApi, userApi } from '../../../../api'
import { 
  Plus, Edit, Trash2, Search, X, Home, Store, Briefcase, Layers, 
  Users, UserPlus, UserCheck, UserX, Upload, Download, AlertCircle,
  Link, Unlink, UsersRound, UserCog, Building2, Shield, FileSpreadsheet, CheckCircle, XCircle, Info, Eye, EyeOff
} from 'lucide-react'
import clsx from 'clsx'
import { validateFlatForm, validateUserForm, parseApiError } from '../../utils'
import { SmartSelect, FormInput, NumberInput, PhoneInput, FormErrorSummary, AsyncButton } from '../../components'
import { BulkImportModal as SharedBulkImportModal } from '../../components'
import { HeroSkeleton, TabsSkeleton, FiltersSkeleton, CardGridSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const unitTypeIcons = {
  FLAT: Home,
  SHOP: Store,
  OFFICE: Briefcase
}

const unitTypeClasses = {
  FLAT: 'units-type units-type--flat',
  SHOP: 'units-type units-type--shop',
  OFFICE: 'units-type units-type--office'
}

const roleColors = {
  MASTER_ADMIN: 'units-role-tag',
  SOCIETY_ADMIN: 'units-role-tag',
  CHAIRMAN: 'units-role-tag',
  SECRETARY: 'units-role-tag',
  TREASURER: 'units-role-tag',
  COMMITTEE: 'units-role-tag',
  MEMBER: 'units-role-tag',
  TENANT: 'units-role-tag',
  default: 'units-role-tag',
}

export default function UnitManagement() {
  const { user, isCommitteeLevel, canManageDocuments } = useAuth()
  const { showToast } = useToast()
  const confirmDialog = useConfirmDialog()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Get URL params early (before state init that depends on them)
  const societyIdFromUrl = searchParams.get('society')
  const unitTypeFromUrl = searchParams.get('unitType')
  const tabFromUrl = searchParams.get('tab')
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? parseInt(societyIdFromUrl) : user?.societyId
  const currentUserSocietyId = user?.societyId ? String(user.societyId) : ''

  // PO/OO are supervisory - they can view but not directly edit units/users within a society
  const canEditUnits = isCommitteeLevel() && !isPlatformLevel

  // Active tab: 'units' or 'users'
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'users' ? 'users' : 'units')

  // Sync tab with URL parameter
  useEffect(() => {
    setActiveTab(tabFromUrl === 'users' ? 'users' : 'units')
  }, [tabFromUrl])

  const switchTab = (tab) => {
    setActiveTab(tab)
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
  const [deleteError, setDeleteError] = useState('')
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
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false)
  const [bulkCreateResults, setBulkCreateResults] = useState(null)
  
  // Editing states
  const [editingUnit, setEditingUnit] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState(unitTypeFromUrl || '')
  const [viewMode, setViewMode] = useState('units') // 'units' or 'table'
  
  // Form states
  const [unitFormErrors, setUnitFormErrors] = useState({})
  const [userFormErrors, setUserFormErrors] = useState({})
  const [apiError, setApiError] = useState('')

  // Sync filterType with URL parameter when it changes
  useEffect(() => {
    setFilterType(unitTypeFromUrl || '')
  }, [unitTypeFromUrl])

  useEffect(() => {
    if (societyIdFromUrl) {
      setFilterSociety(String(societyIdFromUrl))
      return
    }
    if (!isPlatformLevel && user?.societyId) {
      setFilterSociety(String(user.societyId))
    }
  }, [societyIdFromUrl, isPlatformLevel, user?.societyId])

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

    if (filterSociety) {
      usersInScope = usersInScope.filter(u => String(u.societyId || '') === filterSociety)
    } else if (!isPlatformLevel && currentUserSocietyId) {
      usersInScope = usersInScope.filter(u => String(u.societyId || '') === currentUserSocietyId)
    }

    return usersInScope
  }, [users, filterSociety, isPlatformLevel, currentUserSocietyId])

  // Filter members for linking to units
  const memberUsers = useMemo(() => {
    return scopedUsers.filter(u => ['MEMBER', 'TENANT'].includes(u.role))
  }, [scopedUsers])

  // Create unit-user mapping (1 user per unit)
  const unitUserMap = useMemo(() => {
    const map = {}
    flats.forEach(flat => {
      // Only one user can be assigned per unit - take the first MEMBER, or first TENANT
      const assignedUser = memberUsers.find(u => u.flatId === flat.id)
      map[flat.id] = {
        flat,
        owner: flat.ownerEmail ? scopedUsers.find(u => u.email === flat.ownerEmail) : null,
        member: assignedUser || null
      }
    })
    return map
  }, [flats, scopedUsers, memberUsers])

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

  // Bulk create users mutation
  const bulkCreateUsersMutation = useMutation({
    mutationFn: () => userApi.bulkCreateForUnits(effectiveSocietyId),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['users'])
      queryClient.invalidateQueries(['flats'])
      setBulkCreateResults(response.data)
      showToast(`Created ${response.data.usersCreated} users successfully`, 'success')
    },
    onError: (err) => {
      showToast(parseApiError(err), 'error')
      setShowBulkCreateModal(false)
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      queryClient.invalidateQueries(['flats'])
      setDeleteError('')
      showToast('User deleted successfully', 'success')
    },
    onError: (err) => {
      const msg = err.response?.data?.message || parseApiError(err)
      setDeleteError(msg)
    },
  })

  // Standalone user create mutation (for Users tab)
  const standaloneCreateUserMutation = useMutation({
    mutationFn: (data) => userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      queryClient.invalidateQueries(['flats'])
      setShowStandaloneUserModal(false)
      setEditingStandaloneUser(null)
      setShowStandalonePassword(false)
      setUserError('')
      showToast('User created successfully', 'success')
    },
    onError: (err) => {
      setUserError(parseApiError(err))
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
      const hasOwner = flat.ownerUserId != null
      const isAvailable = !hasOwner || (editingStandaloneUser && editingStandaloneUser.flatId === flat.id)
      return isAvailable
    })
  }, [flats, editingStandaloneUser])

  // Filtered users for Users tab
  const filteredTabUsers = useMemo(() => {
    return scopedUsers.filter(u => {
      const matchesSearch = u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                           u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
      const matchesRole = !filterRole || u.role === filterRole
      return matchesSearch && matchesRole
    })
  }, [scopedUsers, userSearchTerm, filterRole])

  const societyOptions = useMemo(() => {
    return societies
  }, [societies])

  const roleFilterOptions = useMemo(() => {
    const roles = new Set(scopedUsers.map(u => u.role).filter(Boolean))
    return Array.from(roles).sort((a, b) => a.localeCompare(b))
  }, [scopedUsers])

  const handleOpenStandaloneUserModal = (userToEdit = null) => {
    setEditingStandaloneUser(userToEdit)
    setSelectedRole(userToEdit?.role || (creatableRoles.length === 1 ? creatableRoles[0] : creatableRoles[0] || 'MEMBER'))
    setUserError('')
    setShowStandalonePassword(false)
    setShowStandaloneUserModal(true)
  }

  // Handle standalone user form submission (Users tab)
  const handleStandaloneUserSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const roleValue = creatableRoles.length === 1 ? creatableRoles[0] : formData.get('role')
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
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

    // Validate flatId for member/tenant
    if (['MEMBER', 'TENANT'].includes(roleValue) && !data.flatId) {
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

    if (editingStandaloneUser) {
      standaloneUpdateUserMutation.mutate({ id: editingStandaloneUser.id, data })
    } else {
      standaloneCreateUserMutation.mutate(data)
    }
  }

  // ─── End User Management Tab ──────────────────────────────────────────

  // Handle unit form submission
  const handleUnitSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    const societyId = isPlatformLevel 
      ? parseInt(formData.get('societyId')) 
      : user?.societyId

    const unitType = formData.get('unitType') || 'FLAT'

    const data = {
      societyId,
      wingId: formData.get('wingId') ? parseInt(formData.get('wingId')) : null,
      flatNumber: formData.get('flatNumber'),
      unitType: unitType,
      flatType: formData.get('flatType'),
      floor: parseInt(formData.get('floor')) || 0,
      area: parseFloat(formData.get('area')) || 0,
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
    
    // Default password = flat number padded to meet minimum length requirement
    const defaultPassword = selectedUnit?.flatNumber?.padEnd(6, '123456') || '123456'
    
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password') || defaultPassword,
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
    
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
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
  const stats = useMemo(() => {
    const occupiedUnits = flats.filter(f => {
      const hasAssignedUser = memberUsers.some(u => u.flatId === f.id)
      return hasAssignedUser || f.ownerName
    })
    const flatCount = flats.filter(f => !f.unitType || f.unitType === 'FLAT').length
    const shopCount = flats.filter(f => f.unitType === 'SHOP').length
    const officeCount = flats.filter(f => f.unitType === 'OFFICE').length
    return {
      totalUnits: flats.length,
      flats: flatCount,
      shops: shopCount,
      offices: officeCount,
      occupied: occupiedUnits.length,
      vacant: flats.length - occupiedUnits.length,
      assignedUsers: memberUsers.filter(u => u.flatId).length,
      // Capacity limits from society
      maxFlats: currentSociety?.totalFlats || 0,
      maxShops: currentSociety?.totalShops || 0,
      maxOffices: currentSociety?.totalOffices || 0,
    }
  }, [flats, memberUsers, currentSociety])

  const showSkeleton = useMinLoadingTime(flatsLoading || flatsError)

  if (showSkeleton) return (
    <div className="units-page">
      <WakeUpBanner />
      <HeroSkeleton statCount={0} />
      <TabsSkeleton tabCount={2} />
      <FiltersSkeleton />
      <CardGridSkeleton count={8} />
    </div>
  )

  return (
    <div className="units-page">
      {/* Header */}
      <div className="units-header">
        <div>
          <h1 className="units-title">
            <Home className="units-title-icon" />
            Unit Management
          </h1>
          <p className="units-subtitle">
            Manage units and their assigned users in one place
          </p>
        </div>
        <div className="units-header-actions">
          {canEditUnits && (
            <>
              <button
                onClick={() => setShowBulkCreateModal(true)}
                className="units-bulk-button units-bulk-button--success"
              >
                <UsersRound size={18} />
                Bulk Create Users
              </button>
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="units-bulk-button"
              >
                <Upload size={18} />
                Import Units
              </button>
              <button
                onClick={() => openUnitModal()}
                className="units-add-button"
              >
                <Plus size={20} />
                Add Unit
              </button>
            </>
          )}
          {activeTab === 'users' && (
            <>
              {['SECRETARY', 'COMMITTEE'].includes(user?.role) && (
                <>
                  <button
                    onClick={() => {
                      setBulkImportFile(null)
                      setBulkImportPreview(null)
                      setBulkImportError('')
                      setShowUserBulkImportModal(true)
                    }}
                    className="units-bulk-button units-bulk-button--success"
                  >
                    <Upload size={18} />
                    Import Excel
                  </button>
                  <button
                    onClick={() => setShowBulkCreateModal(true)}
                    className="units-bulk-button units-bulk-button--auto"
                  >
                    <UserPlus size={18} />
                    Auto-Create
                  </button>
                </>
              )}
              {!isPlatformLevel && creatableRoles.length > 0 && (
                <button
                  onClick={() => handleOpenStandaloneUserModal(null)}
                  className="units-add-button units-add-button--users"
                >
                  <Plus size={20} />
                  Add User
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="units-main-tabs" role="tablist" aria-label="Unit management sections">
        <button
          onClick={() => switchTab('units')}
          type="button"
          className={clsx(
            'units-main-tab',
            activeTab === 'units' && 'is-active'
          )}
          role="tab"
          aria-selected={activeTab === 'units'}
        >
          <Home size={18} />
          Units
          <span className="units-main-tab-badge">{flats.length}</span>
        </button>
        <button
          onClick={() => switchTab('users')}
          type="button"
          className={clsx(
            'units-main-tab',
            activeTab === 'users' && 'is-active'
          )}
          role="tab"
          aria-selected={activeTab === 'users'}
        >
          <Users size={18} />
          Users
          <span className="units-main-tab-badge">{scopedUsers.length}</span>
        </button>
      </div>

      {/* ═══════════════════ UNITS TAB ═══════════════════ */}
      {activeTab === 'units' && (
      <>
      {/* Stats Cards */}
      <div className="units-stats">
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
        <div className="units-alert">
          <div className="units-alert-content">
            <AlertCircle size={20} />
            <span>{apiError}</span>
          </div>
          <button onClick={() => setApiError('')} className="units-alert-close">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="units-filters">
        <div className="units-filters-row">
          <div className="units-search">
            <Search className="units-search-icon" />
            <input
              type="text"
              placeholder="Search by unit number or user name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="units-search-input"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="units-filter-select"
          >
            <option value="">All Types</option>
            <option value="FLAT">Flats</option>
            <option value="SHOP">Shops</option>
            <option value="OFFICE">Offices</option>
          </select>
          {/* View toggle */}
          <div className="units-view-toggle">
            <button
              onClick={() => setViewMode('units')}
              className={clsx(
                'units-view-button',
                viewMode === 'units' && 'is-active'
              )}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={clsx(
                'units-view-button',
                viewMode === 'table' && 'is-active'
              )}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'units' ? (
        /* Card View */
        <div className="units-grid">
          {filteredUnits.map((unit) => {
            const UnitIcon = getUnitIcon(unit.unitType)
            const unitColor = getUnitColor(unit.unitType)
            const assignedUser = unitUserMap[unit.id]?.member
            const hasAssignedUser = !!assignedUser
            
            return (
              <div key={unit.id} className="units-card">
                {/* Unit Header */}
                <div className="units-card-header">
                  <div className="units-card-title-row">
                    <div className={clsx('units-card-icon', unitColor)}>
                      <UnitIcon className="units-card-icon-svg" />
                    </div>
                    <div>
                      <h3 className="units-card-title">{unit.flatNumber}</h3>
                      <div className="units-card-meta">
                        {unit.wingName && (
                          <span className="units-card-meta-item">
                            <Layers className="units-card-meta-icon" />
                            {unit.wingName}
                          </span>
                        )}
                        <span>Floor {unit.floor}</span>
                      </div>
                    </div>
                  </div>
                  <span className={clsx(
                    'units-status',
                    hasAssignedUser ? 'is-occupied' : 'is-vacant'
                  )}>
                    {hasAssignedUser ? 'Occupied' : 'Vacant'}
                  </span>
                </div>

                {/* Unit Details */}
                <div className="units-card-details">
                  <div className="units-card-detail-row">
                    <span className="units-card-detail-label">Type:</span>
                    <span className="units-card-detail-value">{unit.flatType || unit.unitType || 'FLAT'}</span>
                  </div>
                  {unit.area > 0 && (
                    <div className="units-card-detail-row">
                      <span className="units-card-detail-label">Area:</span>
                      <span className="units-card-detail-value">{unit.area} sq.ft</span>
                    </div>
                  )}
                </div>

                {/* Assigned User - single user per unit */}
                <div className="units-assigned">
                  <p className="units-assigned-title">Assigned User</p>
                  {assignedUser ? (
                    <div className="units-assigned-user">
                      <div className="units-assigned-avatar">
                        <span className="units-assigned-avatar-text">
                          {assignedUser.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="units-assigned-meta">
                        <p className="units-assigned-name">{assignedUser.name}</p>
                        <p className="units-assigned-contact">{assignedUser.phone || assignedUser.email}</p>
                      </div>
                      <span className={clsx(
                        'units-assigned-role',
                        assignedUser.role === 'MEMBER' ? 'is-owner' : 'is-tenant'
                      )}>
                        {assignedUser.role === 'MEMBER' ? 'Owner' : 'Tenant'}
                      </span>
                      {canEditUnits && (
                        <button
                          onClick={() => openEditUserModal(assignedUser, unit)}
                          className="units-edit-user"
                          title="Edit User"
                        >
                          <Edit size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="units-assigned-empty">No user assigned</p>
                  )}
                </div>

                {/* Actions */}
                {canEditUnits && (
                  <div className="units-card-actions">
                    <button
                      onClick={() => openUnitModal(unit)}
                      className="units-card-button"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    {!hasAssignedUser && (
                      <button
                        onClick={() => openUserModal(unit)}
                        className="units-card-button units-card-button--primary"
                      >
                        <UserPlus size={14} />
                        Add User
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
                      className="units-card-delete"
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
        <div className="units-table-card">
          <div className="units-table-scroll">
            <table className="units-table">
              <thead className="units-thead">
                <tr>
                  <th className="units-th">Unit</th>
                  <th className="units-th">Wing</th>
                  <th className="units-th">Type</th>
                  <th className="units-th">Assigned User</th>
                  <th className="units-th">Contact</th>
                  <th className="units-th">Status</th>
                  {canEditUnits && (
                    <th className="units-th units-th--right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="units-tbody">
                {filteredUnits.map((unit) => {
                  const UnitIcon = getUnitIcon(unit.unitType)
                  const assignedUser = unitUserMap[unit.id]?.member
                  const hasAssignedUser = !!assignedUser
                  return (
                    <tr key={unit.id} className="units-row">
                      <td className="units-cell">
                        <div className="units-table-unit">
                          <div className={clsx('units-table-icon', getUnitColor(unit.unitType))}>
                            <UnitIcon className="units-table-icon-svg" />
                          </div>
                          <div>
                            <span className="units-table-title">{unit.flatNumber}</span>
                            <p className="units-table-subtitle">Floor {unit.floor}</p>
                          </div>
                        </div>
                      </td>
                      <td className="units-cell">
                        {unit.wingName ? (
                          <span className="units-wing-badge">
                            <Layers className="units-wing-icon" />
                            {unit.wingName}
                          </span>
                        ) : (
                          <span className="units-cell--muted">-</span>
                        )}
                      </td>
                      <td className="units-cell units-cell--muted">
                        {unit.flatType || unit.unitType || 'FLAT'}
                      </td>
                      <td className="units-cell">
                        <span className="units-cell--strong">{assignedUser?.name || '-'}</span>
                      </td>
                      <td className="units-cell">
                        <div className="units-table-contact">
                          <p className="units-table-contact-main">{assignedUser?.phone || '-'}</p>
                          <p className="units-table-contact-sub">{assignedUser?.email || ''}</p>
                        </div>
                      </td>
                      <td className="units-cell">
                        <span className={clsx(
                          'units-status',
                          hasAssignedUser ? 'is-occupied' : 'is-vacant'
                        )}>
                          {hasAssignedUser ? 'Occupied' : 'Vacant'}
                        </span>
                      </td>
                      {canEditUnits && (
                        <td className="units-cell units-cell--right">
                          <button
                            onClick={() => openUnitModal(unit)}
                            className="units-table-action units-table-action--edit"
                          >
                            <Edit size={18} />
                          </button>
                          {!hasAssignedUser && (
                            <button
                              onClick={() => openUserModal(unit)}
                              className="units-table-action units-table-action--add"
                            >
                              <UserPlus size={18} />
                            </button>
                          )}
                          {hasAssignedUser && (
                            <button
                              onClick={() => openEditUserModal(assignedUser, unit)}
                              className="units-table-action units-table-action--user"
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
                            className="units-table-action units-table-action--delete"
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
      </>
      )}

      {/* ═══════════════════ USERS TAB ═══════════════════ */}
      {activeTab === 'users' && (
      <>
        {/* Role Permissions Info */}
        <div className="units-permissions-card">
          <div className="units-permissions-layout">
            <Shield className="units-permissions-icon units-permissions-icon--md" />
            <div className="units-permissions-content">
              <h3 className="units-permissions-title units-permissions-title--medium">Your Permissions ({user?.role?.replace('_', ' ')})</h3>
              <p className="units-permissions-text units-permissions-text--sm units-permissions-text--mt">
                Access scope is based on your current role and selected society.
              </p>
              <div className="units-permissions-meta">
                {creatableRoles.length > 0 && (
                  <div className="units-permissions-text units-permissions-text--xs">
                    <span className="units-permissions-label">Can create:</span>{' '}
                    <span className="units-permissions-value">{creatableRoles.map(r => r.replace('_', ' ')).join(', ')}</span>
                  </div>
                )}
                {updatableRoles.length > 0 && creatableRoles.length > 0 && (
                  <span className="units-permissions-sep">|</span>
                )}
                {updatableRoles.length > 0 && (
                  <div className="units-permissions-text units-permissions-text--xs">
                    <span className="units-permissions-label">Can edit/delete:</span>{' '}
                    <span className="units-permissions-value">{updatableRoles.map(r => r.replace('_', ' ')).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Error Alert */}
        {deleteError && (
          <div className="units-inline-alert">
            <div className="units-inline-alert__content">
              <AlertCircle size={20} />
              <span>{deleteError}</span>
            </div>
            <button onClick={() => setDeleteError('')} className="units-inline-alert__close">
              <X size={18} />
            </button>
          </div>
        )}

        {/* User Error Alert */}
        {userError && !showStandaloneUserModal && (
          <div className="units-inline-alert">
            <div className="units-inline-alert__content">
              <AlertCircle size={20} />
              <span>{userError}</span>
            </div>
            <button onClick={() => setUserError('')} className="units-inline-alert__close">
              <X size={18} />
            </button>
          </div>
        )}

        {/* User Filters */}
        <div className="units-filters units-users-filters">
          <div className="units-filters-row units-users-filters-row">
            <div className="units-search">
              <Search className="units-search-icon" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="units-search-input"
              />
            </div>

            {isPlatformLevel && (
              <select
                value={filterSociety}
                onChange={(e) => setFilterSociety(e.target.value)}
                className="units-filter-select"
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
                className="units-filter-select"
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
        <div className="units-users-table">
          {!filteredTabUsers.length ? (
            <div className="units-users-empty">
              <Users className="units-users-empty__icon" />
              <p className="units-users-empty__text">No users found</p>
            </div>
          ) : (
            <div className="units-users-table__scroll">
              <table className="units-users-table__table">
                <thead className="units-users-table__thead">
                  <tr>
                    <th className="units-users-table__th">Name</th>
                    <th className="units-users-table__th">Email</th>
                    <th className="units-users-table__th">Role</th>
                    <th className="units-users-table__th">Property</th>
                    <th className="units-users-table__th">Phone</th>
                    <th className="units-users-table__th units-users-table__th--right units-users-table__th--actions">Actions</th>
                  </tr>
                </thead>
                <tbody className="units-users-table__tbody">
                  {filteredTabUsers.map((u) => {
                    const canEdit = u.id === user?.id || updatableRoles.includes(u.role)
                    const canDelete = u.role !== 'MASTER_ADMIN' && u.id !== user?.id && updatableRoles.includes(u.role)
                    const isSelf = u.id === user?.id
                    const userFlat = flats.find(f => f.id === u.flatId)

                    return (
                      <tr key={u.id} className="units-users-table__row">
                        <td className="units-users-table__td">
                          <div className="units-users-table__name">
                            <div className="units-users-table__avatar">
                              <span className="units-users-table__avatar-text">
                                {u.name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                            <div className="units-users-table__name-text">
                              <span className="units-users-table__name-main">{u.name}</span>
                              {isSelf && <span className="units-users-table__you">You</span>}
                            </div>
                          </div>
                        </td>
                        <td className="units-users-table__td units-users-table__mono">{u.email}</td>
                        <td className="units-users-table__td">
                          <span className={clsx(roleColors[u.role] || roleColors.default)}>
                            {u.role?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="units-users-table__td">
                          {userFlat ? (
                            <span className="units-users-table__prop">
                              <Home className="units-users-table__prop-ico" />
                              {userFlat.flatNumber}
                              {userFlat.wingName && <span className="units-users-table__prop-wing">({userFlat.wingName})</span>}
                            </span>
                          ) : (
                            <span className="units-users-table__empty">-</span>
                          )}
                        </td>
                        <td className="units-users-table__td">{u.phone || '-'}</td>
                        <td className="units-users-table__td units-users-table__td--right">
                          <div className="units-users-table__actions">
                            {canEdit ? (
                              <button
                                onClick={() => handleOpenStandaloneUserModal(u)}
                                className="units-users-table__icon-btn"
                                title={isSelf ? 'Edit your profile' : 'Edit user'}
                              >
                                <Edit size={16} />
                              </button>
                            ) : (
                              <button disabled className="units-users-table__icon-btn" title="No permission to edit">
                                <Edit size={16} />
                              </button>
                            )}
                            {canDelete ? (
                              <button
                                onClick={async () => {
                                  const confirmed = await confirmDialog({
                                    title: 'Delete User',
                                    message: `Are you sure you want to delete "${u.name}"? This action cannot be undone.`,
                                    confirmText: 'Delete',
                                    tone: 'danger',
                                    details: [
                                      { label: 'Name', value: u.name || '-' },
                                      { label: 'Email', value: u.email || '-' },
                                      { label: 'Role', value: u.role?.replace(/_/g, ' ') || '-' },
                                      { label: 'Property', value: userFlat?.flatNumber || 'Unassigned' },
                                    ],
                                    impacts: [
                                      { label: 'User Account', count: 1 },
                                      { label: 'Property Link', count: userFlat ? 1 : 0 },
                                    ],
                                    caution: 'This action permanently removes the user account.',
                                  })
                                  if (confirmed) {
                                    deleteUserMutation.mutate(u.id)
                                  }
                                }}
                                className="units-users-table__icon-btn units-users-table__icon-btn--danger"
                                title="Delete user"
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <button disabled className="units-users-table__icon-btn" title={isSelf ? "Cannot delete yourself" : "No permission"}>
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
          )}
        </div>

        {/* Standalone User Modal (Users tab) */}
        {showStandaloneUserModal && (
          <div className="units-modal">
            <div className="units-modal-card units-modal-card--compact">
              <div className="units-modal-header">
                <h3 className="units-modal-title">{editingStandaloneUser ? 'Edit User' : 'Add User'}</h3>
                <button onClick={() => { setShowStandaloneUserModal(false); setUserError(''); setShowStandalonePassword(false); }} className="units-modal-close">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleStandaloneUserSubmit} className="units-modal-body">
                <FormErrorSummary message={userError} />
                <FormInput label="Name" name="name" defaultValue={editingStandaloneUser?.name} required placeholder="Full name" />
                <FormInput label="Email" name="email" type="email" defaultValue={editingStandaloneUser?.email} required placeholder="user@example.com" />
                <div className="units-modal-password-field">
                  <FormInput
                    label={editingStandaloneUser ? 'New Password (optional)' : 'Password'}
                    name="password"
                    type={showStandalonePassword ? 'text' : 'password'}
                    required={!editingStandaloneUser}
                    placeholder={editingStandaloneUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                  />
                  <button
                    type="button"
                    className="units-modal-toggle-pw"
                    onClick={() => setShowStandalonePassword(!showStandalonePassword)}
                    title={showStandalonePassword ? 'Hide password' : 'Show password'}
                  >
                    {showStandalonePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <SmartSelect
                  label="Role"
                  name="role"
                  value={selectedRole || editingStandaloneUser?.role || creatableRoles[0] || 'MEMBER'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  options={creatableRoles.map(role => ({ value: role, label: role.replace('_', ' ') }))}
                  required
                  icon={Shield}
                  emptyMessage="No roles available to create"
                />
                {/* Property selection for MEMBER/TENANT */}
                {['MEMBER', 'TENANT'].includes(selectedRole || creatableRoles[0]) && (
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
                
                <div className="units-modal-actions">
                  <button type="button" onClick={() => { setShowStandaloneUserModal(false); setUserError(''); setShowStandalonePassword(false); }}
                    className="units-modal-cancel">
                    Cancel
                  </button>
                  <AsyncButton
                    type="submit"
                    className="units-modal-submit units-modal-submit--disabled-aware"
                    isLoading={standaloneCreateUserMutation.isPending || standaloneUpdateUserMutation.isPending}
                    loadingText="Saving..."
                  >
                    {editingStandaloneUser ? 'Update' : 'Create'}
                  </AsyncButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Bulk Import Modal */}
        {showUserBulkImportModal && (
          <div className="units-modal">
            <div className="units-modal-card units-user-import-modal">
              <div className="units-modal-header">
                <h3 className="units-modal-title">Bulk Import Users</h3>
                <button onClick={() => { setShowUserBulkImportModal(false); setBulkImportFile(null); setBulkImportPreview(null); setBulkImportError(''); }}
                  className="units-modal-close">
                  <X size={20} />
                </button>
              </div>
              <div className="units-user-import-body">
                {bulkImportError && (
                  <div className="units-inline-alert units-inline-alert--compact">
                    <AlertCircle size={18} />{bulkImportError}
                  </div>
                )}
                {!bulkImportPreview ? (
                  <>
                    <div
                      className={clsx(
                        'units-user-import-dropzone',
                        isDragOver && 'is-dragover'
                      )}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) { setBulkImportFile(file); setBulkImportError('') } }}
                    >
                      <FileSpreadsheet className="units-user-import-dropzone__icon" />
                      <p className="units-user-import-dropzone__title">
                        {bulkImportFile ? bulkImportFile.name : 'Drag & drop Excel file here'}
                      </p>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="units-user-import-dropzone__btn">
                        {bulkImportFile ? 'Change File' : 'Select File'}
                      </button>
                      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="units-user-import-file-input"
                        onChange={(e) => { if (e.target.files[0]) { setBulkImportFile(e.target.files[0]); setBulkImportError('') } }} />
                    </div>
                    <div className="units-user-import-template-row">
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
                        className="units-user-import-template-link">
                        <Download size={16} />Download Template
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="units-user-import-preview">
                    <div className="units-user-import-summary">
                      <div className="units-user-import-summary-card is-valid">
                        <p className="units-user-import-summary-value">{bulkImportPreview.validCount || 0}</p>
                        <p className="units-user-import-summary-label">Valid</p>
                      </div>
                      <div className="units-user-import-summary-card is-invalid">
                        <p className="units-user-import-summary-value">{bulkImportPreview.invalidCount || 0}</p>
                        <p className="units-user-import-summary-label">Invalid</p>
                      </div>
                      <div className="units-user-import-summary-card is-total">
                        <p className="units-user-import-summary-value">{bulkImportPreview.totalRows || 0}</p>
                        <p className="units-user-import-summary-label">Total</p>
                      </div>
                    </div>
                    {bulkImportPreview.rows?.length > 0 && (
                      <div className="units-user-import-table-wrap">
                        <table className="units-user-import-table">
                          <thead className="units-user-import-table__head">
                            <tr>
                              <th className="units-user-import-table__th">Row</th>
                              <th className="units-user-import-table__th">Name</th>
                              <th className="units-user-import-table__th">Email</th>
                              <th className="units-user-import-table__th">Role</th>
                              <th className="units-user-import-table__th">Status</th>
                            </tr>
                          </thead>
                          <tbody className="units-user-import-table__body">
                            {bulkImportPreview.rows.map((row, idx) => (
                              <tr key={idx} className={clsx('units-user-import-table__row', row.valid === false && 'is-invalid')}>
                                <td className="units-user-import-table__td">{row.rowNumber || idx + 1}</td>
                                <td className="units-user-import-table__td">{row.name}</td>
                                <td className="units-user-import-table__td">{row.email}</td>
                                <td className="units-user-import-table__td">{row.role}</td>
                                <td className="units-user-import-table__td">
                                  {row.valid === false ? (
                                    <span className="units-user-import-status units-user-import-status--error">{row.error || 'Invalid'}</span>
                                  ) : (
                                    <CheckCircle size={16} className="units-user-import-status units-user-import-status--ok" />
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
              <div className="units-user-import-actions">
                {!bulkImportPreview ? (
                  <button
                    onClick={() => { if (bulkImportFile) validateBulkImportMutation.mutate({ file: bulkImportFile, societyId: effectiveSocietyId }) }}
                    disabled={!bulkImportFile || validateBulkImportMutation.isPending}
                    className="units-user-import-action-btn units-user-import-action-btn--primary"
                  >
                    {validateBulkImportMutation.isPending ? 'Validating...' : 'Validate'}
                  </button>
                ) : (
                  <>
                    <button onClick={() => { setBulkImportPreview(null); setBulkImportFile(null) }}
                      className="units-user-import-action-btn units-user-import-action-btn--secondary">
                      Back
                    </button>
                    <button
                      onClick={() => processBulkImportMutation.mutate({ file: bulkImportFile, societyId: effectiveSocietyId })}
                      disabled={(bulkImportPreview.invalidCount > 0) || processBulkImportMutation.isPending}
                      className="units-user-import-action-btn units-user-import-action-btn--success"
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
          societies={societies}
          wings={wings}
          isPlatformLevel={isPlatformLevel}
          userSocietyId={user?.societyId}
          errors={unitFormErrors}
          apiError={apiError}
          onSubmit={handleUnitSubmit}
          onClose={() => {
            setShowUnitModal(false)
            setEditingUnit(null)
            setUnitFormErrors({})
            setApiError('')
          }}
          isLoading={createUnitMutation.isPending || updateUnitMutation.isPending}
        />
      )}

      {/* User Modal for linking to unit */}
      {showUserModal && selectedUnit && (
        <UserFormModal
          unit={selectedUnit}
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

      {/* Bulk Create Users Modal */}
      {showBulkCreateModal && (
        <BulkCreateUsersModal
          isLoading={bulkCreateUsersMutation.isPending}
          results={bulkCreateResults}
          onConfirm={() => bulkCreateUsersMutation.mutate()}
          onClose={() => {
            setShowBulkCreateModal(false)
            setBulkCreateResults(null)
          }}
        />
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'units-stat-icon units-stat-icon--blue',
    indigo: 'units-stat-icon units-stat-icon--indigo',
    green: 'units-stat-icon units-stat-icon--green',
    purple: 'units-stat-icon units-stat-icon--purple',
    teal: 'units-stat-icon units-stat-icon--teal',
    orange: 'units-stat-icon units-stat-icon--orange',
    pink: 'units-stat-icon units-stat-icon--pink',
  }
  
  return (
    <div className="units-stat-card">
      <div className="units-stat-content">
        <div className={colorClasses[color]}>
          <Icon className="units-stat-icon-svg" />
        </div>
        <div>
          <p className="units-stat-value">{value}</p>
          <p className="units-stat-label">{label}</p>
        </div>
      </div>
    </div>
  )
}

// Unit Form Modal
function UnitFormModal({ unit, societies, wings, isPlatformLevel, userSocietyId, errors, apiError, onSubmit, onClose, isLoading }) {
  const [selectedUnitType, setSelectedUnitType] = useState(unit?.unitType || 'FLAT')
  const [selectedWingId, setSelectedWingId] = useState(unit?.wingId ? String(unit.wingId) : '')
  const [selectedFlatType, setSelectedFlatType] = useState(unit?.flatType || '')

  // Update flatType when unitType changes
  useEffect(() => {
    if (!unit) {
      if (selectedUnitType === 'FLAT') {
        setSelectedFlatType('2BHK')
      } else if (selectedUnitType === 'SHOP') {
        setSelectedFlatType('RETAIL')
      } else if (selectedUnitType === 'OFFICE') {
        setSelectedFlatType('STANDARD')
      }
    }
  }, [selectedUnitType, unit])

  // Get max floor from selected wing
  const selectedWing = wings.find(w => w.id === parseInt(selectedWingId))
  const maxFloor = selectedWing?.totalFloors || 100

  return (
    <div className="units-modal">
      <div className="units-modal-card">
        <div className="units-modal-header">
          <h3 className="units-modal-title">{unit ? 'Edit Unit' : 'Add Unit'}</h3>
          <button onClick={onClose} className="units-modal-close">
            <X size={20} />
          </button>
        </div>

        {apiError && <div className="units-modal-alert"><FormErrorSummary message={apiError} /></div>}
        {errors.capacity && <div className="units-modal-alert"><FormErrorSummary message={errors.capacity} /></div>}

        <form onSubmit={onSubmit} className="units-modal-body">
          {/* Society (MASTER_ADMIN only) */}
          {isPlatformLevel ? (
            <SmartSelect
              label="Society"
              name="societyId"
              defaultValue={unit?.societyId}
              required
              icon={Building2}
              placeholder="Select Society"
              options={societies.map(s => ({ value: s.id, label: s.name }))}
              error={errors.societyId}
            />
          ) : (
            <input type="hidden" name="societyId" value={userSocietyId || ''} />
          )}

          {/* Unit Type and Wing */}
          <div className="units-modal-grid">
            <SmartSelect
              label="Unit Type"
              name="unitType"
              value={selectedUnitType}
              onChange={(e) => setSelectedUnitType(e.target.value)}
              icon={Home}
              required
              options={[
                { value: 'FLAT', label: '🏠 Flat' },
                { value: 'SHOP', label: '🏪 Shop' },
                { value: 'OFFICE', label: '🏢 Office' },
              ]}
            />
            <SmartSelect
              label={`Wing (Optional)${selectedWingId && selectedWing?.totalFloors ? ` (Max Floor: ${selectedWing.totalFloors})` : ''}`}
              name="wingId"
              value={selectedWingId}
              onChange={(e) => setSelectedWingId(e.target.value)}
              placeholder="No Wing"
              options={wings.map(w => ({ value: w.id, label: `${w.name}${w.totalFloors ? ` (${w.totalFloors} floors)` : ''}` }))}
            />
          </div>

          {/* Flat Number and Type */}
          <div className="units-modal-grid">
            <FormInput
              label="Unit Number"
              name="flatNumber"
              defaultValue={unit?.flatNumber}
              required
              placeholder={
                selectedUnitType === 'SHOP' 
                  ? 'e.g., S-101' 
                  : selectedUnitType === 'OFFICE' 
                  ? 'e.g., O-201' 
                  : 'e.g., A-101'
              }
              pattern="[A-Za-z0-9][A-Za-z0-9\-\/]*"
              maxLength="20"
              error={errors.flatNumber}
            />
            <SmartSelect
              label={selectedUnitType === 'FLAT' ? 'Configuration' : selectedUnitType === 'SHOP' ? 'Shop Type' : 'Office Type'}
              name="flatType"
              value={selectedFlatType}
              onChange={(e) => setSelectedFlatType(e.target.value)}
              required
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

          {/* Floor and Area */}
          <div className="units-modal-grid">
            <NumberInput
              label={`Floor${selectedWingId && selectedWing?.totalFloors ? ` (0 to ${selectedWing.totalFloors})` : ''}`}
              name="floor"
              defaultValue={unit?.floor || 0}
              required
              min={0}
              max={maxFloor}
              error={errors.floor}
              icon={Layers}
            />
            <NumberInput
              label="Area (sq.ft)"
              name="area"
              defaultValue={unit?.area || ''}
              min={0}
              max={100000}
              step={0.01}
              placeholder={selectedUnitType === 'SHOP' ? 'e.g., 500' : selectedUnitType === 'OFFICE' ? 'e.g., 800' : 'e.g., 1200'}
              required
            />
          </div>

          {/* Note: Owner/user will be added via the 'Add User' button after creating the unit */}

          {/* Submit Button */}
          <div className="units-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="units-modal-cancel"
            >
              Cancel
            </button>
            <AsyncButton
              type="submit"
              className="units-modal-submit"
              isLoading={isLoading}
              loadingText="Saving..."
            >
              {unit ? 'Update Unit' : 'Create Unit'}
            </AsyncButton>
          </div>
        </form>
      </div>
    </div>
  )
}

// User Form Modal for linking user to unit
function UserFormModal({ unit, errors, apiError, onSubmit, onClose, isLoading }) {
  return (
    <div className="units-modal">
      <div className="units-modal-card units-modal-card--compact">
        <div className="units-modal-header">
          <div>
            <h3 className="units-modal-title">Add User to Unit</h3>
            <p className="units-modal-subtitle">Unit: {unit.flatNumber}</p>
          </div>
          <button onClick={onClose} className="units-modal-close">
            <X size={20} />
          </button>
        </div>

        {apiError && <div className="units-modal-alert"><FormErrorSummary message={apiError} /></div>}

        <form onSubmit={onSubmit} className="units-modal-body">
          <div className="units-modal-note">
            <p><strong>Default Password:</strong> {unit.flatNumber?.padEnd(6, '123456') || '123456'}</p>
            <p className="units-modal-note-text">User can change password after login</p>
          </div>

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

          <PhoneInput
            label="Phone"
            name="phone"
            error={errors.phone}
            required
          />

          <SmartSelect
            label="Role"
            name="role"
            defaultValue="MEMBER"
            required
            options={[
              { value: 'MEMBER', label: 'Member (Owner)' },
              { value: 'TENANT', label: 'Tenant' },
            ]}
          />

          <div className="units-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="units-modal-cancel"
            >
              Cancel
            </button>
            <AsyncButton
              type="submit"
              className="units-modal-submit"
              isLoading={isLoading}
              loadingText="Creating..."
            >
              Create User
            </AsyncButton>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit User Form Modal for editing user linked to unit
function EditUserFormModal({ user, unit, errors, apiError, onSubmit, onClose, isLoading }) {
  return (
    <div className="units-modal">
      <div className="units-modal-card units-modal-card--compact">
        <div className="units-modal-header">
          <div>
            <h3 className="units-modal-title">Edit User</h3>
            <p className="units-modal-subtitle">Unit: {unit.flatNumber}</p>
          </div>
          <button onClick={onClose} className="units-modal-close">
            <X size={20} />
          </button>
        </div>

        {apiError && <div className="units-modal-alert"><FormErrorSummary message={apiError} /></div>}

        <form onSubmit={onSubmit} className="units-modal-body">
          <div className="units-modal-meta">
            <p className="units-modal-meta-text">User ID: <span className="units-modal-meta-id">{user.id}</span></p>
          </div>

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
            options={[
              { value: 'MEMBER', label: 'Member (Owner)' },
              { value: 'TENANT', label: 'Tenant' },
            ]}
          />

          <div className="units-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="units-modal-cancel"
            >
              Cancel
            </button>
            <AsyncButton
              type="submit"
              className="units-modal-submit"
              isLoading={isLoading}
              loadingText="Saving..."
            >
              Update User
            </AsyncButton>
          </div>
        </form>
      </div>
    </div>
  )
}

// Bulk Create Users Modal
function BulkCreateUsersModal({ isLoading, results, onConfirm, onClose }) {
  return (
    <div className="units-modal">
      <div className="units-modal-card units-modal-card--wide">
        <div className="units-modal-header">
          <h3 className="units-modal-title">
            {results ? 'Bulk Create Results' : 'Create Users in Bulk'}
          </h3>
          <button onClick={onClose} className="units-modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="units-modal-scroll">
          {!results ? (
            <>
              <div className="units-bulk-info">
                <div className="units-bulk-icon">
                  <UsersRound className="units-bulk-icon-svg" />
                </div>
                <h4 className="units-bulk-title">Create Users for All Units</h4>
                <p className="units-bulk-text">
                  This will automatically create user accounts for all units that have an owner email configured but don't have an associated user yet.
                </p>
                <div className="units-bulk-callout">
                  <h5 className="units-bulk-callout-title">How it works:</h5>
                  <ul className="units-bulk-callout-list">
                    <li>• Email from unit owner details will be used as username</li>
                    <li>• Flat/Unit number will be used as the default password</li>
                    <li>• Units without owner email will be skipped</li>
                    <li>• Units with existing users will be skipped</li>
                    <li>• All users will be created with MEMBER role</li>
                  </ul>
                </div>
                <div className="units-bulk-warning">
                  <p className="units-bulk-warning-text">
                    <AlertCircle size={16} />
                    Users should change their password after first login
                  </p>
                </div>
              </div>

              <div className="units-bulk-actions">
                <button
                  onClick={onClose}
                  className="units-modal-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="units-modal-submit units-modal-submit--success"
                >
                  {isLoading ? (
                    <>
                      <div className="units-bulk-spinner" />
                      Creating Users...
                    </>
                  ) : (
                    <>
                      <UsersRound size={18} />
                      Create Users
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="units-bulk-results">
                <div className={clsx(
                  'units-bulk-results-icon',
                  results.usersCreated > 0 ? 'is-success' : 'is-idle'
                )}>
                  {results.usersCreated > 0 ? (
                    <UserCheck className="units-bulk-results-icon-svg" />
                  ) : (
                    <UserX className="units-bulk-results-icon-svg" />
                  )}
                </div>
                <h4 className="units-bulk-results-title">{results.message}</h4>
              </div>

              <div className="units-bulk-results-grid">
                <div className="units-bulk-results-card units-bulk-results-card--success">
                  <div className="units-bulk-results-value">
                    {results.usersCreated}
                  </div>
                  <div className="units-bulk-results-label">Created</div>
                </div>
                <div className="units-bulk-results-card units-bulk-results-card--warning">
                  <div className="units-bulk-results-value">
                    {results.usersSkipped}
                  </div>
                  <div className="units-bulk-results-label">Skipped</div>
                </div>
                <div className="units-bulk-results-card units-bulk-results-card--error">
                  <div className="units-bulk-results-value">
                    {results.errors}
                  </div>
                  <div className="units-bulk-results-label">Errors</div>
                </div>
              </div>

              {results.results && results.results.length > 0 && (
                <div className="units-bulk-table-card">
                  <table className="units-bulk-table">
                    <thead className="units-bulk-thead">
                      <tr>
                        <th className="units-bulk-th">Unit</th>
                        <th className="units-bulk-th">Status</th>
                        <th className="units-bulk-th">Details</th>
                      </tr>
                    </thead>
                    <tbody className="units-bulk-tbody">
                      {results.results.map((result, idx) => (
                        <tr key={idx} className={
                          result.status === 'CREATED' ? 'units-bulk-row is-success' :
                          result.status === 'ERROR' ? 'units-bulk-row is-error' :
                          'units-bulk-row'
                        }>
                          <td className="units-bulk-cell">{result.flatNumber}</td>
                          <td className="units-bulk-cell">
                            <span className={clsx(
                              'units-bulk-status',
                              result.status === 'CREATED'
                                ? 'is-success'
                                : result.status === 'SKIPPED'
                                  ? 'is-warning'
                                  : 'is-error'
                            )}>
                              {result.status}
                            </span>
                          </td>
                          <td className="units-bulk-cell units-bulk-cell--muted">
                            {result.email || result.errorMessage}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="units-bulk-actions">
                <button
                  onClick={onClose}
                  className="units-modal-submit"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
