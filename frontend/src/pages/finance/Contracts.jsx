import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { useToast } from '../../context'
import { contractApi, vendorApi } from '../../../../api'
import { Plus, Edit, Trash2, Search, X, FileText, AlertTriangle, CheckCircle } from 'lucide-react'
import { FormInput, SmartSelect, NumberInput, FormTextarea, InfoTooltip, NeonSweepButton, AnimatedModal } from '../../components'
import { HeroSkeleton, FinancePageSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const contractTypes = [
  'AMC', 'INSURANCE', 'PEST_CONTROL', 'HOUSEKEEPING', 'CCTV', 
  'LIFT', 'GENERATOR', 'SECURITY', 'FD', 'OTHER'
]

const MODAL_ANIMATION_DURATION = 220

export default function Contracts() {
  const { user, canManageContracts } = useAuth()
  const [searchParams] = useSearchParams()
  const confirmDialog = useConfirmDialog()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingContract, setEditingContract] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')

  function closeContractModal(force = false) {
    if (!force && (createMutation.isPending || updateMutation.isPending)) return
    setShowModal(false)
    window.setTimeout(() => {
      setEditingContract(null)
    }, MODAL_ANIMATION_DURATION)
  }

  const societyIdFromUrl = searchParams.get('society')
  const parsedSocietyIdFromUrl = Number(societyIdFromUrl)
  const scopedSocietyId = user?.role === 'MASTER_ADMIN' && Number.isInteger(parsedSocietyIdFromUrl) && parsedSocietyIdFromUrl > 0
    ? parsedSocietyIdFromUrl
    : null
  const isPlatformLevel = user?.role === 'MASTER_ADMIN' && !scopedSocietyId
  const effectiveSocietyId = scopedSocietyId || user?.societyId

  const { data: contracts = [], isLoading, isError } = useQuery({
    queryKey: ['contracts', effectiveSocietyId, isPlatformLevel],
    queryFn: () => {
      if (effectiveSocietyId) {
        return contractApi.getBySociety(effectiveSocietyId).then(res => res.data)
      }
      return contractApi.getAll().then(res => res.data)
    },
  })

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', effectiveSocietyId, isPlatformLevel],
    queryFn: () => {
      if (effectiveSocietyId) {
        return vendorApi.getBySociety(effectiveSocietyId).then(res => res.data)
      }
      return vendorApi.getAll().then(res => res.data)
    },
  })



  const createMutation = useMutation({
    mutationFn: (data) => contractApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts'])
      closeContractModal(true)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => contractApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts'])
      closeContractModal(true)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => contractApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['contracts']),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete contract')
    },
  })

  const filteredContracts = useMemo(() => contracts.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !filterType || c.contractType === filterType
    return matchesSearch && matchesType
  }), [contracts, searchTerm, filterType])

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      societyId: effectiveSocietyId,
      vendorId: formData.get('vendorId') ? parseInt(formData.get('vendorId')) : null,
      contractType: formData.get('contractType'),
      title: formData.get('title'),
      description: formData.get('description'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      reminderDays: parseInt(formData.get('reminderDays')) || 30,
      isActive: true,
    }

    if (editingContract) {
      updateMutation.mutate({ id: editingContract.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return diff
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) return (
    <div>
      <WakeUpBanner />
      <HeroSkeleton statCount={0} />
      <FinancePageSkeleton summaryCount={0} rows={6} cols={5} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Contracts</h1>
            <InfoTooltip text="Manage AMC and service contracts" />
          </div>
        </div>
        {canManageContracts() && (
          <NeonSweepButton
            tone="violet"
            size="md"
            onClick={() => { setEditingContract(null); setShowModal(true) }}
            className="w-full sm:w-auto"
          >
            <Plus size={20} />
            Add Contract
          </NeonSweepButton>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] px-3 py-2 pl-10 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-auto sm:min-w-[200px]"
          >
            <option value="">All Types</option>
            {contractTypes.map(type => (
              <option key={type} value={type}>{type.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-sm">
        {(
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b border-[var(--border-light)] bg-[var(--bg-tertiary)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Contract</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Type</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Period</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Status</th>
                  <th className="px-6 py-3 text-right text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Actions</th>
                </tr>
              </thead>
              <tbody className="border-t border-[var(--border-light)]">
                {filteredContracts.map((contract) => {
                  const daysLeft = getDaysUntilExpiry(contract.endDate)
                  const isExpiring = daysLeft !== null && daysLeft <= 30 && daysLeft > 0
                  const isExpired = daysLeft !== null && daysLeft <= 0
                  
                  return (
                    <tr key={contract.id} className="transition hover:bg-[var(--bg-tertiary)]">
                      <td className="whitespace-nowrap px-6 py-4 text-[var(--text-primary)]">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-indigo-50">
                            <FileText className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <span className="font-semibold text-[var(--text-primary)]">{contract.title}</span>
                            {isPlatformLevel && <p className="text-xs text-[var(--text-tertiary)]">{contract.societyName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-[var(--text-primary)]">
                        <span className="inline-flex items-center rounded-full bg-[var(--bg-tertiary)] px-2 py-1 text-xs text-slate-700">
                          {contract.contractType?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-tertiary)]">{contract.vendorName || '-'}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-tertiary)]">
                        {contract.startDate && new Date(contract.startDate).toLocaleDateString()} - {contract.endDate && new Date(contract.endDate).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-[var(--text-primary)]">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            <AlertTriangle size={12} /> Expired
                          </span>
                        ) : isExpiring ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            <AlertTriangle size={12} /> {daysLeft} days left
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle size={12} /> Active
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-[var(--text-primary)]">
                        <button
                          onClick={() => { setEditingContract(contract); setShowModal(true) }}
                          className="inline-flex items-center justify-center rounded-[10px] border-0 bg-transparent p-1.5 text-[var(--text-tertiary)] transition hover:text-blue-600"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = await confirmDialog({
                              title: 'Delete Contract',
                              message: 'Are you sure you want to delete this contract? This action cannot be undone.',
                              confirmText: 'Delete',
                              tone: 'danger',
                              details: [
                                { label: 'Contract', value: contract.contractNumber || contract.title || '-' },
                                { label: 'Type', value: contract.contractType?.replace('_', ' ') || '-' },
                                { label: 'Vendor', value: contract.vendorName || '-' },
                                { label: 'Amount', value: contract.amount ? `₹${contract.amount.toLocaleString()}` : '-' },
                              ],
                              caution: 'This action permanently removes contract records.',
                            })
                            if (confirmed) {
                              deleteMutation.mutate(contract.id)
                            }
                          }}
                          className="ml-2 inline-flex items-center justify-center rounded-[10px] border-0 bg-transparent p-1.5 text-[var(--text-tertiary)] transition hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatedModal
        open={showModal}
        onRequestClose={closeContractModal}
        className="max-h-[calc(100vh-3rem)] w-full max-w-[520px] overflow-y-auto rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        durationMs={MODAL_ANIMATION_DURATION}
      >
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border-light)] bg-inherit p-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{editingContract ? 'Edit Contract' : 'Add Contract'}</h3>
              <button onClick={closeContractModal} className="rounded-lg border-0 bg-transparent p-1 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 p-4">
              <FormInput
                label="Title"
                name="title"
                defaultValue={editingContract?.title}
                required
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SmartSelect
                  label="Type"
                  name="contractType"
                  defaultValue={editingContract?.contractType}
                  required
                  options={contractTypes.map(type => ({ value: type, label: type.replace('_', ' ') }))}
                  placeholder="Select Type"
                />
                <SmartSelect
                  label="Vendor"
                  name="vendorId"
                  defaultValue={editingContract?.vendorId}
                  required
                  options={vendors.map(v => ({ value: v.id, label: v.name }))}
                  placeholder="None"
                  emptyMessage="No vendors available"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  label="Start Date"
                  name="startDate"
                  type="date"
                  defaultValue={editingContract?.startDate}
                  required
                />
                <FormInput
                  label="End Date"
                  name="endDate"
                  type="date"
                  defaultValue={editingContract?.endDate}
                  required
                />
              </div>
              <NumberInput
                label="Reminder Days Before Expiry"
                name="reminderDays"
                defaultValue={editingContract?.reminderDays || 30}
                required
              />
              <FormTextarea
                label="Description (Optional)"
                name="description"
                defaultValue={editingContract?.description}
                rows={3}
              />
              <div className="flex gap-3 pt-4">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  onClick={closeContractModal}
                  className="flex-1"
                >
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton
                  type="submit"
                  tone="cyan"
                  size="md"
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingContract ? 'Update' : 'Create')}
                </NeonSweepButton>
              </div>
            </form>
      </AnimatedModal>
    </div>
  )
}
