import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { flatApi, societyApi, wingApi, userApi } from '../api'
import { 
  Plus, Edit, Trash2, Search, X, Home, Store, Briefcase, Layers, 
  Users, UserPlus, UserCheck, UserX, Upload, Download, AlertCircle,
  Eye, Link, Unlink, UsersRound
} from 'lucide-react'
import clsx from 'clsx'
import { validateFlatForm, validateUserForm, parseApiError } from '../utils/validation'

const unitTypeIcons = {
  FLAT: Home,
  SHOP: Store,
  OFFICE: Briefcase
}

const unitTypeColors = {
  FLAT: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  SHOP: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  OFFICE: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
}

export default function UnitManagement() {
  const { user, isCommitteeLevel, canManageDocuments } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  
  // Modal states
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false)
  const [bulkCreateResults, setBulkCreateResults] = useState(null)
  
  // Editing states
  const [editingUnit, setEditingUnit] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [viewMode, setViewMode] = useState('units') // 'units' or 'table'
  
  // Form states
  const [unitFormErrors, setUnitFormErrors] = useState({})
  const [userFormErrors, setUserFormErrors] = useState({})
  const [apiError, setApiError] = useState('')

  // Get society filter from URL (for MASTER_ADMIN viewing specific society)
  const societyIdFromUrl = searchParams.get('society')
  const isMasterAdmin = user?.role === 'MASTER_ADMIN'
  const effectiveSocietyId = isMasterAdmin && societyIdFromUrl ? parseInt(societyIdFromUrl) : user?.societyId

  // Fetch flats/units
  const { data: flats = [], isLoading: flatsLoading } = useQuery({
    queryKey: ['flats', user?.id, effectiveSocietyId],
    queryFn: () => effectiveSocietyId 
      ? flatApi.getBySociety(effectiveSocietyId).then(res => res.data)
      : flatApi.getAll(user.id).then(res => res.data),
    enabled: !!user?.id,
  })

  // Fetch users in the society
  const { data: users = [] } = useQuery({
    queryKey: ['users', user?.id],
    queryFn: () => userApi.getAll().then(res => res.data).catch(() => []),
    enabled: !!user?.id,
  })

  // Fetch societies (for MASTER_ADMIN)
  const { data: societies = [] } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data),
    enabled: isMasterAdmin,
  })

  // Fetch wings
  const { data: wings = [] } = useQuery({
    queryKey: ['wings', effectiveSocietyId],
    queryFn: () => effectiveSocietyId 
      ? wingApi.getBySociety(effectiveSocietyId).then(res => res.data)
      : [],
    enabled: !!effectiveSocietyId,
  })

  // Filter members for linking to units
  const memberUsers = useMemo(() => {
    return users.filter(u => ['MEMBER', 'TENANT'].includes(u.role))
  }, [users])

  // Create unit-user mapping
  const unitUserMap = useMemo(() => {
    const map = {}
    flats.forEach(flat => {
      map[flat.id] = {
        flat,
        owner: flat.ownerEmail ? users.find(u => u.email === flat.ownerEmail) : null,
        members: memberUsers.filter(u => u.flatId === flat.id)
      }
    })
    return map
  }, [flats, users, memberUsers])

  // Filtered data
  const filteredUnits = useMemo(() => {
    return flats.filter(f => {
      const matchesSearch = 
        f.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = !filterType || f.unitType === filterType
      return matchesSearch && matchesType
    })
  }, [flats, searchTerm, filterType])

  // Unit CRUD mutations
  const createUnitMutation = useMutation({
    mutationFn: (data) => flatApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['flats'])
      setShowUnitModal(false)
      setUnitFormErrors({})
      setApiError('')
    },
    onError: (err) => {
      setApiError(parseApiError(err))
    },
  })

  const updateUnitMutation = useMutation({
    mutationFn: ({ id, data }) => flatApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['flats'])
      setShowUnitModal(false)
      setEditingUnit(null)
      setUnitFormErrors({})
      setApiError('')
    },
    onError: (err) => {
      setApiError(parseApiError(err))
    },
  })

  const deleteUnitMutation = useMutation({
    mutationFn: (id) => flatApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['flats']),
    onError: (err) => {
      setApiError(parseApiError(err))
    },
  })

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: (data) => userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowUserModal(false)
      setUserFormErrors({})
      setApiError('')
    },
    onError: (err) => {
      setApiError(parseApiError(err))
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowUserModal(false)
      setUserFormErrors({})
      setApiError('')
    },
    onError: (err) => {
      setApiError(parseApiError(err))
    },
  })

  // Bulk create users mutation
  const bulkCreateUsersMutation = useMutation({
    mutationFn: () => userApi.bulkCreateForUnits(effectiveSocietyId),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['users'])
      queryClient.invalidateQueries(['flats'])
      setBulkCreateResults(response.data)
      showToast(`Created ${response.data.usersCreated} users successfully`, 'success')
    },
    onError: (err) => {
      showToast(parseApiError(err), 'error')
      setShowBulkCreateModal(false)
    },
  })

  // Handle unit form submission
  const handleUnitSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    const societyId = isMasterAdmin 
      ? parseInt(formData.get('societyId')) 
      : user?.societyId

    const data = {
      societyId,
      wingId: formData.get('wingId') ? parseInt(formData.get('wingId')) : null,
      flatNumber: formData.get('flatNumber'),
      unitType: formData.get('unitType') || 'FLAT',
      flatType: formData.get('flatType'),
      floor: parseInt(formData.get('floor')) || 0,
      area: parseFloat(formData.get('area')) || 0,
      ownerName: formData.get('ownerName'),
      ownerEmail: formData.get('ownerEmail'),
      ownerPhone: formData.get('ownerPhone'),
    }

    // Validate
    const validation = validateFlatForm(data)
    if (!validation.isValid) {
      setUnitFormErrors(validation.errors)
      return
    }

    if (editingUnit) {
      updateUnitMutation.mutate({ id: editingUnit.id, data })
    } else {
      createUnitMutation.mutate(data)
    }
  }

  // Handle user form submission for linking to unit
  const handleUserSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password') || selectedUnit?.flatNumber, // Default password = flat number
      role: formData.get('role') || 'MEMBER',
      phone: formData.get('phone'),
      societyId: effectiveSocietyId,
      flatId: selectedUnit?.id,
    }

    // Validate
    const validation = validateUserForm(data, false)
    if (!validation.isValid) {
      setUserFormErrors(validation.errors)
      return
    }

    createUserMutation.mutate(data)
  }

  const openUnitModal = (unit = null) => {
    setEditingUnit(unit)
    setUnitFormErrors({})
    setApiError('')
    setShowUnitModal(true)
  }

  const openUserModal = (unit) => {
    setSelectedUnit(unit)
    setUserFormErrors({})
    setApiError('')
    setShowUserModal(true)
  }

  const getUnitIcon = (type) => unitTypeIcons[type] || Home
  const getUnitColor = (type) => unitTypeColors[type] || unitTypeColors.FLAT

  // Stats
  const stats = useMemo(() => ({
    totalUnits: flats.length,
    flats: flats.filter(f => !f.unitType || f.unitType === 'FLAT').length,
    shops: flats.filter(f => f.unitType === 'SHOP').length,
    offices: flats.filter(f => f.unitType === 'OFFICE').length,
    occupied: flats.filter(f => f.ownerName).length,
    vacant: flats.filter(f => !f.ownerName).length,
    linkedUsers: memberUsers.length,
  }), [flats, memberUsers])

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Home className="w-7 h-7 text-blue-600" />
            Unit Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage units and their assigned users in one place
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isCommitteeLevel() && (
            <>
              <button
                onClick={() => setShowBulkCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition"
              >
                <UsersRound size={18} />
                Bulk Create Users
              </button>
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
              >
                <Upload size={18} />
                Import
              </button>
              <button
                onClick={() => openUnitModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={20} />
                Add Unit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <StatCard label="Total Units" value={stats.totalUnits} icon={Layers} color="blue" />
        <StatCard label="Flats" value={stats.flats} icon={Home} color="indigo" />
        <StatCard label="Shops" value={stats.shops} icon={Store} color="green" />
        <StatCard label="Offices" value={stats.offices} icon={Briefcase} color="purple" />
        <StatCard label="Occupied" value={stats.occupied} icon={UserCheck} color="teal" />
        <StatCard label="Vacant" value={stats.vacant} icon={UserX} color="orange" />
        <StatCard label="Users" value={stats.linkedUsers} icon={Users} color="pink" />
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="flex items-center justify-between gap-2 p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{apiError}</span>
          </div>
          <button onClick={() => setApiError('')} className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by unit number, owner name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="FLAT">Flats</option>
            <option value="SHOP">Shops</option>
            <option value="OFFICE">Offices</option>
          </select>
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-300 dark:border-slate-600 overflow-hidden">
            <button
              onClick={() => setViewMode('units')}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition',
                viewMode === 'units'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
              )}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition',
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
              )}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {flatsLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : viewMode === 'units' ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => {
            const UnitIcon = getUnitIcon(unit.unitType)
            const unitColor = getUnitColor(unit.unitType)
            const linkedOwner = unitUserMap[unit.id]?.owner
            const linkedMembers = unitUserMap[unit.id]?.members || []
            
            return (
              <div key={unit.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 hover:shadow-md transition">
                {/* Unit Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${unitColor}`}>
                      <UnitIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{unit.flatNumber}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        {unit.wingName && (
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {unit.wingName}
                          </span>
                        )}
                        <span>Floor {unit.floor}</span>
                      </div>
                    </div>
                  </div>
                  <span className={clsx(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    unit.ownerName ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'
                  )}>
                    {unit.ownerName ? 'Occupied' : 'Vacant'}
                  </span>
                </div>

                {/* Unit Details */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Type:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{unit.flatType || unit.unitType || 'FLAT'}</span>
                  </div>
                  {unit.area > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Area:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{unit.area} sq.ft</span>
                    </div>
                  )}
                </div>

                {/* Owner Info */}
                <div className="border-t border-gray-100 dark:border-slate-700 pt-4 mb-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Owner / Member</p>
                  {unit.ownerName ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {unit.ownerName?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{unit.ownerName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{unit.ownerPhone || unit.ownerEmail}</p>
                      </div>
                      {linkedOwner && (
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                          Linked
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 text-sm italic">No owner assigned</p>
                  )}
                </div>

                {/* Linked Users */}
                {linkedMembers.length > 0 && (
                  <div className="border-t border-gray-100 dark:border-slate-700 pt-3 mb-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                      Linked Users ({linkedMembers.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {linkedMembers.slice(0, 3).map(m => (
                        <span key={m.id} className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-full">
                          {m.name}
                        </span>
                      ))}
                      {linkedMembers.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 rounded-full">
                          +{linkedMembers.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {isCommitteeLevel() && (
                  <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <button
                      onClick={() => openUnitModal(unit)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => openUserModal(unit)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                    >
                      <UserPlus size={14} />
                      Add User
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this unit?')) {
                          deleteUnitMutation.mutate(unit.id)
                        }
                      }}
                      className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Wing</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Owner / Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  {isCommitteeLevel() && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredUnits.map((unit) => {
                  const UnitIcon = getUnitIcon(unit.unitType)
                  return (
                    <tr key={unit.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getUnitColor(unit.unitType)}`}>
                            <UnitIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{unit.flatNumber}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Floor {unit.floor}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {unit.wingName ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                            <Layers className="w-3 h-3" />
                            {unit.wingName}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-600 dark:text-gray-300">{unit.flatType || unit.unitType || 'FLAT'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900 dark:text-white">{unit.ownerName || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <p className="text-gray-600 dark:text-gray-300">{unit.ownerPhone || '-'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{unit.ownerEmail || ''}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={clsx(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          unit.ownerName ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'
                        )}>
                          {unit.ownerName ? 'Occupied' : 'Vacant'}
                        </span>
                      </td>
                      {isCommitteeLevel() && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => openUnitModal(unit)}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 transition"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => openUserModal(unit)}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-green-600 transition ml-1"
                          >
                            <UserPlus size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this unit?')) {
                                deleteUnitMutation.mutate(unit.id)
                              }
                            }}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 transition ml-1"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unit Modal */}
      {showUnitModal && (
        <UnitFormModal
          unit={editingUnit}
          societies={societies}
          wings={wings}
          isMasterAdmin={isMasterAdmin}
          userSocietyId={user?.societyId}
          errors={unitFormErrors}
          apiError={apiError}
          onSubmit={handleUnitSubmit}
          onClose={() => {
            setShowUnitModal(false)
            setEditingUnit(null)
            setUnitFormErrors({})
            setApiError('')
          }}
          isLoading={createUnitMutation.isPending || updateUnitMutation.isPending}
        />
      )}

      {/* User Modal for linking to unit */}
      {showUserModal && selectedUnit && (
        <UserFormModal
          unit={selectedUnit}
          errors={userFormErrors}
          apiError={apiError}
          onSubmit={handleUserSubmit}
          onClose={() => {
            setShowUserModal(false)
            setSelectedUnit(null)
            setUserFormErrors({})
            setApiError('')
          }}
          isLoading={createUserMutation.isPending}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <BulkImportModal
          onClose={() => setShowBulkImportModal(false)}
          societyId={effectiveSocietyId}
          onSuccess={() => {
            queryClient.invalidateQueries(['flats'])
            queryClient.invalidateQueries(['users'])
            setShowBulkImportModal(false)
          }}
        />
      )}

      {/* Bulk Create Users Modal */}
      {showBulkCreateModal && (
        <BulkCreateUsersModal
          isLoading={bulkCreateUsersMutation.isPending}
          results={bulkCreateResults}
          onConfirm={() => bulkCreateUsersMutation.mutate()}
          onClose={() => {
            setShowBulkCreateModal(false)
            setBulkCreateResults(null)
          }}
        />
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
  }
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  )
}

// Unit Form Modal
function UnitFormModal({ unit, societies, wings, isMasterAdmin, userSocietyId, errors, apiError, onSubmit, onClose, isLoading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <h3 className="text-lg font-semibold dark:text-white">{unit ? 'Edit Unit' : 'Add Unit'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {apiError && (
          <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {apiError}
          </div>
        )}

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          {/* Society (MASTER_ADMIN only) */}
          {isMasterAdmin ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Society <span className="text-red-500">*</span>
              </label>
              <select
                name="societyId"
                defaultValue={unit?.societyId}
                required
                className={clsx(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white',
                  errors.societyId ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                )}
              >
                <option value="">Select Society</option>
                {societies.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.societyId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.societyId}</p>}
            </div>
          ) : (
            <input type="hidden" name="societyId" value={userSocietyId || ''} />
          )}

          {/* Unit Type and Wing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit Type</label>
              <select
                name="unitType"
                defaultValue={unit?.unitType || 'FLAT'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="FLAT">Flat</option>
                <option value="SHOP">Shop</option>
                <option value="OFFICE">Office</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wing</label>
              <select
                name="wingId"
                defaultValue={unit?.wingId || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="">No Wing</option>
                {wings.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Flat Number and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unit Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="flatNumber"
                defaultValue={unit?.flatNumber}
                required
                placeholder="e.g., A-101"
                className={clsx(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400',
                  errors.flatNumber ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                )}
              />
              {errors.flatNumber && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.flatNumber}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Flat Type</label>
              <select
                name="flatType"
                defaultValue={unit?.flatType || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="">Select Type</option>
                <option value="1BHK">1 BHK</option>
                <option value="2BHK">2 BHK</option>
                <option value="3BHK">3 BHK</option>
                <option value="4BHK">4 BHK</option>
                <option value="Penthouse">Penthouse</option>
              </select>
            </div>
          </div>

          {/* Floor and Area */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Floor</label>
              <input
                type="number"
                name="floor"
                defaultValue={unit?.floor || 0}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area (sq.ft)</label>
              <input
                type="number"
                name="area"
                defaultValue={unit?.area || ''}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Owner Details */}
          <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Owner / Member Details</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner Name</label>
                <input
                  type="text"
                  name="ownerName"
                  defaultValue={unit?.ownerName || ''}
                  placeholder="Enter owner name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner Email</label>
                  <input
                    type="email"
                    name="ownerEmail"
                    defaultValue={unit?.ownerEmail || ''}
                    placeholder="email@example.com"
                    className={clsx(
                      'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400',
                      errors.ownerEmail ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                    )}
                  />
                  {errors.ownerEmail && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ownerEmail}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner Phone</label>
                  <input
                    type="tel"
                    name="ownerPhone"
                    defaultValue={unit?.ownerPhone || ''}
                    placeholder="10-digit number"
                    className={clsx(
                      'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400',
                      errors.ownerPhone ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                    )}
                  />
                  {errors.ownerPhone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ownerPhone}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Saving...' : unit ? 'Update Unit' : 'Create Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// User Form Modal for linking user to unit
function UserFormModal({ unit, errors, apiError, onSubmit, onClose, isLoading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <div>
            <h3 className="text-lg font-semibold dark:text-white">Add User to Unit</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Unit: {unit.flatNumber}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {apiError && (
          <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {apiError}
          </div>
        )}

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
            <p><strong>Default Password:</strong> {unit.flatNumber}</p>
            <p className="text-xs mt-1">User can change password after login</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Enter full name"
              className={clsx(
                'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400',
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
              )}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="email@example.com"
              className={clsx(
                'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400',
                errors.email ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
              )}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              placeholder="10-digit number"
              className={clsx(
                'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400',
                errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
              )}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              name="role"
              defaultValue="MEMBER"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="MEMBER">Member (Owner)</option>
              <option value="TENANT">Tenant</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Bulk Import Modal (placeholder for now)
function BulkImportModal({ onClose, societyId, onSuccess }) {
  const [file, setFile] = useState(null)
  const [validationResults, setValidationResults] = useState(null)
  const [importResults, setImportResults] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('upload') // 'upload', 'preview', 'results'

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setValidationResults(null)
      setImportResults(null)
      setError('')
      setStep('upload')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile)
      setValidationResults(null)
      setImportResults(null)
      setError('')
      setStep('upload')
    } else {
      setError('Please drop a valid Excel file (.xlsx or .xls)')
    }
  }

  const handleValidate = async () => {
    if (!file || !societyId) return
    setIsValidating(true)
    setError('')
    try {
      const response = await userApi.validateBulkImport(file, societyId)
      setValidationResults(response.data)
      setStep('preview')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to validate file')
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = async () => {
    if (!file || !societyId) return
    setIsImporting(true)
    setError('')
    try {
      const response = await userApi.processBulkImport(file, societyId)
      setImportResults(response.data)
      setStep('results')
      if (response.data.successCount > 0) {
        onSuccess?.()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import users')
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await userApi.downloadImportTemplate()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'user_import_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to download template')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold dark:text-white">Bulk Import Users</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {step === 'upload' && (
            <>
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 text-center"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{file.name}</span>
                    <button 
                      onClick={() => setFile(null)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                    >
                      <X size={18} className="text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Drag and drop your Excel file here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                      Supported format: .xlsx, .xls
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-upload"
                />
                {!file && (
                  <label
                    htmlFor="excel-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition"
                  >
                    <Upload size={18} />
                    Select File
                  </label>
                )}
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Excel Format Requirements:</h4>
                  <button
                    onClick={downloadTemplate}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Download size={14} />
                    Download Template
                  </button>
                </div>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Column A: Name (required)</li>
                  <li>• Column B: Email (required, becomes username)</li>
                  <li>• Column C: Phone (required)</li>
                  <li>• Column D: Flat Number (required, becomes default password)</li>
                  <li>• Column E: Wing Code (optional)</li>
                  <li>• Column F: Role (optional, default: MEMBER)</li>
                </ul>
              </div>
            </>
          )}

          {step === 'preview' && validationResults && (
            <>
              <div className="mb-4 flex gap-4">
                <div className="flex-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {validationResults.successCount}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Valid</div>
                </div>
                <div className="flex-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {validationResults.failureCount}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">Invalid</div>
                </div>
              </div>

              <div className="border dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left dark:text-white">Row</th>
                      <th className="px-3 py-2 text-left dark:text-white">Name</th>
                      <th className="px-3 py-2 text-left dark:text-white">Email</th>
                      <th className="px-3 py-2 text-left dark:text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-700">
                    {validationResults.results?.map((result, idx) => (
                      <tr key={idx} className={result.success ? '' : 'bg-red-50 dark:bg-red-900/10'}>
                        <td className="px-3 py-2 dark:text-gray-300">{result.rowNumber}</td>
                        <td className="px-3 py-2 dark:text-gray-300">{result.name}</td>
                        <td className="px-3 py-2 dark:text-gray-300">{result.email}</td>
                        <td className="px-3 py-2">
                          {result.success ? (
                            <span className="text-green-600 dark:text-green-400">✓ Valid</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">{result.errorMessage}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {step === 'results' && importResults && (
            <div className="text-center py-8">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                importResults.successCount > 0 
                  ? 'bg-green-100 dark:bg-green-900/30' 
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {importResults.successCount > 0 ? (
                  <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                ) : (
                  <UserX className="w-8 h-8 text-red-600 dark:text-red-400" />
                )}
              </div>
              <h4 className="text-lg font-semibold dark:text-white mb-2">{importResults.message}</h4>
              <div className="flex gap-4 justify-center">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {importResults.successCount}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Imported</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">
                    {importResults.failureCount}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            {step === 'upload' && (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleValidate}
                  disabled={!file || isValidating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {isValidating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Eye size={18} />
                      Preview & Validate
                    </>
                  )}
                </button>
              </>
            )}

            {step === 'preview' && (
              <>
                <button
                  onClick={() => setStep('upload')}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={validationResults?.failureCount > 0 || isImporting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Import {validationResults?.successCount} Users
                    </>
                  )}
                </button>
              </>
            )}

            {step === 'results' && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Bulk Create Users Modal
function BulkCreateUsersModal({ isLoading, results, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold dark:text-white">
            {results ? 'Bulk Create Results' : 'Create Users in Bulk'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!results ? (
            <>
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <UsersRound className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-semibold dark:text-white mb-2">Create Users for All Units</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  This will automatically create user accounts for all units that have an owner email configured but don't have an associated user yet.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left mb-4">
                  <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How it works:</h5>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Email from unit owner details will be used as username</li>
                    <li>• Flat/Unit number will be used as the default password</li>
                    <li>• Units without owner email will be skipped</li>
                    <li>• Units with existing users will be skipped</li>
                    <li>• All users will be created with MEMBER role</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-left">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Users should change their password after first login
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Users...
                    </>
                  ) : (
                    <>
                      <UsersRound size={18} />
                      Create Users
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-4">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  results.usersCreated > 0 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {results.usersCreated > 0 ? (
                    <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <UserX className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <h4 className="text-lg font-semibold dark:text-white mb-2">{results.message}</h4>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {results.usersCreated}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Created</div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {results.usersSkipped}
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">Skipped</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {results.errors}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">Errors</div>
                </div>
              </div>

              {results.results && results.results.length > 0 && (
                <div className="border dark:border-slate-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-700 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left dark:text-white">Unit</th>
                        <th className="px-3 py-2 text-left dark:text-white">Status</th>
                        <th className="px-3 py-2 text-left dark:text-white">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-700">
                      {results.results.map((result, idx) => (
                        <tr key={idx} className={
                          result.status === 'CREATED' ? 'bg-green-50/50 dark:bg-green-900/10' :
                          result.status === 'ERROR' ? 'bg-red-50/50 dark:bg-red-900/10' :
                          ''
                        }>
                          <td className="px-3 py-2 dark:text-gray-300">{result.flatNumber}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              result.status === 'CREATED' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                              result.status === 'SKIPPED' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                              'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                            }`}>
                              {result.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 dark:text-gray-300 text-xs">
                            {result.email || result.errorMessage}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
