import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Building2, Save, SlidersHorizontal } from 'lucide-react'
import { societyApi, societySettingApi } from '../../../../api'
import { useAuth, useToast } from '../../context'
import { FormInput, PermissionDenied, InfoTooltip, NeonSweepButton } from '../../components'
import { HeroSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const defaultForm = {
  maintenanceRatePerSqft: 0,
  waterChargesFixed: 0,
  waterChargesPerPerson: 0,
  sinkingFundPerSqft: 0,
  repairFundPerSqft: 0,
  parkingChargeOpen: 0,
  parkingChargeCovered: 0,
  parkingChargeStilt: 0,
  parkingChargeTwoWheeler: 0,
  liftMaintenanceCharge: 0,
  electricityCommonCharge: 0,
  securityCharge: 0,
  insuranceCharge: 0,
  clubHouseCharge: 0,
  propertyTaxShare: 0,
  nonOccupancySurchargePct: 0,
  gstPercentage: 0,
  latePaymentInterestPct: 0,
  gracePeriodDays: 5,
  penaltyFixed: 0,
  billGenerationDay: 1,
  dueDateDay: 10,
  financialYearStartMonth: 4,
  billNumberPrefix: 'BILL',
  receiptNumberPrefix: 'RCT',
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  upiId: '',
  paymentLink: '',
  committeeElectionStartDate: '',
  committeeElectionEndDate: '',
}

const defaultPreviewInput = {
  areaSqft: 1000,
  isOccupied: true,
  occupantCount: 3,
  twoWheelerCount: 1,
  fourWheelerOpenCount: 0,
  fourWheelerCoveredCount: 1,
  fourWheelerStiltCount: 0,
}

const amountFields = [
  { key: 'maintenanceRatePerSqft', label: 'Maintenance Rate / SqFt' },
  { key: 'waterChargesFixed', label: 'Water Charges (Fixed)' },
  { key: 'waterChargesPerPerson', label: 'Water Charges / Person' },
  { key: 'sinkingFundPerSqft', label: 'Sinking Fund / SqFt' },
  { key: 'repairFundPerSqft', label: 'Repair Fund / SqFt' },
  { key: 'parkingChargeOpen', label: 'Parking (Open)' },
  { key: 'parkingChargeCovered', label: 'Parking (Covered)' },
  { key: 'parkingChargeStilt', label: 'Parking (Stilt)' },
  { key: 'parkingChargeTwoWheeler', label: 'Parking (Two Wheeler)' },
  { key: 'liftMaintenanceCharge', label: 'Lift Maintenance' },
  { key: 'electricityCommonCharge', label: 'Electricity (Common)' },
  { key: 'securityCharge', label: 'Security Charge' },
  { key: 'insuranceCharge', label: 'Insurance Charge' },
  { key: 'clubHouseCharge', label: 'Club House Charge' },
  { key: 'propertyTaxShare', label: 'Property Tax Share' },
  { key: 'penaltyFixed', label: 'Penalty (Fixed)' },
]

const percentageFields = [
  { key: 'nonOccupancySurchargePct', label: 'Non Occupancy Surcharge %' },
  { key: 'gstPercentage', label: 'GST %' },
  { key: 'latePaymentInterestPct', label: 'Late Payment Interest %' },
]

const scheduleFields = [
  { key: 'gracePeriodDays', label: 'Grace Period (Days)', min: 0, max: 90 },
  { key: 'billGenerationDay', label: 'Bill Generation Day', min: 1, max: 31 },
  { key: 'dueDateDay', label: 'Due Date Day', min: 1, max: 31 },
  { key: 'financialYearStartMonth', label: 'FY Start Month', min: 1, max: 12 },
]

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export default function SocietySettings() {
  const { user, hasRole } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState(defaultForm)
  const [previewInput, setPreviewInput] = useState(defaultPreviewInput)
  const [errors, setErrors] = useState({})

  const canManageSettings = hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER')
  const isMasterAdmin = user?.role === 'MASTER_ADMIN'

  const societyIdFromUrl = searchParams.get('society')
  const parsedSocietyIdFromUrl = Number(societyIdFromUrl)
  const hasValidSocietyIdInUrl = Number.isInteger(parsedSocietyIdFromUrl) && parsedSocietyIdFromUrl > 0
  const effectiveSocietyId = useMemo(
    () => (isMasterAdmin ? (hasValidSocietyIdInUrl ? parsedSocietyIdFromUrl : null) : user?.societyId || null),
    [hasValidSocietyIdInUrl, isMasterAdmin, parsedSocietyIdFromUrl, user?.societyId]
  )

  const {
    data: scopedSociety,
    isError: isScopedSocietyMissing,
    isLoading: isScopedSocietyLoading,
  } = useQuery({
    queryKey: ['society-exists', effectiveSocietyId],
    queryFn: () => societyApi.getById(effectiveSocietyId).then((res) => res.data),
    enabled: isMasterAdmin && !!effectiveSocietyId,
    retry: false,
  })

  const invalidUrlSociety = isMasterAdmin && !!societyIdFromUrl && (!hasValidSocietyIdInUrl || isScopedSocietyMissing)

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['society-settings', effectiveSocietyId],
    queryFn: () => societySettingApi.getBySocietyId(effectiveSocietyId, user.id).then((res) => res.data),
    enabled: canManageSettings
      && !!effectiveSocietyId
      && !!user?.id
      && (!isMasterAdmin || !!scopedSociety)
      && !invalidUrlSociety,
  })

  useEffect(() => {
    if (!settings) return
    setForm({
      ...defaultForm,
      ...settings,
      billNumberPrefix: settings.billNumberPrefix || 'BILL',
      receiptNumberPrefix: settings.receiptNumberPrefix || 'RCT',
    })
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: (payload) => societySettingApi.upsertBySocietyId(effectiveSocietyId, payload, user.id),
    onSuccess: (response) => {
      const saved = response?.data
      if (saved) {
        setForm({
          ...defaultForm,
          ...saved,
          billNumberPrefix: saved.billNumberPrefix ?? 'BILL',
          receiptNumberPrefix: saved.receiptNumberPrefix ?? 'RCT',
        })
      }
      queryClient.invalidateQueries({ queryKey: ['society-settings', effectiveSocietyId] })
      toast.success('Society settings updated successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update settings')
    },
  })

  const showSkeleton = useMinLoadingTime(isLoading || isScopedSocietyLoading)

  const previewMath = useMemo(() => {
    const area = Math.max(0, toNumber(previewInput.areaSqft, 0))
    const isOccupied = !!previewInput.isOccupied
    const occupantCount = isOccupied ? Math.max(0, Math.floor(toNumber(previewInput.occupantCount, 0))) : 0
    const twoWheelerCount = isOccupied ? Math.max(0, Math.floor(toNumber(previewInput.twoWheelerCount, 0))) : 0
    const fourWheelerOpenCount = isOccupied ? Math.max(0, Math.floor(toNumber(previewInput.fourWheelerOpenCount, 0))) : 0
    const fourWheelerCoveredCount = isOccupied ? Math.max(0, Math.floor(toNumber(previewInput.fourWheelerCoveredCount, 0))) : 0
    const fourWheelerStiltCount = isOccupied ? Math.max(0, Math.floor(toNumber(previewInput.fourWheelerStiltCount, 0))) : 0

    const lines = [
      {
        key: 'maintenance',
        label: 'Maintenance charge',
        amount: toNumber(form.maintenanceRatePerSqft) * area,
        taxable: true,
      },
      {
        key: 'sinking',
        label: 'Sinking fund',
        amount: toNumber(form.sinkingFundPerSqft) * area,
        taxable: false,
      },
      {
        key: 'repair',
        label: 'Repair fund',
        amount: toNumber(form.repairFundPerSqft) * area,
        taxable: false,
      },
      {
        key: 'waterFixed',
        label: 'Water charges (fixed)',
        amount: toNumber(form.waterChargesFixed),
        taxable: true,
      },
      {
        key: 'waterPerPerson',
        label: 'Water charges (per person)',
        amount: toNumber(form.waterChargesPerPerson) * occupantCount,
        taxable: true,
      },
      {
        key: 'parkingTwoW',
        label: 'Parking (two-wheeler)',
        amount: toNumber(form.parkingChargeTwoWheeler) * twoWheelerCount,
        taxable: true,
      },
      {
        key: 'parkingOpen',
        label: 'Parking (open)',
        amount: toNumber(form.parkingChargeOpen) * fourWheelerOpenCount,
        taxable: true,
      },
      {
        key: 'parkingCovered',
        label: 'Parking (covered)',
        amount: toNumber(form.parkingChargeCovered) * fourWheelerCoveredCount,
        taxable: true,
      },
      {
        key: 'parkingStilt',
        label: 'Parking (stilt)',
        amount: toNumber(form.parkingChargeStilt) * fourWheelerStiltCount,
        taxable: true,
      },
      {
        key: 'lift',
        label: 'Lift maintenance',
        amount: toNumber(form.liftMaintenanceCharge),
        taxable: true,
      },
      {
        key: 'electricity',
        label: 'Common electricity',
        amount: toNumber(form.electricityCommonCharge),
        taxable: true,
      },
      {
        key: 'security',
        label: 'Security charge',
        amount: toNumber(form.securityCharge),
        taxable: true,
      },
      {
        key: 'insurance',
        label: 'Insurance',
        amount: toNumber(form.insuranceCharge),
        taxable: false,
      },
      {
        key: 'club',
        label: 'Club house',
        amount: toNumber(form.clubHouseCharge),
        taxable: true,
      },
      {
        key: 'propertyTax',
        label: 'Property tax share',
        amount: toNumber(form.propertyTaxShare),
        taxable: false,
      },
    ]

    if (!isOccupied) {
      const maintenanceBase = lines.find((line) => line.key === 'maintenance')?.amount || 0
      const surchargeAmount = maintenanceBase * (toNumber(form.nonOccupancySurchargePct) / 100)
      lines.push({
        key: 'nonOccupancy',
        label: `Non-occupancy surcharge @ ${toNumber(form.nonOccupancySurchargePct)}%`,
        amount: surchargeAmount,
        taxable: false,
      })
    }

    const subtotal = lines.reduce((sum, line) => sum + (line.amount > 0 ? line.amount : 0), 0)
    const taxableBase = lines.reduce(
      (sum, line) => sum + (line.taxable && line.amount > 0 ? line.amount : 0),
      0,
    )
    const gstAmount = taxableBase * (toNumber(form.gstPercentage) / 100)
    const total = subtotal + gstAmount

    return {
      lines: lines.filter((line) => line.amount > 0),
      subtotal,
      taxableBase,
      gstAmount,
      total,
    }
  }, [form, previewInput])

  if (!canManageSettings) {
    return <PermissionDenied message="You don't have permission to manage society settings" />
  }

  const fieldHints = {
    maintenanceRatePerSqft: 'Base monthly maintenance rate per square foot',
    waterChargesFixed: 'Fixed monthly water amount',
    waterChargesPerPerson: 'Use if billing water per person',
    sinkingFundPerSqft: 'Long-term reserve contribution per square foot',
    repairFundPerSqft: 'Repair reserve contribution per square foot',
    parkingChargeOpen: 'Monthly open parking charge',
    parkingChargeCovered: 'Monthly covered parking charge',
    parkingChargeStilt: 'Monthly stilt parking charge',
    parkingChargeTwoWheeler: 'Monthly two-wheeler parking charge',
    liftMaintenanceCharge: 'Monthly lift maintenance amount',
    electricityCommonCharge: 'Monthly common-area electricity amount',
    securityCharge: 'Monthly security amount',
    insuranceCharge: 'Monthly insurance share',
    clubHouseCharge: 'Monthly club house charge',
    propertyTaxShare: 'Monthly property tax allocation',
    penaltyFixed: 'Flat penalty applied after grace period',
    nonOccupancySurchargePct: 'Applied for non-occupied units',
    gstPercentage: 'Tax rate for taxable line items',
    latePaymentInterestPct: 'Monthly late payment interest rate',
    gracePeriodDays: 'Allowed days after due date before penalty/interest',
    billGenerationDay: 'Calendar day of month to generate bills (1-31)',
    dueDateDay: 'Calendar day of month due date is set (1-31)',
    financialYearStartMonth: '1=Jan, 4=Apr, 12=Dec',
    billNumberPrefix: 'Used as prefix for generated bill numbers',
    receiptNumberPrefix: 'Used as prefix for generated receipt numbers',
    accountHolderName: 'Beneficiary/account holder name for invoice payment details',
    bankName: 'Bank name shown in invoice payment details',
    accountNumber: 'Bank account number shown in invoice payment details',
    ifscCode: 'IFSC code shown in invoice payment details',
    upiId: 'UPI ID shown in invoice payment details',
    paymentLink: 'Payment URL used for invoice QR code and quick pay',
    committeeElectionStartDate: 'Start date of committee election period (optional)',
    committeeElectionEndDate: 'End date of committee election period (optional)',
  }

  const validateForm = (payload) => {
    const nextErrors = {}

    ;[
      ...amountFields.map((f) => f.key),
      ...percentageFields.map((f) => f.key),
    ].forEach((key) => {
      if (payload[key] < 0) {
        nextErrors[key] = 'Value cannot be negative'
      }
    })

    if (payload.gracePeriodDays < 0 || payload.gracePeriodDays > 90) {
      nextErrors.gracePeriodDays = 'Grace period must be between 0 and 90'
    }
    if (payload.billGenerationDay < 1 || payload.billGenerationDay > 31) {
      nextErrors.billGenerationDay = 'Bill generation day must be between 1 and 31'
    }
    if (payload.dueDateDay < 1 || payload.dueDateDay > 31) {
      nextErrors.dueDateDay = 'Due date day must be between 1 and 31'
    }
    if (payload.financialYearStartMonth < 1 || payload.financialYearStartMonth > 12) {
      nextErrors.financialYearStartMonth = 'Financial year month must be between 1 and 12'
    }

    const prefixPattern = /^[A-Za-z0-9_-]{1,20}$/
    if (!prefixPattern.test(payload.billNumberPrefix)) {
      nextErrors.billNumberPrefix = 'Use 1-20 chars: letters, numbers, _ or -'
    }
    if (!prefixPattern.test(payload.receiptNumberPrefix)) {
      nextErrors.receiptNumberPrefix = 'Use 1-20 chars: letters, numbers, _ or -'
    }

    if (payload.committeeElectionStartDate && payload.committeeElectionEndDate) {
      const startDate = new Date(payload.committeeElectionStartDate)
      const endDate = new Date(payload.committeeElectionEndDate)
      if (startDate > endDate) {
        nextErrors.committeeElectionStartDate = 'Start date cannot be after end date'
        nextErrors.committeeElectionEndDate = 'End date cannot be before start date'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (key) => (e) => {
    if (errors[key]) {
      setErrors((prev) => {
        const { [key]: _ignored, ...rest } = prev
        return rest
      })
    }
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handlePreviewChange = (key) => (e) => {
    const nextValue = key === 'isOccupied' ? e.target.checked : e.target.value
    setPreviewInput((prev) => ({ ...prev, [key]: nextValue }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!effectiveSocietyId) {
      toast.error('Please select a society before saving settings')
      return
    }

    const payload = {
      ...form,
      maintenanceRatePerSqft: toNumber(form.maintenanceRatePerSqft),
      waterChargesFixed: toNumber(form.waterChargesFixed),
      waterChargesPerPerson: toNumber(form.waterChargesPerPerson),
      sinkingFundPerSqft: toNumber(form.sinkingFundPerSqft),
      repairFundPerSqft: toNumber(form.repairFundPerSqft),
      parkingChargeOpen: toNumber(form.parkingChargeOpen),
      parkingChargeCovered: toNumber(form.parkingChargeCovered),
      parkingChargeStilt: toNumber(form.parkingChargeStilt),
      parkingChargeTwoWheeler: toNumber(form.parkingChargeTwoWheeler),
      liftMaintenanceCharge: toNumber(form.liftMaintenanceCharge),
      electricityCommonCharge: toNumber(form.electricityCommonCharge),
      securityCharge: toNumber(form.securityCharge),
      insuranceCharge: toNumber(form.insuranceCharge),
      clubHouseCharge: toNumber(form.clubHouseCharge),
      propertyTaxShare: toNumber(form.propertyTaxShare),
      nonOccupancySurchargePct: toNumber(form.nonOccupancySurchargePct),
      gstPercentage: toNumber(form.gstPercentage),
      latePaymentInterestPct: toNumber(form.latePaymentInterestPct),
      gracePeriodDays: Math.max(0, Math.floor(toNumber(form.gracePeriodDays, 5))),
      penaltyFixed: toNumber(form.penaltyFixed),
      billGenerationDay: Math.min(31, Math.max(1, Math.floor(toNumber(form.billGenerationDay, 1)))),
      dueDateDay: Math.min(31, Math.max(1, Math.floor(toNumber(form.dueDateDay, 10)))),
      financialYearStartMonth: Math.min(12, Math.max(1, Math.floor(toNumber(form.financialYearStartMonth, 4)))),
      billNumberPrefix: String(form.billNumberPrefix || 'BILL').trim(),
      receiptNumberPrefix: String(form.receiptNumberPrefix || 'RCT').trim(),
      accountHolderName: String(form.accountHolderName || '').trim(),
      bankName: String(form.bankName || '').trim(),
      accountNumber: String(form.accountNumber || '').trim(),
      ifscCode: String(form.ifscCode || '').trim(),
      upiId: String(form.upiId || '').trim(),
      paymentLink: String(form.paymentLink || '').trim(),
      committeeElectionStartDate: form.committeeElectionStartDate || null,
      committeeElectionEndDate: form.committeeElectionEndDate || null,
    }

    if (!validateForm(payload)) {
      toast.error('Please fix validation errors before saving')
      return
    }

    updateMutation.mutate(payload)
  }

  if (showSkeleton) {
    return (
      <div className="flex flex-col gap-4">
        <WakeUpBanner />
        <HeroSkeleton statCount={2} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] p-5">
          <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">Failed to load settings</h2>
          <p className="text-sm text-[var(--text-secondary)]">Please refresh the page and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-4 rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="m-0 flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
            <SlidersHorizontal size={20} />
            Society Rate Settings
            <InfoTooltip text="Configure default finance rates and billing schedule" />
          </h1>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-[var(--text-secondary)]">
          <Building2 size={16} />
          <span>
            {effectiveSocietyId
              ? (settings?.societyName || scopedSociety?.name || `Society #${effectiveSocietyId}`)
              : 'No society selected'}
          </span>
        </div>
      </div>

      {invalidUrlSociety && (
        <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] p-5">
          <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">No society exists for this URL</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Please choose a valid society context from app navigation. Do not use random values in the URL.
          </p>
        </div>
      )}

      {!invalidUrlSociety && !effectiveSocietyId && (
        <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] p-5">
          <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">Society context required</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {isMasterAdmin
              ? 'Open this page from a selected society context (URL with ?society=<id>) to manage that society settings.'
              : 'Please select a society to continue.'}
          </p>
        </div>
      )}

      {!invalidUrlSociety && !!effectiveSocietyId && (
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <section className="rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-5 py-4">
          <h3 className="mb-3.5 text-base font-semibold text-[var(--text-primary)]">Amount Based Charges</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {amountFields.map((field) => (
              <FormInput
                key={field.key}
                label={field.label}
                name={field.key}
                type="number"
                step="0.01"
                min="0"
                value={form[field.key] ?? 0}
                onChange={handleChange(field.key)}
                error={errors[field.key]}
                hint={fieldHints[field.key]}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-5 py-4">
          <h3 className="mb-3.5 text-base font-semibold text-[var(--text-primary)]">Percentages</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {percentageFields.map((field) => (
              <FormInput
                key={field.key}
                label={field.label}
                name={field.key}
                type="number"
                step="0.01"
                min="0"
                value={form[field.key] ?? 0}
                onChange={handleChange(field.key)}
                error={errors[field.key]}
                hint={fieldHints[field.key]}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-5 py-4">
          <h3 className="mb-3.5 text-base font-semibold text-[var(--text-primary)]">Billing Schedule</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {scheduleFields.map((field) => (
              <FormInput
                key={field.key}
                label={field.label}
                name={field.key}
                type="number"
                min={field.min}
                max={field.max}
                step="1"
                value={form[field.key] ?? 0}
                onChange={handleChange(field.key)}
                error={errors[field.key]}
                hint={fieldHints[field.key]}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-5 py-4">
          <h3 className="mb-3.5 text-base font-semibold text-[var(--text-primary)]">Numbering Prefix</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormInput
              label="Bill Prefix"
              name="billNumberPrefix"
              value={form.billNumberPrefix ?? 'BILL'}
              onChange={handleChange('billNumberPrefix')}
              error={errors.billNumberPrefix}
              hint={fieldHints.billNumberPrefix}
              maxLength={20}
            />
            <FormInput
              label="Receipt Prefix"
              name="receiptNumberPrefix"
              value={form.receiptNumberPrefix ?? 'RCT'}
              onChange={handleChange('receiptNumberPrefix')}
              error={errors.receiptNumberPrefix}
              hint={fieldHints.receiptNumberPrefix}
              maxLength={20}
            />
          </div>
        </section>

        <section className="rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-5 py-4">
          <h3 className="mb-3.5 text-base font-semibold text-[var(--text-primary)]">Invoice Payment Details</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormInput
              label="Account Holder Name"
              name="accountHolderName"
              value={form.accountHolderName ?? ''}
              onChange={handleChange('accountHolderName')}
              hint={fieldHints.accountHolderName}
            />
            <FormInput
              label="Bank Name"
              name="bankName"
              value={form.bankName ?? ''}
              onChange={handleChange('bankName')}
              hint={fieldHints.bankName}
            />
            <FormInput
              label="Account Number"
              name="accountNumber"
              value={form.accountNumber ?? ''}
              onChange={handleChange('accountNumber')}
              hint={fieldHints.accountNumber}
            />
            <FormInput
              label="IFSC Code"
              name="ifscCode"
              value={form.ifscCode ?? ''}
              onChange={handleChange('ifscCode')}
              hint={fieldHints.ifscCode}
            />
            <FormInput
              label="UPI ID"
              name="upiId"
              value={form.upiId ?? ''}
              onChange={handleChange('upiId')}
              hint={fieldHints.upiId}
            />
            <FormInput
              label="Payment Link"
              name="paymentLink"
              type="url"
              value={form.paymentLink ?? ''}
              onChange={handleChange('paymentLink')}
              hint={fieldHints.paymentLink}
            />
          </div>
        </section>

        <section className="rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-5 py-4">
          <h3 className="mb-3.5 text-base font-semibold text-[var(--text-primary)]">Committee Election Window (Optional)</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormInput
              label="Election Start Date"
              name="committeeElectionStartDate"
              type="date"
              value={form.committeeElectionStartDate ?? ''}
              onChange={handleChange('committeeElectionStartDate')}
              error={errors.committeeElectionStartDate}
              hint={fieldHints.committeeElectionStartDate}
            />
            <FormInput
              label="Election End Date"
              name="committeeElectionEndDate"
              type="date"
              value={form.committeeElectionEndDate ?? ''}
              onChange={handleChange('committeeElectionEndDate')}
              error={errors.committeeElectionEndDate}
              hint={fieldHints.committeeElectionEndDate}
            />
          </div>
        </section>

        <section className="rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-5 py-4">
          <h3 className="mb-3.5 text-base font-semibold text-[var(--text-primary)]">Bill Math Preview</h3>
          <p className="mb-3 text-xs text-[var(--text-tertiary)]">
            Preview per-unit calculation before bill generation. Uses current settings and sample inputs.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormInput label="Area (SqFt)" name="preview-area" type="number" min="0" step="0.01" value={previewInput.areaSqft} onChange={handlePreviewChange('areaSqft')} />
            <FormInput label="Occupant Count" name="preview-occupants" type="number" min="0" step="1" value={previewInput.occupantCount} onChange={handlePreviewChange('occupantCount')} disabled={!previewInput.isOccupied} />
            <FormInput label="Two-Wheeler Count" name="preview-2w" type="number" min="0" step="1" value={previewInput.twoWheelerCount} onChange={handlePreviewChange('twoWheelerCount')} disabled={!previewInput.isOccupied} />
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input type="checkbox" checked={previewInput.isOccupied} onChange={handlePreviewChange('isOccupied')} />
                Unit occupied
              </label>
            </div>
            <FormInput label="4W Open Count" name="preview-open" type="number" min="0" step="1" value={previewInput.fourWheelerOpenCount} onChange={handlePreviewChange('fourWheelerOpenCount')} disabled={!previewInput.isOccupied} />
            <FormInput label="4W Covered Count" name="preview-covered" type="number" min="0" step="1" value={previewInput.fourWheelerCoveredCount} onChange={handlePreviewChange('fourWheelerCoveredCount')} disabled={!previewInput.isOccupied} />
            <FormInput label="4W Stilt Count" name="preview-stilt" type="number" min="0" step="1" value={previewInput.fourWheelerStiltCount} onChange={handlePreviewChange('fourWheelerStiltCount')} disabled={!previewInput.isOccupied} />
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border-default)]">
            <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              <span>Charge Item</span>
              <span>Amount</span>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              {previewMath.lines.length === 0 && (
                <div className="px-3 py-3 text-sm text-[var(--text-tertiary)]">No charge lines from current sample inputs.</div>
              )}
              {previewMath.lines.map((line) => (
                <div key={line.key} className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 text-sm">
                  <span className="text-[var(--text-secondary)]">{line.label}</span>
                  <span className="font-semibold text-[var(--text-primary)]">{line.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 text-sm">
                <span className="text-[var(--text-secondary)]">Taxable Base</span>
                <span className="font-semibold text-[var(--text-primary)]">{previewMath.taxableBase.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 text-sm">
                <span className="text-[var(--text-secondary)]">GST @ {toNumber(form.gstPercentage).toFixed(2)}%</span>
                <span className="font-semibold text-[var(--text-primary)]">{previewMath.gstAmount.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2 bg-[var(--bg-tertiary)] px-3 py-2 text-sm">
                <span className="font-semibold text-[var(--text-primary)]">Total (Before Late Interest/Penalty)</span>
                <span className="font-bold text-[var(--accent-primary)]">{previewMath.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <NeonSweepButton
            type="submit"
            tone="cyan"
            size="md"
            disabled={!effectiveSocietyId}
            className="w-full sm:w-auto"
          >
            <Save size={16} />
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </NeonSweepButton>
        </div>
      </form>
      )}
    </div>
  )
}
