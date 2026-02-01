import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { societyApi } from '../api'
import { Plus, Edit, Trash2, Search, X, Building2, Eye, ChevronRight, Home, Store, Briefcase, Layers } from 'lucide-react'

export default function Societies() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingSociety, setEditingSociety] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: societies = [], isLoading } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data).catch(() => []),
  })

  const createMutation = useMutation({
    mutationFn: (data) => societyApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['societies'])
      setShowModal(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => societyApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['societies'])
      setShowModal(false)
      setEditingSociety(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => societyApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['societies']),
  })

  const filteredSocieties = societies.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      name: formData.get('name'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      pincode: formData.get('pincode'),
      registrationNumber: formData.get('registrationNumber'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      totalFlats: parseInt(formData.get('totalFlats')) || 0,
      totalShops: parseInt(formData.get('totalShops')) || 0,
      totalOffices: parseInt(formData.get('totalOffices')) || 0,
      totalWings: parseInt(formData.get('totalWings')) || 0,
    }

    if (editingSociety) {
      updateMutation.mutate({ id: editingSociety.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header with gradient background */}
      <div className="relative mb-8 p-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,white)]"></div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="w-8 h-8" />
              Societies
            </h1>
            <p className="text-blue-100 mt-2">Manage housing societies and their properties</p>
          </div>
          <button
            onClick={() => { setEditingSociety(null); setShowModal(true) }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus size={20} />
            Add Society
          </button>
        </div>
      </div>

      {/* Search with glass effect */}
      <div className="glass-card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search societies by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600"></div>
            <Building2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
          </div>
        </div>
      ) : filteredSocieties.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No societies found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first society</p>
          <button
            onClick={() => { setEditingSociety(null); setShowModal(true) }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Add Society
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSocieties.map((society, index) => (
            <div 
              key={society.id} 
              className="group glass-card p-6 hover:shadow-2xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-500 hover:-translate-y-1"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="relative p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 cursor-pointer group-hover:scale-110 transition-transform duration-300 shadow-lg"
                  onClick={() => navigate(`/societies/${society.id}`)}
                >
                  <Building2 className="w-6 h-6 text-white" />
                  <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => navigate(`/societies/${society.id}`)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                    title="View details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => { setEditingSociety(society); setShowModal(true) }}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition"
                    title="Edit society"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this society?')) {
                        deleteMutation.mutate(society.id)
                      }
                    }}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                    title="Delete society"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Society Name & Address */}
              <h3 
                className="text-lg font-bold text-gray-900 dark:text-white mb-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => navigate(`/societies/${society.id}`)}
              >
                {society.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{society.address}</p>

              {/* Unit Stats Grid */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 group/stat hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  <Home className="w-4 h-4 mx-auto text-blue-600 dark:text-blue-400 mb-1" />
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{society.actualFlats || 0}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Flats</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                  <Store className="w-4 h-4 mx-auto text-green-600 dark:text-green-400 mb-1" />
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{society.actualShops || 0}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Shops</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                  <Briefcase className="w-4 h-4 mx-auto text-purple-600 dark:text-purple-400 mb-1" />
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{society.actualOffices || 0}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Offices</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                  <Layers className="w-4 h-4 mx-auto text-amber-600 dark:text-amber-400 mb-1" />
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{society.actualWings || 0}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Wings</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-1 text-sm border-t border-gray-100 dark:border-slate-700 pt-3">
                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">📍</span> 
                  {society.city}{society.state ? `, ${society.state}` : ''}
                </p>
                {society.phone && (
                  <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span>📞</span> {society.phone}
                  </p>
                )}
              </div>

              {/* View Details Button */}
              <button
                onClick={() => navigate(`/societies/${society.id}`)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg group/btn"
              >
                View Details
                <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingSociety ? 'Edit Society' : 'Add New Society'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {editingSociety ? 'Update society details and capacity' : 'Create a new society with its properties'}
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                  <Building2 size={16} className="text-blue-500" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Society Name *</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingSociety?.name}
                      required
                      placeholder="Enter society name"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address *</label>
                    <textarea
                      name="address"
                      defaultValue={editingSociety?.address}
                      rows={2}
                      required
                      placeholder="Full address"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">City *</label>
                    <input
                      type="text"
                      name="city"
                      defaultValue={editingSociety?.city}
                      required
                      placeholder="City"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">State</label>
                    <input
                      type="text"
                      name="state"
                      defaultValue={editingSociety?.state}
                      placeholder="State"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      defaultValue={editingSociety?.pincode}
                      placeholder="Pincode"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Registration Number</label>
                    <input
                      type="text"
                      name="registrationNumber"
                      defaultValue={editingSociety?.registrationNumber}
                      placeholder="Registration number"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingSociety?.email}
                      placeholder="Society email"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={editingSociety?.phone}
                      placeholder="Phone number"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Property Capacity Section */}
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                  <Layers size={16} className="text-purple-500" />
                  Property Capacity (Optional)
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Set the total capacity for planning purposes. Actual counts are calculated automatically.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                      <Home size={14} className="text-blue-500" />
                      Total Flats
                    </label>
                    <input
                      type="number"
                      name="totalFlats"
                      min="0"
                      defaultValue={editingSociety?.totalFlats || 0}
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                      <Store size={14} className="text-green-500" />
                      Total Shops
                    </label>
                    <input
                      type="number"
                      name="totalShops"
                      min="0"
                      defaultValue={editingSociety?.totalShops || 0}
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                      <Briefcase size={14} className="text-purple-500" />
                      Total Offices
                    </label>
                    <input
                      type="number"
                      name="totalOffices"
                      min="0"
                      defaultValue={editingSociety?.totalOffices || 0}
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                      <Layers size={14} className="text-amber-500" />
                      Total Wings
                    </label>
                    <input
                      type="number"
                      name="totalWings"
                      min="0"
                      defaultValue={editingSociety?.totalWings || 0}
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {editingSociety ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    editingSociety ? 'Update Society' : 'Create Society'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
