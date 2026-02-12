import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { flatApi, societyApi, wingApi, userApi } from '../../../api'
import { 
  Plus, Edit, Trash2, Search, X, Home, Store, Briefcase, Layers, 
  Users, UserPlus, UserCheck, UserX, Upload, Download, AlertCircle,
  Eye, Link, Unlink, UsersRound, UserCog, Building2, Shield, FileSpreadsheet, CheckCircle, XCircle, Info
} from 'lucide-react'
import clsx from 'clsx'
import { validateFlatForm, validateUserForm, parseApiError } from '../utils/validation'
import { SmartSelect, FormInput, NumberInput, PhoneInput, FormErrorSummary } from '../components/FormComponents'

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

export default function UnitManagement() {
  const { user, isCommitteeLevel, canManageDocuments } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Get URL params early (before state init that depends on them)
  const societyIdFromUrl = searchParams.get('society')
  const unitTypeFromUrl = searchParams.get('unitType')
  const tabFromUrl = searchParams.get('tab')
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? parseInt(societyIdFromUrl) : user?.societyId

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
  const [userError, setUserError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
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

  // Fetch flats/units
  // PO/OO must have effectiveSocietyId (from URL), otherwise skip
  const { data: flats = [], isLoading: flatsLoading } = useQuery({
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

  // Fetch societies (for PLATFORM_OWNER)
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

  // Filter members for linking to units
  const memberUsers = useMemo(() => {
    return users.filter(u => ['MEMBER', 'TENANT'].includes(u.role))
  }, [users])

  // Create unit-user mapping (1 user per unit)
  const unitUserMap = useMemo(() => {
    const map = {}
    flats.forEach(flat => {
      // Only one user can be assigned per unit - take the first MEMBER, or first TENANT
      const assignedUser = memberUsers.find(u => u.flatId === flat.id)
      map[flat.id] = {
        flat,
        owner: flat.ownerEmail ? users.find(u => u.email === flat.ownerEmail) : null,
        member: assignedUser || null
      }
    })
    return map
  }, [flats, users, memberUsers])

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
    mutationFn: (id) => flatApi.delete(id, user.id),
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
    return users.filter(u => {
      const matchesSearch = u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                           u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
      const matchesRole = !filterRole || u.role === filterRole
      return matchesSearch && matchesRole
    })
  }, [users, userSearchTerm, filterRole])

  const handleOpenStandaloneUserModal = (userToEdit = null) => {
    setEditingStandaloneUser(userToEdit)
    setSelectedRole(userToEdit?.role || (creatableRoles.length === 1 ? creatableRoles[0] : creatableRoles[0] || 'MEMBER'))
    setUserError('')
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
      organizationName: formData.get('organizationName') || null,
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
                    className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                  >
                    <Upload size={18} />
                    Import Excel
                  </button>
                  <button
                    onClick={() => setShowBulkCreateModal(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                  >
                    <UserPlus size={18} />
                    Auto-Create
                  </button>
                </>
              )}
              {creatableRoles.length > 0 && (
                <button
                  onClick={() => handleOpenStandaloneUserModal(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
        <button
          onClick={() => switchTab('units')}
          className={clsx(
            'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition',
            activeTab === 'units'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <Home size={18} />
          Units
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{flats.length}</span>
        </button>
        <button
          onClick={() => switchTab('users')}
          className={clsx(
            'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition',
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <Users size={18} />
          Users
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{users.length}</span>
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
      {flatsLoading ? (
        <div className="units-loading">
          <div className="units-spinner" />
        </div>
      ) : viewMode === 'units' ? (
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
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this unit?')) {
                          deleteUnitMutation.mutate(unit.id)
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
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this unit?')) {
                                deleteUnitMutation.mutate(unit.id)
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
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Your Permissions ({user?.role?.replace('_', ' ')})</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {roleHierarchyInfo[user?.role] || 'View only access'}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {creatableRoles.length > 0 && (
                  <div className="text-xs">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">Can create:</span>{' '}
                    <span className="text-blue-800 dark:text-blue-200">{creatableRoles.map(r => r.replace('_', ' ')).join(', ')}</span>
                  </div>
                )}
                {updatableRoles.length > 0 && creatableRoles.length > 0 && (
                  <span className="text-blue-400 dark:text-blue-500">|</span>
                )}
                {updatableRoles.length > 0 && (
                  <div className="text-xs">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">Can edit/delete:</span>{' '}
                    <span className="text-blue-800 dark:text-blue-200">{updatableRoles.map(r => r.replace('_', ' ')).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Error Alert */}
        {deleteError && (
          <div className="flex items-center justify-between gap-2 p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{deleteError}</span>
            </div>
            <button onClick={() => setDeleteError('')} className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded">
              <X size={18} />
            </button>
          </div>
        )}

        {/* User Error Alert */}
        {userError && !showStandaloneUserModal && (
          <div className="flex items-center justify-between gap-2 p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{userError}</span>
            </div>
            <button onClick={() => setUserError('')} className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded">
              <X size={18} />
            </button>
          </div>
        )}

        {/* User Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </div>
            {updatableRoles.length > 0 && (
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="">All Roles</option>
                {[user?.role, ...updatableRoles]
                  .filter((role, index, arr) => role && arr.indexOf(role) === index)
                  .map(role => (
                  <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          {!users.length ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {filteredTabUsers.map((u) => {
                    const canEdit = u.id === user?.id || updatableRoles.includes(u.role)
                    const canDelete = u.role !== 'PLATFORM_OWNER' && u.id !== user?.id && updatableRoles.includes(u.role)
                    const isSelf = u.id === user?.id
                    const userFlat = flats.find(f => f.id === u.flatId)

                    return (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {u.name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">{u.name}</span>
                              {isSelf && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300 text-sm">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', roleColors[u.role])}>
                            {u.role?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {userFlat ? (
                            <span className="inline-flex items-center gap-1">
                              <Home className="w-3.5 h-3.5 text-gray-400" />
                              {userFlat.flatNumber}
                              {userFlat.wingName && <span className="text-gray-400 text-xs">({userFlat.wingName})</span>}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300 text-sm">{u.phone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1">
                            {canEdit ? (
                              <button
                                onClick={() => handleOpenStandaloneUserModal(u)}
                                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                title={isSelf ? 'Edit your profile' : 'Edit user'}
                              >
                                <Edit size={16} />
                              </button>
                            ) : (
                              <button disabled className="p-1.5 text-gray-300 dark:text-gray-600 cursor-not-allowed" title="No permission to edit">
                                <Edit size={16} />
                              </button>
                            )}
                            {canDelete ? (
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${u.name}"?`)) {
                                    deleteUserMutation.mutate(u.id)
                                  }
                                }}
                                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                title="Delete user"
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <button disabled className="p-1.5 text-gray-300 dark:text-gray-600 cursor-not-allowed" title={isSelf ? "Cannot delete yourself" : "No permission"}>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
                <h3 className="text-lg font-semibold dark:text-white">{editingStandaloneUser ? 'Edit User' : 'Add User'}</h3>
                <button onClick={() => { setShowStandaloneUserModal(false); setUserError(''); }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleStandaloneUserSubmit} className="p-4 space-y-4">
                <FormErrorSummary message={userError} />
                <FormInput label="Name" name="name" defaultValue={editingStandaloneUser?.name} required placeholder="Full name" />
                <FormInput label="Email" name="email" type="email" defaultValue={editingStandaloneUser?.email} required placeholder="user@example.com" />
                {!editingStandaloneUser && (
                  <FormInput label="Password" name="password" type="password" required placeholder="Min 6 characters" />
                )}
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
                <PhoneInput label="Phone" name="phone" defaultValue={editingStandaloneUser?.phone} />
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setShowStandaloneUserModal(false); setUserError(''); }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                    Cancel
                  </button>
                  <button type="submit"
                    disabled={standaloneCreateUserMutation.isPending || standaloneUpdateUserMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {(standaloneCreateUserMutation.isPending || standaloneUpdateUserMutation.isPending) ? 'Saving...' : (editingStandaloneUser ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Bulk Import Modal */}
        {showUserBulkImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
                <h3 className="text-lg font-semibold dark:text-white">Bulk Import Users</h3>
                <button onClick={() => { setShowUserBulkImportModal(false); setBulkImportFile(null); setBulkImportPreview(null); setBulkImportError(''); }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                {bulkImportError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertCircle size={18} />{bulkImportError}
                  </div>
                )}
                {!bulkImportPreview ? (
                  <>
                    <div
                      className={clsx(
                        'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
                        isDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-slate-600 hover:border-gray-400'
                      )}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) { setBulkImportFile(file); setBulkImportError('') } }}
                    >
                      <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-300 mb-2">
                        {bulkImportFile ? bulkImportFile.name : 'Drag & drop Excel file here'}
                      </p>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                        {bulkImportFile ? 'Change File' : 'Select File'}
                      </button>
                      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden"
                        onChange={(e) => { if (e.target.files[0]) { setBulkImportFile(e.target.files[0]); setBulkImportError('') } }} />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <a href={`/api/users/bulk-import/template?societyId=${effectiveSocietyId}&userId=${user?.id}`}
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                        <Download size={16} />Download Template
                      </a>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">{bulkImportPreview.validCount || 0}</p>
                        <p className="text-xs text-green-700 dark:text-green-300">Valid</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-600">{bulkImportPreview.invalidCount || 0}</p>
                        <p className="text-xs text-red-700 dark:text-red-300">Invalid</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">{bulkImportPreview.totalRows || 0}</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Total</p>
                      </div>
                    </div>
                    {bulkImportPreview.rows?.length > 0 && (
                      <div className="border dark:border-slate-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto mb-4">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-slate-700 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left dark:text-white">Row</th>
                              <th className="px-3 py-2 text-left dark:text-white">Name</th>
                              <th className="px-3 py-2 text-left dark:text-white">Email</th>
                              <th className="px-3 py-2 text-left dark:text-white">Role</th>
                              <th className="px-3 py-2 text-left dark:text-white">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y dark:divide-slate-700">
                            {bulkImportPreview.rows.map((row, idx) => (
                              <tr key={idx} className={row.valid === false ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                                <td className="px-3 py-2 dark:text-gray-300">{row.rowNumber || idx + 1}</td>
                                <td className="px-3 py-2 dark:text-gray-300">{row.name}</td>
                                <td className="px-3 py-2 dark:text-gray-300">{row.email}</td>
                                <td className="px-3 py-2 dark:text-gray-300">{row.role}</td>
                                <td className="px-3 py-2">
                                  {row.valid === false ? (
                                    <span className="text-red-600 text-xs">{row.error || 'Invalid'}</span>
                                  ) : (
                                    <CheckCircle size={16} className="text-green-500" />
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
              <div className="flex gap-3 p-4 border-t border-gray-100 dark:border-slate-700">
                {!bulkImportPreview ? (
                  <button
                    onClick={() => { if (bulkImportFile) validateBulkImportMutation.mutate({ file: bulkImportFile, societyId: effectiveSocietyId }) }}
                    disabled={!bulkImportFile || validateBulkImportMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {validateBulkImportMutation.isPending ? 'Validating...' : 'Validate'}
                  </button>
                ) : (
                  <>
                    <button onClick={() => { setBulkImportPreview(null); setBulkImportFile(null) }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 transition">
                      Back
                    </button>
                    <button
                      onClick={() => processBulkImportMutation.mutate({ file: bulkImportFile, societyId: effectiveSocietyId })}
                      disabled={(bulkImportPreview.invalidCount > 0) || processBulkImportMutation.isPending}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
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
        <BulkImportModal
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
          {/* Society (PLATFORM_OWNER only) */}
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
              options={[
                { value: 'FLAT', label: '🏠 Flat' },
                { value: 'SHOP', label: '🏪 Shop' },
                { value: 'OFFICE', label: '🏢 Office' },
              ]}
            />
            <SmartSelect
              label={`Wing${selectedWingId && selectedWing?.totalFloors ? ` (Max Floor: ${selectedWing.totalFloors})` : ''}`}
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
            <button
              type="submit"
              disabled={isLoading}
              className="units-modal-submit"
            >
              {isLoading ? 'Saving...' : unit ? 'Update Unit' : 'Create Unit'}
            </button>
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
          />

          <SmartSelect
            label="Role"
            name="role"
            defaultValue="MEMBER"
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
            <button
              type="submit"
              disabled={isLoading}
              className="units-modal-submit"
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </button>
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
          />

          <SmartSelect
            label="Role (Ownership Type)"
            name="role"
            defaultValue={user.role}
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
            <button
              type="submit"
              disabled={isLoading}
              className="units-modal-submit"
            >
              {isLoading ? 'Saving...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Bulk Import Modal (placeholder for now)
function BulkImportModal({ onClose, societyId, userId, onSuccess }) {
  const [file, setFile] = useState(null)
  const [validationResults, setValidationResults] = useState(null)
  const [importResults, setImportResults] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('upload') // 'upload', 'preview', 'results'

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setValidationResults(null)
      setImportResults(null)
      setError('')
      setStep('upload')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile)
      setValidationResults(null)
      setImportResults(null)
      setError('')
      setStep('upload')
    } else {
      setError('Please drop a valid Excel file (.xlsx or .xls)')
    }
  }

  const handleValidate = async () => {
    if (!file || !societyId || !userId) return
    setIsValidating(true)
    setError('')
    try {
      const response = await flatApi.validateBulkImport(file, societyId, userId)
      setValidationResults(response.data)
      setStep('preview')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to validate file')
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = async () => {
    if (!file || !societyId || !userId) return
    setIsImporting(true)
    setError('')
    try {
      const response = await flatApi.processBulkImport(file, societyId, userId)
      setImportResults(response.data)
      setStep('results')
      if (response.data.successCount > 0) {
        onSuccess?.()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import units')
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await flatApi.downloadImportTemplate(userId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'unit_import_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to download template')
    }
  }

  return (
    <div className="units-modal">
      <div className="units-modal-card units-modal-card--wide">
        <div className="units-modal-header">
          <h3 className="units-modal-title">Bulk Import Units</h3>
          <button onClick={onClose} className="units-modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="units-modal-scroll">
          {error && (
            <div className="units-import-alert">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {step === 'upload' && (
            <>
              <div 
                className="units-import-dropzone"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                {file ? (
                  <div className="units-import-file">
                    <div className="units-import-file-icon">
                      <Upload className="units-import-file-icon-svg" />
                    </div>
                    <span className="units-import-file-name">{file.name}</span>
                    <button 
                      onClick={() => setFile(null)}
                      className="units-import-file-remove"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="units-import-drop-icon" />
                    <p className="units-import-drop-title">
                      Drag and drop your Excel file here, or click to browse
                    </p>
                    <p className="units-import-drop-subtitle">
                      Supported format: .xlsx, .xls
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-upload"
                />
                {!file && (
                  <label
                    htmlFor="excel-upload"
                    className="units-import-button units-import-button--primary"
                  >
                    <Upload size={18} />
                    Select File
                  </label>
                )}
              </div>

              <div className="units-import-help">
                <div className="units-import-help-header">
                  <h4 className="units-import-help-title">
                    <span className="units-import-help-dot"></span>
                    Excel Format Requirements
                  </h4>
                  <button
                    onClick={downloadTemplate}
                    className="units-import-button units-import-button--success"
                  >
                    <Download size={16} />
                    Download Template
                  </button>
                </div>
                <ul className="units-import-help-list">
                  <li className="units-import-help-item">
                    <span className="units-import-help-badge">A</span>
                    <span><strong>Unit Type</strong> (required) - FLAT, SHOP, or OFFICE</span>
                  </li>
                  <li className="units-import-help-item">
                    <span className="units-import-help-badge">B</span>
                    <span><strong>Wing</strong> (optional) - Wing name/code</span>
                  </li>
                  <li className="units-import-help-item">
                    <span className="units-import-help-badge">C</span>
                    <span><strong>Unit Number</strong> (required) - e.g., A-101, S-01</span>
                  </li>
                  <li className="units-import-help-item">
                    <span className="units-import-help-badge">D</span>
                    <span><strong>Configuration</strong> (optional) - e.g., 2BHK, RETAIL</span>
                  </li>
                  <li className="units-import-help-item">
                    <span className="units-import-help-badge">E</span>
                    <span><strong>Floor</strong> (required) - Floor number</span>
                  </li>
                  <li className="units-import-help-item">
                    <span className="units-import-help-badge">F</span>
                    <span><strong>Area</strong> (optional) - Size in sq.ft</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          {step === 'preview' && validationResults && (
            <>
              <div className="units-import-summary">
                <div className={clsx(
                  'units-import-summary-card',
                  validationResults.successCount > 0 && 'is-success'
                )}>
                  <div className="units-import-summary-value">
                    {validationResults.successCount}
                  </div>
                  <div className="units-import-summary-label">
                    Valid
                  </div>
                </div>
                <div className={clsx(
                  'units-import-summary-card',
                  validationResults.failureCount > 0 ? 'is-error' : 'is-idle'
                )}>
                  <div className="units-import-summary-value">
                    {validationResults.failureCount}
                  </div>
                  <div className="units-import-summary-label">
                    {validationResults.failureCount > 0 ? 'Needs Fixing' : 'Invalid'}
                  </div>
                </div>
              </div>

              <div className="units-import-table-card">
                <table className="units-import-table">
                  <thead className="units-import-thead">
                    <tr>
                      <th className="units-import-th">Row</th>
                      <th className="units-import-th">Unit</th>
                      <th className="units-import-th">Type</th>
                      <th className="units-import-th">Wing</th>
                      <th className="units-import-th">Status</th>
                    </tr>
                  </thead>
                  <tbody className="units-import-tbody">
                    {validationResults.results?.map((result, idx) => (
                      <tr 
                        key={idx} 
                        className={clsx('units-import-row', result.success ? 'is-valid' : 'is-invalid')}
                      >
                        <td className="units-import-cell units-import-cell--mono">{result.rowNumber}</td>
                        <td className="units-import-cell units-import-cell--strong">{result.flatNumber}</td>
                        <td className="units-import-cell">
                          <span className={clsx(
                            'units-import-badge',
                            result.unitType === 'FLAT'
                              ? 'is-flat'
                              : result.unitType === 'SHOP'
                                ? 'is-shop'
                                : 'is-office'
                          )}>
                            {result.unitType}
                          </span>
                        </td>
                        <td className="units-import-cell">{result.wingCode || '-'}</td>
                        <td className="units-import-cell">
                          {result.success ? (
                            <span className="units-import-status units-import-status--success">
                              <span className="units-import-status-dot"></span>
                              Valid
                            </span>
                          ) : (
                            <span className="units-import-status units-import-status--error">{result.errorMessage}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {step === 'results' && importResults && (
            <div className="units-import-results">
              <div className={clsx(
                'units-import-results-icon',
                importResults.successCount > 0 ? 'is-success' : 'is-error'
              )}>
                {importResults.successCount > 0 ? (
                  <Home className="units-import-results-icon-svg" />
                ) : (
                  <AlertCircle className="units-import-results-icon-svg" />
                )}
              </div>
              <h4 className="units-import-results-title">{importResults.message}</h4>
              <div className="units-import-results-grid">
                <div className="units-import-results-card units-import-results-card--success">
                  <div className="units-import-results-value">
                    {importResults.successCount}
                  </div>
                  <div className="units-import-results-label">Created</div>
                </div>
                <div className="units-import-results-card units-import-results-card--error">
                  <div className="units-import-results-value">
                    {importResults.failureCount}
                  </div>
                  <div className="units-import-results-label">Failed</div>
                </div>
              </div>
            </div>
          )}

          <div className="units-import-actions">
            {step === 'upload' && (
              <>
                <button
                  onClick={onClose}
                  className="units-import-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleValidate}
                  disabled={!file || isValidating}
                  className="units-import-button units-import-button--primary"
                >
                  {isValidating ? (
                    <>
                      <div className="units-import-button-spinner" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Eye size={18} />
                      Preview & Validate
                    </>
                  )}
                </button>
              </>
            )}

            {step === 'preview' && (
              <>
                {validationResults?.failureCount > 0 ? (
                  // Check if this looks like a completely wrong file format
                  validationResults.failureCount === validationResults.totalRows ? (
                    // Wrong file format - all rows have errors
                    <div className="units-import-message">
                      <div className="units-import-message-card units-import-message-card--error">
                        <div className="units-import-message-content">
                          <div className="units-import-message-icon">
                            <AlertCircle className="units-import-message-icon-svg" />
                          </div>
                          <div className="units-import-message-body">
                            <h4 className="units-import-message-title">
                              Invalid File Format
                            </h4>
                            <p className="units-import-message-text">
                              The uploaded Excel file does not match the required format. Please ensure you are using the correct template with columns: <strong>Unit Type, Wing, Unit Number, Configuration, Floor, Area</strong>.
                            </p>
                            <p className="units-import-message-footnote">
                              Download the template for reference and try again.
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setFile(null)
                          setValidationResults(null)
                          setStep('upload')
                        }}
                        className="units-import-button units-import-button--primary"
                      >
                        <Upload size={18} />
                        Upload Correct File
                      </button>
                    </div>
                  ) : (
                    // Some rows have errors - show fix message
                    <div className="units-import-message">
                      <div className="units-import-message-card units-import-message-card--warning">
                        <div className="units-import-message-content">
                          <div className="units-import-message-icon">
                            <AlertCircle className="units-import-message-icon-svg" />
                          </div>
                          <div className="units-import-message-body">
                            <h4 className="units-import-message-title">
                              Please Fix {validationResults.failureCount} Error{validationResults.failureCount > 1 ? 's' : ''} Before Import
                            </h4>
                            <p className="units-import-message-text">
                              All rows must be valid to proceed. Please review the highlighted errors above, correct them in your Excel file, and re-upload.
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setFile(null)
                          setValidationResults(null)
                          setStep('upload')
                        }}
                        className="units-import-button units-import-button--primary"
                      >
                        <Upload size={18} />
                        Fix & Re-upload Excel
                      </button>
                    </div>
                  )
                ) : (
                  // Show normal import button when all rows are valid
                  <div className="units-import-actions">
                    <button
                      onClick={() => setStep('upload')}
                      className="units-import-button"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={isImporting}
                      className="units-import-button units-import-button--success"
                    >
                      {isImporting ? (
                        <>
                          <div className="units-import-button-spinner" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          Import {validationResults?.successCount} Units
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {step === 'results' && (
              <button
                onClick={onClose}
                className="units-import-button units-import-button--primary"
              >
                Done
              </button>
            )}
          </div>
        </div>
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
                      <div className="units-import-button-spinner" />
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
