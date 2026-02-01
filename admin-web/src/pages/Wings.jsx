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

export default function Wings() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const urlSocietyId = searchParams.get('society')
  
  const [showModal, setShowModal] = useState(false)
  const [editingWing, setEditingWing] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSociety, setFilterSociety] = useState(urlSocietyId || '')

  // Check if user is MASTER_ADMIN
  const isMasterAdmin = user?.role === 'MASTER_ADMIN'

  // Determine the effective society ID
  const effectiveSocietyId = isMasterAdmin ? filterSociety : user?.societyId

  // Fetch societies (for MASTER_ADMIN dropdown)
  const { data: societies = [] } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data),
    enabled: isMasterAdmin,
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
    
    const societyId = isMasterAdmin 
      ? parseInt(formData.get('societyId')) 
      : user?.societyId

    console.log('Society ID:', societyId, 'User:', user, 'isMasterAdmin:', isMasterAdmin)

    if (!societyId) {
      alert('Society ID is required.')
      return
    }

    const data = {
      societyId: parseInt(societyId),
      name: formData.get('name'),
      totalFloors: parseInt(formData.get('totalFloors')) || 0,
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
        </div>
        <button
          onClick={() => { setEditingWing(null); setShowModal(true) }}
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
          {isMasterAdmin && (
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
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Wing Header */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{wing.name}</h3>
                      {isMasterAdmin && (
                        <p className="text-white/70 text-sm">{wing.societyName}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Wing Body */}
              <div className="p-4">
                {wing.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{wing.description}</p>
                )}
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Building2 className="w-4 h-4" />
                    <span>{wing.totalFloors || 0} Floors</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Hash className="w-4 h-4" />
                    <span>ID: {wing.id}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  onClick={() => { setEditingWing(wing); setShowModal(true) }}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this wing?')) {
                      deleteMutation.mutate(wing.id)
                    }
                  }}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                >
                  <Trash2 size={18} />
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
              {/* Society field - only show dropdown for MASTER_ADMIN */}
              {isMasterAdmin ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Society</label>
                  <select
                    name="societyId"
                    defaultValue={editingWing?.societyId}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Society</option>
                    {societies.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <input type="hidden" name="societyId" value={user?.societyId || ''} />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wing Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingWing?.name}
                  required
                  placeholder="e.g., A Wing, Tower 1, Building A"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Floors</label>
                <input
                  type="number"
                  name="totalFloors"
                  defaultValue={editingWing?.totalFloors || 0}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>

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
