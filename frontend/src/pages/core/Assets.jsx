import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { assetApi } from '../../../../api'
import { Plus, Search, X, Package, MapPin, IndianRupee, Calendar, AlertTriangle, UserPlus, Wrench, CheckCircle2, Archive } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, AsyncButton } from '../../components'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const statusLabels = { AVAILABLE: 'Available', IN_USE: 'In Use', UNDER_MAINTENANCE: 'Maintenance', RETIRED: 'Retired', DISPOSED: 'Disposed' }
const conditionLabels = { EXCELLENT: 'Excellent', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor', DAMAGED: 'Damaged' }

const iconBgMap = {
  available: 'bg-[rgba(34,197,94,0.15)] text-[var(--color-green)]',
  'in-use': 'bg-[rgba(59,130,246,0.15)] text-[var(--color-blue)]',
  'under-maintenance': 'bg-[rgba(245,158,11,0.15)] text-[var(--color-amber)]',
  retired: 'bg-[rgba(107,114,128,0.15)] text-[var(--text-secondary)]',
  disposed: 'bg-[rgba(239,68,68,0.15)] text-[var(--color-red)]',
}

const statusBadgeMap = {
  available: 'bg-[rgba(34,197,94,0.15)] text-[var(--color-green)]',
  'in-use': 'bg-[rgba(59,130,246,0.15)] text-[var(--color-blue)]',
  'under-maintenance': 'bg-[rgba(245,158,11,0.15)] text-[var(--color-amber)]',
  retired: 'bg-[rgba(107,114,128,0.15)] text-[var(--text-secondary)]',
}

const conditionBadgeMap = {
  excellent: 'bg-[rgba(34,197,94,0.1)] text-[var(--color-green)]',
  good: 'bg-[rgba(34,197,94,0.1)] text-[var(--color-green)]',
  fair: 'bg-[rgba(245,158,11,0.1)] text-[var(--color-amber)]',
  poor: 'bg-[rgba(239,68,68,0.1)] text-[var(--color-red)]',
  damaged: 'bg-[rgba(239,68,68,0.1)] text-[var(--color-red)]',
}
const categoryOptions = [
  { value: 'FURNITURE', label: 'Furniture' }, { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'ELECTRONICS', label: 'Electronics' }, { value: 'TOOLS', label: 'Tools' },
  { value: 'CLEANING', label: 'Cleaning Supplies' }, { value: 'SAFETY', label: 'Safety Equipment' },
  { value: 'PLUMBING', label: 'Plumbing' }, { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'GARDENING', label: 'Gardening' }, { value: 'OTHER', label: 'Other' },
]

export default function Assets() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const isMember = user?.role && user.role !== 'VISITOR'
  if (!isMember) return <PermissionDenied message="You don't have permission to access asset management" />

  const isStaff = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE'].includes(user?.role)
  const isAdmin = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'].includes(user?.role)
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const societyIdFromUrl = searchParams.get('society')
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? societyIdFromUrl : user?.societyId

  const { data: assets = [], isLoading, isError } = useQuery({
    queryKey: ['assets', effectiveSocietyId],
    queryFn: () => assetApi.getBySociety(effectiveSocietyId, user.id).then(r => r.data),
    enabled: !!user?.id && !!effectiveSocietyId,
  })

  const createMutation = useMutation({
    mutationFn: (data) => assetApi.create(user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['assets']); setShowModal(false) },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => assetApi.updateStatus(id, user.id, status),
    onSuccess: () => queryClient.invalidateQueries(['assets']),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => assetApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['assets']),
  })

  const filtered = useMemo(() => assets.filter(a => {
    const matchesSearch = a.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.assetCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || a.status === filterStatus
    const matchesCategory = !filterCategory || a.category === filterCategory
    return matchesSearch && matchesStatus && matchesCategory
  }), [assets, searchTerm, filterStatus, filterCategory])

  const handleSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    createMutation.mutate({
      assetName: fd.get('assetName'),
      assetCode: fd.get('assetCode') || null,
      category: fd.get('category'),
      description: fd.get('description') || null,
      location: fd.get('location') || null,
      condition: fd.get('condition') || 'GOOD',
      purchaseDate: fd.get('purchaseDate') || null,
      purchaseCost: fd.get('purchaseCost') ? parseFloat(fd.get('purchaseCost')) : null,
      currentValue: fd.get('currentValue') ? parseFloat(fd.get('currentValue')) : null,
      warrantyExpiry: fd.get('warrantyExpiry') || null,
      vendorName: fd.get('vendorName') || null,
      quantity: fd.get('quantity') ? parseInt(fd.get('quantity')) : 1,
      minQuantity: fd.get('minQuantity') ? parseInt(fd.get('minQuantity')) : 0,
      notes: fd.get('notes') || null,
      societyId: user.societyId,
    })
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)
  if (showSkeleton) return (<div><WakeUpBanner /><HeroSkeleton /><SummaryRowSkeleton count={4} /><FiltersSkeleton filterCount={2} /><ListSkeleton count={4} /></div>)

  const available = assets.filter(a => a.status === 'AVAILABLE').length
  const inUse = assets.filter(a => a.status === 'IN_USE').length
  const maintenance = assets.filter(a => a.status === 'UNDER_MAINTENANCE').length
  const lowStock = assets.filter(a => a.minQuantity > 0 && a.quantity <= a.minQuantity).length

  return (
    <div>
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Assets & Inventory</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Track society assets, equipment, and inventory</p>
        </div>
        {isStaff && (
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 py-[10px] px-5 bg-[var(--color-blue)] text-white border-none rounded-[10px] text-sm font-semibold cursor-pointer transition-colors hover:bg-[var(--color-blue-hover,#2563eb)]">
            <Plus size={20} /> Add Asset
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center border border-[var(--border-primary)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-[0.5px] mb-1">Available</p>
          <p className="text-[28px] font-bold text-[var(--color-green)]">{available}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center border border-[var(--border-primary)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-[0.5px] mb-1">In Use</p>
          <p className="text-[28px] font-bold text-[var(--color-blue)]">{inUse}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center border border-[var(--border-primary)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-[0.5px] mb-1">Maintenance</p>
          <p className="text-[28px] font-bold text-[var(--color-amber)]">{maintenance}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center border border-[var(--border-primary)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-[0.5px] mb-1">Low Stock</p>
          <p className="text-[28px] font-bold text-[var(--color-red)]">{lowStock}</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] w-4 h-4" />
            <input type="text" placeholder="Search assets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full py-[10px] pr-3 pl-9 border border-[var(--border-primary)] rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)]" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="py-[10px] px-3 border border-[var(--border-primary)] rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] min-w-[140px]">
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="IN_USE">In Use</option>
            <option value="UNDER_MAINTENANCE">Maintenance</option>
            <option value="RETIRED">Retired</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="py-[10px] px-3 border border-[var(--border-primary)] rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] min-w-[140px]">
            <option value="">All Categories</option>
            {categoryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)] text-center text-[var(--text-tertiary)]">No assets found</div>
        )}
        {filtered.map(asset => {
          const isLow = asset.minQuantity > 0 && asset.quantity <= asset.minQuantity
          const statusKey = asset.status?.toLowerCase().replace('_', '-')
          return (
            <div key={asset.id} className={clsx('bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]', isLow && 'border-l-[3px] border-l-[var(--color-red)]')}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className={clsx('w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0', iconBgMap[statusKey])}>
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={clsx('text-[11px] font-semibold py-[2px] px-2 rounded-[6px] uppercase tracking-[0.3px]', statusBadgeMap[statusKey])}>{statusLabels[asset.status] || asset.status}</span>
                      <span className="text-[11px] font-semibold py-[2px] px-2 rounded-[6px] uppercase tracking-[0.3px] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{asset.category}</span>
                      <span className={clsx('text-[11px] font-semibold py-[2px] px-2 rounded-[6px] uppercase tracking-[0.3px]', conditionBadgeMap[asset.condition?.toLowerCase()])}>{conditionLabels[asset.condition] || asset.condition}</span>
                      {isLow && <span className="inline-flex items-center gap-[3px] text-[11px] font-semibold py-[2px] px-2 rounded-[6px] bg-[rgba(239,68,68,0.15)] text-[var(--color-red)]"><AlertTriangle size={12} /> Low Stock</span>}
                    </div>
                    <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-[2px]">{asset.assetName} {asset.assetCode && <span className="font-normal text-[var(--text-tertiary)] text-[13px]">({asset.assetCode})</span>}</h3>
                    {asset.description && <p className="text-[13px] text-[var(--text-secondary)] mb-1">{asset.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-[6px]">
                      {asset.location && <span className="text-xs text-[var(--text-tertiary)] inline-flex items-center gap-[3px]"><MapPin size={12} /> {asset.location}</span>}
                      <span className="text-xs text-[var(--text-tertiary)] inline-flex items-center gap-[3px]">Qty: {asset.quantity}</span>
                      {asset.purchaseCost && <span className="text-xs text-[var(--text-tertiary)] inline-flex items-center gap-[3px]"><IndianRupee size={12} /> ₹{asset.purchaseCost}</span>}
                      {asset.vendorName && <span className="text-xs text-[var(--text-tertiary)] inline-flex items-center gap-[3px]">Vendor: {asset.vendorName}</span>}
                      {asset.assignedToName && <span className="text-xs text-[var(--text-tertiary)] inline-flex items-center gap-[3px]"><UserPlus size={12} /> {asset.assignedToName}</span>}
                      {asset.warrantyExpiry && <span className="text-xs text-[var(--text-tertiary)] inline-flex items-center gap-[3px]"><Calendar size={12} /> Warranty: {asset.warrantyExpiry}</span>}
                    </div>
                  </div>
                </div>
                {isStaff && (
                  <div className="flex gap-[6px] flex-wrap shrink-0">
                    {asset.status === 'AVAILABLE' && <button onClick={() => statusMutation.mutate({ id: asset.id, status: 'IN_USE' })} className="py-[6px] px-[14px] border border-[rgba(59,130,246,0.3)] rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-1 transition-all bg-[rgba(59,130,246,0.1)] text-[var(--color-blue)]">In Use</button>}
                    {asset.status === 'IN_USE' && <button onClick={() => statusMutation.mutate({ id: asset.id, status: 'AVAILABLE' })} className="py-[6px] px-[14px] border border-[rgba(34,197,94,0.3)] rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-1 transition-all bg-[rgba(34,197,94,0.1)] text-[var(--color-green)]">Available</button>}
                    {asset.status !== 'UNDER_MAINTENANCE' && <button onClick={() => statusMutation.mutate({ id: asset.id, status: 'UNDER_MAINTENANCE' })} className="py-[6px] px-[14px] border border-[rgba(245,158,11,0.3)] rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-1 transition-all bg-[rgba(245,158,11,0.1)] text-[var(--color-amber)]"><Wrench size={14} /></button>}
                    {asset.status === 'UNDER_MAINTENANCE' && <button onClick={() => statusMutation.mutate({ id: asset.id, status: 'AVAILABLE' })} className="py-[6px] px-[14px] border border-[rgba(34,197,94,0.3)] rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-1 transition-all bg-[rgba(34,197,94,0.1)] text-[var(--color-green)]"><CheckCircle2 size={14} /></button>}
                    {isAdmin && <button onClick={() => { if (confirm('Delete this asset?')) deleteMutation.mutate(asset.id) }} className="py-[6px] px-[14px] border border-[rgba(239,68,68,0.3)] rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-1 transition-all bg-[rgba(239,68,68,0.1)] text-[var(--color-red)]">Delete</button>}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-[4px]">
          <div className="bg-[var(--bg-primary)] rounded-2xl p-6 w-[90%] max-w-[560px] max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Add Asset</h3>
              <button onClick={() => setShowModal(false)} className="bg-none border-none cursor-pointer text-[var(--text-tertiary)] p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="Asset Name" name="assetName" required placeholder="e.g. Fire Extinguisher" />
                <FormInput label="Asset Code" name="assetCode" placeholder="e.g. FE-001" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SmartSelect label="Category" name="category" required options={categoryOptions} placeholder="Select Category" />
                <SmartSelect label="Condition" name="condition" options={[
                  { value: 'EXCELLENT', label: 'Excellent' }, { value: 'GOOD', label: 'Good' },
                  { value: 'FAIR', label: 'Fair' }, { value: 'POOR', label: 'Poor' },
                ]} placeholder="Select Condition" />
              </div>
              <FormInput label="Location" name="location" placeholder="e.g. Club House, Store Room" />
              <FormTextarea label="Description" name="description" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="Quantity" name="quantity" type="number" min="1" defaultValue="1" />
                <FormInput label="Min Quantity (alert)" name="minQuantity" type="number" min="0" defaultValue="0" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="Purchase Cost (₹)" name="purchaseCost" type="number" step="0.01" />
                <FormInput label="Current Value (₹)" name="currentValue" type="number" step="0.01" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="Purchase Date" name="purchaseDate" type="date" />
                <FormInput label="Warranty Expiry" name="warrantyExpiry" type="date" />
              </div>
              <FormInput label="Vendor Name" name="vendorName" placeholder="Supplier name" />
              <FormTextarea label="Notes" name="notes" rows={2} />
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="py-[6px] px-[14px] border border-[var(--border-primary)] rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-1 transition-all bg-transparent text-[var(--text-primary)]">Cancel</button>
                <AsyncButton type="submit" className="py-2 px-4 rounded-lg text-xs font-medium cursor-pointer border-none inline-flex items-center gap-1 transition-all bg-[var(--color-blue)] text-white hover:opacity-90" isLoading={createMutation.isPending} loadingText="Adding...">Add Asset</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
