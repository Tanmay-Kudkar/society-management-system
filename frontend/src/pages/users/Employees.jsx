import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context'
import { useToast } from '../../context'
import { employeeApi, attendanceApi, employeeSalaryPaymentApi, userApi, downloadBlob } from '../../../../api'
import { Users, CalendarCheck2, Wallet, BadgeCheck, Paperclip } from 'lucide-react'
import { NeonSweepButton } from '../../components'

const ATTENDANCE_STATUS = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE']
const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/

const getApiErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (typeof data === 'string' && data.trim()) return data
  if (data?.message) return data.message
  if (data?.error) return data.error
  return fallback
}

const canManageAttendance = (role) => (
  ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER'].includes(role)
)

const formatFileSize = (size) => {
  const bytes = Number(size || 0)
  if (!bytes) return '0 B'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

export default function Employees() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10))
  const [attendanceStatus, setAttendanceStatus] = useState('PRESENT')
  const [remarks, setRemarks] = useState('')
  const [salaryEmployeeId, setSalaryEmployeeId] = useState('')
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 10))
  const [baseSalary, setBaseSalary] = useState('')
  const [deductionAmount, setDeductionAmount] = useState('0')
  const [deductionReason, setDeductionReason] = useState('')
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER')
  const [createUserId, setCreateUserId] = useState('')
  const [createNewEmployeeUser, setCreateNewEmployeeUser] = useState(false)
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('')
  const [newEmployeePassword, setNewEmployeePassword] = useState('')
  const [newEmployeePhone, setNewEmployeePhone] = useState('')
  const [createDepartment, setCreateDepartment] = useState('')
  const [createDesignation, setCreateDesignation] = useState('')
  const [createJoiningDate, setCreateJoiningDate] = useState(new Date().toISOString().slice(0, 10))
  const [createSalary, setCreateSalary] = useState('')
  const [createIdProofType, setCreateIdProofType] = useState('')
  const [createIdProofNumber, setCreateIdProofNumber] = useState('')
  const [createIdProofFile, setCreateIdProofFile] = useState(null)
  const [downloadingEmployeeId, setDownloadingEmployeeId] = useState(null)

  const societyIdFromUrl = Number(searchParams.get('society'))
  const scopedSocietyId = user?.role === 'MASTER_ADMIN' && Number.isInteger(societyIdFromUrl) && societyIdFromUrl > 0
    ? societyIdFromUrl
    : null
  const effectiveSocietyId = scopedSocietyId || user?.societyId

  const { data: employeePage, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees', effectiveSocietyId, user?.id],
    queryFn: () => employeeApi.getBySociety(effectiveSocietyId, user.id, { page: 0, size: 200 }).then((res) => res.data),
    enabled: !!effectiveSocietyId && !!user?.id,
  })

  const employees = useMemo(() => employeePage?.content || [], [employeePage])

  const { data: societyUsers = [] } = useQuery({
    queryKey: ['users-by-society', effectiveSocietyId],
    queryFn: () => userApi.getBySociety(effectiveSocietyId).then((res) => res.data),
    enabled: !!effectiveSocietyId,
  })

  const availableEmployeeUsers = useMemo(() => {
    const linked = new Set(employees.map((emp) => emp.userId))
    return societyUsers.filter((candidate) => candidate.role === 'EMPLOYEE' && !linked.has(candidate.id))
  }, [employees, societyUsers])

  const { data: attendancePage, isLoading: loadingAttendance } = useQuery({
    queryKey: ['employee-attendance', effectiveSocietyId, attendanceDate, user?.id],
    queryFn: () => attendanceApi.getBySociety(effectiveSocietyId, user.id, {
      fromDate: attendanceDate,
      toDate: attendanceDate,
      page: 0,
      size: 400,
    }).then((res) => res.data),
    enabled: !!effectiveSocietyId && !!user?.id,
  })

  const attendanceRows = useMemo(() => attendancePage?.content || [], [attendancePage])

  const { data: salaryPaymentPage } = useQuery({
    queryKey: ['employee-salary-payments', effectiveSocietyId, user?.id],
    queryFn: () => employeeSalaryPaymentApi.getBySociety(effectiveSocietyId, user.id, {
      page: 0,
      size: 50,
    }).then((res) => res.data),
    enabled: !!effectiveSocietyId && !!user?.id,
  })

  const salaryPayments = useMemo(() => salaryPaymentPage?.content || [], [salaryPaymentPage])

  const markAttendanceMutation = useMutation({
    mutationFn: (payload) => attendanceApi.markAttendance(payload.employeeId, payload.data, user.id),
    onSuccess: () => {
      toast.success('Attendance saved')
      queryClient.invalidateQueries({ queryKey: ['employee-attendance', effectiveSocietyId] })
      setRemarks('')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to save attendance')
    },
  })

  const createEmployeeMutation = useMutation({
    mutationFn: (payload) => employeeApi.create(payload, user.id),
    onSuccess: () => {
      toast.success('Employee profile created')
      queryClient.invalidateQueries({ queryKey: ['employees', effectiveSocietyId, user?.id] })
      queryClient.invalidateQueries({ queryKey: ['users-by-society', effectiveSocietyId] })
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create employee profile')
    },
  })

  const recordSalaryPaymentMutation = useMutation({
    mutationFn: (payload) => employeeSalaryPaymentApi.recordPayment(payload.employeeId, payload.data, user.id),
    onSuccess: () => {
      toast.success('Salary payment recorded')
      queryClient.invalidateQueries({ queryKey: ['employee-salary-payments', effectiveSocietyId] })
      setDeductionReason('')
      setDeductionAmount('0')
      setBaseSalary('')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to record salary payment')
    },
  })

  const attendanceByEmployeeId = useMemo(() => {
    const map = new Map()
    attendanceRows.forEach((item) => {
      map.set(item.employeeId, item)
    })
    return map
  }, [attendanceRows])

  const stats = useMemo(() => {
    const presentCount = attendanceRows.filter((entry) => entry.status === 'PRESENT').length
    const activeCount = employees.filter((entry) => entry.isActive).length
    const totalSalary = employees.reduce((sum, entry) => sum + Number(entry.monthlySalary || 0), 0)
    const totalAdvance = employees.reduce((sum, entry) => sum + Number(entry.advanceBalance || 0), 0)

    return {
      totalEmployees: employees.length,
      activeEmployees: activeCount,
      presentCount,
      totalSalary,
      totalAdvance,
    }
  }, [employees, attendanceRows])

  const handleMarkAttendance = (event) => {
    event.preventDefault()

    if (!selectedEmployeeId) {
      toast.error('Select an employee first')
      return
    }

    markAttendanceMutation.mutate({
      employeeId: Number(selectedEmployeeId),
      data: {
        attendanceDate,
        status: attendanceStatus,
        remarks: remarks || undefined,
      },
    })
  }

  const handleRecordSalaryPayment = (event) => {
    event.preventDefault()

    if (!salaryEmployeeId) {
      toast.error('Select an employee for salary payment')
      return
    }

    if (!baseSalary || Number(baseSalary) <= 0) {
      toast.error('Base salary should be greater than zero')
      return
    }

    recordSalaryPaymentMutation.mutate({
      employeeId: Number(salaryEmployeeId),
      data: {
        salaryMonth,
        baseSalary: Number(baseSalary),
        deductionAmount: Number(deductionAmount || 0),
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMode,
        deductionReason: deductionReason || undefined,
      },
    })
  }

  const handleCreateEmployee = async (event) => {
    event.preventDefault()

    if (!createDepartment || !createDesignation) {
      toast.error('Department and designation are required')
      return
    }

    try {
      let employeeUserId = Number(createUserId)

      if (createNewEmployeeUser) {
        if (!newEmployeeName || !newEmployeeEmail || !newEmployeePassword || !newEmployeePhone) {
          toast.error('Name, email, password and phone are required to create an employee user')
          return
        }

        const normalizedName = newEmployeeName.trim()
        const normalizedEmail = newEmployeeEmail.trim()
        const normalizedPhone = newEmployeePhone.trim()

        if (normalizedName.length < 2 || normalizedName.length > 100) {
          toast.error('Name must be between 2 and 100 characters')
          return
        }

        if (newEmployeePassword.length < 6 || newEmployeePassword.length > 50) {
          toast.error('Password must be between 6 and 50 characters')
          return
        }

        if (!PHONE_REGEX.test(normalizedPhone)) {
          toast.error('Invalid phone number format. Use 10-digit mobile number starting with 6-9')
          return
        }

        const userCreateResponse = await userApi.create({
          name: normalizedName,
          email: normalizedEmail,
          password: newEmployeePassword,
          role: 'EMPLOYEE',
          phone: normalizedPhone,
          societyId: effectiveSocietyId,
          flatId: null,
        })

        employeeUserId = userCreateResponse?.data?.id
        if (!employeeUserId) {
          throw new Error('Failed to create employee user')
        }
      }

      if (!employeeUserId) {
        toast.error('Select an employee user or create a new one')
        return
      }

      const response = await createEmployeeMutation.mutateAsync({
        userId: employeeUserId,
        societyId: effectiveSocietyId,
        department: createDepartment,
        designation: createDesignation,
        joiningDate: createJoiningDate || undefined,
        monthlySalary: createSalary ? Number(createSalary) : undefined,
        idProofType: createIdProofType || undefined,
        idProofNumber: createIdProofNumber || undefined,
      })

      const employeeId = response?.data?.id
      if (employeeId && createIdProofFile) {
        await employeeApi.uploadIdProofDocument(
          employeeId,
          createIdProofFile,
          user.id,
          createIdProofType || undefined,
          createIdProofNumber || undefined,
        )
      }

      setCreateUserId('')
      setCreateNewEmployeeUser(false)
      setNewEmployeeName('')
      setNewEmployeeEmail('')
      setNewEmployeePassword('')
      setNewEmployeePhone('')
      setCreateDepartment('')
      setCreateDesignation('')
      setCreateSalary('')
      setCreateIdProofType('')
      setCreateIdProofNumber('')
      setCreateIdProofFile(null)
      queryClient.invalidateQueries({ queryKey: ['users-by-society', effectiveSocietyId] })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create employee user/profile'))
    }
  }

  const handleDownloadIdProof = async (employee) => {
    try {
      setDownloadingEmployeeId(employee.id)
      const response = await employeeApi.downloadIdProofDocument(employee.id, user.id)
      const fallbackName = `employee-${employee.id}-id-proof`
      const fileName = employee.idProofDocumentFileName || fallbackName
      downloadBlob(response.data, fileName)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to download ID proof')
    } finally {
      setDownloadingEmployeeId(null)
    }
  }

  return (
    <div className="space-y-6 max-[360px]:space-y-4">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between max-[360px]:mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] max-[360px]:text-[1.45rem]">Employee Records</h1>
          <p className="text-sm text-[var(--text-secondary)] max-[360px]:text-xs">
            HR-only records for salary, ID proof, advance balances, and attendance.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 max-[360px]:mb-4 max-[360px]:gap-2">
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm max-[360px]:p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-500/15 p-2"><Users className="h-5 w-5 text-sky-400" /></div>
            <div>
              <p className="text-2xl font-semibold text-[var(--text-primary)] max-[360px]:text-xl">{stats.totalEmployees}</p>
              <p className="text-sm text-[var(--text-tertiary)] max-[360px]:text-xs">Total Employees ({stats.activeEmployees} active)</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm max-[360px]:p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/15 p-2"><CalendarCheck2 className="h-5 w-5 text-emerald-400" /></div>
            <div>
              <p className="text-2xl font-semibold text-[var(--text-primary)] max-[360px]:text-xl">{stats.presentCount}</p>
              <p className="text-sm text-[var(--text-tertiary)] max-[360px]:text-xs">Present ({attendanceDate})</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm max-[360px]:p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/15 p-2"><Wallet className="h-5 w-5 text-amber-400" /></div>
            <div>
              <p className="text-2xl font-semibold text-[var(--text-primary)] max-[360px]:text-xl">INR {stats.totalSalary.toFixed(0)}</p>
              <p className="text-sm text-[var(--text-tertiary)] max-[360px]:text-xs">Monthly Salary Outflow</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm max-[360px]:p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-500/15 p-2"><BadgeCheck className="h-5 w-5 text-violet-400" /></div>
            <div>
              <p className="text-2xl font-semibold text-[var(--text-primary)] max-[360px]:text-xl">INR {stats.totalAdvance.toFixed(0)}</p>
              <p className="text-sm text-[var(--text-tertiary)] max-[360px]:text-xs">Advance Outstanding</p>
            </div>
          </div>
        </div>
      </div>

      {canManageAttendance(user?.role) && (
        <form onSubmit={handleCreateEmployee} className="mb-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm max-[360px]:mb-4 max-[360px]:p-3">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] max-[360px]:text-base">Create Employee Profile</h2>
            <p className="text-sm text-[var(--text-secondary)] max-[360px]:text-xs">Create EMPLOYEE user and HR profile in one place, with optional ID-proof attachment.</p>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={createNewEmployeeUser}
                onChange={(event) => setCreateNewEmployeeUser(event.target.checked)}
                className="h-4 w-4"
              />
              Create new EMPLOYEE user here
            </label>
            {!createNewEmployeeUser && availableEmployeeUsers.length === 0 && (
              <span className="text-xs text-amber-600">No unlinked EMPLOYEE users found. Enable this option to create one.</span>
            )}
          </div>

          {createNewEmployeeUser ? (
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <input type="text" value={newEmployeeName} onChange={(event) => setNewEmployeeName(event.target.value)} placeholder="Employee name" className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]" />
              <input type="email" value={newEmployeeEmail} onChange={(event) => setNewEmployeeEmail(event.target.value)} placeholder="Employee email" className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]" />
              <input type="password" value={newEmployeePassword} onChange={(event) => setNewEmployeePassword(event.target.value)} placeholder="Password" className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]" />
              <input type="text" value={newEmployeePhone} onChange={(event) => setNewEmployeePhone(event.target.value)} placeholder="Phone" className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]" />
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {!createNewEmployeeUser ? (
              <select value={createUserId} onChange={(event) => setCreateUserId(event.target.value)} className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]">
                <option value="">Select employee user</option>
                {availableEmployeeUsers.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>{candidate.name} ({candidate.email})</option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border-light)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                Employee user will be created from the details above.
              </div>
            )}
            <input type="text" value={createDepartment} onChange={(event) => setCreateDepartment(event.target.value)} placeholder="Department" className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]" />
            <input type="text" value={createDesignation} onChange={(event) => setCreateDesignation(event.target.value)} placeholder="Designation" className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]" />
            <input type="date" value={createJoiningDate} onChange={(event) => setCreateJoiningDate(event.target.value)} className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]" />
            <input type="number" min="0" step="0.01" value={createSalary} onChange={(event) => setCreateSalary(event.target.value)} placeholder="Monthly salary" className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]" />
            <input type="text" value={createIdProofType} onChange={(event) => setCreateIdProofType(event.target.value)} placeholder="ID Proof Type" className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]" />
            <input type="text" value={createIdProofNumber} onChange={(event) => setCreateIdProofNumber(event.target.value)} placeholder="ID Proof Number" className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]" />
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(event) => setCreateIdProofFile(event.target.files?.[0] || null)}
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]"
            />
          </div>
          <div className="mt-3">
            <NeonSweepButton type="submit" tone="violet" size="md" disabled={createEmployeeMutation.isPending} className="w-full sm:w-auto">
              {createEmployeeMutation.isPending ? 'Creating...' : 'Create Employee'}
            </NeonSweepButton>
          </div>
        </form>
      )}

      {canManageAttendance(user?.role) && (
        <form onSubmit={handleMarkAttendance} className="mb-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm max-[360px]:mb-4 max-[360px]:p-3">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] max-[360px]:text-base">Mark Attendance</h2>
            <p className="text-sm text-[var(--text-secondary)] max-[360px]:text-xs">Only management roles can create or update attendance records.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <select
              value={selectedEmployeeId}
              onChange={(event) => setSelectedEmployeeId(event.target.value)}
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]"
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.userName} ({emp.employeeCode || 'No code'})</option>
              ))}
            </select>
            <input
              type="date"
              value={attendanceDate}
              onChange={(event) => setAttendanceDate(event.target.value)}
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]"
            />
            <select
              value={attendanceStatus}
              onChange={(event) => setAttendanceStatus(event.target.value)}
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]"
            >
              {ATTENDANCE_STATUS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <input
              type="text"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Remarks (optional)"
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]"
            />
          </div>
          <div className="mt-3">
            <NeonSweepButton
              type="submit"
              disabled={markAttendanceMutation.isPending}
              tone="cyan"
              size="md"
              className="w-full sm:w-auto"
            >
              {markAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
            </NeonSweepButton>
          </div>
        </form>
      )}

      {canManageAttendance(user?.role) && (
        <form onSubmit={handleRecordSalaryPayment} className="mb-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm max-[360px]:mb-4 max-[360px]:p-3">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] max-[360px]:text-base">Record Salary Payment</h2>
            <p className="text-sm text-[var(--text-secondary)] max-[360px]:text-xs">Track salary structure, deductions, and payment history.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <select
              value={salaryEmployeeId}
              onChange={(event) => setSalaryEmployeeId(event.target.value)}
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]"
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.userName}</option>
              ))}
            </select>
            <input
              type="date"
              value={salaryMonth}
              onChange={(event) => setSalaryMonth(event.target.value)}
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={baseSalary}
              onChange={(event) => setBaseSalary(event.target.value)}
              placeholder="Base salary"
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={deductionAmount}
              onChange={(event) => setDeductionAmount(event.target.value)}
              placeholder="Deduction"
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]"
            />
            <input
              type="text"
              value={deductionReason}
              onChange={(event) => setDeductionReason(event.target.value)}
              placeholder="Deduction reason"
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]"
            />
            <select
              value={paymentMode}
              onChange={(event) => setPaymentMode(event.target.value)}
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)]"
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
          <div className="mt-3">
            <NeonSweepButton
              type="submit"
              disabled={recordSalaryPaymentMutation.isPending}
              tone="cyan"
              size="md"
              className="w-full sm:w-auto"
            >
              {recordSalaryPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
            </NeonSweepButton>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="bg-[var(--bg-muted)]">
              <tr>
                <th className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-tertiary)]">Employee</th>
                <th className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-tertiary)]">Department</th>
                <th className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-tertiary)]">Salary</th>
                <th className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-tertiary)]">ID Proof</th>
                <th className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-tertiary)]">Advance</th>
                <th className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-tertiary)]">Attendance ({attendanceDate})</th>
                <th className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-tertiary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const attendance = attendanceByEmployeeId.get(emp.id)
                return (
                  <tr key={emp.id} className="hover:bg-[var(--bg-soft)]/40">
                    <td className="border-b border-[var(--border-default)] px-4 py-3">
                      <div className="font-medium text-[var(--text-primary)]">{emp.userName}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">{emp.employeeCode || 'No code'}</div>
                    </td>
                    <td className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-secondary)]">{emp.department || '-'}</td>
                    <td className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-secondary)]">INR {Number(emp.monthlySalary || 0).toFixed(0)}</td>
                    <td className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-secondary)]">
                      <div>{emp.idProofType || '-'} {emp.idProofNumber ? `(${emp.idProofNumber})` : ''}</div>
                      {emp.hasIdProofDocument && (
                        <div className="mt-1 inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400">
                          <Paperclip className="h-3 w-3" />
                          <span className="max-w-[220px] truncate">{emp.idProofDocumentFileName || 'Attached file'} ({formatFileSize(emp.idProofDocumentSize)})</span>
                        </div>
                      )}
                    </td>
                    <td className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-secondary)]">INR {Number(emp.advanceBalance || 0).toFixed(0)}</td>
                    <td className="border-b border-[var(--border-default)] px-4 py-3">
                      <span className="rounded-full border border-slate-500/40 bg-slate-500/10 px-2 py-1 text-xs text-[var(--text-secondary)]">
                        {attendance?.status || 'NOT_MARKED'}
                      </span>
                    </td>
                    <td className="border-b border-[var(--border-default)] px-4 py-3">
                      {emp.hasIdProofDocument ? (
                        <NeonSweepButton
                          type="button"
                          onClick={() => handleDownloadIdProof(emp)}
                          disabled={downloadingEmployeeId === emp.id}
                          tone="cyan"
                          size="sm"
                        >
                          {downloadingEmployeeId === emp.id ? 'Downloading...' : 'Download ID Proof'}
                        </NeonSweepButton>
                      ) : (
                        <span className="text-xs text-[var(--text-tertiary)]">No file</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {!loadingEmployees && !loadingAttendance && employees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[var(--text-tertiary)]">
                    No employee records found for this society.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {employees.map((emp) => {
            const attendance = attendanceByEmployeeId.get(emp.id)
            return (
              <div key={emp.id} className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{emp.userName}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{emp.employeeCode || 'No code'}</p>
                  </div>
                  <span className="rounded-full border border-slate-500/40 bg-slate-500/10 px-2 py-1 text-[10px] text-[var(--text-secondary)]">
                    {attendance?.status || 'NOT_MARKED'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <p className="text-[var(--text-tertiary)]">Department: <span className="text-[var(--text-secondary)]">{emp.department || '-'}</span></p>
                  <p className="text-[var(--text-tertiary)]">Salary: <span className="text-[var(--text-secondary)]">INR {Number(emp.monthlySalary || 0).toFixed(0)}</span></p>
                  <p className="text-[var(--text-tertiary)]">Advance: <span className="text-[var(--text-secondary)]">INR {Number(emp.advanceBalance || 0).toFixed(0)}</span></p>
                  <p className="text-[var(--text-tertiary)]">ID Proof: <span className="text-[var(--text-secondary)]">{emp.idProofType || '-'}</span></p>
                </div>
                {emp.hasIdProofDocument && (
                  <div className="mt-2 inline-flex max-w-full items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400">
                    <Paperclip className="h-3 w-3" />
                    <span className="truncate">{emp.idProofDocumentFileName || 'Attached file'} ({formatFileSize(emp.idProofDocumentSize)})</span>
                  </div>
                )}
                <div className="mt-3">
                  {emp.hasIdProofDocument ? (
                    <NeonSweepButton
                      type="button"
                      onClick={() => handleDownloadIdProof(emp)}
                      disabled={downloadingEmployeeId === emp.id}
                      tone="cyan"
                      size="sm"
                      className="w-full"
                    >
                      {downloadingEmployeeId === emp.id ? 'Downloading...' : 'Download ID Proof'}
                    </NeonSweepButton>
                  ) : (
                    <span className="text-xs text-[var(--text-tertiary)]">No file</span>
                  )}
                </div>
              </div>
            )
          })}
          {!loadingEmployees && !loadingAttendance && employees.length === 0 && (
            <div className="px-2 py-8 text-center text-sm text-[var(--text-tertiary)]">
              No employee records found for this society.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm">
        <div className="border-b border-[var(--border-default)] px-4 py-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Salary Payments</h2>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="bg-[var(--bg-muted)]">
              <tr>
                <th className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-tertiary)]">Employee</th>
                <th className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-tertiary)]">Month</th>
                <th className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-tertiary)]">Base</th>
                <th className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-tertiary)]">Deduction</th>
                <th className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-tertiary)]">Net Paid</th>
                <th className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-tertiary)]">Mode</th>
              </tr>
            </thead>
            <tbody>
              {salaryPayments.map((entry) => (
                <tr key={entry.id} className="hover:bg-[var(--bg-soft)]/40">
                  <td className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-primary)]">{entry.employeeName}</td>
                  <td className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-secondary)]">{entry.salaryMonth}</td>
                  <td className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-secondary)]">INR {Number(entry.baseSalary || 0).toFixed(0)}</td>
                  <td className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-secondary)]">INR {Number(entry.deductionAmount || 0).toFixed(0)}</td>
                  <td className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-secondary)]">INR {Number(entry.netPaid || 0).toFixed(0)}</td>
                  <td className="border-b border-[var(--border-default)] px-4 py-3 text-[var(--text-secondary)]">{entry.paymentMode || '-'}</td>
                </tr>
              ))}
              {salaryPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-tertiary)]">
                    No salary payment history available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {salaryPayments.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] p-3 text-xs">
              <p className="font-semibold text-[var(--text-primary)]">{entry.employeeName}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[var(--text-secondary)]">
                <p>Month: {entry.salaryMonth}</p>
                <p>Mode: {entry.paymentMode || '-'}</p>
                <p>Base: INR {Number(entry.baseSalary || 0).toFixed(0)}</p>
                <p>Deduction: INR {Number(entry.deductionAmount || 0).toFixed(0)}</p>
                <p className="col-span-2">Net Paid: INR {Number(entry.netPaid || 0).toFixed(0)}</p>
              </div>
            </div>
          ))}
          {salaryPayments.length === 0 && (
            <div className="px-2 py-8 text-center text-sm text-[var(--text-tertiary)]">
              No salary payment history available.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
