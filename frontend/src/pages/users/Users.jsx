import { useState, useRef, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { useToast } from '../../context'
import { userApi, societyApi, flatApi, employeeApi } from '../../../../api'
import { Plus, Edit, Trash2, Search, X, AlertCircle, Shield, Users as UsersIcon, Building2, Home, Upload, Download, UserPlus, FileSpreadsheet, CheckCircle, XCircle, Info, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { parseApiError, validateUserForm } from '../../utils'
import * as XLSX from 'xlsx'
import { FormInput, PhoneInput, SmartSelect, FormErrorSummary, PaginationControls } from '../../components'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, FiltersSkeleton, TableSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const roleColors = {
  MASTER_ADMIN: 'border border-violet-400/30 bg-violet-500/15 text-violet-200',
  SOCIETY_ADMIN: 'border border-blue-400/30 bg-blue-500/15 text-blue-200',
  CHAIRMAN: 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
  SECRETARY: 'border border-cyan-400/30 bg-cyan-500/15 text-cyan-200',
  TREASURER: 'border border-amber-400/30 bg-amber-500/15 text-amber-200',
  COMMITTEE: 'border border-purple-400/30 bg-purple-500/15 text-purple-200',
  MANAGER: 'border border-orange-400/30 bg-orange-500/15 text-orange-200',
  EMPLOYEE: 'border border-orange-300/30 bg-orange-400/15 text-orange-100',
  MEMBER: 'border border-slate-400/30 bg-slate-500/15 text-slate-200',
  TENANT: 'border border-pink-400/30 bg-pink-500/15 text-pink-200',
  VENDOR: 'border border-sky-400/30 bg-sky-500/15 text-sky-200',
  VISITOR: 'border border-red-400/30 bg-red-500/15 text-red-200',
}

const roleAccentColors = {
  MASTER_ADMIN: '#8b5cf6',
  SOCIETY_ADMIN: '#3b82f6',
  CHAIRMAN: '#10b981',
  SECRETARY: '#06b6d4',
  TREASURER: '#f59e0b',
  COMMITTEE: '#a855f7',
  MANAGER: '#f97316',
  EMPLOYEE: '#fb923c',
  MEMBER: '#94a3b8',
  TENANT: '#ec4899',
  VENDOR: '#0ea5e9',
  VISITOR: '#ef4444',
}

const EMPLOYEE_ID_PROOF_MAX_SIZE_BYTES = 5 * 1024 * 1024
const EMPLOYEE_ID_PROOF_ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const EMPLOYEE_ID_PROOF_ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp']

const formatFileSize = (bytes) => {
  const numericBytes = Number(bytes || 0)
  if (!numericBytes) return '0 B'
  if (numericBytes >= 1024 * 1024) return `${(numericBytes / (1024 * 1024)).toFixed(1)} MB`
  if (numericBytes >= 1024) return `${(numericBytes / 1024).toFixed(1)} KB`
  return `${numericBytes} B`
}

const validateEmployeeIdProofFile = (file) => {
  if (!file || !(file instanceof File) || file.size <= 0) {
    return { valid: true, message: '' }
  }

  if (file.size > EMPLOYEE_ID_PROOF_MAX_SIZE_BYTES) {
    return {
      valid: false,
      message: `File is too large. Maximum allowed size is ${formatFileSize(EMPLOYEE_ID_PROOF_MAX_SIZE_BYTES)}.`,
    }
  }

  const fileName = (file.name || '').toLowerCase()
  const extension = fileName.includes('.') ? fileName.split('.').pop() : ''
  const isMimeAllowed = EMPLOYEE_ID_PROOF_ALLOWED_MIME.includes((file.type || '').toLowerCase())
  const isExtensionAllowed = EMPLOYEE_ID_PROOF_ALLOWED_EXTENSIONS.includes(extension)

  if (!isMimeAllowed && !isExtensionAllowed) {
    return {
      valid: false,
      message: 'Unsupported file type. Allowed: PDF, JPG, JPEG, PNG, WEBP.',
    }
  }

  return {
    valid: true,
    message: `Selected: ${file.name} (${formatFileSize(file.size)})`,
  }
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
  const [createEmployeeProfile, setCreateEmployeeProfile] = useState(false)
  const [employeeIdProofFileFeedback, setEmployeeIdProofFileFeedback] = useState({
    type: '',
    message: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [usersPage, setUsersPage] = useState(1)
  const [usersPageSize, setUsersPageSize] = useState(12)
  
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
  
  // Check if current user is MASTER_ADMIN
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const canCreateEmployeeRecord = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER'].includes(user?.role)
  
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
    const initialRole = userToEdit?.role || (creatableRoles.length === 1 ? creatableRoles[0] : creatableRoles[0] || 'MEMBER')
    setEditingUser(userToEdit)
    setSelectedRole(initialRole)
    setCreateEmployeeProfile(!userToEdit && canCreateEmployeeRecord && initialRole === 'EMPLOYEE')
    setShowPassword(false)
    setShowModal(true)
  }

  const closeModal = (force = false) => {
    if (!force && (createMutation.isPending || updateMutation.isPending)) return
    setShowModal(false)
    setError('')
    setShowPassword(false)
    setCreateEmployeeProfile(false)
    setEmployeeIdProofFileFeedback({ type: '', message: '' })
  }

  const handleRoleChange = (event) => {
    const nextRole = event.target.value
    setSelectedRole(nextRole)
    if (editingUser) return
    if (nextRole === 'EMPLOYEE') {
      if (canCreateEmployeeRecord) {
        setCreateEmployeeProfile(true)
      }
      return
    }
    setCreateEmployeeProfile(false)
    setEmployeeIdProofFileFeedback({ type: '', message: '' })
  }

  const handleEmployeeIdProofFileChange = (event) => {
    const file = event.target.files?.[0]
    const result = validateEmployeeIdProofFile(file)
    setEmployeeIdProofFileFeedback({
      type: result.valid ? 'success' : 'error',
      message: result.message,
    })
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
    mutationFn: async ({ userData, employeeProfileData, employeeIdProofUpload }) => {
      const createdUserResponse = await userApi.create(userData)
      const createdUser = createdUserResponse?.data

      if (employeeProfileData && createdUser?.id) {
        const createdEmployeeResponse = await employeeApi.create({
          ...employeeProfileData,
          userId: createdUser.id,
        }, user?.id)

        const createdEmployee = createdEmployeeResponse?.data
        if (employeeIdProofUpload?.file && createdEmployee?.id) {
          await employeeApi.uploadIdProofDocument(
            createdEmployee.id,
            employeeIdProofUpload.file,
            user?.id,
            employeeIdProofUpload.idProofType,
            employeeIdProofUpload.idProofNumber,
          )
        }
      }

      return createdUserResponse
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['users'])
      queryClient.invalidateQueries(['employees'])
      closeModal(true)
      setEditingUser(null)
      toast.success(variables?.employeeProfileData ? 'User and employee profile created successfully' : 'User created successfully')
    },
    onError: (err) => {
      setError(parseApiError(err))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      closeModal(true)
      setEditingUser(null)
    },
    onError: (err) => {
      setError(parseApiError(err))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, force = false }) => userApi.delete(id, force),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['users'])
      toast.success(variables?.force ? 'User force-deleted successfully' : 'User deleted successfully')
    },
    onError: (err) => {
      toast.error(parseApiError(err))
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
        toast.error(parseApiError(forceError))
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

  // For MASTER_ADMIN, show SOCIETY_ADMIN and SOCIETY_ADMIN (their manageable users)
  // For SOCIETY_ADMIN, show only SOCIETY_ADMIN users in their org
  // UNLESS viewing a specific society from URL - then show all users in that society
  // For others, show all users they can see
  let displayUsers = users
  
  // Apply society filter from URL if present
  if (urlSocietyId) {
    displayUsers = displayUsers.filter(u => String(u.societyId) === urlSocietyId)
  } else if (user?.role === 'MASTER_ADMIN') {
    // Master Admin sees all Society Admins
    displayUsers = displayUsers.filter(u => u.role === 'SOCIETY_ADMIN')
  }

  const filteredUsers = displayUsers.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !filterRole || u.role === filterRole
    return matchesSearch && matchesRole
  })

  const paginatedUsers = useMemo(() => {
    const start = (usersPage - 1) * usersPageSize
    return filteredUsers.slice(start, start + usersPageSize)
  }, [filteredUsers, usersPage, usersPageSize])

  useEffect(() => {
    setUsersPage(1)
  }, [searchTerm, filterRole, urlSocietyId, urlRole])

  // Get society name for a user
  const getSocietyName = (societyId) => {
    const society = societies.find(s => s.id === societyId)
    return society?.name || 'No Society Assigned'
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const passwordValue = (formData.get('password') || '').toString().trim()
    
    // Use the single role if only one is available
    const roleValue = creatableRoles.length === 1 ? creatableRoles[0] : formData.get('role')
    
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      // Keep password optional on edit by omitting blank values.
      password: editingUser ? (passwordValue ? passwordValue : undefined) : passwordValue,
      role: roleValue,
      phone: formData.get('phone'),
      societyId: formData.get('societyId') ? parseInt(formData.get('societyId')) : null,
      flatId: formData.get('flatId') ? parseInt(formData.get('flatId')) : null,
    }

    // Frontend validation - Fix: use !!editingUser instead of !editingUser
    const validation = validateUserForm(data, !!editingUser)
    if (!validation.isValid) {
      setError(Object.values(validation.errors).join(', '))
      return
    }

    // Validate societyId is required for SOCIETY_ADMIN creation (by MASTER_ADMIN or SOCIETY_ADMIN)
    if ((user?.role === 'MASTER_ADMIN') && roleValue === 'SOCIETY_ADMIN' && !data.societyId) {
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
      let employeeProfileData = null
      let employeeIdProofUpload = null
      const shouldCreateEmployeeProfile = roleValue === 'EMPLOYEE' && createEmployeeProfile

      if (shouldCreateEmployeeProfile) {
        const targetSocietyId = data.societyId || user?.societyId || (urlSocietyId ? parseInt(urlSocietyId) : null)
        if (!targetSocietyId) {
          setError('Society is required to create an employee profile. Open Users with a society context or assign a society first.')
          return
        }

        const department = (formData.get('employeeDepartment') || '').toString().trim()
        const designation = (formData.get('employeeDesignation') || '').toString().trim()
        const joiningDate = (formData.get('employeeJoiningDate') || '').toString().trim()
        const monthlySalaryRaw = (formData.get('employeeMonthlySalary') || '').toString().trim()

        if (!department || !designation) {
          setError('Department and designation are required to create the employee profile.')
          return
        }

        employeeProfileData = {
          societyId: targetSocietyId,
          department,
          designation,
          employeeCode: (formData.get('employeeCode') || '').toString().trim() || undefined,
          joiningDate: joiningDate || undefined,
          monthlySalary: monthlySalaryRaw ? Number(monthlySalaryRaw) : undefined,
          employmentType: (formData.get('employeeEmploymentType') || '').toString().trim() || undefined,
          shiftTiming: (formData.get('employeeShiftTiming') || '').toString().trim() || undefined,
          notes: (formData.get('employeeNotes') || '').toString().trim() || undefined,
        }

        const idProofType = (formData.get('employeeIdProofType') || '').toString().trim()
        const idProofNumber = (formData.get('employeeIdProofNumber') || '').toString().trim()
        const idProofFile = formData.get('employeeIdProofFile')

        if (idProofFile && idProofFile instanceof File && idProofFile.size > 0) {
          const idProofValidation = validateEmployeeIdProofFile(idProofFile)
          if (!idProofValidation.valid) {
            setError(idProofValidation.message)
            return
          }

          employeeIdProofUpload = {
            file: idProofFile,
            idProofType: idProofType || undefined,
            idProofNumber: idProofNumber || undefined,
          }
        }
      }

      createMutation.mutate({ userData: data, employeeProfileData, employeeIdProofUpload })
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
    if (user?.role === 'MASTER_ADMIN') {
      return 'Manage Users'
    }
    if (user?.role === 'SOCIETY_ADMIN') {
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
    if (user?.role === 'MASTER_ADMIN') {
      return 'Manage society administrators'
    }
    if (user?.role === 'SOCIETY_ADMIN') {
      return 'Manage society administrators'
    }
    return 'Manage system users and roles'
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (!hasUserManagementPermission) {
    return <PermissionDenied message="You don't have permission to manage users" />
  }

  if (showSkeleton) return (
    <div className="min-h-[calc(100vh-68px)] bg-[var(--bg-secondary)] px-6 pb-12 pt-7 text-[var(--text-primary)]">
      <WakeUpBanner />
      <HeroSkeleton statCount={0} />
      <FiltersSkeleton filterCount={3} />
      <TableSkeleton rows={10} cols={6} />
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[var(--bg-secondary)] px-6 pb-12 pt-7 text-[var(--text-primary)]">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[28px] font-bold text-[var(--text-primary)]">
            {getPageTitle()}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            {getPageDescription()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
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
                className="inline-flex items-center gap-2.5 rounded-xl border border-transparent bg-green-600 px-3.5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-green-700"
              >
                <Upload size={18} />
                Import Excel
              </button>
              <button
                onClick={() => setShowBulkCreateModal(true)}
                className="inline-flex items-center gap-2.5 rounded-xl border border-transparent bg-violet-600 px-3.5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-violet-700"
              >
                <UserPlus size={18} />
                Auto-Create Users
              </button>
            </>
          ) : null}
          {creatableRoles.length > 0 && (
            <button
              onClick={() => handleOpenModal(null)}
              className="inline-flex items-center gap-2.5 rounded-xl border border-transparent bg-blue-600 px-3.5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={20} />
              {urlRole === 'SOCIETY_ADMIN' ? 'Add Society Admin' : isPlatformLevel && !urlSocietyId ? 'Create User' : 'Add User'}
            </button>
          )}
        </div>
      </div>

      {/* Role Permissions Info */}
      {!['MASTER_ADMIN', 'SOCIETY_ADMIN'].includes(user?.role) && (
        <div className="mb-6 rounded-2xl border border-[color-mix(in_srgb,var(--accent-primary)_20%,var(--border-light))] bg-[color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-tertiary))] p-4">
          <div className="flex items-start gap-3">
            <Shield className="text-[var(--accent-primary)]" size={20} />
            <div>
              <h3 className="m-0 text-sm font-semibold text-[var(--text-primary)]">Your Permissions ({user?.role?.replace('_', ' ')})</h3>
              <p className="mt-1.5 text-[13px] text-[var(--text-secondary)]">
                Access scope is based on your current role and society assignment.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2.5 text-xs">
                {creatableRoles.length > 0 && (
                  <div>
                    <span className="font-semibold text-[var(--accent-primary)]">Can create:</span>{' '}
                    <span className="text-[var(--text-primary)]">
                      {creatableRoles.map(r => r.replace('_', ' ')).join(', ')}
                    </span>
                  </div>
                )}
                {updatableRoles.length > 0 && creatableRoles.length > 0 && (
                  <span className="text-[var(--text-tertiary)]">|</span>
                )}
                {updatableRoles.length > 0 && (
                  <div>
                    <span className="font-semibold text-[var(--accent-primary)]">Can edit/delete:</span>{' '}
                    <span className="text-[var(--text-primary)]">
                      {updatableRoles.map(r => r.replace('_', ' ')).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3.5 py-2.5 pl-10 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.2)]"
            />
          </div>
          {/* Show role filter when there are manageable roles */}
          {updatableRoles.length > 0 && user?.role !== 'SOCIETY_ADMIN' && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
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

      {/* MASTER_ADMIN sees user cards with navigation (unless viewing specific society) */}
      {isPlatformLevel && !urlSocietyId ? (
        <div className="flex flex-col gap-4">
          <h2 className="m-0 flex items-center gap-2.5 text-base font-bold text-[var(--text-primary)]">
            <UsersIcon size={20} />
            Society Administrators
            <span className="text-[13px] font-medium text-[var(--text-tertiary)]">({filteredUsers.length})</span>
          </h2>
          
          {filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-8 text-center">
              <UsersIcon className="mb-3 text-[#4b5563]" size={48} />
              <p className="m-0 text-[var(--text-secondary)]">No users found</p>
              <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">Create a new Society Admin to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
              {paginatedUsers.map((u) => {
                const canEdit = updatableRoles.includes(u.role)
                const canDelete = u.role !== 'MASTER_ADMIN' && updatableRoles.includes(u.role)
                const societyName = getSocietyName(u.societyId)
                
                return (
                  <div key={u.id} className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-3.5 shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition-all hover:border-[var(--border-default)] hover:shadow-[0_6px_14px_rgba(15,23,42,0.1)]">
                    {/* Card Header */}
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[13px] font-bold text-white">
                          <span>
                            {u.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="m-0 break-words text-[15px] font-bold leading-tight text-[var(--text-primary)]">{u.name}</h3>
                          <p className="mt-0.5 max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--text-tertiary)]">{u.email}</p>
                        </div>
                      </div>
                      <span className={clsx('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]', roleColors[u.role] || 'border border-slate-400/30 bg-slate-500/15 text-slate-200')}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* Society Info */}
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-[var(--bg-tertiary)] px-2.5 py-2">
                      <Building2 size={16} />
                      <span className="flex-1 text-xs text-[var(--text-secondary)]">{societyName}</span>
                    </div>
                    
                    {/* Phone */}
                    {u.phone && (
                      <p className="mb-2.5 mt-0 text-xs text-[var(--text-tertiary)]">
                        📞 {u.phone}
                      </p>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 border-t border-[var(--border-light)] pt-2.5">
                      {u.societyId ? (
                        <button
                          onClick={() => navigate(`/dashboard?society=${encodeURIComponent(u.societyId)}`)}
                          className="inline-flex min-h-[34px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-blue-500/15 px-2.5 py-1.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/25"
                        >
                          <Building2 size={16} />
                          View Society
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex min-h-[34px] flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-transparent bg-blue-500/15 px-2.5 py-1.5 text-xs font-semibold text-blue-300 opacity-60"
                          title="No society assigned"
                        >
                          <Building2 size={16} />
                          No Society
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] p-0 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-secondary)] hover:text-blue-500"
                          title="Edit user"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => confirmAndDeleteUser(u, { societyName })}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] p-0 text-[var(--text-tertiary)] transition hover:bg-red-500/10 hover:text-red-500"
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
      /* Card-row view for non-MASTER_ADMIN users */
      <div className="flex flex-col gap-0">
        {(
          <>
          {/* Column labels */}
          <div className="mb-1.5 hidden h-10 grid-cols-[minmax(180px,1.4fr)_minmax(160px,1.3fr)_120px_140px_130px_90px] items-center px-[18px] pl-[30px] text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)] lg:grid">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Property</span>
            <span>Phone</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-1.5">
            {paginatedUsers.map((u) => {
              const canEdit = u.id === user?.id || updatableRoles.includes(u.role)
              const canDelete = u.role !== 'MASTER_ADMIN' && updatableRoles.includes(u.role)
              const isSelf = u.id === user?.id
              const userFlat = flats.find(f => f.id === u.flatId)
              const accentColor = roleAccentColors[u.role] || 'var(--role-member)'

              return (
              <div key={u.id} className="relative grid min-h-[58px] grid-cols-1 gap-2 overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-3 pl-5 transition-all hover:-translate-y-0.5 hover:border-[var(--border-default)] hover:bg-[color-mix(in_srgb,var(--bg-card),var(--text-primary)_2%)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] lg:grid-cols-[minmax(180px,1.4fr)_minmax(160px,1.3fr)_120px_140px_130px_90px] lg:items-center lg:gap-x-3 lg:px-[18px] lg:py-[14px] lg:pl-[30px]" style={{ '--row-accent': accentColor }}>
                <div className="absolute bottom-2 left-0 top-2 w-1 rounded-r-[3px] bg-[var(--row-accent)] opacity-80" />
                <div className="flex min-w-0 items-center">
                  <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[var(--border-light)] bg-[var(--bg-tertiary)] text-sm font-bold text-[var(--text-primary)]">
                    {u.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-semibold text-[var(--text-primary)]">{u.name}</span>
                    {isSelf && <span className="inline-flex shrink-0 items-center rounded-full border border-[var(--border-light)] bg-[var(--bg-tertiary)] px-2 py-0.5 text-[10px] font-bold tracking-[0.03em] text-[var(--text-primary)]">You</span>}
                  </div>
                </div>

                <div className="flex min-w-0 items-center">
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[12.5px] tracking-[-0.01em] text-[var(--text-secondary)]">{u.email}</span>
                </div>

                <div className="flex min-w-0 items-center">
                  <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]', roleColors[u.role] || 'border border-slate-400/30 bg-slate-500/15 text-slate-200')}>
                    <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: accentColor }} />
                    {u.role?.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex min-w-0 items-center lg:justify-end">
                  {userFlat ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-tertiary)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                      <Home size={13} />
                      <span>{userFlat.flatNumber}</span>
                      {userFlat.wingName && <span className="text-[10.5px] font-medium text-[var(--text-tertiary)]">{userFlat.wingName}</span>}
                    </span>
                  ) : (
                    <span className="text-sm text-[var(--text-muted)]">—</span>
                  )}
                </div>

                <div className="flex min-w-0 items-center">
                  <span className="text-[12.5px] text-[var(--text-secondary)]">{u.phone || '—'}</span>
                </div>

                <div className="flex min-w-0 items-center lg:justify-end">
                  <div className="inline-flex items-center gap-0.5 rounded-[10px] border border-transparent p-[3px] transition-all hover:border-[var(--border-light)] hover:bg-[var(--bg-tertiary)]">
                    {canEdit ? (
                      <button onClick={() => handleOpenModal(u)} className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border-none bg-transparent text-[var(--text-tertiary)] transition hover:bg-black/5 hover:text-[var(--text-primary)]" title={isSelf ? 'Edit your profile' : 'Edit user'}>
                        <Edit size={15} />
                      </button>
                    ) : (
                      <button disabled className="inline-flex h-[30px] w-[30px] cursor-not-allowed items-center justify-center rounded-[7px] border-none bg-transparent text-[var(--text-muted)] opacity-40" title="No permission to edit">
                        <Edit size={15} />
                      </button>
                    )}
                    {canDelete ? (
                      <button
                        onClick={() => confirmAndDeleteUser(u, { userFlat, property: userFlat?.flatNumber || 'Unassigned' })}
                        className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border-none bg-transparent text-[var(--text-tertiary)] transition hover:bg-red-500/10 hover:text-red-500"
                        title="Delete user"
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : (
                      <button disabled className="inline-flex h-[30px] w-[30px] cursor-not-allowed items-center justify-center rounded-[7px] border-none bg-transparent text-[var(--text-muted)] opacity-40" title={isSelf ? 'Cannot delete yourself' : 'No permission'}>
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

      <PaginationControls
        totalItems={filteredUsers.length}
        currentPage={usersPage}
        pageSize={usersPageSize}
        onPageChange={setUsersPage}
        onPageSizeChange={(nextSize) => {
          setUsersPageSize(nextSize)
          setUsersPage(1)
        }}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-[560px] overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{editingUser ? 'Edit User' : 'Add User'}</h3>
              <button onClick={closeModal} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[var(--text-tertiary)] transition hover:border-[var(--border-light)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="max-h-[calc(90vh-70px)] space-y-4 overflow-y-auto px-5 py-4">
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
              <div className="relative">
                <FormInput
                  label={editingUser ? 'New Password (optional)' : 'Password'}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required={!editingUser}
                  placeholder={editingUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                />
                <button
                  type="button"
                  className="absolute right-3 top-[35px] inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-[var(--text-tertiary)] transition hover:border-[var(--border-light)] hover:bg-[var(--bg-tertiary)]"
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
                onChange={handleRoleChange}
                options={creatableRoles.map(role => ({ value: role, label: role.replace('_', ' ') }))}
                required
                icon={Shield}
                emptyMessage="No roles available to create"
              />
              {(user?.role === 'MASTER_ADMIN') && (selectedRole || editingUser?.role) === 'SOCIETY_ADMIN' && (
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
              {!editingUser && (selectedRole || creatableRoles[0]) === 'EMPLOYEE' && (
                <div className="space-y-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)] p-3.5">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      name="createEmployeeProfile"
                      checked={createEmployeeProfile}
                      onChange={(e) => setCreateEmployeeProfile(e.target.checked)}
                      disabled={!canCreateEmployeeRecord}
                      className="h-4 w-4 rounded border-[var(--border-default)]"
                    />
                    Create employee HR profile now
                  </label>
                  {!canCreateEmployeeRecord && (
                    <p className="text-xs text-[var(--text-tertiary)]">
                      You can create the user here, but only Admin/Management roles can create the employee HR profile from Employees page.
                    </p>
                  )}
                  {createEmployeeProfile && canCreateEmployeeRecord && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <FormInput
                        label="Department"
                        name="employeeDepartment"
                        required
                        placeholder="Housekeeping, Security, Maintenance"
                      />
                      <FormInput
                        label="Designation"
                        name="employeeDesignation"
                        required
                        placeholder="Guard, Cleaner, Technician"
                      />
                      <FormInput
                        label="Employee Code"
                        name="employeeCode"
                        placeholder="EMP-001"
                      />
                      <FormInput
                        label="Joining Date"
                        name="employeeJoiningDate"
                        type="date"
                      />
                      <FormInput
                        label="Monthly Salary"
                        name="employeeMonthlySalary"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="25000"
                      />
                      <FormInput
                        label="Employment Type"
                        name="employeeEmploymentType"
                        placeholder="FULL_TIME / PART_TIME / CONTRACT"
                      />
                      <div className="sm:col-span-2">
                        <FormInput
                          label="Shift Timing"
                          name="employeeShiftTiming"
                          placeholder="09:00-17:00"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <FormInput
                          label="Notes"
                          name="employeeNotes"
                          placeholder="Optional notes"
                        />
                      </div>
                      <FormInput
                        label="ID Proof Type"
                        name="employeeIdProofType"
                        placeholder="Aadhaar / PAN / Passport"
                      />
                      <FormInput
                        label="ID Proof Number"
                        name="employeeIdProofNumber"
                        placeholder="Document number"
                      />
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">ID Proof File (optional)</label>
                        <input
                          type="file"
                          name="employeeIdProofFile"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={handleEmployeeIdProofFileChange}
                          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--bg-tertiary)] file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--text-secondary)]"
                        />
                        {employeeIdProofFileFeedback.message && (
                          <p
                            className={clsx(
                              'mt-1 text-xs',
                              employeeIdProofFileFeedback.type === 'error' ? 'text-red-500' : 'text-emerald-500',
                            )}
                          >
                            {employeeIdProofFileFeedback.message}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                          Allowed: PDF, JPG, JPEG, PNG, WEBP. Max size: {formatFileSize(EMPLOYEE_ID_PROOF_MAX_SIZE_BYTES)}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-2 flex justify-end gap-2 border-t border-[var(--border-light)] pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatableRoles.length === 0 && !editingUser}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-emerald-500 bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-[900px] overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Bulk Import Users</h3>
              <button 
                onClick={() => {
                  setShowBulkImportModal(false)
                  setBulkImportFile(null)
                  setBulkImportPreview(null)
                  setBulkImportError('')
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[var(--text-tertiary)] transition hover:border-[var(--border-light)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="max-h-[calc(90vh-150px)] space-y-4 overflow-y-auto px-5 py-4">
              {/* Error Message */}
              {bulkImportError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300">
                  <AlertCircle size={18} />
                  {bulkImportError}
                </div>
              )}

              {/* Step 1: File Upload */}
              {!bulkImportPreview && (
                <>
                  <div
                    className={clsx(
                      'rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-tertiary)] p-6 text-center transition',
                      isDragOver && 'border-emerald-500 bg-emerald-500/10'
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
                      <div className="flex items-center gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] p-3 text-left">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                          <FileSpreadsheet size={24} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{bulkImportFile.name}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">{(bulkImportFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          onClick={() => setBulkImportFile(null)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-[var(--text-tertiary)] transition hover:border-[var(--border-light)] hover:bg-[var(--bg-tertiary)]"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={48} className="mx-auto mb-3 text-[var(--text-tertiary)]" />
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          Drag and drop your Excel file here, or click to browse
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">Supported format: .xlsx, .xls</p>
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
                          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-500 bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-600"
                        >
                          <Upload size={18} />
                          Select File
                        </button>
                      </label>
                    )}
                  </div>

                  {/* Format Requirements with attractive styling */}
                  <div className="space-y-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                        <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
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
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                      >
                        <Download size={16} />
                        Download Template
                      </button>
                    </div>
                    <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                      <li className="flex items-start gap-2">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-500/20 text-[11px] font-bold text-slate-200">A</span>
                        <span><strong>Name</strong> (required) - Full name of the user</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-500/20 text-[11px] font-bold text-slate-200">B</span>
                        <span><strong>Email</strong> (required) - Used as username</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-500/20 text-[11px] font-bold text-slate-200">C</span>
                        <span><strong>Flat Number</strong> - Required for unit owners. Supports comma-separated for multiple units (e.g., "A-101, S-001")</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-500/20 text-[11px] font-bold text-slate-200">D</span>
                        <span><strong>Phone</strong> (optional) - Contact number</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-500/20 text-[11px] font-bold text-slate-200">E</span>
                        <span><strong>Role</strong> (optional) - Default: MEMBER</span>
                      </li>
                    </ul>
                    {/* Role-Unit Type Rules */}
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Role & Unit Type Rules:</p>
                      <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className={clsx(
                      'rounded-xl border p-4',
                      bulkImportPreview.successCount > 0 ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-[var(--border-light)] bg-[var(--bg-tertiary)]'
                    )}>
                      <div className="text-2xl font-bold text-[var(--text-primary)]">
                        {bulkImportPreview.successCount}
                      </div>
                      <div className="text-xs uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                        Valid
                      </div>
                    </div>
                    <div className={clsx(
                      'rounded-xl border p-4',
                      bulkImportPreview.failureCount > 0 ? 'border-red-500/40 bg-red-500/10' : 'border-[var(--border-light)] bg-[var(--bg-tertiary)]'
                    )}>
                      <div className="text-2xl font-bold text-[var(--text-primary)]">
                        {bulkImportPreview.failureCount}
                      </div>
                      <div className="text-xs uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                        {bulkImportPreview.failureCount > 0 ? 'Needs Fixing' : 'Invalid'}
                      </div>
                    </div>
                  </div>

                  {/* Results Table */}
                  <div className="overflow-x-auto rounded-xl border border-[var(--border-light)]">
                    <table className="min-w-full border-collapse bg-[var(--bg-card)]">
                      <thead>
                        <tr className="bg-[var(--bg-tertiary)] text-left text-[11px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                          <th className="px-3 py-2">Row</th>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Email</th>
                          <th className="px-3 py-2">Flat</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkImportPreview.results?.map((row, idx) => (
                          <tr 
                            key={idx}
                            className={clsx('border-t border-[var(--border-light)] text-sm', !row.success && 'bg-red-500/5')}
                          >
                            <td className="px-3 py-2">{row.rowNumber}</td>
                            <td className="px-3 py-2">{row.name || '-'}</td>
                            <td className="px-3 py-2">{row.email || '-'}</td>
                            <td className="px-3 py-2">{row.flatNumber || '-'}</td>
                            <td className="px-3 py-2">
                              {row.success ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                                  Valid
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-300">{row.errorMessage}</span>
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
            <div className="border-t border-[var(--border-light)] px-5 py-4">
              {!bulkImportPreview ? (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowBulkImportModal(false)
                      setBulkImportFile(null)
                      setBulkImportPreview(null)
                      setBulkImportError('')
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
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
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-500 bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {validateBulkImportMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></div>
                        Validating...
                      </>
                    ) : (
                      <>
                        <Eye size={18} /> Preview & Validate
                      </>
                    )}
                  </button>
                </div>
              ) : bulkImportPreview.failureCount > 0 ? (
                // Show error state with appropriate message
                bulkImportPreview.failureCount === bulkImportPreview.totalRows ? (
                  // All rows invalid - wrong file format
                  <div className="space-y-3">
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-red-300">
                          <AlertCircle size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-red-200">
                            Invalid File Format
                          </h4>
                          <p className="mt-1 text-sm text-red-100/90">
                            The uploaded Excel file does not match the required format. Please ensure you are using the correct template with columns: <strong>Name, Email, Flat Number, Phone, Role</strong>.
                          </p>
                          <p className="mt-1 text-sm text-red-100/90">
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
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                    >
                      <Upload size={18} />
                      Upload Correct File
                    </button>
                    <button
                      onClick={downloadUsersBulkErrorReport}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/15 px-4 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/25"
                    >
                      <Download size={18} />
                      Download Error Report
                    </button>
                  </div>
                ) : (
                  // Some rows have errors
                  <div className="space-y-3">
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-amber-300">
                          <AlertCircle size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-amber-200">
                            Please Fix {bulkImportPreview.failureCount} Error{bulkImportPreview.failureCount > 1 ? 's' : ''} Before Import
                          </h4>
                          <p className="mt-1 text-sm text-amber-100/90">
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
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                    >
                      <Upload size={18} />
                      Fix & Re-upload Excel
                    </button>
                    <button
                      onClick={downloadUsersBulkErrorReport}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/15 px-4 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/25"
                    >
                      <Download size={18} />
                      Download Error Report
                    </button>
                  </div>
                )
              ) : (
                // All valid - show import button
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setBulkImportFile(null)
                      setBulkImportPreview(null)
                      setBulkImportError('')
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      const societyId = urlSocietyId || user?.societyId
                      processBulkImportMutation.mutate({ file: bulkImportFile, societyId })
                    }}
                    disabled={processBulkImportMutation.isPending}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-500 bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processBulkImportMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[720px] overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Create Users in Bulk</h3>
              <button 
                onClick={() => setShowBulkCreateModal(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[var(--text-tertiary)] transition hover:border-[var(--border-light)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 px-5 py-4">
              <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)] p-4 text-center">
                <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                  <UserPlus size={32} />
                </div>
                <h4 className="text-base font-semibold text-[var(--text-primary)]">
                  Create Users for All Units
                </h4>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  This will automatically create user accounts for all units that have an owner email configured but don't have an associated user yet.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)] p-4">
                <h5 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">How it works:</h5>
                <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                  <li>• Email from unit owner details will be used as username</li>
                  <li>• Flat/Unit number will be used as the default password</li>
                  <li>• Units without owner email will be skipped</li>
                  <li>• Units with existing users will be skipped</li>
                  <li>• All users will be created with MEMBER role</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                <Info size={18} />
                <p>
                  Users should change their password after first login
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--border-light)] px-5 py-4">
              <button
                type="button"
                onClick={() => setShowBulkCreateModal(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
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
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-500 bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bulkCreateFromUnitsMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></div>
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
