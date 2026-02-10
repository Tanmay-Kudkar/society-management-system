import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { bannerApi } from '../../../api'
import { Plus, Search, X, Image, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, NumberInput, FormTextarea } from '../components/FormComponents'

export default function Banners() {
  const { user, canManageBanners } = useAuth()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Check if current user is PLATFORM_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: () => bannerApi.getAll().then(res => res.data),
  })



  const createMutation = useMutation({
    mutationFn: (data) => bannerApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['banners'])
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => bannerApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['banners'])
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => bannerApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['banners']),
  })

  const toggleMutation = useMutation({
    mutationFn: (banner) => bannerApi.update(banner.id, { ...banner, isActive: !banner.isActive }, user.id),
    onSuccess: () => queryClient.invalidateQueries(['banners']),
  })

  const filteredBanners = banners.filter(b => {
    const matchesSearch = b.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === '' || 
      (filterStatus === 'active' && b.isActive) || 
      (filterStatus === 'inactive' && !b.isActive)
    return matchesSearch && matchesStatus
  })

  const closeModal = () => {
    setShowModal(false)
    setEditingBanner(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      societyId: user.societyId,
      title: formData.get('title'),
      imageUrl: formData.get('imageUrl'),
      redirectUrl: formData.get('redirectUrl') || null,
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      displayOrder: parseInt(formData.get('displayOrder')) || 1,
    }
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Banners</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage promotional banners for mobile app</p>
        </div>
        {canManageBanners() && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Add Banner
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search banners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Banners Grid */}
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((banner) => (
            <div key={banner.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition">
              {/* Banner Image */}
              <div className="aspect-video bg-gray-100 dark:bg-slate-700 relative">
                {banner.imageUrl ? (
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-12 h-12 text-gray-300 dark:text-gray-500" />
                  </div>
                )}
                <div className={clsx(
                  'absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium',
                  banner.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300'
                )}>
                  {banner.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              {/* Banner Details */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{banner.title}</h3>
                {isPlatformLevel && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{banner.societyName || 'All Societies'}</p>}
                
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                  <p>Start: {banner.startDate && new Date(banner.startDate).toLocaleDateString()}</p>
                  <p>End: {banner.endDate && new Date(banner.endDate).toLocaleDateString()}</p>
                  <p>Order: {banner.displayOrder}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleMutation.mutate(banner)}
                    className={clsx(
                      'flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg transition',
                      banner.isActive 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    )}
                  >
                    {banner.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    {banner.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => { setEditingBanner(banner); setShowModal(true) }}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(banner.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
              <h3 className="text-lg font-semibold dark:text-white">{editingBanner ? 'Edit Banner' : 'Add Banner'}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded dark:text-gray-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <FormInput
                label="Title"
                name="title"
                defaultValue={editingBanner?.title || ''}
                required
              />
              <FormInput
                label="Image URL"
                name="imageUrl"
                type="url"
                defaultValue={editingBanner?.imageUrl || ''}
                required
                placeholder="https://example.com/image.jpg"
              />
              <FormInput
                label="Redirect URL (Optional)"
                name="redirectUrl"
                type="url"
                defaultValue={editingBanner?.redirectUrl || ''}
                placeholder="https://example.com"
              />
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Start Date"
                  name="startDate"
                  type="date"
                  defaultValue={editingBanner?.startDate || ''}
                  required
                />
                <FormInput
                  label="End Date"
                  name="endDate"
                  type="date"
                  defaultValue={editingBanner?.endDate || ''}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  label="Display Order"
                  name="displayOrder"
                  defaultValue={editingBanner?.displayOrder || 1}
                  min={1}
                />
                <SmartSelect
                  label="Status"
                  name="isActive"
                  defaultValue={editingBanner?.isActive?.toString() || 'true'}
                  options={[
                    { value: 'true', label: 'Active' },
                    { value: 'false', label: 'Inactive' },
                  ]}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  {editingBanner ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
