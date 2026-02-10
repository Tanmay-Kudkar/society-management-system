import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { userApi, societyApi, flatApi } from '../../../api'
import { Plus, Edit, Trash2, Search, X, AlertCircle, Shield, Users as UsersIcon, Building2, Home, Upload, Download, UserPlus, FileSpreadsheet, CheckCircle, XCircle, Info, Eye } from 'lucide-react'
import clsx from 'clsx'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { parseApiError, validateUserForm } from '../utils/validation'
import { FormInput, PhoneInput, SmartSelect, FormErrorSummary } from '../components/FormComponents'

const roleColors = {
  PLATFORM_OWNER: 'bg-purple-100 text-purple-800',
  ORGANIZATION_OWNER: 'bg-violet-100 text-violet-800',
  SOCIETY_ADMIN: 'bg-blue-100 text-blue-800',
  CHAIRMAN: 'bg-indigo-100 text-indigo-800',
  SECRETARY: 'bg-cyan-100 text-cyan-800',
  TREASURER: 'bg-green-100 text-green-800',
  COMMITTEE: 'bg-yellow-100 text-yellow-800',
  MANAGER: 'bg-amber-100 text-amber-800',
  EMPLOYEE: 'bg-orange-100 text-orange-800',
  MEMBER: 'bg-gray-100 text-gray-800',
  TENANT: 'bg-pink-100 text-pink-800',
  VISITOR: 'bg-red-100 text-red-800',
}

// Role hierarchy descriptions for tooltips - aligned with Permission Matrix
const roleHierarchyInfo = {
  PLATFORM_OWNER: 'Platform Owner - Manages all societies and organizations',
  ORGANIZATION_OWNER: 'Organization Owner - Manages multiple societies under an organization',
  SOCIETY_ADMIN: 'Society Super Admin - Full control over society, all CRUD operations',
  CHAIRMAN: 'Highest Committee Authority - Presides meetings, final approval, bank signatory',
  SECRETARY: 'Administrative Head - Documentation, records, day-to-day operations. Creates Committee',
  TREASURER: 'Financial Head - Finances, billing, payments, accounts. Creates Committee',
  COMMITTEE: 'Committee Member - Intermediate management, creates Employee and Member',
  MANAGER: 'Operational Manager - Handles day-to-day management tasks (no user CRUD)',
  EMPLOYEE: 'Staff/Security - Handles visitors, basic operations. Creates Visitor only',
  MEMBER: 'Flat Owner - Views own data, raises tickets/complaints. Creates Tenant only',
  TENANT: 'Renter - Limited access to own profile & bills',
  VISITOR: 'Guest - Minimal access, read-only',
}

