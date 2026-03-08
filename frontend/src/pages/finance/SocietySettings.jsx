import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Building2, Save, SlidersHorizontal } from 'lucide-react'
import { societyApi, societySettingApi } from '../../../../api'
import { useAuth, useToast } from '../../context'
import { AsyncButton, FormInput, PermissionDenied } from '../../components'
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
    onSuccess: () => {
      queryClient.invalidateQueries(['society-settings', effectiveSocietyId])
      toast.success('Society settings updated successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update settings')
    },
  })

  const showSkeleton = useMinLoadingTime(isLoading || isScopedSocietyLoading)

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
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">Configure default finance rates and billing schedule</p>
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

        <div className="flex justify-end">
          <AsyncButton
            type="submit"
            isLoading={updateMutation.isPending}
            disabled={!effectiveSocietyId}
            loadingText="Saving..."
            className="inline-flex items-center gap-2 rounded-[10px] border-none bg-[var(--accent-primary)] px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-65"
          >
            <Save size={16} />
            Save Settings
          </AsyncButton>
        </div>
      </form>
      )}
    </div>
  )
}
