import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { userApi, societyApi } from '../api'
import { Plus, Edit, Trash2, Search, X, AlertCircle, Shield, Users as UsersIcon, Building2 } from 'lucide-react'
import clsx from 'clsx'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { parseApiError, validateUserForm } from '../utils/validation'

const roleColors = {
  MASTER_ADMIN: 'bg-purple-100 text-purple-800',
  SOCIETY_ADMIN: 'bg-blue-100 text-blue-800',
  CHAIRMAN: 'bg-indigo-100 text-indigo-800',
  SECRETARY: 'bg-cyan-100 text-cyan-800',
  TREASURER: 'bg-green-100 text-green-800',
  COMMITTEE: 'bg-yellow-100 text-yellow-800',
  EMPLOYEE: 'bg-orange-100 text-orange-800',
  MEMBER: 'bg-gray-100 text-gray-800',
  TENANT: 'bg-pink-100 text-pink-800',
  VISITOR: 'bg-red-100 text-red-800',
}

// Role hierarchy descriptions for tooltips
const roleHierarchyInfo = {
  MASTER_ADMIN: 'Platform Owner - Can only manage SOCIETY_ADMIN',
  SOCIETY_ADMIN: 'Society Manager - Full control over all roles in society',
  CHAIRMAN: 'Committee Head - Can manage SECRETARY and TREASURER',
  SECRETARY: 'Administrative Head - Can manage COMMITTEE members',
  TREASURER: 'Financial Head - Can manage COMMITTEE members',
  COMMITTEE: 'Committee Member - Can manage EMPLOYEE and MEMBER',
  EMPLOYEE: 'Society Staff - Can manage VISITOR only',
  MEMBER: 'Flat Owner - Can manage TENANT only',
  TENANT: 'Renter - View only access',
  VISITOR: 'Temporary Access - View only access',
}

