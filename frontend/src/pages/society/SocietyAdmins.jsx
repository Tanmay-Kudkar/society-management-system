import { useState, useMemo, useEffect } from 'react'
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
  StateCitySelector, SmartSelect, NeonSweepButton
} from '../../components'
import { BulkImportModal } from '../../components'
import { FiltersSkeleton, CardGridSkeleton, HeroSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import {
  UserCheck, Plus, Edit, Trash2, Search, X, Building2,
  Eye, EyeOff, Mail, Phone, MapPin, Shield, ChevronRight,
  Home, Store, Layers, User, Upload
} from 'lucide-react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PINCODE_REGEX = /^\d{6}$/
const pageShellClass = 'rounded-[28px] border border-[color-mix(in_srgb,var(--border-default)_88%,white_12%)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bg-secondary)_96%,white_4%),color-mix(in_srgb,var(--bg-secondary)_100%,black_0%))] shadow-[0_20px_60px_rgba(2,6,23,0.08)]'
const pagePanelClass = 'rounded-[18px] border border-[color-mix(in_srgb,var(--border-default)_90%,white_10%)] bg-[color-mix(in_srgb,var(--bg-tertiary)_88%,white_12%)] shadow-[0_12px_30px_rgba(15,23,42,0.08)]'

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
  { key: 'totalFloors', label: 'Floors', required: true, description: 'Total building floors (minimum 1)', sample: '12', aliases: ['floors', 'totalfloors', 'total_floors'] },
  { key: 'twoWheelerParkingCapacity', label: '2W Parking', required: false, description: 'Two-wheeler parking spots (optional)', sample: '50', aliases: ['twowheeler', 'two_wheeler', 'twowheelerparkingcapacity', 'two_wheeler_parking_capacity', '2wparkingcapacity', '2w_parking'] },
  { key: 'fourWheelerParkingCapacity', label: '4W Parking', required: false, description: 'Four-wheeler parking spots (optional)', sample: '30', aliases: ['fourwheeler', 'four_wheeler', 'fourwheelerparkingcapacity', 'four_wheeler_parking_capacity', '4wparkingcapacity', '4w_parking'] },
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
      'totalFlats', 'totalShops', 'totalOffices', 'totalWings', 'totalFloors',
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

    const numericFields = ['totalFlats', 'totalShops', 'totalOffices', 'totalWings', 'totalFloors']
    const parsedNumbers = {}
    numericFields.forEach((field) => {
      const raw = normalizeText(row[field])
      const parsed = Number(raw)
      const minAllowed = field === 'totalFloors' ? 1 : 0
      if (!Number.isInteger(parsed) || parsed < minAllowed) {
        const fieldLabel = BULK_FIELD_CONFIG.find((item) => item.key === field)?.label || field
        errors.push(`${fieldLabel} must be a whole number greater than or equal to ${minAllowed}`)
      } else {
        parsedNumbers[field] = parsed
      }
    })

    if (adminEmail) {
      const adminEmailKey = `admin:${adminEmail}`
      if (seenEmails.has(adminEmailKey)) {
        errors.push('Duplicate admin email found in import file')
      } else {
        seenEmails.add(adminEmailKey)
      }

      if (existingAdminEmails.has(adminEmail)) {
        errors.push('This admin email is already registered')
      }
    }

    if (societyEmail) {
      const societyEmailKey = `society:${societyEmail}`
      if (seenEmails.has(societyEmailKey)) {
        errors.push('Duplicate society email found in import file')
      } else {
        seenEmails.add(societyEmailKey)
      }
    }

    if (registrationNumber) {
      if (seenRegistrationNumbers.has(registrationNumber)) {
        errors.push('Duplicate registration number found in import file')
      } else {
        seenRegistrationNumbers.add(registrationNumber)
      }

      if (existingRegistrationNumbers.has(registrationNumber)) {
        errors.push('This registration number is already in use by another society')
      }
    }

    if (societyEmail && existingSocietyEmails.has(societyEmail)) {
      errors.push('This society email is already registered')
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
      totalFloors: parsedNumbers.totalFloors,
      twoWheelerParkingCapacity: parsedNumbers.twoWheelerParkingCapacity,
      fourWheelerParkingCapacity: parsedNumbers.fourWheelerParkingCapacity,
    }

    return {
      rowNumber: row.rowNumber,
      adminName: normalizedRow.adminName,
      adminEmail: normalizedRow.adminEmail,
      societyName: normalizedRow.societyName,
      success: errors.length === 0,
      errors,
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
  const [hasWingsEnabled, setHasWingsEnabled] = useState(true)

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

  useEffect(() => {
    if (!showModal) return
    const defaultHasWings = activeSociety
      ? (activeSociety?.hasWings ?? ((activeSociety?.totalWings ?? 0) > 0))
      : true
    setHasWingsEnabled(Boolean(defaultHasWings))
  }, [showModal, activeSociety])

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
          totalFloors: row.totalFloors,
          hasWings: row.totalWings > 0,
          twoWheelerParkingCapacity: row.twoWheelerParkingCapacity || undefined,
          fourWheelerParkingCapacity: row.fourWheelerParkingCapacity || undefined,
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
      telephone: (fd.get('telephone') || fd.get('societyPhone'))?.trim(),
      totalFlats: parseInt(fd.get('totalFlats'), 10),
      totalShops: parseInt(fd.get('totalShops'), 10),
      totalOffices: parseInt(fd.get('totalOffices'), 10),
      totalWings: hasWingsEnabled ? parseInt(fd.get('totalWings'), 10) : 0,
      totalFloors: parseInt(fd.get('totalFloors'), 10),
      hasWings: hasWingsEnabled,
      twoWheelerParkingCapacity: fd.get('twoWheelerParkingCapacity') ? parseInt(fd.get('twoWheelerParkingCapacity'), 10) || undefined : undefined,
      fourWheelerParkingCapacity: fd.get('fourWheelerParkingCapacity') ? parseInt(fd.get('fourWheelerParkingCapacity'), 10) || undefined : undefined,
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

    const missingSocietyFields = []

    if (!societyData.name) missingSocietyFields.push('Society Name')
    if (!societyData.address) missingSocietyFields.push('Address')
    if (!societyData.state) missingSocietyFields.push('State')
    if (!societyData.city) missingSocietyFields.push('City')
    if (!societyData.pincode) missingSocietyFields.push('Pincode')
    if (!societyData.registrationNumber) missingSocietyFields.push('Registration Number')
    if (!societyData.email) missingSocietyFields.push('Society Email')
    if (!societyData.telephone) missingSocietyFields.push('Society Phone')
    if (Number.isNaN(societyData.totalFlats)) missingSocietyFields.push('Flats')
    if (Number.isNaN(societyData.totalShops)) missingSocietyFields.push('Shops')
    if (Number.isNaN(societyData.totalOffices)) missingSocietyFields.push('Offices')
    if (hasWingsEnabled && Number.isNaN(societyData.totalWings)) missingSocietyFields.push('Wings')
    if (Number.isNaN(societyData.totalFloors)) missingSocietyFields.push('Floors')

    if (missingSocietyFields.length > 0) {
      setFormError(`Please fill required fields: ${missingSocietyFields.join(', ')}`)
      return
    }

    if (societyData.totalFloors < 1) {
      setFormError('Floors must be at least 1')
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
      <div className="p-6 max-md:p-4 min-h-[calc(100vh-68px)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
        <WakeUpBanner show />
        <HeroSkeleton statCount={3} />
        <FiltersSkeleton filterCount={2} />
        <CardGridSkeleton count={6} />
      </div>
    )
  }

  return (
    <div className="p-6 max-md:p-4 min-h-[calc(100vh-68px)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
      <style>{`
        @keyframes admin-border-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl p-[3px] shadow-sm transition-all duration-300">
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            backgroundImage: 'var(--flow-border-gradient)',
            backgroundSize: 'var(--flow-border-size)',
            animation: 'admin-border-flow var(--flow-border-speed-admin) linear infinite',
            filter: 'blur(var(--flow-border-blur))',
            opacity: 'var(--flow-border-opacity)',
          }}
        />
        <div className="relative z-[2] grid gap-0 overflow-hidden rounded-[13px] bg-[var(--bg-secondary)] xl:grid-cols-[1.15fr_0.85fr] xl:divide-x xl:divide-[color-mix(in_srgb,var(--border-default)_70%,white_30%)]">
          <div className="px-6 py-6 sm:px-8 sm:py-7">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">Admin Control</p>
            <h1 className="m-0 flex items-center gap-3 text-[40px] font-extrabold tracking-tight text-[var(--text-primary)] max-md:text-[31px]">
              <UserCheck size={28} className="text-[var(--accent-primary)]" />
              Society Admins
            </h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[color-mix(in_srgb,var(--text-secondary)_90%,white_10%)] sm:text-[17px]">
              Manage society administrators, assignment gaps, and onboarding operations from one command surface.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] px-3 py-1 text-[11px] font-semibold text-[var(--accent-primary)]">
                {societyAdmins.length} active admins
              </span>
              <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                {societiesNeedingAssignment.length} pending assignments
              </span>
            </div>

            {canManageSocietyAdmins && (
              <div className="mt-5 inline-flex flex-wrap items-center gap-3">
                <NeonSweepButton tone="cyan" onClick={() => setShowBulkImportModal(true)}>
                  <Upload size={20} />
                  Bulk Import
                </NeonSweepButton>
                <NeonSweepButton tone="violet" onClick={openCreate}>
                  <Plus size={20} />
                  Create Society Admin
                </NeonSweepButton>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 px-6 py-6 sm:grid-cols-3 sm:px-8 sm:py-7 xl:grid-cols-1 xl:gap-2">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-4 py-3 transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-[var(--accent-primary)]/35 hover:shadow-[0_6px_14px_rgba(15,23,42,0.16)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Assigned Admins</p>
              <p className="mt-1 text-3xl font-black leading-none text-[var(--text-primary)]">{societyAdmins.length}</p>
              <div className="mt-2 h-1.5 rounded-full bg-[color-mix(in_srgb,var(--border-default)_75%,transparent)]">
                <div className="h-full rounded-full bg-[var(--accent-primary)]" style={{ width: `${Math.min(100, societies.length ? Math.round((societyAdmins.length / societies.length) * 100) : 0)}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-4 py-3 transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-[var(--accent-primary)]/35 hover:shadow-[0_6px_14px_rgba(15,23,42,0.16)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Total Societies</p>
              <p className="mt-1 text-3xl font-black leading-none text-[var(--text-primary)]">{societies.length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-4 py-3 transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-[var(--accent-primary)]/35 hover:shadow-[0_6px_14px_rgba(15,23,42,0.16)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Needs Assignment</p>
              <p className="mt-1 text-3xl font-black leading-none text-[var(--text-primary)]">{societiesNeedingAssignment.length}</p>
              <p className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                {societiesNeedingAssignment.length > 0 ? "Action required" : "All covered"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className={`${pagePanelClass} mb-4 mt-[18px] px-4 py-3 transition-all focus-within:border-[var(--accent-primary)]/45 focus-within:shadow-[0_10px_24px_color-mix(in_srgb,var(--accent-primary)_18%,transparent)]`}>
        <div className="flex items-center gap-[10px] text-[var(--text-tertiary)]">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or society..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-none text-sm outline-none text-[var(--text-primary)] bg-transparent"
          />
          {searchTerm && (
            <button className="bg-transparent border-none cursor-pointer text-[var(--text-tertiary)] p-[2px] flex" onClick={() => setSearchTerm('')}>
              <X size={16} />
            </button>
          )}
        </div>

      </div>

      {societiesNeedingAssignment.length > 0 && (
        <section className={`${pagePanelClass} mb-4 p-[14px]`}>
          <div className="flex items-center justify-between mb-[10px]">
            <h3 className="m-0 text-[15px] font-semibold text-[var(--text-primary)]">Societies Requiring Assignment</h3>
            <span className="inline-flex items-center justify-center min-w-6 h-6 rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs font-bold">{societiesNeedingAssignment.length}</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[10px]">
            {societiesNeedingAssignment.map((society) => {
              return (
                <div key={society.id} className="rounded-[12px] border border-[var(--border-light)] bg-[var(--bg-secondary)] p-[12px] transition-all hover:-translate-y-px hover:border-[rgba(59,130,246,0.28)] hover:shadow-[0_10px_26px_rgba(30,64,175,0.14)]">
                  <div className="flex items-start justify-between gap-[10px]">
                    <div>
                      <p className="m-0 text-sm font-semibold text-[var(--text-primary)]">{society.name}</p>
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">{society.city || 'N/A'}{society.state ? `, ${society.state}` : ''}</p>
                    </div>
                    <div className="inline-flex items-center gap-[6px] shrink-0">
                      <button
                        type="button"
                        className="inline-flex items-center gap-[6px] border border-[rgba(59,130,246,0.34)] bg-[rgba(59,130,246,0.12)] text-[var(--accent-primary)] rounded-lg py-[5px] px-[9px] text-[11px] font-bold cursor-pointer transition-colors hover:bg-[rgba(59,130,246,0.2)] hover:border-[rgba(59,130,246,0.5)]"
                        onClick={() => openAssign(society)}
                      >
                        <Plus size={14} />
                        Assign Admin
                      </button>
                      <button
                        type="button"
                        className="bg-[var(--bg-tertiary)] border border-[var(--border-light)] p-[6px] rounded-lg cursor-pointer text-[var(--text-secondary)] transition-colors flex items-center justify-center hover:bg-[rgba(239,68,68,0.12)] hover:border-[rgba(239,68,68,0.35)] hover:text-[#ef4444] disabled:opacity-55 disabled:cursor-not-allowed"
                        title={deletingSocietyId === society.id ? 'Deleting...' : 'Delete society'}
                        onClick={() => handleDeleteSociety(society)}
                        disabled={deletingSocietyId === society.id || deleteSocietyMutation.isPending}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-[6px] flex-wrap">
                    {!assignedSocietyIds.has(society.id) && <span className="inline-flex items-center border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.14)] text-[#f59e0b] rounded-full py-[2px] px-2 text-[11px] font-semibold">No Society Admin</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Content */}
      {filteredAdmins.length === 0 ? (
        <div className="py-16 px-6 text-center text-[var(--text-secondary)]">
          <UserCheck size={48} className="text-[var(--text-muted)] mb-3" />
          <h3 className="m-0 mb-[6px] text-lg">No society admins found</h3>
          <p className="m-0 text-sm text-[var(--text-tertiary)]">Create a society and its admin to get started</p>
          {canManageSocietyAdmins && (
            <div className="mt-[18px] inline-flex items-center gap-[10px] flex-wrap">
              <NeonSweepButton tone="slate" size="md" onClick={() => setShowBulkImportModal(true)}>
                <Upload size={18} />
                Bulk Import
              </NeonSweepButton>
              <NeonSweepButton tone="cyan" size="md" onClick={openCreate}>
                <Plus size={18} />
                Create Society Admin
              </NeonSweepButton>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-4 max-md:grid-cols-1">
          {filteredAdmins.map((admin) => {
            const society = societyMap[admin.societyId]
            return (
              <div key={admin.id} className={`${pagePanelClass} group flex flex-col gap-[14px] p-[18px] transition-[border-color,box-shadow,background-color] duration-200 ease-out hover:border-[rgba(59,130,246,0.3)] hover:shadow-[0_14px_34px_rgba(30,64,175,0.16)]`}>
                {/* Admin info */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold text-white bg-gradient-to-br from-[#0891b2] to-[#06b6d4]">
                    {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="m-0 text-base font-semibold text-[var(--text-primary)] leading-[1.3]">{admin.name}</h3>
                    <div className="flex items-center gap-[6px] text-[12.5px] text-[var(--text-secondary)] mt-1">
                      <Mail size={13} className="shrink-0 text-[var(--text-muted)]" />
                      <span>{admin.email}</span>
                    </div>
                    {admin.phone && (
                      <div className="flex items-center gap-[6px] text-[12.5px] text-[var(--text-secondary)] mt-1">
                        <Phone size={13} className="shrink-0 text-[var(--text-muted)]" />
                        <span>{admin.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(admin)} className="bg-[var(--bg-tertiary)] border border-[var(--border-light)] p-[6px] rounded-lg cursor-pointer text-[var(--text-secondary)] transition-[border-color,background-color,color] duration-150 ease-out flex items-center justify-center hover:bg-[rgba(251,191,36,0.12)] hover:border-[rgba(245,158,11,0.35)] hover:text-[#f59e0b]" title="Edit">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(admin)} className="bg-[var(--bg-tertiary)] border border-[var(--border-light)] p-[6px] rounded-lg cursor-pointer text-[var(--text-secondary)] transition-[border-color,background-color,color] duration-150 ease-out flex items-center justify-center hover:bg-[rgba(239,68,68,0.12)] hover:border-[rgba(239,68,68,0.35)] hover:text-[#ef4444]" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Linked society */}
                {society ? (
                  <div
                    className="p-3 rounded-[12px] bg-[color-mix(in_srgb,var(--bg-secondary)_94%,white_6%)] border border-[color-mix(in_srgb,var(--border-default)_90%,white_10%)] cursor-pointer transition-[border-color,background-color,box-shadow] duration-200 ease-out flex flex-col gap-[6px] hover:bg-[color-mix(in_srgb,var(--bg-secondary)_88%,var(--accent-primary)_12%)] hover:border-[rgba(59,130,246,0.3)] hover:shadow-[0_8px_18px_rgba(30,64,175,0.14)]"
                    onClick={() => navigate(`/dashboard?society=${encodeURIComponent(society.id)}`)}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <Building2 size={16} />
                      <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{society.name}</span>
                      <ChevronRight size={14} className="shrink-0 text-[var(--text-muted)]" />
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                      {society.city && (
                        <span><MapPin size={11} /> {society.city}, {society.state || ''}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11.5px] text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-1"><Home size={12} /> {society.actualFlats ?? society.totalFlats ?? 0} Flats</span>
                      <span className="inline-flex items-center gap-1"><Store size={12} /> {society.actualShops ?? society.totalShops ?? 0} Shops</span>
                      <span className="inline-flex items-center gap-1"><Building2 size={12} /> {society.actualOffices ?? society.totalOffices ?? 0} Offices</span>
                      <span className="inline-flex items-center gap-1"><Layers size={12} /> {society.actualWings ?? society.totalWings ?? 0} Wings</span>
                    </div>
                    {(society.twoWheelerParkingCapacity != null || society.fourWheelerParkingCapacity != null) && (
                      <div className="flex flex-wrap gap-3 text-[11.5px] text-[var(--text-secondary)]">
                        {society.twoWheelerParkingCapacity != null && <span className="inline-flex items-center gap-1">🏍️ {society.twoWheelerParkingCapacity} Two-Wheeler</span>}
                        {society.fourWheelerParkingCapacity != null && <span className="inline-flex items-center gap-1">🚗 {society.fourWheelerParkingCapacity} Four-Wheeler</span>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-[12px] bg-[color-mix(in_srgb,var(--bg-secondary)_94%,white_6%)] border border-[color-mix(in_srgb,var(--border-default)_90%,white_10%)] flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-[4px] p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="w-full max-w-[620px] max-h-[90vh] overflow-y-auto bg-[var(--bg-card)] rounded-2xl border border-[var(--border-light)] shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <div className="flex justify-between items-start px-6 pt-5 gap-3">
              <div>
                <h3 className="m-0 text-lg font-bold text-[var(--text-primary)]">{editingAdmin ? 'Edit Society Admin' : assignmentSociety ? 'Assign Society Admin' : 'Create Society + Admin'}</h3>
                <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">{editingAdmin ? 'Update society and admin details' : assignmentSociety ? 'Assign an individual society admin' : 'Create a new society with its administrator'}</p>
              </div>
              <button onClick={() => { setShowModal(false); setShowPassword(false) }} className="bg-transparent border-none cursor-pointer text-[var(--text-tertiary)] p-1 rounded-lg flex hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-5 px-6 pb-6 flex flex-col gap-5">
              {formError && (
                <div className="py-[10px] px-[14px] rounded-[10px] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-[#ef4444] text-[13px] flex items-center gap-2">
                  <X size={16} className="cursor-pointer shrink-0" onClick={() => setFormError('')} />
                  {formError}
                </div>
              )}

              {/* Admin Credentials — always shown */}
              <div className="flex flex-col gap-3">
                <h4 className="m-0 text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2 pb-2 border-b border-[var(--border-light)]"><User size={16} /> Admin Credentials</h4>
                <div className="grid grid-cols-2 max-md:grid-cols-1 gap-3">
                  <FormInput label="Admin Name" name="adminName" defaultValue={editingAdmin?.name || ''} required />
                  <FormInput label="Admin Email" name="adminEmail" type="email" defaultValue={editingAdmin?.email || ''} required />
                  <div className="relative">
                    <FormInput
                      label={editingAdmin ? 'New Password (optional)' : 'Password'}
                      name="adminPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={editingAdmin ? 'Leave blank to keep current' : 'Password for admin login'}
                      required={!editingAdmin}
                    />
                    <button
                      type="button"
                      className="absolute top-8 right-[10px] bg-transparent border-none cursor-pointer text-[var(--text-muted)] p-1 flex"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide' : 'Show'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PhoneInput label="Admin Phone" name="adminPhone" defaultValue={editingAdmin?.phone || ''} required />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="m-0 text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2 pb-2 border-b border-[var(--border-light)]"><Building2 size={16} /> Society Information</h4>
                <div className="grid grid-cols-2 max-md:grid-cols-1 gap-3">
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

              <div className="flex flex-col gap-3">
                <h4 className="m-0 text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2 pb-2 border-b border-[var(--border-light)]"><Home size={16} /> Property Capacity</h4>
                <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    name="hasWings"
                    checked={hasWingsEnabled}
                    onChange={(e) => setHasWingsEnabled(e.target.checked)}
                    className="h-4 w-4 accent-cyan-600"
                  />
                  Society has multiple wings/towers
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <NumberInput label="Flats" name="totalFlats" min={0} defaultValue={activeSociety?.totalFlats ?? 0} required />
                  <NumberInput label="Shops" name="totalShops" min={0} defaultValue={activeSociety?.totalShops ?? 0} required />
                  <NumberInput label="Offices" name="totalOffices" min={0} defaultValue={activeSociety?.totalOffices ?? 0} required />
                  <NumberInput label="Floors" name="totalFloors" min={1} defaultValue={activeSociety?.totalFloors ?? 1} required />
                  <NumberInput
                    label="Wings"
                    name="totalWings"
                    min={0}
                    defaultValue={activeSociety?.totalWings ?? 0}
                    required={hasWingsEnabled}
                    disabled={!hasWingsEnabled}
                  />
                </div>
                {!hasWingsEnabled && (
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Single-tower mode enabled. Wing creation will be disabled for this society.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="m-0 text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2 pb-2 border-b border-[var(--border-light)]">🅿️ Parking Capacity <span className="text-xs font-normal text-[var(--text-tertiary)]">(Optional)</span></h4>
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput label="Two-Wheeler Spots" name="twoWheelerParkingCapacity" min={0} defaultValue={activeSociety?.twoWheelerParkingCapacity ?? ''} />
                  <NumberInput label="Four-Wheeler Spots" name="fourWheelerParkingCapacity" min={0} defaultValue={activeSociety?.fourWheelerParkingCapacity ?? ''} />
                </div>
              </div>

              <div className="flex justify-end gap-[10px] pt-3 border-t border-[var(--border-light)]">
                <NeonSweepButton tone="slate" size="md" type="button" onClick={() => { setShowModal(false); setShowPassword(false) }}>
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton
                  tone="cyan"
                  size="md"
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || assignMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending || assignMutation.isPending) ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#03141d]/70 border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    editingAdmin ? 'Update Admin' : assignmentSociety ? 'Assign Admin' : 'Create Society + Admin'
                  )}
                </NeonSweepButton>
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