export default function Users() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  
  // Get URL parameters for filtering
  const urlSocietyId = searchParams.get('society')
  const urlRole = searchParams.get('role')
  
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  
  // Bulk import state
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false)
  const [bulkImportFile, setBulkImportFile] = useState(null)
  const [bulkImportPreview, setBulkImportPreview] = useState(null)
  const [bulkImportError, setBulkImportError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)
  
  // Initialize filterRole from URL parameter
  useEffect(() => {
    if (urlRole) {
      setFilterRole(urlRole)
    }
  }, [urlRole])

  // Check if current user is PLATFORM_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'
  
  // Check if current user is MEMBER (for tenant assignment logic)
  // Check from session, profile API response, or users list
  const isMember = user?.role === 'MEMBER'

  // Fetch users - include user.id in queryKey to refetch when user changes
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', user?.id],
    queryFn: () => userApi.getAll().then(res => res.data).catch(() => []),
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
    
    // For other roles creating users, filter based on selected role's unit type restrictions
    const targetRole = selectedRole || creatableRoles[0]
    
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
    mutationFn: (id) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setDeleteError('')
    },
    onError: (err) => {
      setDeleteError(err.response?.data?.message || 'Failed to delete user')
    },
  })

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
      alert(`${res.data.message}`)
      setShowBulkCreateModal(false)
    },
    onError: (err) => {
      alert(parseApiError(err))
    },
  })

  // For PLATFORM_OWNER, show ORGANIZATION_OWNER and SOCIETY_ADMIN (their manageable users)
  // For ORGANIZATION_OWNER, show only SOCIETY_ADMIN users in their org
  // UNLESS viewing a specific society from URL - then show all users in that society
  // For others, show all users they can see
  let displayUsers = users
  
  // Apply society filter from URL if present
  if (urlSocietyId) {
    displayUsers = displayUsers.filter(u => String(u.societyId) === urlSocietyId)
  } else if (user?.role === 'PLATFORM_OWNER') {
    // Platform Owner sees both Organization Owners and Society Admins
    displayUsers = displayUsers.filter(u => u.role === 'ORGANIZATION_OWNER' || u.role === 'SOCIETY_ADMIN')
  } else if (user?.role === 'ORGANIZATION_OWNER') {
    // Organization Owner sees Society Admins in their org
    displayUsers = displayUsers.filter(u => u.role === 'SOCIETY_ADMIN')
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

    // Validate flatId is required for MEMBER/TENANT roles only (they are resident roles)
    // Exception: MEMBER creating TENANT - backend auto-assigns the member's flat
    if (['MEMBER', 'TENANT'].includes(roleValue) && !data.flatId) {
      // Skip validation if MEMBER is creating TENANT (backend will auto-assign)
      if (!(confirmedIsMember && roleValue === 'TENANT')) {
        setError('Please select a property for the user')
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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getPageTitle()}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {getPageDescription()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
                Auto-Create Users
              </button>
            </>
          ) : null}
          {creatableRoles.length > 0 && (
            <button
              onClick={() => handleOpenModal(null)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              {isPlatformLevel && !urlSocietyId ? 'Create User' : 'Add User'}
            </button>
          )}
        </div>
      </div>

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
                  <span className="text-blue-800 dark:text-blue-200">
                    {creatableRoles.map(r => r.replace('_', ' ')).join(', ')}
                  </span>
                </div>
              )}
              {updatableRoles.length > 0 && creatableRoles.length > 0 && (
                <span className="text-blue-400 dark:text-blue-500">|</span>
              )}
              {updatableRoles.length > 0 && (
                <div className="text-xs">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Can edit/delete:</span>{' '}
                  <span className="text-blue-800 dark:text-blue-200">
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
        <div className="flex items-center justify-between gap-2 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{deleteError}</span>
          </div>
          <button 
            onClick={() => setDeleteError('')}
            className="p-1 hover:bg-red-100 rounded"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
          {/* Show role filter when there are manageable roles (hide for Organization Owner as they only manage Society Admins) */}
          {updatableRoles.length > 0 && user?.role !== 'ORGANIZATION_OWNER' && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
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
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            {user?.role === 'PLATFORM_OWNER' ? 'Organization Owners & Society Administrators' : 'Society Administrators'}
            <span className="text-sm font-normal text-gray-500">({filteredUsers.length})</span>
          </h2>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center">
              <UsersIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{user?.role === 'PLATFORM_OWNER' ? 'Create an Organization Owner or Society Admin to get started' : 'Create a new Society Admin to get started'}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((u) => {
                const canEdit = updatableRoles.includes(u.role)
                const canDelete = u.role !== 'PLATFORM_OWNER' && updatableRoles.includes(u.role)
                const societyName = getSocietyName(u.societyId)
                
                return (
                  <div key={u.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 hover:shadow-md transition">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{u.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                        </div>
                      </div>
                      <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', roleColors[u.role])}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* Society Info */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg mb-3">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{societyName}</span>
                    </div>
                    
                    {/* Phone */}
                    {u.phone && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        📞 {u.phone}
                      </p>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
                      {u.societyId && (
                        <button
                          onClick={() => navigate(`/societies/${u.societyId}`)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                        >
                          <Building2 className="w-4 h-4" />
                          View Society
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition"
                          title="Edit user"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this user?')) {
                              deleteMutation.mutate(u.id)
                            }
                          }}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition"
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
      /* Table view for non-PLATFORM_OWNER users */
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredUsers.map((u) => {
                  // Check if current user can edit/delete this user
                  const canEdit = u.id === user?.id || updatableRoles.includes(u.role)
                  const canDelete = u.role !== 'PLATFORM_OWNER' && updatableRoles.includes(u.role)
                  const isSelf = u.id === user?.id
                  
                  return (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{u.name}</span>
                          {isSelf && (
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', roleColors[u.role])}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{u.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {canEdit ? (
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 transition"
                          title={isSelf ? 'Edit your profile' : 'Edit user'}
                        >
                          <Edit size={18} />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="p-1.5 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                          title="No permission to edit this user"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {canDelete ? (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this user?')) {
                              deleteMutation.mutate(u.id)
                            }
                          }}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 transition ml-2"
                          title="Delete user"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="p-1.5 text-gray-300 dark:text-gray-600 cursor-not-allowed ml-2"
                          title={isSelf ? "Cannot delete yourself" : "No permission to delete this user"}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold dark:text-white">{editingUser ? 'Edit User' : 'Add User'}</h3>
              <button onClick={() => { setShowModal(false); setError(''); }} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
              {!editingUser && (
                <FormInput
                  label="Password"
                  name="password"
                  type="password"
                  required={!editingUser}
                  placeholder="Min 6 characters"
                />
              )}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization Name</label>
                  <input
                    type="text"
                    name="organizationName"
                    defaultValue={editingUser?.organizationName || ''}
                    placeholder="e.g. ABC Housing Group"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from the owner's name</p>
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
              {/* Property selection for MEMBER/TENANT roles - NOT shown for EMPLOYEE */}
              {['MEMBER', 'TENANT'].includes(selectedRole || creatableRoles[0]) && (
                <div>
                  {/* MEMBER creating TENANT: auto-assign from member's flat */}
                  {confirmedIsMember && (selectedRole || creatableRoles[0]) === 'TENANT' ? (
                    <div className="form-field-group">
                      <label className="form-label">
                        <Home className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        Property
                      </label>
                      {availableFlats.length > 0 ? (
                        <div className="smart-select-single">
                          <Home size={14} className="text-blue-500 dark:text-blue-400 shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {availableFlats[0]?.flatNumber} {availableFlats[0]?.wingName ? `(${availableFlats[0]?.wingName})` : ''}
                          </span>
                          <span className="ml-auto text-[10px] uppercase tracking-wider text-blue-500 dark:text-blue-400 font-semibold">
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
              />
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatableRoles.length === 0 && !editingUser}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold dark:text-white">Bulk Import Users</h3>
              <button 
                onClick={() => {
                  setShowBulkImportModal(false)
                  setBulkImportFile(null)
                  setBulkImportPreview(null)
                  setBulkImportError('')
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Error Message */}
              {bulkImportError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
                  <AlertCircle size={18} />
                  {bulkImportError}
                </div>
              )}

              {/* Step 1: File Upload */}
              {!bulkImportPreview && (
                <>
                  <div
                    className={clsx(
                      'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
                      isDragOver 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-300 dark:border-slate-600 hover:border-blue-400'
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
                      <div className="flex items-center justify-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">{bulkImportFile.name}</p>
                          <p className="text-sm text-gray-500">{(bulkImportFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          onClick={() => setBulkImportFile(null)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                        >
                          <X size={18} className="text-gray-500" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          Drag and drop your Excel file here, or click to browse
                        </p>
                        <p className="text-sm text-gray-500 mb-4">Supported format: .xlsx, .xls</p>
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
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition"
                        >
                          <Upload size={18} />
                          Select File
                        </button>
                      </label>
                    )}
                  </div>

                  {/* Format Requirements with attractive styling */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-medium rounded-lg shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <Download size={16} />
                        Download Template
                      </button>
                    </div>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 text-xs font-bold rounded mt-0.5">A</span>
                        <span><strong>Name</strong> (required) - Full name of the user</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 text-xs font-bold rounded mt-0.5">B</span>
                        <span><strong>Email</strong> (required) - Used as username</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 text-xs font-bold rounded mt-0.5">C</span>
                        <span><strong>Flat Number</strong> - Required for unit owners. Supports comma-separated for multiple units (e.g., "A-101, S-001")</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 text-xs font-bold rounded mt-0.5">D</span>
                        <span><strong>Phone</strong> (optional) - Contact number</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 text-xs font-bold rounded mt-0.5">E</span>
                        <span><strong>Role</strong> (optional) - Default: MEMBER</span>
                      </li>
                    </ul>
                    {/* Role-Unit Type Rules */}
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                      <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">Role & Unit Type Rules:</p>
                      <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
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
                  <div className="mb-4 flex gap-4">
                    <div className={`flex-1 p-4 rounded-xl text-center transition-all duration-300 ${
                      bulkImportPreview.successCount > 0 
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-green-500/30' 
                        : 'bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600'
                    }`}>
                      <div className={`text-3xl font-bold ${bulkImportPreview.successCount > 0 ? 'text-white' : 'text-gray-400'}`}>
                        {bulkImportPreview.successCount}
                      </div>
                      <div className={`text-sm font-medium ${bulkImportPreview.successCount > 0 ? 'text-emerald-100' : 'text-gray-500'}`}>
                        Valid
                      </div>
                    </div>
                    <div className={`flex-1 p-4 rounded-xl text-center transition-all duration-300 ${
                      bulkImportPreview.failureCount > 0 
                        ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-red-500/30' 
                        : 'bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600'
                    }`}>
                      <div className={`text-3xl font-bold ${bulkImportPreview.failureCount > 0 ? 'text-white' : 'text-gray-400'}`}>
                        {bulkImportPreview.failureCount}
                      </div>
                      <div className={`text-sm font-medium ${bulkImportPreview.failureCount > 0 ? 'text-rose-100' : 'text-gray-500'}`}>
                        {bulkImportPreview.failureCount > 0 ? 'Needs Fixing' : 'Invalid'}
                      </div>
                    </div>
                  </div>

                  {/* Results Table */}
                  <div className="border dark:border-slate-700 rounded-xl overflow-hidden shadow-sm max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-slate-700 dark:to-slate-600 sticky top-0">
                        <tr>
                          <th className="px-3 py-3 text-left font-semibold dark:text-white">Row</th>
                          <th className="px-3 py-3 text-left font-semibold dark:text-white">Name</th>
                          <th className="px-3 py-3 text-left font-semibold dark:text-white">Email</th>
                          <th className="px-3 py-3 text-left font-semibold dark:text-white">Flat</th>
                          <th className="px-3 py-3 text-left font-semibold dark:text-white">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-slate-700">
                        {bulkImportPreview.results?.map((row, idx) => (
                          <tr 
                            key={idx}
                            className={`transition-colors duration-200 ${
                              row.success 
                                ? 'hover:bg-green-50/50 dark:hover:bg-green-900/10' 
                                : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-l-4 border-l-red-500'
                            }`}
                          >
                            <td className="px-3 py-3 dark:text-gray-300 font-mono text-xs">{row.rowNumber}</td>
                            <td className="px-3 py-3 dark:text-gray-300 font-medium">{row.name || '-'}</td>
                            <td className="px-3 py-3 dark:text-gray-300 text-xs">{row.email || '-'}</td>
                            <td className="px-3 py-3 dark:text-gray-300">{row.flatNumber || '-'}</td>
                            <td className="px-3 py-3">
                              {row.success ? (
                                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                  Valid
                                </span>
                              ) : (
                                <span className="text-red-600 dark:text-red-400 text-xs font-medium">{row.errorMessage}</span>
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
            <div className="flex gap-3 p-4 border-t border-gray-100 dark:border-slate-700">
              {!bulkImportPreview ? (
                <>
                  <button
                    onClick={() => {
                      setShowBulkImportModal(false)
                      setBulkImportFile(null)
                      setBulkImportPreview(null)
                      setBulkImportError('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
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
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                  >
                    {validateBulkImportMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                  <div className="w-full space-y-3">
                    <div className="p-5 bg-gradient-to-br from-rose-500 to-red-600 dark:from-rose-600 dark:to-red-700 rounded-2xl shadow-xl shadow-red-500/30">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-lg mb-2">
                            Invalid File Format
                          </h4>
                          <p className="text-rose-100 text-sm leading-relaxed">
                            The uploaded Excel file does not match the required format. Please ensure you are using the correct template with columns: <strong>Name, Email, Flat Number, Phone, Role</strong>.
                          </p>
                          <p className="text-rose-200 text-xs mt-2">
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
                      className="w-full px-4 py-3.5 accent-btn rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
                    >
                      <Upload size={18} />
                      Upload Correct File
                    </button>
                  </div>
                ) : (
                  // Some rows have errors
                  <div className="w-full space-y-3">
                    <div className="p-5 bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 rounded-2xl shadow-xl shadow-orange-500/30">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center animate-bounce-gentle">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-lg mb-2">
                            Please Fix {bulkImportPreview.failureCount} Error{bulkImportPreview.failureCount > 1 ? 's' : ''} Before Import
                          </h4>
                          <p className="text-amber-100 text-sm leading-relaxed">
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
                      className="w-full px-4 py-3.5 accent-btn rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
                    >
                      <Upload size={18} />
                      Fix & Re-upload Excel
                    </button>
                  </div>
                )
              ) : (
                // All valid - show import button
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => {
                      setBulkImportFile(null)
                      setBulkImportPreview(null)
                      setBulkImportError('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      const societyId = urlSocietyId || user?.societyId
                      processBulkImportMutation.mutate({ file: bulkImportFile, societyId })
                    }}
                    disabled={processBulkImportMutation.isPending}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    {processBulkImportMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold dark:text-white">Create Users in Bulk</h3>
              <button 
                onClick={() => setShowBulkCreateModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Create Users for All Units
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This will automatically create user accounts for all units that have an owner email configured but don't have an associated user yet.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">How it works:</h5>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Email from unit owner details will be used as username</li>
                  <li>• Flat/Unit number will be used as the default password</li>
                  <li>• Units without owner email will be skipped</li>
                  <li>• Units with existing users will be skipped</li>
                  <li>• All users will be created with MEMBER role</li>
                </ul>
              </div>

              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Users should change their password after first login
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowBulkCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const societyId = urlSocietyId || user?.societyId
                  if (!societyId) {
                    alert('Society ID is required')
                    return
                  }
                  bulkCreateFromUnitsMutation.mutate(societyId)
                }}
                disabled={bulkCreateFromUnitsMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {bulkCreateFromUnitsMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