export default function Users() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  
  // Get URL parameters for filtering
  const urlSocietyId = searchParams.get('society')
  const urlRole = searchParams.get('role')
  
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  
  // Initialize filterRole from URL parameter
  useEffect(() => {
    if (urlRole) {
      setFilterRole(urlRole)
    }
  }, [urlRole])

  // Check if current user is MASTER_ADMIN
  const isMasterAdmin = user?.role === 'MASTER_ADMIN'

  // Fetch users - include user.id in queryKey to refetch when user changes
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', user?.id],
    queryFn: () => userApi.getAll().then(res => res.data).catch(() => []),
  })

  // Fetch roles that current user can create
  const { data: creatableRoles = [] } = useQuery({
    queryKey: ['creatable-roles', user?.id],
    queryFn: () => userApi.getCreatableRoles().then(res => res.data).catch(() => []),
  })

  // Fetch roles that current user can update/delete
  const { data: updatableRoles = [] } = useQuery({
    queryKey: ['updatable-roles', user?.id],
    queryFn: () => userApi.getUpdatableRoles().then(res => res.data).catch(() => []),
  })

  const handleOpenModal = (userToEdit = null) => {
    setEditingUser(userToEdit)
    setSelectedRole(userToEdit?.role || (creatableRoles.length === 1 ? creatableRoles[0] : creatableRoles[0] || 'MEMBER'))
    setShowModal(true)
  }

  const { data: societies = [] } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data).catch(() => []),
    enabled: isMasterAdmin,
  })

  const createMutation = useMutation({
    mutationFn: (data) => userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowModal(false)
      setEditingUser(null)
      setError('')
    },
    onError: (err) => {
      setError(parseApiError(err))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowModal(false)
      setEditingUser(null)
      setError('')
    },
    onError: (err) => {
      setError(parseApiError(err))
    },
  })

  const [deleteError, setDeleteError] = useState('')

  const deleteMutation = useMutation({
    mutationFn: (id) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setDeleteError('')
    },
    onError: (err) => {
      setDeleteError(err.response?.data?.message || 'Failed to delete user')
    },
  })

  // For MASTER_ADMIN, only show SOCIETY_ADMINs (not all users scattered)
  // UNLESS viewing a specific society from URL - then show all users in that society
  // For others, show all users they can see
  let displayUsers = users
  
  // Apply society filter from URL if present
  if (urlSocietyId) {
    displayUsers = displayUsers.filter(u => String(u.societyId) === urlSocietyId)
  } else if (isMasterAdmin) {
    // Only apply SOCIETY_ADMIN filter when not viewing a specific society
    displayUsers = displayUsers.filter(u => u.role === 'SOCIETY_ADMIN')
  }

  const filteredUsers = displayUsers.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !filterRole || u.role === filterRole
    return matchesSearch && matchesRole
  })

  // Get society name for a user
  const getSocietyName = (societyId) => {
    const society = societies.find(s => s.id === societyId)
    return society?.name || 'No Society Assigned'
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    // Use the single role if only one is available
    const roleValue = creatableRoles.length === 1 ? creatableRoles[0] : formData.get('role')
    
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: roleValue,
      phone: formData.get('phone'),
      societyId: formData.get('societyId') ? parseInt(formData.get('societyId')) : null,
    }

    // Frontend validation
    const validation = validateUserForm(data, !editingUser)
    if (!validation.isValid) {
      setError(Object.values(validation.errors).join(', '))
      return
    }

    // Validate societyId is required for SOCIETY_ADMIN creation by MASTER_ADMIN
    if (user?.role === 'MASTER_ADMIN' && roleValue === 'SOCIETY_ADMIN' && !data.societyId) {
      setError('Please select a society for the Society Admin')
      return
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  // Determine page title based on context
  const getPageTitle = () => {
    if (urlSocietyId && urlRole) {
      return `${urlRole.replace('_', ' ')}s`
    }
    if (urlSocietyId) {
      return 'Society Users'
    }
    if (isMasterAdmin) {
      return 'Society Admins'
    }
    return 'Users'
  }
  
  const getPageDescription = () => {
    if (urlSocietyId) {
      return 'View users in this society'
    }
    if (isMasterAdmin) {
      return 'Manage society administrators'
    }
    return 'Manage system users and roles'
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getPageTitle()}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {getPageDescription()}
          </p>
        </div>
        {creatableRoles.length > 0 && (
          <button
            onClick={() => handleOpenModal(null)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            {isMasterAdmin && !urlSocietyId ? 'Create Society Admin' : 'Add User'}
          </button>
        )}
      </div>

      {/* Role Permissions Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 dark:text-blue-100">Your Permissions ({user?.role?.replace('_', ' ')})</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {roleHierarchyInfo[user?.role] || 'View only access'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {creatableRoles.length > 0 && (
                <div className="text-xs">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Can create:</span>{' '}
                  <span className="text-blue-800 dark:text-blue-200">
                    {creatableRoles.map(r => r.replace('_', ' ')).join(', ')}
                  </span>
                </div>
              )}
              {updatableRoles.length > 0 && creatableRoles.length > 0 && (
                <span className="text-blue-400 dark:text-blue-500">|</span>
              )}
              {updatableRoles.length > 0 && (
                <div className="text-xs">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Can edit/delete:</span>{' '}
                  <span className="text-blue-800 dark:text-blue-200">
                    {updatableRoles.map(r => r.replace('_', ' ')).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Error Alert */}
      {deleteError && (
        <div className="flex items-center justify-between gap-2 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{deleteError}</span>
          </div>
          <button 
            onClick={() => setDeleteError('')}
            className="p-1 hover:bg-red-100 rounded"
          >
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
              placeholder={isMasterAdmin && !urlSocietyId ? "Search society admins..." : "Search users..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
          {/* Only show role filter for non-MASTER_ADMIN users (or when viewing specific society), and only show roles they can see */}
          {(!isMasterAdmin || urlSocietyId) && updatableRoles.length > 0 && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="">All Roles</option>
              {/* Include current user's role + roles they can manage */}
              {[user?.role, ...updatableRoles].filter((role, index, arr) => role && arr.indexOf(role) === index).map(role => (
                <option key={role} value={role}>{role.replace('_', ' ')}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* MASTER_ADMIN sees Society Admin cards with navigation (unless viewing specific society) */}
      {isMasterAdmin && !urlSocietyId ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            Society Administrators
            <span className="text-sm font-normal text-gray-500">({filteredUsers.length})</span>
          </h2>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center">
              <UsersIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No Society Admins found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create a new Society Admin to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((u) => {
                const canEdit = updatableRoles.includes(u.role)
                const canDelete = u.role !== 'MASTER_ADMIN' && updatableRoles.includes(u.role)
                const societyName = getSocietyName(u.societyId)
                
                return (
                  <div key={u.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 hover:shadow-md transition">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{u.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                        </div>
                      </div>
                      <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', roleColors[u.role])}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* Society Info */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg mb-3">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{societyName}</span>
                    </div>
                    
                    {/* Phone */}
                    {u.phone && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        📞 {u.phone}
                      </p>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
                      {u.societyId && (
                        <button
                          onClick={() => navigate(`/societies/${u.societyId}`)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                        >
                          <Building2 className="w-4 h-4" />
                          View Society
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition"
                          title="Edit user"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this user?')) {
                              deleteMutation.mutate(u.id)
                            }
                          }}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition"
                          title="Delete user"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
      /* Table view for non-MASTER_ADMIN users */
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredUsers.map((u) => {
                  // Check if current user can edit/delete this user
                  const canEdit = u.id === user?.id || updatableRoles.includes(u.role)
                  const canDelete = u.role !== 'MASTER_ADMIN' && updatableRoles.includes(u.role)
                  const isSelf = u.id === user?.id
                  
                  return (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{u.name}</span>
                          {isSelf && (
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', roleColors[u.role])}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{u.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {canEdit ? (
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 transition"
                          title={isSelf ? 'Edit your profile' : 'Edit user'}
                        >
                          <Edit size={18} />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="p-1.5 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                          title="No permission to edit this user"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {canDelete ? (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this user?')) {
                              deleteMutation.mutate(u.id)
                            }
                          }}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 transition ml-2"
                          title="Delete user"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="p-1.5 text-gray-300 dark:text-gray-600 cursor-not-allowed ml-2"
                          title={isSelf ? "Cannot delete yourself" : "No permission to delete this user"}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold dark:text-white">{editingUser ? 'Edit User' : 'Add User'}</h3>
              <button onClick={() => { setShowModal(false); setError(''); }} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingUser?.name}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingUser?.email}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    required={!editingUser}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                {creatableRoles.length === 1 && !editingUser ? (
                  // Single role - show static text instead of dropdown
                  <div className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{creatableRoles[0].replace('_', ' ')}</span>
                  </div>
                ) : (
                  // Multiple roles - show dropdown
                  <select
                    name="role"
                    defaultValue={editingUser?.role || (creatableRoles[0] || 'MEMBER')}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    {creatableRoles.length > 0 ? (
                      creatableRoles.map(role => (
                        <option key={role} value={role}>{role.replace('_', ' ')}</option>
                      ))
                    ) : (
                      <option value="" disabled>No roles available to create</option>
                    )}
                  </select>
                )}
                {creatableRoles.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">You don't have permission to create users.</p>
                )}
              </div>
              {user?.role === 'MASTER_ADMIN' && (selectedRole || editingUser?.role) === 'SOCIETY_ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Society</label>
                  <select
                    name="societyId"
                    defaultValue={editingUser?.societyId || ''}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Society</option>
                    {societies.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={editingUser?.phone}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatableRoles.length === 0 && !editingUser}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
