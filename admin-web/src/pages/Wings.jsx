import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { wingApi, societyApi } from '../api'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Layers,
  Building2,
  Hash
} from 'lucide-react'
import { FormInput, SmartSelect, NumberInput, FormErrorSummary } from '../components/FormComponents'

export default function Wings() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const urlSocietyId = searchParams.get('society')
  
  const [showModal, setShowModal] = useState(false)
  const [editingWing, setEditingWing] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSociety, setFilterSociety] = useState(urlSocietyId || '')
  const [formErrors, setFormErrors] = useState({})

  // Check if user is PLATFORM_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'

  // Determine the effective society ID
  const effectiveSocietyId = isPlatformLevel ? filterSociety : user?.societyId

  // Fetch societies (for PLATFORM_OWNER dropdown)
  const { data: societies = [] } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data),
    enabled: isPlatformLevel,
  })

  // Fetch current society details for capacity limits
  const { data: currentSociety } = useQuery({
    queryKey: ['society', effectiveSocietyId],
    queryFn: () => societyApi.getById(effectiveSocietyId).then(res => res.data),
    enabled: !!effectiveSocietyId,
  })

  // Fetch wings
  const { data: wings = [], isLoading } = useQuery({
    queryKey: ['wings', effectiveSocietyId],
    queryFn: () => {
      if (effectiveSocietyId) {
        return wingApi.getBySociety(effectiveSocietyId).then(res => res.data)
      }
      return wingApi.getAll().then(res => res.data)
    },
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => wingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['wings'])
      setShowModal(false)
    },
    onError: (error) => {
      console.error('Create wing error:', error.response?.data || error.message)
      alert('Failed to create wing: ' + (error.response?.data?.message || error.message))
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => wingApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['wings'])
      setShowModal(false)
      setEditingWing(null)
    },
    onError: (error) => {
      console.error('Update wing error:', error.response?.data || error.message)
      alert('Failed to update wing: ' + (error.response?.data?.message || error.message))
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => wingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['wings'])
    },
  })

  // Filter wings
  const filteredWings = wings.filter(wing => {
    const matchesSearch = wing.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSociety = !filterSociety || wing.societyId?.toString() === filterSociety
    return matchesSearch && matchesSociety
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    const name = formData.get('name')?.trim()
    const totalFloors = parseInt(formData.get('totalFloors')) || 0
    
    // Validation
    const errors = {}
    
    // Wing name must contain at least one letter
    if (!name || !/[A-Za-z]/.test(name)) {
      errors.name = 'Wing name must contain at least one letter (e.g., "A Wing", "Tower 1")'
    }
    
    // Total floors must be at least 1
    if (totalFloors < 1) {
      errors.totalFloors = 'Total floors must be at least 1'
    }
    
    // Check wings capacity limit (only for new wings)
    if (!editingWing && currentSociety) {
      const currentWingCount = wings.filter(w => w.societyId === effectiveSocietyId).length
      const maxWings = currentSociety.totalWings || 0
      if (currentWingCount >= maxWings) {
        errors.capacity = `Cannot create more wings. Society capacity: ${currentWingCount}/${maxWings} wings`
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    
    setFormErrors({})
    
    const societyId = isPlatformLevel 
      ? parseInt(formData.get('societyId')) 
      : user?.societyId

    console.log('Society ID:', societyId, 'User:', user, 'isPlatformLevel:', isPlatformLevel)

    if (!societyId) {
      alert('Society ID is required.')
      return
    }

    const data = {
      societyId: parseInt(societyId),
      name: name,
      totalFloors: totalFloors,
    }

    console.log('Sending wing data:', data)

    if (editingWing) {
      updateMutation.mutate({ id: editingWing.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage society wings and towers</p>
          {currentSociety && effectiveSocietyId && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Capacity: {wings.filter(w => w.societyId === effectiveSocietyId).length}/{currentSociety.totalWings || 0} wings
            </p>
          )}
        </div>
        <button
          onClick={() => { setEditingWing(null); setFormErrors({}); setShowModal(true) }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Add Wing
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search wings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
          {isPlatformLevel && (
            <select
              value={filterSociety}
              onChange={(e) => setFilterSociety(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="">All Societies</option>
              {societies.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredWings.length === 0 ? (
          <div className="col-span-full p-8 text-center">
            <Layers className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No wings found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add your first wing to get started</p>
          </div>
        ) : (
          filteredWings.map((wing) => (
            <div 
              key={wing.id} 
              className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              {/* Wing Header with 3D Effect */}
              <div className="relative bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 p-5">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
                <div className="relative flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30 group-hover:scale-110 transition-transform duration-300">
                    <Layers className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white truncate">{wing.name}</h3>
                    {isPlatformLevel && (
                      <p className="text-white/80 text-sm mt-0.5 truncate">{wing.societyName}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Wing Body with Stats */}
              <div className="p-5">
                {wing.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{wing.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Floors</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{wing.totalFloors || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-3 border border-purple-100 dark:border-purple-800/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Wing ID</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{wing.id}</p>
                  </div>
                </div>
              </div>

              {/* Actions with Better Hover */}
              <div className="px-5 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  onClick={() => { setEditingWing(wing); setFormErrors({}); setShowModal(true) }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                  title="Edit Wing"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this wing?')) {
                      deleteMutation.mutate(wing.id)
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                  title="Delete Wing"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
              <h3 className="text-lg font-semibold dark:text-white">{editingWing ? 'Edit Wing' : 'Add Wing'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <FormErrorSummary message={formErrors.capacity} />
              
              {/* Society field - only show dropdown for PLATFORM_OWNER */}
              {isPlatformLevel ? (
                <SmartSelect
                  label="Society"
                  name="societyId"
                  defaultValue={editingWing?.societyId}
                  options={societies.map(s => ({ value: s.id, label: s.name }))}
                  required
                  icon={Building2}
                  placeholder="Select Society"
                  emptyMessage="No societies available"
                />
              ) : (
                <input type="hidden" name="societyId" value={user?.societyId || ''} />
              )}

              <FormInput
                label="Wing Name"
                name="name"
                defaultValue={editingWing?.name}
                required
                placeholder="e.g., A Wing, Tower 1, Building A"
                maxLength={50}
                error={formErrors.name}
                onChange={() => setFormErrors(prev => ({ ...prev, name: null }))}
              />

              <NumberInput
                label="Total Floors"
                name="totalFloors"
                defaultValue={editingWing?.totalFloors || 1}
                min={1}
                max={200}
                required
                error={formErrors.totalFloors}
                onChange={() => setFormErrors(prev => ({ ...prev, totalFloors: null }))}
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
