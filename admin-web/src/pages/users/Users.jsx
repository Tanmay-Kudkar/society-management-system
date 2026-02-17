import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { useToast } from '../../context'
import { userApi, societyApi, flatApi } from '../../../../api'
import { Plus, Edit, Trash2, Search, X, AlertCircle, Shield, Users as UsersIcon, Building2, Home, Upload, Download, UserPlus, FileSpreadsheet, CheckCircle, XCircle, Info, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { parseApiError, validateUserForm } from '../../utils'
import * as XLSX from 'xlsx'
import { FormInput, PhoneInput, SmartSelect, FormErrorSummary } from '../../components'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, FiltersSkeleton, TableSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const roleColors = {
  PLATFORM_OWNER: 'role-tag role-tag--platform-owner',
  ORGANIZATION_OWNER: 'role-tag role-tag--organization-owner',
  SOCIETY_ADMIN: 'role-tag role-tag--society-admin',
  CHAIRMAN: 'role-tag role-tag--chairman',
  SECRETARY: 'role-tag role-tag--secretary',
  TREASURER: 'role-tag role-tag--treasurer',
  COMMITTEE: 'role-tag role-tag--committee',
  MANAGER: 'role-tag role-tag--manager',
  EMPLOYEE: 'role-tag role-tag--employee',
  MEMBER: 'role-tag role-tag--member',
  TENANT: 'role-tag role-tag--tenant',
  VISITOR: 'role-tag role-tag--visitor',
}

const roleAccentColors = {
  PLATFORM_OWNER: 'var(--role-platform-owner)',
  ORGANIZATION_OWNER: 'var(--role-organization-owner)',
  SOCIETY_ADMIN: 'var(--role-society-admin)',
  CHAIRMAN: 'var(--role-chairman)',
  SECRETARY: 'var(--role-secretary)',
  TREASURER: 'var(--role-treasurer)',
  COMMITTEE: 'var(--role-committee)',
  MANAGER: 'var(--role-manager)',
  EMPLOYEE: 'var(--role-employee)',
  MEMBER: 'var(--role-member)',
  TENANT: 'var(--role-tenant)',
  VISITOR: 'var(--role-visitor)',
}

export default function Users() {
  const { user, canManageUsers } = useAuth()
  const confirmDialog = useConfirmDialog()
  const toast = useToast()
  const navigate = useNavigate()
  const hasUserManagementPermission = canManageUsers()

  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  
  // Get URL parameters for filtering
  const urlSocietyId = searchParams.get('society')
  const urlRole = searchParams.get('role')
  
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState(urlRole || '')
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Bulk import state
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false)
  const [bulkImportFile, setBulkImportFile] = useState(null)
  const [bulkImportPreview, setBulkImportPreview] = useState(null)
  const [bulkImportError, setBulkImportError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const downloadUsersBulkErrorReport = () => {
    const failedRows = (bulkImportPreview?.results || []).filter((row) => !row.success)
    if (!failedRows.length) return

    const reportRows = failedRows.map((row) => ({
      Row: row.rowNumber ?? '-',
      Name: row.name || '-',
      Email: row.email || '-',
      Flat: row.flatNumber || '-',
      Role: row.role || '-',
      'Error Message': row.errorMessage || 'Unknown error',
    }))

    const worksheet = XLSX.utils.json_to_sheet(reportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ImportErrors')
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'user_bulk_import_errors.xlsx'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(url)
  }
  
  // Check if current user is PLATFORM_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'
  
  // Check if current user is MEMBER (for tenant assignment logic)
  // Check from session, profile API response, or users list
  const isMember = user?.role === 'MEMBER'

  // Fetch users - include user.id in queryKey to refetch when user changes
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['users', user?.id],
    queryFn: () => userApi.getAll().then(res => res.data),
  })

  // Fetch current user's full profile to get flatId and verify role (for MEMBER creating TENANT)
  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-profile', user?.id],
    queryFn: () => userApi.getById(user.id).then(res => res.data),
    enabled: !!user?.id,
  })
  
  // Double-check if user is MEMBER from profile data (in case session is stale)
  const confirmedIsMember = isMember || currentUserProfile?.role === 'MEMBER'

  // Get current user's flatId from multiple sources
  const currentUserFlatId = user?.flatId || currentUserProfile?.flatId || users.find(u => u.id === user?.id)?.flatId

  // Fetch roles that current user can create
  const { data: creatableRoles = [] } = useQuery({
    queryKey: ['creatable-roles', user?.id],
    queryFn: () => userApi.getCreatableRoles().then(res => res.data).catch(() => []),
  })

  // Fetch roles that current user can update/delete
  const { data: updatableRoles = [] } = useQuery({
    queryKey: ['updatable-roles', user?.id],
    queryFn: () => userApi.getUpdatableRoles().then(res => res.data).catch(() => []),
  })

  const handleOpenModal = (userToEdit = null) => {
    setEditingUser(userToEdit)
    setSelectedRole(userToEdit?.role || (creatableRoles.length === 1 ? creatableRoles[0] : creatableRoles[0] || 'MEMBER'))
    setShowPassword(false)
    setShowModal(true)
  }

  const { data: societies = [] } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data).catch(() => []),
    enabled: isPlatformLevel,
  })

  // Effective society for flat fetching: URL param takes priority, then user's own society
  const effectiveSocietyIdForFlats = urlSocietyId ? parseInt(urlSocietyId) : user?.societyId

  // Fetch flats for MEMBER/TENANT property assignment
  // PO/OO only need flats when viewing a specific society (via ?society=X)
  const { data: flats = [] } = useQuery({
    queryKey: ['flats', effectiveSocietyIdForFlats],
    queryFn: () => flatApi.getBySociety(effectiveSocietyIdForFlats).then(res => res.data),
    enabled: !!effectiveSocietyIdForFlats,
  })

  // Fetch the MEMBER's own flat directly if they have flatId (for tenant assignment)
  const { data: memberFlat } = useQuery({
    queryKey: ['member-flat', currentUserFlatId],
    queryFn: () => flatApi.getById(currentUserFlatId).then(res => res.data),
    enabled: confirmedIsMember && !!currentUserFlatId,
  })

  // Get available flats based on user role and selected role for the new user
  const availableFlats = (() => {
    // MEMBER creating TENANT: show only flats owned by this member
    if (confirmedIsMember) {
      // Filter flats where ownerUserId matches the current user's ID
      const memberOwnedFlats = flats.filter(flat => flat.ownerUserId === user?.id)
      if (memberOwnedFlats.length > 0) {
        return memberOwnedFlats
      }
      // Fallback: try using currentUserFlatId
      if (currentUserFlatId) {
        const flatFromList = flats.find(flat => flat.id === currentUserFlatId)
        if (flatFromList) return [flatFromList]
        if (memberFlat) return [memberFlat]
      }
      // If no flat found, return empty (the form will show auto-assign message)
      return []
    }
    
    return flats.filter(flat => {
      // Check if flat has an owner assigned (using ownerUserId from backend)
      const hasOwner = flat.ownerUserId != null
      // Allow if not owned, or if editing the current owner
      const isAvailable = !hasOwner || (editingUser && editingUser.flatId === flat.id)
      if (!isAvailable) return false
      
      // All unit-assignable roles (MEMBER, TENANT, CHAIRMAN, etc.) can own any unit type
      // No unit type filtering needed
      return true
    })
  })()

  const createMutation = useMutation({
    mutationFn: (data) => userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowModal(false)
      setEditingUser(null)
      setError('')
    },
    onError: (err) => {
      setError(parseApiError(err))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowModal(false)
      setEditingUser(null)
      setError('')
    },
    onError: (err) => {
      setError(parseApiError(err))
    },
  })

  const [deleteError, setDeleteError] = useState('')

  const deleteMutation = useMutation({
    mutationFn: ({ id, force = false }) => userApi.delete(id, force),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['users'])
      setDeleteError('')
      toast.success(variables?.force ? 'User force-deleted successfully' : 'User deleted successfully')
    },
    onError: (err) => {
      setDeleteError(parseApiError(err))
    },
  })

  const confirmAndDeleteUser = async (targetUser, context = {}) => {
    const propertyValue = context?.property || context?.userFlat?.flatNumber || 'Unassigned'
    const societyValue = context?.societyName || 'Not linked'

    const confirmed = await confirmDialog({
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      confirmText: 'Delete',
      tone: 'danger',
      details: [
        { label: 'Name', value: targetUser?.name || '-' },
        { label: 'Email', value: targetUser?.email || '-' },
        { label: 'Role', value: targetUser?.role?.replace(/_/g, ' ') || '-' },
        { label: 'Society', value: societyValue },
        { label: 'Property', value: propertyValue },
      ],
      impacts: [
        { label: 'User Account', count: 1 },
        { label: 'Role Access', count: 1 },
      ],
      caution: 'This action permanently removes the user account.',
    })

    if (!confirmed) return

    try {
      await deleteMutation.mutateAsync({ id: targetUser.id, force: false })
    } catch (error) {
      const serverMessage = error?.response?.data?.message || parseApiError(error)
      const shouldOfferForceDelete =
        error?.response?.status === 409 &&
        String(serverMessage).toLowerCase().includes('use force delete')

      if (!shouldOfferForceDelete) {
        return
      }

      const finalWarning = await confirmDialog({
        title: 'Final Warning: Force Delete User',
        message: `Force delete user "${targetUser?.name}" and automatically clean linked role records?`,
        confirmText: 'Force Delete',
        cancelText: 'Cancel',
        tone: 'danger',
        details: [
          { label: 'Name', value: targetUser?.name || '-' },
          { label: 'Role', value: targetUser?.role?.replace(/_/g, ' ') || '-' },
          { label: 'Society', value: societyValue },
          { label: 'Property', value: propertyValue },
        ],
        caution: 'This will auto-remove or unlink linked references and cannot be undone.',
      })

      if (!finalWarning) return

      try {
        await deleteMutation.mutateAsync({ id: targetUser.id, force: true })
      } catch (forceError) {
        setDeleteError(parseApiError(forceError))
      }
    }
  }

  // Bulk validate import mutation
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

  // Bulk process import mutation
  const processBulkImportMutation = useMutation({
    mutationFn: ({ file, societyId }) => userApi.processBulkImport(file, societyId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowBulkImportModal(false)
      setBulkImportFile(null)
      setBulkImportPreview(null)
      setBulkImportError('')
    },
    onError: (err) => {
      setBulkImportError(parseApiError(err))
    },
  })

  // Bulk create users from units mutation
  const bulkCreateFromUnitsMutation = useMutation({
    mutationFn: (societyId) => userApi.bulkCreateForUnits(societyId),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['users'])
      toast.success(`${res.data.message}`)
      setShowBulkCreateModal(false)
    },
    onError: (err) => {
      toast.error(parseApiError(err))
    },
  })

  // For PLATFORM_OWNER, show ORGANIZATION_OWNER and SOCIETY_ADMIN (their manageable users)
  // For ORGANIZATION_OWNER, show only SOCIETY_ADMIN users in their org
  // UNLESS viewing a specific society from URL - then show all users in that society
  // For others, show all users they can see
  let displayUsers = users
  const scopedSocietyIds = new Set(societies.map(s => s.id))
  
  // Apply society filter from URL if present
  if (urlSocietyId) {
    displayUsers = displayUsers.filter(u => String(u.societyId) === urlSocietyId)
  } else if (user?.role === 'PLATFORM_OWNER') {
    // Platform Owner sees both Organization Owners and Society Admins
    displayUsers = displayUsers.filter(u => u.role === 'ORGANIZATION_OWNER' || u.role === 'SOCIETY_ADMIN')
  } else if (user?.role === 'ORGANIZATION_OWNER') {
    // Organization Owner sees only Society Admins scoped to societies in their organization
    displayUsers = displayUsers.filter(u =>
      u.role === 'SOCIETY_ADMIN' &&
      ((u.societyId && scopedSocietyIds.has(u.societyId)) ||
        (u.organizationId && user?.organizationId && u.organizationId === user.organizationId))
    )
  }

  const filteredUsers = displayUsers.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !filterRole || u.role === filterRole
    return matchesSearch && matchesRole
  })

  // Get society name for a user
  const getSocietyName = (societyId) => {
    const society = societies.find(s => s.id === societyId)
    return society?.name || 'No Society Assigned'
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    // Use the single role if only one is available
    const roleValue = creatableRoles.length === 1 ? creatableRoles[0] : formData.get('role')
    
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: roleValue,
      phone: formData.get('phone'),
      societyId: formData.get('societyId') ? parseInt(formData.get('societyId')) : null,
      flatId: formData.get('flatId') ? parseInt(formData.get('flatId')) : null,
      organizationName: formData.get('organizationName') || null,
    }

    // Frontend validation - Fix: use !!editingUser instead of !editingUser
    const validation = validateUserForm(data, !!editingUser)
    if (!validation.isValid) {
      setError(Object.values(validation.errors).join(', '))
      return
    }

    // Validate societyId is required for SOCIETY_ADMIN creation (by PLATFORM_OWNER or ORGANIZATION_OWNER)
    if ((user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER') && roleValue === 'SOCIETY_ADMIN' && !data.societyId) {
      setError('Please select a society for the Society Admin')
      return
    }

    // Validate flatId is required for resident society roles
    // Exception: MEMBER creating TENANT - backend auto-assigns the member's flat
    const residentUnitRoles = ['MEMBER', 'TENANT', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE']
    if (residentUnitRoles.includes(roleValue) && !data.flatId) {
      // Skip validation if MEMBER is creating TENANT (backend will auto-assign)
      if (!(confirmedIsMember && roleValue === 'TENANT')) {
        setError(`Please select a property for ${roleValue.replace('_', ' ').toLowerCase()}`)
        return
      }
    }

    // Roles that cannot be assigned to any unit
    // EMPLOYEE, VISITOR = staff/visitor roles, no unit
    // MEMBER, CHAIRMAN, SECRETARY, TREASURER, COMMITTEE = can have FLAT
    // TENANT = can have any unit (FLAT, SHOP, OFFICE)
    const nonUnitRoles = ['EMPLOYEE', 'VISITOR']
    if (nonUnitRoles.includes(roleValue) && data.flatId) {
      setError(`${roleValue} role cannot be assigned to a property. Only MEMBER, TENANT, CHAIRMAN, SECRETARY, TREASURER, and COMMITTEE can occupy units.`)
      return
    }

    // Prevent multiple high-level roles in the same society
    const restrictedRoles = ['CHAIRMAN', 'SECRETARY', 'TREASURER']
    if (restrictedRoles.includes(roleValue)) {
      // Determine the society to check against
      const targetSocietyId = data.societyId || user?.societyId
      
      // Check if a user with this role already exists in the same society
      const existingRoleUser = users.find(u => 
        u.role === roleValue && 
        u.societyId === targetSocietyId &&
        u.id !== editingUser?.id
      )
      
      if (existingRoleUser) {
        setError(`A ${roleValue} already exists in this society: ${existingRoleUser.name}. Only one ${roleValue} is allowed per society.`)
        return
      }
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  // Determine page title based on context
  const getPageTitle = () => {
    if (urlRole === 'SOCIETY_ADMIN' && !urlSocietyId) {
      return 'Society Admins'
    }
    if (urlSocietyId && urlRole) {
      return `${urlRole.replace('_', ' ')}s`
    }
    if (urlSocietyId) {
      return 'Society Users'
    }
    if (user?.role === 'PLATFORM_OWNER') {
      return 'Manage Users'
    }
    if (user?.role === 'ORGANIZATION_OWNER') {
      return 'Society Admins'
    }
    return 'Users'
  }
  
  const getPageDescription = () => {
    if (urlRole === 'SOCIETY_ADMIN' && !urlSocietyId) {
      return 'Manage society administrators'
    }
    if (urlSocietyId) {
      return 'View users in this society'
    }
    if (user?.role === 'PLATFORM_OWNER') {
      return 'Manage organization owners and society administrators'
    }
    if (user?.role === 'ORGANIZATION_OWNER') {
      return 'Manage society administrators'
    }
    return 'Manage system users and roles'
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (!hasUserManagementPermission) {
    return <PermissionDenied message="You don't have permission to manage users" />
  }

  if (showSkeleton) return (
    <div className="users-page">
      <WakeUpBanner />
      <HeroSkeleton statCount={0} />
      <FiltersSkeleton filterCount={3} />
      <TableSkeleton rows={10} cols={6} />
    </div>
  )

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <div>
          <h1 className="users-title">
            {getPageTitle()}
          </h1>
          <p className="users-subtitle">
            {getPageDescription()}
          </p>
        </div>
        <div className="users-actions">
          {/* Bulk Actions - only show for SECRETARY and COMMITTEE (they manage multiple users like MEMBER, EMPLOYEE, etc.) */}
          {/* SOCIETY_ADMIN only creates unique positions (CHAIRMAN, SECRETARY, TREASURER) - no bulk import needed */}
          {['SECRETARY', 'COMMITTEE'].includes(user?.role) ? (
            <>
              <button
                onClick={() => {
                  setBulkImportFile(null)
                  setBulkImportPreview(null)
                  setBulkImportError('')
                  setShowBulkImportModal(true)
                }}
                className="users-action-btn users-action-btn--success"
              >
                <Upload size={18} />
                Import Excel
              </button>
              <button
                onClick={() => setShowBulkCreateModal(true)}
                className="users-action-btn users-action-btn--purple"
              >
                <UserPlus size={18} />
                Auto-Create Users
              </button>
            </>
          ) : null}
          {creatableRoles.length > 0 && (
            <button
              onClick={() => handleOpenModal(null)}
              className="users-action-btn users-action-btn--primary"
            >
              <Plus size={20} />
              {urlRole === 'SOCIETY_ADMIN' ? 'Add Society Admin' : isPlatformLevel && !urlSocietyId ? 'Create User' : 'Add User'}
            </button>
          )}
        </div>
      </div>

      {/* Role Permissions Info */}
      <div className="users-permissions">
        <div className="users-permissions__row">
          <Shield className="users-permissions__icon" size={20} />
          <div>
            <h3 className="users-permissions__title">Your Permissions ({user?.role?.replace('_', ' ')})</h3>
            <p className="users-permissions__text">
              Access scope is based on your current role and organization/society assignment.
            </p>
            <div className="users-permissions__meta">
              {creatableRoles.length > 0 && (
                <div>
                  <span className="users-permissions__label">Can create:</span>{' '}
                  <span className="users-permissions__value">
                    {creatableRoles.map(r => r.replace('_', ' ')).join(', ')}
                  </span>
                </div>
              )}
              {updatableRoles.length > 0 && creatableRoles.length > 0 && (
                <span className="users-permissions__divider">|</span>
              )}
              {updatableRoles.length > 0 && (
                <div>
                  <span className="users-permissions__label">Can edit/delete:</span>{' '}
                  <span className="users-permissions__value">
                    {updatableRoles.map(r => r.replace('_', ' ')).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Error Alert */}
      {deleteError && (
        <div className="users-alert">
          <div className="users-alert__content">
            <AlertCircle size={20} />
            <span>{deleteError}</span>
          </div>
          <button 
            onClick={() => setDeleteError('')}
            className="users-alert__close"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="users-filters">
        <div className="users-filters__row">
          <div className="users-search">
            <Search className="users-search__icon" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="users-search__input"
            />
          </div>
          {/* Show role filter when there are manageable roles (hide for Organization Owner as they only manage Society Admins) */}
          {updatableRoles.length > 0 && user?.role !== 'ORGANIZATION_OWNER' && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="users-filter-select"
            >
              <option value="">All Roles</option>
              {/* Include current user's role + roles they can manage */}
              {[user?.role, ...updatableRoles]
                .filter((role, index, arr) => role && arr.indexOf(role) === index)
                .map(role => (
                <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* PLATFORM_OWNER/ORG_OWNER sees user cards with navigation (unless viewing specific society) */}
      {isPlatformLevel && !urlSocietyId ? (
        <div className="users-section">
          <h2 className="users-section__title">
            <UsersIcon size={20} />
            {user?.role === 'PLATFORM_OWNER' ? 'Organization Owners & Society Administrators' : 'Society Administrators'}
            <span className="users-section__count">({filteredUsers.length})</span>
          </h2>
          
          {filteredUsers.length === 0 ? (
            <div className="users-empty">
              <UsersIcon className="users-empty__icon" size={48} />
              <p className="users-empty__text">No users found</p>
              <p className="users-empty__subtext">{user?.role === 'PLATFORM_OWNER' ? 'Create an Organization Owner or Society Admin to get started' : 'Create a new Society Admin to get started'}</p>
            </div>
          ) : (
            <div className="user-grid">
              {filteredUsers.map((u) => {
                const canEdit = updatableRoles.includes(u.role)
                const canDelete = u.role !== 'PLATFORM_OWNER' && updatableRoles.includes(u.role)
                const societyName = getSocietyName(u.societyId)
                
                return (
                  <div key={u.id} className="user-card">
                    {/* Card Header */}
                    <div className="user-card__header">
                      <div className="user-card__identity">
                        <div className="user-card__avatar">
                          <span>
                            {u.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="user-card__name">{u.name}</h3>
                          <p className="user-card__email">{u.email}</p>
                        </div>
                      </div>
                      <span className={clsx(roleColors[u.role])}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* Society Info */}
                    <div className="user-card__society">
                      <Building2 size={16} />
                      <span className="user-card__society-text">{societyName}</span>
                    </div>
                    
                    {/* Phone */}
                    {u.phone && (
                      <p className="user-card__phone">
                        📞 {u.phone}
                      </p>
                    )}
                    
                    {/* Actions */}
                    <div className="user-card__actions">
                      {u.societyId ? (
                        <button
                          onClick={() => navigate(`/societies/${u.societyId}`)}
                          className="user-card__action user-card__action--view"
                        >
                          <Building2 size={16} />
                          View Society
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="user-card__action user-card__action--view user-card__action--disabled"
                          title="No society assigned"
                        >
                          <Building2 size={16} />
                          No Society
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="user-card__action user-card__action--icon"
                          title="Edit user"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => confirmAndDeleteUser(u, { societyName })}
                          className="user-card__action user-card__action--icon user-card__action--danger"
                          title="Delete user"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
      /* Card-row view for non-PLATFORM_OWNER users */
      <div className="utbl">
        {(
          <>
          {/* Column labels */}
          <div className="utbl__head">
            <span className="utbl__col utbl__col--name">Name</span>
            <span className="utbl__col utbl__col--email">Email</span>
            <span className="utbl__col utbl__col--role">Role</span>
            <span className="utbl__col utbl__col--prop">Property</span>
            <span className="utbl__col utbl__col--phone">Phone</span>
            <span className="utbl__col utbl__col--acts">Actions</span>
          </div>

          {/* Rows */}
          <div className="utbl__body">
            {filteredUsers.map((u) => {
              const canEdit = u.id === user?.id || updatableRoles.includes(u.role)
              const canDelete = u.role !== 'PLATFORM_OWNER' && updatableRoles.includes(u.role)
              const isSelf = u.id === user?.id
              const userFlat = flats.find(f => f.id === u.flatId)
              const accentColor = roleAccentColors[u.role] || 'var(--role-member)'

              return (
              <div key={u.id} className="utbl__row" style={{ '--row-accent': accentColor }}>
                <div className="utbl__accent" />
                <div className="utbl__col utbl__col--name">
                  <div className="utbl__avatar" style={{ '--avatar-accent': accentColor }}>
                    {u.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="utbl__name-block">
                    <span className="utbl__name">{u.name}</span>
                    {isSelf && <span className="utbl__you">You</span>}
                  </div>
                </div>

                <div className="utbl__col utbl__col--email">
                  <span className="utbl__email">{u.email}</span>
                </div>

                <div className="utbl__col utbl__col--role">
                  <span className={clsx(roleColors[u.role])}>
                    <span className="role-tag__dot" />
                    {u.role?.replace('_', ' ')}
                  </span>
                </div>

                <div className="utbl__col utbl__col--prop">
                  {userFlat ? (
                    <span className="utbl__prop-chip">
                      <Home size={13} />
                      <span>{userFlat.flatNumber}</span>
                      {userFlat.wingName && <span className="utbl__prop-wing">{userFlat.wingName}</span>}
                    </span>
                  ) : (
                    <span className="utbl__prop-empty">—</span>
                  )}
                </div>

                <div className="utbl__col utbl__col--phone">
                  <span className="utbl__phone">{u.phone || '—'}</span>
                </div>

                <div className="utbl__col utbl__col--acts">
                  <div className="utbl__act-group">
                    {canEdit ? (
                      <button onClick={() => handleOpenModal(u)} className="utbl__act-btn" title={isSelf ? 'Edit your profile' : 'Edit user'}>
                        <Edit size={15} />
                      </button>
                    ) : (
                      <button disabled className="utbl__act-btn" title="No permission to edit">
                        <Edit size={15} />
                      </button>
                    )}
                    {canDelete ? (
                      <button
                        onClick={() => confirmAndDeleteUser(u, { userFlat, property: userFlat?.flatNumber || 'Unassigned' })}
                        className="utbl__act-btn utbl__act-btn--danger"
                        title="Delete user"
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : (
                      <button disabled className="utbl__act-btn" title={isSelf ? 'Cannot delete yourself' : 'No permission'}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              )
            })}
          </div>
          </>
        )}
      </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="users-modal">
          <div className="users-modal__panel">
            <div className="users-modal__header">
              <h3 className="users-modal__title">{editingUser ? 'Edit User' : 'Add User'}</h3>
              <button onClick={() => { setShowModal(false); setError(''); setShowPassword(false); }} className="users-modal__close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="users-modal__form">
              <FormErrorSummary message={error} />
              <FormInput
                label="Name"
                name="name"
                defaultValue={editingUser?.name}
                required
                placeholder="Full name"
              />
              <FormInput
                label="Email"
                name="email"
                type="email"
                defaultValue={editingUser?.email}
                required
                placeholder="user@example.com"
              />
              <div className="users-modal__password-field">
                <FormInput
                  label={editingUser ? 'New Password (optional)' : 'Password'}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required={!editingUser}
                  placeholder={editingUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                />
                <button
                  type="button"
                  className="users-modal__toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <SmartSelect
                label="Role"
                name="role"
                value={selectedRole || editingUser?.role || creatableRoles[0] || 'MEMBER'}
                onChange={(e) => setSelectedRole(e.target.value)}
                options={creatableRoles.map(role => ({ value: role, label: role.replace('_', ' ') }))}
                required
                icon={Shield}
                emptyMessage="No roles available to create"
              />
              {user?.role === 'PLATFORM_OWNER' && (selectedRole || editingUser?.role) === 'ORGANIZATION_OWNER' && (
                <div>
                  <label className="form-label">Organization Name</label>
                  <input
                    type="text"
                    name="organizationName"
                    defaultValue={editingUser?.organizationName || ''}
                    placeholder="e.g. ABC Housing Group"
                    className="form-input"
                  />
                  <p className="form-help">Leave empty to auto-generate from the owner's name</p>
                </div>
              )}
              {(user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER') && (selectedRole || editingUser?.role) === 'SOCIETY_ADMIN' && (
                <SmartSelect
                  label="Society"
                  name="societyId"
                  defaultValue={editingUser?.societyId || ''}
                  options={societies.map(s => ({ value: s.id, label: s.name }))}
                  required
                  icon={Building2}
                  placeholder="Select Society"
                  emptyMessage="No societies available"
                />
              )}
              {/* Property selection for resident society roles - hidden only for non-unit roles */}
              {['MEMBER', 'TENANT', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE'].includes(selectedRole || creatableRoles[0]) && (
                <div>
                  {/* MEMBER creating TENANT: auto-assign from member's flat */}
                  {confirmedIsMember && (selectedRole || creatableRoles[0]) === 'TENANT' ? (
                    <div className="form-field-group">
                      <label className="form-label">
                        <Home size={16} className="form-label__icon" />
                        Property
                      </label>
                      {availableFlats.length > 0 ? (
                        <div className="smart-select-single">
                          <Home size={14} className="smart-select__icon" />
                          <span className="smart-select__value">
                            {availableFlats[0]?.flatNumber} {availableFlats[0]?.wingName ? `(${availableFlats[0]?.wingName})` : ''}
                          </span>
                          <span className="smart-select__badge">
                            Your flat
                          </span>
                          <input type="hidden" name="flatId" value={availableFlats[0]?.id || ''} />
                        </div>
                      ) : (
                        <div className="smart-select-empty">
                          <span>Your flat will be automatically assigned to the tenant</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <SmartSelect
                      label="Property"
                      name="flatId"
                      defaultValue={editingUser?.flatId || ''}
                      options={availableFlats.map(flat => ({
                        value: flat.id,
                        label: `${flat.flatNumber} ${flat.wingName ? `(${flat.wingName})` : ''} - ${flat.unitType || 'FLAT'}`
                      }))}
                      required={!confirmedIsMember}
                      icon={Home}
                      placeholder="Select Property"
                      emptyMessage="No available properties. All units are assigned."
                    />
                  )}
                </div>
              )}
              <PhoneInput
                label={(selectedRole || editingUser?.role) === 'SOCIETY_ADMIN' ? 'Telephone' : 'Phone'}
                name="phone"
                defaultValue={editingUser?.phone}
                required
              />
              <div className="users-modal__actions">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(''); setShowPassword(false); }}
                  className="users-modal__btn users-modal__btn--ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatableRoles.length === 0 && !editingUser}
                  className="users-modal__btn users-modal__btn--primary"
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="bulk-modal">
          <div className="bulk-modal__panel">
            <div className="bulk-modal__header">
              <h3 className="bulk-modal__title">Bulk Import Users</h3>
              <button 
                onClick={() => {
                  setShowBulkImportModal(false)
                  setBulkImportFile(null)
                  setBulkImportPreview(null)
                  setBulkImportError('')
                }}
                className="bulk-modal__close"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="bulk-modal__body">
              {/* Error Message */}
              {bulkImportError && (
                <div className="bulk-error">
                  <AlertCircle size={18} />
                  {bulkImportError}
                </div>
              )}

              {/* Step 1: File Upload */}
              {!bulkImportPreview && (
                <>
                  <div
                    className={clsx(
                      'bulk-upload',
                      isDragOver && 'bulk-upload--active'
                    )}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDragOver(false)
                      const file = e.dataTransfer.files[0]
                      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                        setBulkImportFile(file)
                        setBulkImportError('')
                      } else {
                        setBulkImportError('Please upload an Excel file (.xlsx or .xls)')
                      }
                    }}
                  >
                    {bulkImportFile ? (
                      <div className="bulk-upload__file">
                        <div className="bulk-upload__file-icon">
                          <FileSpreadsheet size={24} />
                        </div>
                        <div className="bulk-upload__meta">
                          <p className="bulk-upload__file-name">{bulkImportFile.name}</p>
                          <p className="bulk-upload__file-size">{(bulkImportFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          onClick={() => setBulkImportFile(null)}
                          className="bulk-upload__remove"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={48} className="users-empty__icon" />
                        <p className="bulk-upload__prompt">
                          Drag and drop your Excel file here, or click to browse
                        </p>
                        <p className="bulk-upload__hint">Supported format: .xlsx, .xls</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          setBulkImportFile(file)
                          setBulkImportError('')
                        }
                      }}
                    />
                    {!bulkImportFile && (
                      <label>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bulk-upload__button"
                        >
                          <Upload size={18} />
                          Select File
                        </button>
                      </label>
                    )}
                  </div>

                  {/* Format Requirements with attractive styling */}
                  <div className="bulk-requirements">
                    <div className="bulk-requirements__header">
                      <h4 className="bulk-requirements__title">
                        <span className="bulk-requirements__dot"></span>
                        Excel Format Requirements
                      </h4>
                      <button
                        onClick={() => {
                          userApi.downloadImportTemplate()
                            .then(res => {
                              const blob = new Blob([res.data], { 
                                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                              })
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = 'user_import_template.xlsx'
                              a.click()
                              window.URL.revokeObjectURL(url)
                            })
                            .catch(() => setBulkImportError('Failed to download template'))
                        }}
                        className="bulk-requirements__download"
                      >
                        <Download size={16} />
                        Download Template
                      </button>
                    </div>
                    <ul className="bulk-requirements__list">
                      <li className="bulk-requirements__item">
                        <span className="bulk-requirements__badge">A</span>
                        <span><strong>Name</strong> (required) - Full name of the user</span>
                      </li>
                      <li className="bulk-requirements__item">
                        <span className="bulk-requirements__badge">B</span>
                        <span><strong>Email</strong> (required) - Used as username</span>
                      </li>
                      <li className="bulk-requirements__item">
                        <span className="bulk-requirements__badge">C</span>
                        <span><strong>Flat Number</strong> - Required for unit owners. Supports comma-separated for multiple units (e.g., "A-101, S-001")</span>
                      </li>
                      <li className="bulk-requirements__item">
                        <span className="bulk-requirements__badge">D</span>
                        <span><strong>Phone</strong> (optional) - Contact number</span>
                      </li>
                      <li className="bulk-requirements__item">
                        <span className="bulk-requirements__badge">E</span>
                        <span><strong>Role</strong> (optional) - Default: MEMBER</span>
                      </li>
                    </ul>
                    {/* Role-Unit Type Rules */}
                    <div>
                      <p className="bulk-requirements__rule-title">Role & Unit Type Rules:</p>
                      <ul className="bulk-requirements__rules">
                        <li>• <strong>MEMBER, CHAIRMAN, SECRETARY, TREASURER, COMMITTEE, TENANT</strong> → Can own FLAT, SHOP, or OFFICE</li>
                        <li>• <strong>Multiple units:</strong> Use comma-separated values (e.g., "A-101, S-001") for owners with multiple properties</li>
                        <li>• <strong>EMPLOYEE, VISITOR</strong> → Cannot be assigned to any unit (leave Flat Number empty)</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Preview Results */}
              {bulkImportPreview && (
                <>
                  {/* Summary Cards */}
                  <div className="bulk-summary">
                    <div className={clsx(
                      'bulk-summary__card',
                      bulkImportPreview.successCount > 0 && 'bulk-summary__card--valid'
                    )}>
                      <div className="bulk-summary__count">
                        {bulkImportPreview.successCount}
                      </div>
                      <div className="bulk-summary__label">
                        Valid
                      </div>
                    </div>
                    <div className={clsx(
                      'bulk-summary__card',
                      bulkImportPreview.failureCount > 0 && 'bulk-summary__card--invalid'
                    )}>
                      <div className="bulk-summary__count">
                        {bulkImportPreview.failureCount}
                      </div>
                      <div className="bulk-summary__label">
                        {bulkImportPreview.failureCount > 0 ? 'Needs Fixing' : 'Invalid'}
                      </div>
                    </div>
                  </div>

                  {/* Results Table */}
                  <div className="bulk-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Flat</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkImportPreview.results?.map((row, idx) => (
                          <tr 
                            key={idx}
                            className={clsx(!row.success && 'bulk-table__row--invalid')}
                          >
                            <td>{row.rowNumber}</td>
                            <td>{row.name || '-'}</td>
                            <td>{row.email || '-'}</td>
                            <td>{row.flatNumber || '-'}</td>
                            <td>
                              {row.success ? (
                                <span className="bulk-table__status bulk-table__status--valid">
                                  <span className="bulk-requirements__dot"></span>
                                  Valid
                                </span>
                              ) : (
                                <span className="bulk-table__status bulk-table__status--error">{row.errorMessage}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="bulk-footer">
              {!bulkImportPreview ? (
                <>
                  <button
                    onClick={() => {
                      setShowBulkImportModal(false)
                      setBulkImportFile(null)
                      setBulkImportPreview(null)
                      setBulkImportError('')
                    }}
                    className="bulk-footer__button bulk-footer__button--ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!bulkImportFile) {
                        setBulkImportError('Please select a file first')
                        return
                      }
                      const societyId = urlSocietyId || user?.societyId
                      if (!societyId) {
                        setBulkImportError('Society ID is required')
                        return
                      }
                      validateBulkImportMutation.mutate({ file: bulkImportFile, societyId })
                    }}
                    disabled={!bulkImportFile || validateBulkImportMutation.isPending}
                    className="bulk-footer__button bulk-footer__button--primary"
                  >
                    {validateBulkImportMutation.isPending ? (
                      <>
                        <div className="users-loading__spinner"></div>
                        Validating...
                      </>
                    ) : (
                      <>
                        <Eye size={18} /> Preview & Validate
                      </>
                    )}
                  </button>
                </>
              ) : bulkImportPreview.failureCount > 0 ? (
                // Show error state with appropriate message
                bulkImportPreview.failureCount === bulkImportPreview.totalRows ? (
                  // All rows invalid - wrong file format
                  <div className="bulk-error-stack">
                    <div className="bulk-error-card bulk-error-card--fatal">
                      <div className="bulk-error-card__row">
                        <div className="bulk-error-card__icon">
                          <AlertCircle size={24} />
                        </div>
                        <div className="bulk-error-card__content">
                          <h4 className="bulk-error-card__title">
                            Invalid File Format
                          </h4>
                          <p className="bulk-error-card__text">
                            The uploaded Excel file does not match the required format. Please ensure you are using the correct template with columns: <strong>Name, Email, Flat Number, Phone, Role</strong>.
                          </p>
                          <p className="bulk-error-card__text">
                            Download the template for reference and try again.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setBulkImportFile(null)
                        setBulkImportPreview(null)
                        setBulkImportError('')
                      }}
                      className="bulk-error-action"
                    >
                      <Upload size={18} />
                      Upload Correct File
                    </button>
                    <button
                      onClick={downloadUsersBulkErrorReport}
                      className="bulk-error-action"
                    >
                      <Download size={18} />
                      Download Error Report
                    </button>
                  </div>
                ) : (
                  // Some rows have errors
                  <div className="bulk-error-stack">
                    <div className="bulk-error-card bulk-error-card--warn">
                      <div className="bulk-error-card__row">
                        <div className="bulk-error-card__icon">
                          <AlertCircle size={24} />
                        </div>
                        <div className="bulk-error-card__content">
                          <h4 className="bulk-error-card__title">
                            Please Fix {bulkImportPreview.failureCount} Error{bulkImportPreview.failureCount > 1 ? 's' : ''} Before Import
                          </h4>
                          <p className="bulk-error-card__text">
                            All rows must be valid to proceed. Please review the highlighted errors above, correct them in your Excel file, and re-upload.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setBulkImportFile(null)
                        setBulkImportPreview(null)
                        setBulkImportError('')
                      }}
                      className="bulk-error-action"
                    >
                      <Upload size={18} />
                      Fix & Re-upload Excel
                    </button>
                    <button
                      onClick={downloadUsersBulkErrorReport}
                      className="bulk-error-action"
                    >
                      <Download size={18} />
                      Download Error Report
                    </button>
                  </div>
                )
              ) : (
                // All valid - show import button
                <div className="bulk-footer__row">
                  <button
                    onClick={() => {
                      setBulkImportFile(null)
                      setBulkImportPreview(null)
                      setBulkImportError('')
                    }}
                    className="bulk-footer__button bulk-footer__button--ghost"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      const societyId = urlSocietyId || user?.societyId
                      processBulkImportMutation.mutate({ file: bulkImportFile, societyId })
                    }}
                    disabled={processBulkImportMutation.isPending}
                    className="bulk-footer__button bulk-footer__button--success"
                  >
                    {processBulkImportMutation.isPending ? (
                      <>
                        <div className="users-loading__spinner"></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Import {bulkImportPreview.successCount} Users
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create from Units Modal */}
      {showBulkCreateModal && (
        <div className="bulk-modal">
          <div className="bulk-modal__panel">
            <div className="bulk-modal__header">
              <h3 className="bulk-modal__title">Create Users in Bulk</h3>
              <button 
                onClick={() => setShowBulkCreateModal(false)}
                className="bulk-modal__close"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="bulk-create">
              <div className="bulk-create__hero">
                <div className="bulk-create__icon">
                  <UserPlus size={32} />
                </div>
                <h4 className="bulk-create__title">
                  Create Users for All Units
                </h4>
                <p className="bulk-create__text">
                  This will automatically create user accounts for all units that have an owner email configured but don't have an associated user yet.
                </p>
              </div>

              <div className="bulk-create__info">
                <h5>How it works:</h5>
                <ul>
                  <li>• Email from unit owner details will be used as username</li>
                  <li>• Flat/Unit number will be used as the default password</li>
                  <li>• Units without owner email will be skipped</li>
                  <li>• Units with existing users will be skipped</li>
                  <li>• All users will be created with MEMBER role</li>
                </ul>
              </div>

              <div className="bulk-create__note">
                <Info size={18} />
                <p>
                  Users should change their password after first login
                </p>
              </div>
            </div>

            <div className="bulk-footer">
              <button
                type="button"
                onClick={() => setShowBulkCreateModal(false)}
                className="bulk-footer__button bulk-footer__button--ghost"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const societyId = urlSocietyId || user?.societyId
                  if (!societyId) {
                    toast.error('Society ID is required')
                    return
                  }
                  bulkCreateFromUnitsMutation.mutate(societyId)
                }}
                disabled={bulkCreateFromUnitsMutation.isPending}
                className="bulk-footer__button bulk-footer__button--success"
              >
                {bulkCreateFromUnitsMutation.isPending ? (
                  <>
                    <div className="users-loading__spinner"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} /> Create Users
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
