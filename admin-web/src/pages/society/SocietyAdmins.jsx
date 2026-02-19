import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context'
import { useToast } from '../../context'
import { useConfirmDialog } from '../../context'
import { societyApi, userApi } from '../../../../api'
import { parseApiError } from '../../utils'
import * as XLSX from 'xlsx'
import {
  FormInput, PhoneInput, PincodeInput, NumberInput,
  StateCitySelector, SmartSelect, AsyncButton
} from '../../components'
import { BulkImportModal } from '../../components'
import { FiltersSkeleton, CardGridSkeleton, HeroSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import {
  UserCheck, Plus, Edit, Trash2, Search, X, Building2,
  Eye, EyeOff, Mail, Phone, MapPin, Shield, ChevronRight,
  Home, Store, Layers, User, Upload
} from 'lucide-react'
import '../../styles/pages/society-admins.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PINCODE_REGEX = /^\d{6}$/

const BULK_FIELD_CONFIG = [
  { key: 'adminName', label: 'Admin Name', required: true, description: 'Full name of society admin', sample: 'Rahul Sharma', aliases: ['adminname', 'admin_name'] },
  { key: 'adminEmail', label: 'Admin Email', required: true, description: 'Login email for admin account', sample: 'rahul.sharma@example.com', aliases: ['adminemail', 'admin_email'] },
  { key: 'adminPassword', label: 'Admin Password', required: true, description: 'Minimum 6 characters', sample: 'Admin@123', aliases: ['adminpassword', 'admin_password'] },
  { key: 'adminPhone', label: 'Admin Phone', required: true, description: '10-digit Indian mobile number', sample: '9876543210', aliases: ['adminphone', 'admin_phone'] },
  { key: 'societyName', label: 'Society Name', required: true, description: 'Name of the new society', sample: 'Green Heights CHS', aliases: ['societyname', 'society_name'] },
  { key: 'address', label: 'Address', required: true, description: 'Complete society address', sample: 'Plot 18, Sector 7, Nerul', aliases: ['address'] },
  { key: 'state', label: 'State', required: true, description: 'State name', sample: 'Maharashtra', aliases: ['state'] },
  { key: 'city', label: 'City', required: true, description: 'City name', sample: 'Mumbai', aliases: ['city'] },
  { key: 'pincode', label: 'Pincode', required: true, description: '6-digit postal code', sample: '400001', aliases: ['pincode', 'pin', 'postalcode', 'postal_code'] },
  { key: 'registrationNumber', label: 'Registration Number', required: true, description: 'Unique society registration number', sample: 'MH-REG-2026-001', aliases: ['registrationnumber', 'registration_number', 'registrationno', 'registration_no'] },
  { key: 'societyEmail', label: 'Society Email', required: true, description: 'Official society email', sample: 'contact@greenheights.in', aliases: ['societyemail', 'society_email'] },
  { key: 'societyPhone', label: 'Society Phone', required: true, description: '10-digit contact mobile number', sample: '9988776655', aliases: ['societyphone', 'society_phone', 'telephone'] },
  { key: 'totalFlats', label: 'Flats', required: true, description: 'Total flat count (0 or more)', sample: '120', aliases: ['flats', 'totalflats', 'total_flats'] },
  { key: 'totalShops', label: 'Shops', required: true, description: 'Total shop count (0 or more)', sample: '8', aliases: ['shops', 'totalshops', 'total_shops'] },
  { key: 'totalOffices', label: 'Offices', required: true, description: 'Total office count (0 or more)', sample: '5', aliases: ['offices', 'totaloffices', 'total_offices'] },
  { key: 'totalWings', label: 'Wings', required: true, description: 'Total wing count (0 or more)', sample: '3', aliases: ['wings', 'totalwings', 'total_wings'] },
]

const normalizeHeader = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const normalizeText = (value) => String(value ?? '').trim()
const normalizePhone = (value) => normalizeText(value).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
const isBlankRow = (row = []) => row.every((cell) => normalizeText(cell) === '')
const createApiError = (message) => ({ response: { data: { message } } })

const getHeaderIndexMap = (headerRow) => {
  const normalizedHeaders = headerRow.map((header) => normalizeHeader(header))
  const headerIndex = {}
  BULK_FIELD_CONFIG.forEach((field) => {
    const aliases = [field.label, ...field.aliases].map(normalizeHeader)
    const matchedIndex = normalizedHeaders.findIndex((header) => aliases.includes(header))
    if (matchedIndex >= 0) {
      headerIndex[field.key] = matchedIndex
    }
  })
  return headerIndex
}

const parseWorkbookRows = async (file) => {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames?.[0]
  if (!firstSheetName) {
    return { rows: [], missingHeaders: BULK_FIELD_CONFIG.filter((field) => field.required).map((field) => field.label) }
  }

  const sheet = workbook.Sheets[firstSheetName]
  const sheetRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (!sheetRows.length) {
    return { rows: [], missingHeaders: BULK_FIELD_CONFIG.filter((field) => field.required).map((field) => field.label) }
  }

  const [headerRow, ...dataRows] = sheetRows
  const headerIndex = getHeaderIndexMap(headerRow)

  const missingHeaders = BULK_FIELD_CONFIG
    .filter((field) => field.required && headerIndex[field.key] === undefined)
    .map((field) => field.label)

  const rows = dataRows
    .map((cells, idx) => {
      if (isBlankRow(cells)) return null
      const rowData = {
        rowNumber: idx + 2,
      }
      BULK_FIELD_CONFIG.forEach((field) => {
        const value = headerIndex[field.key] !== undefined ? cells[headerIndex[field.key]] : ''
        rowData[field.key] = normalizeText(value)
      })
      return rowData
    })
    .filter(Boolean)

  return { rows, missingHeaders }
}

const validateBulkRows = ({ rows, isPlatformOwner, existingAdminEmails, existingSocietyEmails, existingRegistrationNumbers }) => {
  const seenEmails = new Set()
  const seenRegistrationNumbers = new Set()

  const results = rows.map((row) => {
    const errors = []

    const requiredFields = [
      'adminName', 'adminEmail', 'adminPassword', 'adminPhone',
      'societyName', 'address', 'state', 'city', 'pincode',
      'registrationNumber', 'societyEmail', 'societyPhone',
      'totalFlats', 'totalShops', 'totalOffices', 'totalWings',
    ]

    requiredFields.forEach((fieldKey) => {
      if (!normalizeText(row[fieldKey])) {
        const fieldLabel = BULK_FIELD_CONFIG.find((field) => field.key === fieldKey)?.label || fieldKey
        errors.push(`${fieldLabel} is required`)
      }
    })

    const adminEmail = normalizeText(row.adminEmail).toLowerCase()
    const societyEmail = normalizeText(row.societyEmail).toLowerCase()
    const registrationNumber = normalizeText(row.registrationNumber).toLowerCase()
    const adminPhone = normalizePhone(row.adminPhone)
    const societyPhone = normalizePhone(row.societyPhone)

    if (adminEmail && !EMAIL_REGEX.test(adminEmail)) {
      errors.push('Invalid admin email format')
    }

    if (societyEmail && !EMAIL_REGEX.test(societyEmail)) {
      errors.push('Invalid society email format')
    }

    if (normalizeText(row.adminPassword).length > 0 && normalizeText(row.adminPassword).length < 6) {
      errors.push('Admin password must be at least 6 characters')
    }

    if (adminPhone && !/^[6-9]\d{9}$/.test(adminPhone)) {
      errors.push('Admin phone must be a valid 10-digit Indian mobile number')
    }

    if (societyPhone && !/^[6-9]\d{9}$/.test(societyPhone)) {
      errors.push('Society phone must be a valid 10-digit Indian mobile number')
    }

    if (normalizeText(row.pincode) && !PINCODE_REGEX.test(normalizeText(row.pincode))) {
      errors.push('Pincode must be exactly 6 digits')
    }

    const numericFields = ['totalFlats', 'totalShops', 'totalOffices', 'totalWings']
    const parsedNumbers = {}
    numericFields.forEach((field) => {
      const raw = normalizeText(row[field])
      const parsed = Number(raw)
      if (!Number.isInteger(parsed) || parsed < 0) {
        const fieldLabel = BULK_FIELD_CONFIG.find((item) => item.key === field)?.label || field
        errors.push(`${fieldLabel} must be a whole number greater than or equal to 0`)
      } else {
        parsedNumbers[field] = parsed
      }
    })

    if (adminEmail) {
      if (seenEmails.has(adminEmail)) {
        errors.push('Duplicate admin email in uploaded file')
      } else {
        seenEmails.add(adminEmail)
      }

      if (existingAdminEmails.has(adminEmail)) {
        errors.push('Admin email already exists')
      }
    }

    if (registrationNumber) {
      if (seenRegistrationNumbers.has(registrationNumber)) {
        errors.push('Duplicate registration number in uploaded file')
      } else {
        seenRegistrationNumbers.add(registrationNumber)
      }

      if (existingRegistrationNumbers.has(registrationNumber)) {
        errors.push('Society registration number already exists')
      }
    }

    if (societyEmail && existingSocietyEmails.has(societyEmail)) {
      errors.push('Society email already exists')
    }

    const normalizedRow = {
      adminName: normalizeText(row.adminName),
      adminEmail,
      adminPassword: normalizeText(row.adminPassword),
      adminPhone,
      societyName: normalizeText(row.societyName),
      address: normalizeText(row.address),
      state: normalizeText(row.state),
      city: normalizeText(row.city),
      pincode: normalizeText(row.pincode),
      registrationNumber: normalizeText(row.registrationNumber),
      societyEmail,
      societyPhone,
      totalFlats: parsedNumbers.totalFlats,
      totalShops: parsedNumbers.totalShops,
      totalOffices: parsedNumbers.totalOffices,
      totalWings: parsedNumbers.totalWings,
    }

    return {
      rowNumber: row.rowNumber,
      adminName: normalizedRow.adminName,
      adminEmail: normalizedRow.adminEmail,
      societyName: normalizedRow.societyName,
      success: errors.length === 0,
      errorMessage: errors.join(', '),
      normalizedRow,
    }
  })

  const successCount = results.filter((result) => result.success).length
  return {
    totalRows: rows.length,
    successCount,
    failureCount: rows.length - successCount,
    results,
  }
}

const buildTemplateWorkbook = () => {
  const headers = BULK_FIELD_CONFIG.map((field) => field.label)
  const sampleRow = BULK_FIELD_CONFIG.map((field) => field.sample)
  const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SocietyAdminImport')
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export default function SocietyAdmins() {
  const { user } = useAuth()
  const confirmDialog = useConfirmDialog()
  const isPlatformOwner = user?.role === 'MASTER_ADMIN'
  const isOrgOwner = user?.role === 'SOCIETY_ADMIN'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [showModal, setShowModal] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [bulkImportFailedRows, setBulkImportFailedRows] = useState([])
  const [assignmentSociety, setAssignmentSociety] = useState(null)
  const [adminFilter, setAdminFilter] = useState('all')
  const [deletingSocietyId, setDeletingSocietyId] = useState(null)

  // Fetch all users, filter to SOCIETY_ADMIN
  const { data: allUsers = [], isLoading: usersLoading, isError: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll().then(res => res.data),
  })

  // Fetch all societies
  const { data: societies = [] } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data).catch(() => []),
    placeholderData: [],
  })

  const societyAdmins = useMemo(() =>
    allUsers.filter(u => u.role === 'SOCIETY_ADMIN'),
    [allUsers]
  )

  const assignedSocietyIds = useMemo(
    () => new Set(societyAdmins.map((admin) => admin.societyId).filter(Boolean)),
    [societyAdmins]
  )

  const societiesNeedingAssignment = useMemo(
    () => societies.filter((society) => !assignedSocietyIds.has(society.id)),
    [societies, assignedSocietyIds]
  )

  // Build a map of societyId to society data for quick lookup
  const societyMap = useMemo(() => {
    const map = {}
    societies.forEach(s => { map[s.id] = s })
    return map
  }, [societies])

  const editingSociety = editingAdmin?.societyId ? societyMap[editingAdmin.societyId] : null
  const activeSociety = assignmentSociety || editingSociety

  const filteredAdmins = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return societyAdmins.filter(a =>
      a.name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.societyName?.toLowerCase().includes(q)
    )
  }, [societyAdmins, searchTerm])

  const canManageSocietyAdmins = isPlatformOwner || isOrgOwner

  const existingAdminEmails = useMemo(
    () => new Set(societyAdmins.map((admin) => normalizeText(admin.email).toLowerCase()).filter(Boolean)),
    [societyAdmins]
  )

  const existingSocietyEmails = useMemo(
    () => new Set(societies.map((society) => normalizeText(society.email).toLowerCase()).filter(Boolean)),
    [societies]
  )

  const existingRegistrationNumbers = useMemo(
    () => new Set(societies.map((society) => normalizeText(society.registrationNumber).toLowerCase()).filter(Boolean)),
    [societies]
  )

  const bulkImportColumns = useMemo(
    () => BULK_FIELD_CONFIG.map((field, index) => ({
      letter: String.fromCharCode(65 + index),
      label: field.label,
      required: field.required,
      description: field.description,
    })),
    []
  )

  const bulkPreviewColumns = useMemo(
    () => [
      { key: 'adminName', label: 'Admin Name' },
      { key: 'adminEmail', label: 'Admin Email' },
      { key: 'societyName', label: 'Society Name' },
    ],
    []
  )

  const validateBulkImport = async (file) => {
    let parsed
    try {
      parsed = await parseWorkbookRows(file)
    } catch {
      throw createApiError('Invalid Excel file. Please upload a valid .xlsx/.xls file.')
    }

    const { rows, missingHeaders } = parsed

    if (missingHeaders.length > 0) {
      throw createApiError(`Missing required column(s): ${missingHeaders.join(', ')}`)
    }

    if (!rows.length) {
      throw createApiError('No data rows found. Add at least one row below the header in the template.')
    }

    return {
      data: validateBulkRows({
        rows,
        isPlatformOwner,
        existingAdminEmails,
        existingSocietyEmails,
        existingRegistrationNumbers,
      }),
    }
  }

  const processBulkImport = async (file) => {
    let parsed
    try {
      parsed = await parseWorkbookRows(file)
    } catch {
      throw createApiError('Invalid Excel file. Please upload a valid .xlsx/.xls file.')
    }

    const { rows, missingHeaders } = parsed

    if (missingHeaders.length > 0) {
      throw createApiError(`Missing required column(s): ${missingHeaders.join(', ')}`)
    }

    const validation = validateBulkRows({
      rows,
      isPlatformOwner,
      existingAdminEmails,
      existingSocietyEmails,
      existingRegistrationNumbers,
    })

    if (validation.failureCount > 0) {
      return {
        data: {
          successCount: 0,
          failureCount: validation.failureCount,
          message: 'Import aborted due to validation errors. Fix the file and try again.',
        },
      }
    }

    const successfulRows = validation.results.filter((result) => result.success)
    let successCount = 0
    let failureCount = 0
    const failedRows = []

    for (const rowResult of successfulRows) {
      const row = rowResult.normalizedRow
      try {
        const societyPayload = {
          name: row.societyName,
          address: row.address,
          city: row.city,
          state: row.state,
          pincode: row.pincode,
          registrationNumber: row.registrationNumber,
          email: row.societyEmail,
          telephone: row.societyPhone,
          totalFlats: row.totalFlats,
          totalShops: row.totalShops,
          totalOffices: row.totalOffices,
          totalWings: row.totalWings,
        }

        const societyRes = await societyApi.create(societyPayload, user.id)
        const createdSociety = societyRes.data

        await userApi.create({
          name: row.adminName,
          email: row.adminEmail,
          password: row.adminPassword,
          phone: row.adminPhone,
          role: 'SOCIETY_ADMIN',
          societyId: createdSociety.id,
        })

        successCount += 1
      } catch (error) {
        failureCount += 1
        failedRows.push({
          rowNumber: rowResult.rowNumber,
          adminName: row.adminName,
          adminEmail: row.adminEmail,
          societyName: row.societyName,
          errorMessage: parseApiError(error),
        })
      }
    }

    setBulkImportFailedRows(failedRows)

    return {
      data: {
        successCount,
        failureCount,
        failedRows,
        message: failureCount > 0
          ? `Imported ${successCount} record(s). ${failureCount} row(s) failed.`
          : `Successfully imported ${successCount} society admin record(s).`,
      },
    }
  }

  const downloadBulkTemplate = async () => ({
    data: buildTemplateWorkbook(),
  })

  const downloadBulkImportErrorReport = async () => {
    if (!bulkImportFailedRows.length) {
      throw createApiError('No failed rows available for error report download.')
    }

    const header = ['Row', 'Admin Name', 'Admin Email', 'Society Name', 'Error']
    const rows = bulkImportFailedRows.map((item) => [
      item.rowNumber,
      item.adminName || '',
      item.adminEmail || '',
      item.societyName || '',
      item.errorMessage || '',
    ])

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ImportErrors')
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

    return {
      data: new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    }
  }

  // Create society + admin combined mutation
  const createMutation = useMutation({
    mutationFn: async ({ societyData, adminData }) => {
      // Create society first
      const societyRes = await societyApi.create(societyData, user.id)
      const createdSociety = societyRes.data

      // Then create the admin user linked to the society
      await userApi.create({
        name: adminData.name,
        email: adminData.email,
        password: adminData.password,
        phone: adminData.phone,
        role: 'SOCIETY_ADMIN',
        societyId: createdSociety.id,
      })

      return createdSociety
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      queryClient.invalidateQueries(['societies'])
      setShowModal(false)
      setFormError('')
      setShowPassword(false)
      toast.success('Society & Admin created successfully')
    },
    onError: (error) => setFormError(parseApiError(error)),
  })

  // Update society + admin together (same full form as create)
  const updateMutation = useMutation({
    mutationFn: async ({ adminId, societyId, adminData, societyData }) => {
      await societyApi.update(societyId, societyData, user.id)
      await userApi.update(adminId, adminData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      queryClient.invalidateQueries(['societies'])
      setShowModal(false)
      setEditingAdmin(null)
      setFormError('')
      setShowPassword(false)
      toast.success('Society & Admin updated successfully')
    },
    onError: (error) => setFormError(parseApiError(error)),
  })

  const assignMutation = useMutation({
    mutationFn: async ({ society, adminData }) => {
      await userApi.create({
        name: adminData.name,
        email: adminData.email,
        password: adminData.password,
        phone: adminData.phone,
        role: 'SOCIETY_ADMIN',
        societyId: society.id,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      queryClient.invalidateQueries(['societies'])
      setShowModal(false)
      setAssignmentSociety(null)
      setFormError('')
      setShowPassword(false)
      toast.success('Society admin assigned successfully')
    },
    onError: (error) => setFormError(parseApiError(error)),
  })

  const deleteSocietyMutation = useMutation({
    mutationFn: ({ id, force = false }) => societyApi.delete(id, user.id, force),
    onMutate: ({ id }) => {
      setDeletingSocietyId(id)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['societies'])
      queryClient.invalidateQueries(['users'])
      toast.success(variables?.force ? 'Society force-deleted successfully' : 'Society deleted successfully')
    },
    onError: (error) => toast.error(parseApiError(error)),
    onSettled: () => {
      setDeletingSocietyId(null)
    },
  })

  // Delete admin user
  const deleteMutation = useMutation({
    mutationFn: ({ id, force = false }) => userApi.delete(id, force),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['users'])
  toast.success(variables?.force ? 'Society Admin force-deleted successfully' : 'Society Admin deleted successfully')
    },
    onError: (error) => toast.error(parseApiError(error)),
  })

  const openCreate = () => {
    setEditingAdmin(null)
    setAssignmentSociety(null)
    setFormError('')
    setShowPassword(false)
    setShowModal(true)
  }

  const openEdit = (admin) => {
    setEditingAdmin(admin)
    setAssignmentSociety(null)
    setFormError('')
    setShowPassword(false)
    setShowModal(true)
  }

  const openAssign = (society) => {
    setEditingAdmin(null)
    setAssignmentSociety(society)
    setFormError('')
    setShowPassword(false)
    setShowModal(true)
  }

  const handleDelete = async (admin) => {
    const confirmed = await confirmDialog({
      title: 'Delete Society Admin',
      message: `Delete society admin "${admin.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      tone: 'danger',
      details: [
        { label: 'Name', value: admin.name || '-' },
        { label: 'Email', value: admin.email || '-' },
        { label: 'Phone', value: admin.phone || '-' },
        { label: 'Society', value: admin.societyName || '-' },
      ],
      caution: 'This action permanently removes admin access.',
    })

    if (!confirmed) return

    try {
      await deleteMutation.mutateAsync({ id: admin.id, force: false })
    } catch (error) {
      const serverMessage = error?.response?.data?.message || parseApiError(error)
      const shouldOfferForceDelete =
        error?.response?.status === 409 &&
        String(serverMessage).toLowerCase().includes('use force delete')

      if (!shouldOfferForceDelete) {
        toast.error(serverMessage)
        return
      }

      const finalWarning = await confirmDialog({
        title: 'Final Warning: Force Delete Admin',
        message: `This will permanently delete admin "${admin.name}" and remove all related records. Continue?`,
        confirmText: 'Force Delete',
        cancelText: 'Cancel',
        tone: 'danger',
        details: [
          { label: 'Name', value: admin.name || '-' },
          { label: 'Email', value: admin.email || '-' },
          { label: 'Society', value: admin.societyName || '-' },
        ],
        caution: 'This action is irreversible and will remove admin access, password reset tokens, and related records.',
      })

      if (!finalWarning) return

      try {
        await deleteMutation.mutateAsync({ id: admin.id, force: true })
      } catch (forceError) {
        toast.error(parseApiError(forceError))
      }
    }
  }

  const handleDeleteSociety = async (society) => {
    const confirmed = await confirmDialog({
      title: 'Delete Society',
      message: `Delete society "${society.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      tone: 'danger',
      details: [
        { label: 'Society', value: society.name || '-' },
        { label: 'City', value: society.city || '-' },
      ],
      impacts: [
        {
          label: 'Configured Units',
          count:
            (society.totalFlats || society.actualFlats || 0)
            + (society.totalShops || society.actualShops || 0)
            + (society.totalOffices || society.actualOffices || 0),
        },
        { label: 'Society Record', count: 1 },
      ],
      caution: 'Deleting a society may affect linked users and records.',
    })

    if (!confirmed) return

    try {
      await deleteSocietyMutation.mutateAsync({ id: society.id, force: false })
    } catch (error) {
      const serverMessage = error?.response?.data?.message || parseApiError(error)
      const shouldOfferForceDelete =
        error?.response?.status === 409 &&
        String(serverMessage).toLowerCase().includes('use force delete')

      if (!shouldOfferForceDelete) {
        return
      }

      const finalWarning = await confirmDialog({
        title: 'Final Warning: Force Delete Society',
        message: `This will permanently delete "${society.name}" and unlink all related records from this society reference. Continue?`,
        confirmText: 'Force Delete',
        cancelText: 'Cancel',
        tone: 'danger',
        details: [
          { label: 'Society', value: society.name || '-' },
          { label: 'City', value: society.city || '-' },
        ],
        caution: 'This action is irreversible and may impact units, users, bills, and society-scoped records.',
      })

      if (!finalWarning) return

      try {
        await deleteSocietyMutation.mutateAsync({ id: society.id, force: true })
      } catch (forceError) {
        toast.error(parseApiError(forceError))
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)

    const adminData = {
      name: fd.get('adminName')?.trim(),
      email: fd.get('adminEmail')?.trim(),
      password: fd.get('adminPassword')?.trim(),
      phone: fd.get('adminPhone')?.trim(),
    }

    const societyData = {
      name: fd.get('societyName')?.trim(),
      address: fd.get('address')?.trim(),
      city: fd.get('city')?.trim(),
      state: fd.get('state')?.trim(),
      pincode: fd.get('pincode')?.trim(),
      registrationNumber: fd.get('registrationNumber')?.trim(),
      email: fd.get('societyEmail')?.trim(),
      telephone: fd.get('telephone')?.trim(),
      totalFlats: parseInt(fd.get('totalFlats'), 10),
      totalShops: parseInt(fd.get('totalShops'), 10),
      totalOffices: parseInt(fd.get('totalOffices'), 10),
      totalWings: parseInt(fd.get('totalWings'), 10),
    }

    if (!adminData.name || !adminData.email || !adminData.phone) {
      setFormError('Admin name, email, and phone are required')
      return
    }

    if (!editingAdmin && !adminData.password) {
      setFormError('Admin password is required while creating')
      return
    }

    if (assignmentSociety && !editingAdmin) {
      assignMutation.mutate({
        society: assignmentSociety,
        adminData,
      })
      return
    }

    if (
      !societyData.name ||
      !societyData.address ||
      !societyData.state ||
      !societyData.city ||
      !societyData.pincode ||
      !societyData.registrationNumber ||
      !societyData.email ||
      !societyData.telephone ||
      Number.isNaN(societyData.totalFlats) ||
      Number.isNaN(societyData.totalShops) ||
      Number.isNaN(societyData.totalOffices) ||
      Number.isNaN(societyData.totalWings)
    ) {
      setFormError('All society fields are mandatory. Fill every field before submitting.')
      return
    }

    if (editingAdmin) {
      const adminUpdateData = {
        name: adminData.name,
        email: adminData.email,
        phone: adminData.phone,
        role: 'SOCIETY_ADMIN',
        societyId: editingAdmin.societyId,
      }
      if (adminData.password) {
        adminUpdateData.password = adminData.password
      }

      updateMutation.mutate({
        adminId: editingAdmin.id,
        societyId: editingAdmin.societyId,
        adminData: adminUpdateData,
        societyData,
      })
      return
    }

    createMutation.mutate({ societyData, adminData })
  }

  const showSkeleton = useMinLoadingTime(usersLoading || usersError)

  if (showSkeleton) {
    return (
      <div className="sa-page">
        <WakeUpBanner show />
        <HeroSkeleton statCount={3} />
        <FiltersSkeleton filterCount={2} />
        <CardGridSkeleton count={6} />
      </div>
    )
  }

  return (
    <div className="sa-page">
      {/* Header */}
      <header className="sa-hero">
        <div className="sa-hero__grid">
          <div>
            <h1 className="sa-hero__title">
              <UserCheck size={28} />
              Society Admins
            </h1>
            <p className="sa-hero__subtitle">Manage society administrators and assignments</p>
          </div>
          <div className="sa-hero__stats">
            <div className="sa-hero__stat">
              <span className="sa-hero__stat-value">{societyAdmins.length}</span>
              <span className="sa-hero__stat-label">Assigned Admins</span>
            </div>
            <div className="sa-hero__stat">
              <span className="sa-hero__stat-value">{societies.length}</span>
              <span className="sa-hero__stat-label">Total Societies</span>
            </div>
            <div className="sa-hero__stat">
              <span className="sa-hero__stat-value">{societiesNeedingAssignment.length}</span>
              <span className="sa-hero__stat-label">Needs Assignment</span>
            </div>
          </div>
          {canManageSocietyAdmins && (
            <div className="sa-hero__actions">
              <button onClick={() => setShowBulkImportModal(true)} className="sa-hero__button">
                <Upload size={18} />
                Bulk Import
              </button>
              <button onClick={openCreate} className="sa-hero__button">
                <Plus size={18} />
                Create Society + Admin
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Search */}
      <div className="sa-search">
        <div className="sa-search__field">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or society..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sa-search__input"
          />
          {searchTerm && (
            <button className="sa-search__clear" onClick={() => setSearchTerm('')}>
              <X size={16} />
            </button>
          )}
        </div>

      </div>

      {societiesNeedingAssignment.length > 0 && (
        <section className="sa-unassigned">
          <div className="sa-unassigned__header">
            <h3>Societies Requiring Assignment</h3>
            <span>{societiesNeedingAssignment.length}</span>
          </div>
          <div className="sa-unassigned__grid">
            {societiesNeedingAssignment.map((society) => {
              return (
                <div key={society.id} className="sa-unassigned__card">
                  <div className="sa-unassigned__top">
                    <div>
                      <p className="sa-unassigned__name">{society.name}</p>
                      <p className="sa-unassigned__meta">{society.city || 'N/A'}{society.state ? `, ${society.state}` : ''}</p>
                    </div>
                    <div className="sa-unassigned__actions">
                      <button
                        type="button"
                        className="sa-unassigned__assign-btn"
                        onClick={() => openAssign(society)}
                      >
                        <Plus size={14} />
                        Assign Admin
                      </button>
                      <button
                        type="button"
                        className="sa-icon-btn sa-icon-btn--delete"
                        title={deletingSocietyId === society.id ? 'Deleting...' : 'Delete society'}
                        onClick={() => handleDeleteSociety(society)}
                        disabled={deletingSocietyId === society.id || deleteSocietyMutation.isPending}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="sa-unassigned__badges">
                    {!assignedSocietyIds.has(society.id) && <span className="sa-unassigned__badge sa-unassigned__badge--warn">No Society Admin</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Content */}
      {filteredAdmins.length === 0 ? (
        <div className="sa-empty">
          <UserCheck size={48} className="sa-empty__icon" />
          <h3>No society admins found</h3>
          <p>Create a society and its admin to get started</p>
          {canManageSocietyAdmins && (
            <div className="sa-empty__actions">
              <button onClick={() => setShowBulkImportModal(true)} className="sa-empty__button sa-empty__button--ghost">
                <Upload size={18} />
                Bulk Import
              </button>
              <button onClick={openCreate} className="sa-empty__button">
                <Plus size={18} />
                Create Society + Admin
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="sa-grid">
          {filteredAdmins.map((admin) => {
            const society = societyMap[admin.societyId]
            return (
              <div key={admin.id} className="sa-card">
                {/* Admin info */}
                <div className="sa-card__header">
                  <div className="sa-card__avatar">
                    {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <div className="sa-card__info">
                    <h3 className="sa-card__name">{admin.name}</h3>
                    <div className="sa-card__meta-row">
                      <Mail size={13} />
                      <span>{admin.email}</span>
                    </div>
                    {admin.phone && (
                      <div className="sa-card__meta-row">
                        <Phone size={13} />
                        <span>{admin.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="sa-card__actions">
                    <button onClick={() => openEdit(admin)} className="sa-icon-btn sa-icon-btn--edit" title="Edit">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(admin)} className="sa-icon-btn sa-icon-btn--delete" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Linked society */}
                {society ? (
                  <div
                    className="sa-card__society"
                    onClick={() => navigate(`/societies/${society.id}`)}
                  >
                    <div className="sa-card__society-header">
                      <Building2 size={16} />
                      <span className="sa-card__society-name">{society.name}</span>
                      <ChevronRight size={14} className="sa-card__society-arrow" />
                    </div>
                    <div className="sa-card__society-details">
                      {society.city && (
                        <span><MapPin size={11} /> {society.city}, {society.state || ''}</span>
                      )}
                    </div>
                    <div className="sa-card__society-stats">
                      <span><Home size={12} /> {society.actualFlats ?? society.totalFlats ?? 0} Flats</span>
                      <span><Store size={12} /> {society.actualShops ?? society.totalShops ?? 0} Shops</span>
                      <span><Building2 size={12} /> {society.actualOffices ?? society.totalOffices ?? 0} Offices</span>
                      <span><Layers size={12} /> {society.actualWings ?? society.totalWings ?? 0} Wings</span>
                    </div>
                  </div>
                ) : (
                  <div className="sa-card__no-society">
                    <Shield size={14} />
                    <span>No society linked</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="sa-modal" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="sa-modal__panel">
            <div className="sa-modal__header">
              <div>
                <h3>{editingAdmin ? 'Edit Society Admin' : assignmentSociety ? 'Assign Society Admin' : 'Create Society + Admin'}</h3>
                <p>{editingAdmin ? 'Update society and admin details' : assignmentSociety ? 'Assign an individual society admin' : 'Create a new society with its administrator'}</p>
              </div>
              <button onClick={() => { setShowModal(false); setShowPassword(false) }} className="sa-modal__close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="sa-form">
              {formError && (
                <div className="sa-form__error">
                  <X size={16} className="sa-form__error-close" onClick={() => setFormError('')} />
                  {formError}
                </div>
              )}

              {/* Admin Credentials — always shown */}
              <div className="sa-form__section">
                <h4><User size={16} /> Admin Credentials</h4>
                <div className="sa-form__grid">
                  <FormInput label="Admin Name" name="adminName" defaultValue={editingAdmin?.name || ''} required />
                  <FormInput label="Admin Email" name="adminEmail" type="email" defaultValue={editingAdmin?.email || ''} required />
                  <div className="sa-form__password-field">
                    <FormInput
                      label={editingAdmin ? 'New Password (optional)' : 'Password'}
                      name="adminPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={editingAdmin ? 'Leave blank to keep current' : 'Password for admin login'}
                      required={!editingAdmin}
                    />
                    <button
                      type="button"
                      className="sa-form__toggle-pw"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide' : 'Show'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PhoneInput label="Admin Phone" name="adminPhone" defaultValue={editingAdmin?.phone || ''} required />
                </div>
              </div>

              <div className="sa-form__section">
                <h4><Building2 size={16} /> Society Information</h4>
                <div className="sa-form__grid">
                  <FormInput label="Society Name" name="societyName" defaultValue={activeSociety?.name || ''} required />
                  <FormInput label="Address" name="address" defaultValue={activeSociety?.address || ''} required />
                  <StateCitySelector
                    stateDefaultValue={activeSociety?.state || ''}
                    cityDefaultValue={activeSociety?.city || ''}
                    stateRequired
                    cityRequired
                  />
                  <PincodeInput label="Pincode" name="pincode" defaultValue={activeSociety?.pincode || ''} required />
                  <FormInput label="Registration Number" name="registrationNumber" defaultValue={activeSociety?.registrationNumber || ''} required />
                  <FormInput label="Society Email" name="societyEmail" type="email" defaultValue={activeSociety?.email || ''} required />
                  <PhoneInput label="Society Phone" name="telephone" defaultValue={activeSociety?.telephone || ''} required />
                </div>
              </div>

              <div className="sa-form__section">
                <h4><Home size={16} /> Property Capacity</h4>
                <div className="sa-form__grid sa-form__grid--4">
                  <NumberInput label="Flats" name="totalFlats" min={0} defaultValue={activeSociety?.totalFlats ?? 0} required />
                  <NumberInput label="Shops" name="totalShops" min={0} defaultValue={activeSociety?.totalShops ?? 0} required />
                  <NumberInput label="Offices" name="totalOffices" min={0} defaultValue={activeSociety?.totalOffices ?? 0} required />
                  <NumberInput label="Wings" name="totalWings" min={0} defaultValue={activeSociety?.totalWings ?? 0} required />
                </div>
              </div>

              <div className="sa-form__footer">
                <button type="button" onClick={() => { setShowModal(false); setShowPassword(false) }} className="sa-btn">
                  Cancel
                </button>
                <AsyncButton
                  type="submit"
                  className="sa-btn sa-btn--primary"
                  isLoading={createMutation.isPending || updateMutation.isPending || assignMutation.isPending}
                  loadingText="Saving..."
                >
                  {editingAdmin ? 'Update Admin' : assignmentSociety ? 'Assign Admin' : 'Create Society + Admin'}
                </AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkImportModal && (
        <BulkImportModal
          title="Bulk Import Society + Admin"
          entityName="records"
          templateFilename="society_admin_bulk_import_template.xlsx"
          columns={bulkImportColumns}
          tableColumns={bulkPreviewColumns}
          apiValidate={validateBulkImport}
          apiProcess={processBulkImport}
          apiTemplate={downloadBulkTemplate}
          requireScopeId={false}
          onDownloadErrorReport={downloadBulkImportErrorReport}
          errorReportFilename="society_admin_bulk_import_errors.xlsx"
          onClose={() => {
            setShowBulkImportModal(false)
            setBulkImportFailedRows([])
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['users'])
            queryClient.invalidateQueries(['societies'])
            toast.success('Bulk import completed successfully')
          }}
        />
      )}
    </div>
  )
}
