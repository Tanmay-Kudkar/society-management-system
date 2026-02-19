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
      <div className="asset-header">
        <div>
          <h1 className="asset-title">Assets & Inventory</h1>
          <p className="asset-subtitle">Track society assets, equipment, and inventory</p>
        </div>
        {isStaff && (
          <button onClick={() => setShowModal(true)} className="asset-action-button">
            <Plus size={20} /> Add Asset
          </button>
        )}
      </div>

      <div className="asset-summary">
        <div className="asset-summary-card">
          <p className="asset-summary-label">Available</p>
          <p className="asset-summary-value asset-summary-value--available">{available}</p>
        </div>
        <div className="asset-summary-card">
          <p className="asset-summary-label">In Use</p>
          <p className="asset-summary-value asset-summary-value--inuse">{inUse}</p>
        </div>
        <div className="asset-summary-card">
          <p className="asset-summary-label">Maintenance</p>
          <p className="asset-summary-value asset-summary-value--maintenance">{maintenance}</p>
        </div>
        <div className="asset-summary-card">
          <p className="asset-summary-label">Low Stock</p>
          <p className="asset-summary-value asset-summary-value--low">{lowStock}</p>
        </div>
      </div>

      <div className="asset-filters">
        <div className="asset-filters-row">
          <div className="asset-search">
            <Search className="asset-search-icon" />
            <input type="text" placeholder="Search assets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="asset-input" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="asset-select">
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="IN_USE">In Use</option>
            <option value="UNDER_MAINTENANCE">Maintenance</option>
            <option value="RETIRED">Retired</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="asset-select">
            <option value="">All Categories</option>
            {categoryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div className="asset-list">
        {filtered.length === 0 && (
          <div className="asset-item" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No assets found</div>
        )}
        {filtered.map(asset => {
          const isLow = asset.minQuantity > 0 && asset.quantity <= asset.minQuantity
          return (
            <div key={asset.id} className={clsx('asset-item', isLow && 'asset-item--low')}>
              <div className="asset-item-row">
                <div className="asset-item-main">
                  <div className={clsx('asset-item-icon', `asset-item-icon--${asset.status?.toLowerCase().replace('_', '-')}`)}>
                    <Package className="asset-item-icon-symbol" />
                  </div>
                  <div>
                    <div className="asset-item-meta">
                      <span className={clsx('asset-status-badge', `asset-status--${asset.status?.toLowerCase().replace('_', '-')}`)}>{statusLabels[asset.status] || asset.status}</span>
                      <span className="asset-category-badge">{asset.category}</span>
                      <span className={clsx('asset-condition-badge', `asset-condition--${asset.condition?.toLowerCase()}`)}>{conditionLabels[asset.condition] || asset.condition}</span>
                      {isLow && <span className="asset-low-badge"><AlertTriangle size={12} /> Low Stock</span>}
                    </div>
                    <h3 className="asset-item-title">{asset.assetName} {asset.assetCode && <span className="asset-code">({asset.assetCode})</span>}</h3>
                    {asset.description && <p className="asset-item-description">{asset.description}</p>}
                    <div className="asset-item-footer">
                      {asset.location && <span className="asset-item-footer-text"><MapPin size={12} /> {asset.location}</span>}
                      <span className="asset-item-footer-text">Qty: {asset.quantity}</span>
                      {asset.purchaseCost && <span className="asset-item-footer-text"><IndianRupee size={12} /> ₹{asset.purchaseCost}</span>}
                      {asset.vendorName && <span className="asset-item-footer-text">Vendor: {asset.vendorName}</span>}
                      {asset.assignedToName && <span className="asset-item-footer-text"><UserPlus size={12} /> {asset.assignedToName}</span>}
                      {asset.warrantyExpiry && <span className="asset-item-footer-text"><Calendar size={12} /> Warranty: {asset.warrantyExpiry}</span>}
                    </div>
                  </div>
                </div>
                {isStaff && (
                  <div className="asset-item-actions">
                    {asset.status === 'AVAILABLE' && <button onClick={() => statusMutation.mutate({ id: asset.id, status: 'IN_USE' })} className="asset-btn asset-btn--use">In Use</button>}
                    {asset.status === 'IN_USE' && <button onClick={() => statusMutation.mutate({ id: asset.id, status: 'AVAILABLE' })} className="asset-btn asset-btn--available">Available</button>}
                    {asset.status !== 'UNDER_MAINTENANCE' && <button onClick={() => statusMutation.mutate({ id: asset.id, status: 'UNDER_MAINTENANCE' })} className="asset-btn asset-btn--maintenance"><Wrench size={14} /></button>}
                    {asset.status === 'UNDER_MAINTENANCE' && <button onClick={() => statusMutation.mutate({ id: asset.id, status: 'AVAILABLE' })} className="asset-btn asset-btn--available"><CheckCircle2 size={14} /></button>}
                    {isAdmin && <button onClick={() => { if (confirm('Delete this asset?')) deleteMutation.mutate(asset.id) }} className="asset-btn asset-btn--delete">Delete</button>}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="asset-modal">
          <div className="asset-modal-card">
            <div className="asset-modal-header">
              <h3 className="asset-modal-title">Add Asset</h3>
              <button onClick={() => setShowModal(false)} className="asset-modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="asset-form">
              <div className="asset-form-row">
                <FormInput label="Asset Name" name="assetName" required placeholder="e.g. Fire Extinguisher" />
                <FormInput label="Asset Code" name="assetCode" placeholder="e.g. FE-001" />
              </div>
              <div className="asset-form-row">
                <SmartSelect label="Category" name="category" required options={categoryOptions} placeholder="Select Category" />
                <SmartSelect label="Condition" name="condition" options={[
                  { value: 'EXCELLENT', label: 'Excellent' }, { value: 'GOOD', label: 'Good' },
                  { value: 'FAIR', label: 'Fair' }, { value: 'POOR', label: 'Poor' },
                ]} placeholder="Select Condition" />
              </div>
              <FormInput label="Location" name="location" placeholder="e.g. Club House, Store Room" />
              <FormTextarea label="Description" name="description" rows={2} />
              <div className="asset-form-row">
                <FormInput label="Quantity" name="quantity" type="number" min="1" defaultValue="1" />
                <FormInput label="Min Quantity (alert)" name="minQuantity" type="number" min="0" defaultValue="0" />
              </div>
              <div className="asset-form-row">
                <FormInput label="Purchase Cost (₹)" name="purchaseCost" type="number" step="0.01" />
                <FormInput label="Current Value (₹)" name="currentValue" type="number" step="0.01" />
              </div>
              <div className="asset-form-row">
                <FormInput label="Purchase Date" name="purchaseDate" type="date" />
                <FormInput label="Warranty Expiry" name="warrantyExpiry" type="date" />
              </div>
              <FormInput label="Vendor Name" name="vendorName" placeholder="Supplier name" />
              <FormTextarea label="Notes" name="notes" rows={2} />
              <div className="asset-form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="asset-btn asset-btn--ghost">Cancel</button>
                <AsyncButton type="submit" className="asset-btn asset-btn--primary" isLoading={createMutation.isPending} loadingText="Adding...">Add Asset</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
