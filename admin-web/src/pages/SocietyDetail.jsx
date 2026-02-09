import { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { societyApi, userApi, flatApi, wingApi } from '../api'
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Users,
  Home,
  Car,
  CreditCard,
  Bell,
  MessageSquare,
  Shield,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  User,
  Briefcase,
  Store,
  Layers
} from 'lucide-react'
import clsx from 'clsx'

// Role colors matching the main app
const roleColors = {
  PLATFORM_OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  SOCIETY_ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  CHAIRMAN: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  SECRETARY: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  TREASURER: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  COMMITTEE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  EMPLOYEE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  MEMBER: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  TENANT: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  VISITOR: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const avatarColors = [
  'bg-gradient-to-br from-blue-500 to-indigo-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-purple-500 to-pink-600',
  'bg-gradient-to-br from-orange-500 to-red-600',
  'bg-gradient-to-br from-cyan-500 to-blue-600',
]

// Role hierarchy for display
const roleHierarchy = [
  { role: 'SOCIETY_ADMIN', label: 'Society Admin', icon: Shield, color: 'blue' },
  { role: 'CHAIRMAN', label: 'Chairman', icon: User, color: 'indigo' },
  { role: 'SECRETARY', label: 'Secretary', icon: Briefcase, color: 'cyan' },
  { role: 'TREASURER', label: 'Treasurer', icon: CreditCard, color: 'green' },
  { role: 'COMMITTEE', label: 'Committee', icon: Users, color: 'yellow' },
  { role: 'EMPLOYEE', label: 'Employee', icon: Briefcase, color: 'orange' },
  { role: 'MEMBER', label: 'Member', icon: Home, color: 'gray' },
  { role: 'TENANT', label: 'Tenant', icon: User, color: 'pink' },
  { role: 'VISITOR', label: 'Visitor', icon: User, color: 'red' },
]

export default function SocietyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Fetch society details
  const { data: society, isLoading: societyLoading, error: societyError } = useQuery({
    queryKey: ['society', id],
    queryFn: () => societyApi.getById(id).then(res => res.data),
    enabled: !!id,
  })

  // Fetch users for this society using society-specific endpoint
  const { data: societyUsers = [] } = useQuery({
    queryKey: ['society-users', id],
    queryFn: () => userApi.getBySociety(id).then(res => res.data).catch(() => []),
    enabled: !!id,
  })

  // Fetch flats for this society using society-specific endpoint
  const { data: societyFlats = [] } = useQuery({
    queryKey: ['society-flats', id],
    queryFn: () => flatApi.getBySociety(id).then(res => res.data).catch(() => []),
    enabled: !!id,
  })

  // Fetch wings for this society
  const { data: societyWings = [] } = useQuery({
    queryKey: ['society-wings', id],
    queryFn: () => wingApi.getBySociety(id).then(res => res.data).catch(() => []),
    enabled: !!id,
  })

  // Group users by role
  const usersByRole = useMemo(() => {
    const grouped = {}
    roleHierarchy.forEach(({ role }) => {
      grouped[role] = societyUsers.filter(u => u.role === role)
    })
    return grouped
  }, [societyUsers])

  // Calculate stats
  const stats = useMemo(() => {
    const flats = societyFlats.filter(f => !f.unitType || f.unitType === 'FLAT')
    const shops = societyFlats.filter(f => f.unitType === 'SHOP')
    const offices = societyFlats.filter(f => f.unitType === 'OFFICE')
    
    return {
      totalUsers: societyUsers.length,
      totalFlats: flats.length,
      occupiedFlats: flats.filter(f => f.isOccupied === true || f.ownerName).length,
      totalShops: shops.length,
      occupiedShops: shops.filter(f => f.isOccupied === true || f.ownerName).length,
      totalOffices: offices.length,
      occupiedOffices: offices.filter(f => f.isOccupied === true || f.ownerName).length,
      totalWings: societyWings.length,
      totalMembers: usersByRole.MEMBER?.length || 0,
      totalTenants: usersByRole.TENANT?.length || 0,
      totalEmployees: usersByRole.EMPLOYEE?.length || 0,
    }
  }, [societyUsers, societyFlats, societyWings, usersByRole])

  // Quick action links
  const quickActions = [
    { 
      title: 'Wings', 
      count: stats.totalWings, 
      icon: Layers, 
      color: 'bg-indigo-500', 
      href: `/wings?society=${id}`,
      description: 'Building wings'
    },
    { 
      title: 'Flats', 
      count: stats.totalFlats, 
      icon: Home, 
      color: 'bg-blue-500', 
      href: `/unit-management?society=${id}&unitType=FLAT`,
      description: `${stats.occupiedFlats} occupied`
    },
    { 
      title: 'Shops', 
      count: stats.totalShops, 
      icon: Store, 
      color: 'bg-green-500', 
      href: `/unit-management?society=${id}&unitType=SHOP`,
      description: `${stats.occupiedShops} occupied`
    },
    { 
      title: 'Offices', 
      count: stats.totalOffices, 
      icon: Briefcase, 
      color: 'bg-amber-500', 
      href: `/unit-management?society=${id}&unitType=OFFICE`,
      description: `${stats.occupiedOffices} occupied`
    },
    { 
      title: 'Members', 
      count: stats.totalMembers, 
      icon: Users, 
      color: 'bg-emerald-500', 
      href: `/users?society=${id}&role=MEMBER`,
      description: 'Flat owners'
    },
    { 
      title: 'Vehicles', 
      count: '—', 
      icon: Car, 
      color: 'bg-purple-500', 
      href: `/vehicles?society=${id}`,
      description: 'Registered vehicles'
    },
    { 
      title: 'Maintenance', 
      count: '—', 
      icon: CreditCard, 
      color: 'bg-orange-500', 
      href: `/maintenance-bills?society=${id}`,
      description: 'Bills & payments'
    },
    { 
      title: 'Notices', 
      count: '—', 
      icon: Bell, 
      color: 'bg-cyan-500', 
      href: `/notices?society=${id}`,
      description: 'Announcements'
    },
    { 
      title: 'Complaints', 
      count: '—', 
      icon: MessageSquare, 
      color: 'bg-rose-500', 
      href: `/complaints?society=${id}`,
      description: 'Open tickets'
    },
  ]

  if (societyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (societyError || !society) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Society Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">The society you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/societies')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <ArrowLeft size={18} />
          Back to Societies
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      {/* Header Section */}
      <div className="society-header">
        <div className="society-header-content">
          {/* Back Button */}
          <button 
            onClick={() => navigate('/societies')}
            className="society-back-btn"
          >
            <ArrowLeft size={18} />
            Back to Societies
          </button>

          {/* Society Title */}
          <h1 className="society-title">{society.name}</h1>
          
          {/* Address */}
          <p className="society-address">
            <MapPin className="inline-block w-4 h-4 mr-1" />
            {society.address}, {society.city}, {society.state} - {society.pincode}
          </p>

          {/* Meta Info */}
          <div className="society-meta">
            <div className="society-meta-item">
              <div className="society-meta-icon">
                <Phone size={16} />
              </div>
              <span>{society.telephone || 'No telephone'}</span>
            </div>
            <div className="society-meta-item">
              <div className="society-meta-icon">
                <Mail size={16} />
              </div>
              <span>{society.email || 'No email'}</span>
            </div>
            <div className="society-meta-item">
              <div className="society-meta-icon">
                <FileText size={16} />
              </div>
              <span>Reg: {society.registrationNumber || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="society-stats">
        <div className="society-stat-card">
          <div className="society-stat-icon indigo">
            <Layers size={24} />
          </div>
          <div className="society-stat-content">
            <div className="society-stat-value">{stats.totalWings}</div>
            <div className="society-stat-label">Wings</div>
          </div>
        </div>
        <div className="society-stat-card">
          <div className="society-stat-icon blue">
            <Home size={24} />
          </div>
          <div className="society-stat-content">
            <div className="society-stat-value">{stats.totalFlats}</div>
            <div className="society-stat-label">Flats ({stats.occupiedFlats} occupied)</div>
          </div>
        </div>
        <div className="society-stat-card">
          <div className="society-stat-icon green">
            <Store size={24} />
          </div>
          <div className="society-stat-content">
            <div className="society-stat-value">{stats.totalShops}</div>
            <div className="society-stat-label">Shops ({stats.occupiedShops} occupied)</div>
          </div>
        </div>
        <div className="society-stat-card">
          <div className="society-stat-icon amber">
            <Briefcase size={24} />
          </div>
          <div className="society-stat-content">
            <div className="society-stat-value">{stats.totalOffices}</div>
            <div className="society-stat-label">Offices ({stats.occupiedOffices} occupied)</div>
          </div>
        </div>
        <div className="society-stat-card">
          <div className="society-stat-icon purple">
            <Users size={24} />
          </div>
          <div className="society-stat-content">
            <div className="society-stat-value">{stats.totalUsers}</div>
            <div className="society-stat-label">Total Users</div>
          </div>
        </div>
        <div className="society-stat-card">
          <div className="society-stat-icon teal">
            <User size={24} />
          </div>
          <div className="society-stat-content">
            <div className="society-stat-value">{stats.totalMembers}</div>
            <div className="society-stat-label">Members</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="society-section">
        <div className="society-section-header">
          <h2 className="society-section-title">
            <Building2 size={20} />
            Quick Navigation
          </h2>
        </div>
        <div className="society-actions">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="society-action-card"
            >
              <div className={clsx('action-icon text-white', action.color)}>
                <action.icon size={22} />
              </div>
              <div className="action-content">
                <div className="action-title">{action.title}</div>
                <div className="action-count">{action.description}</div>
              </div>
              <ChevronRight size={18} className="action-arrow" />
            </Link>
          ))}
        </div>
      </div>

      {/* Role Hierarchy Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Tree */}
        <div className="role-hierarchy">
          <h3 className="role-hierarchy-title">
            <Shield size={18} />
            Role Hierarchy
          </h3>
          <div className="role-tree">
            {roleHierarchy.map(({ role, label }, index) => {
              const count = usersByRole[role]?.length || 0
              const indentLevel = index === 0 ? 0 : index <= 3 ? 1 : index <= 5 ? 2 : 3
              
              return (
                <div 
                  key={role} 
                  className={clsx('role-tree-item', count > 0 && 'active')}
                  style={{ paddingLeft: `${indentLevel * 24}px` }}
                >
                  <span className={clsx('role-tree-badge', roleColors[role])}>
                    {label}
                  </span>
                  <span className="role-tree-count">{count} user{count !== 1 ? 's' : ''}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2">
          <div className="society-section">
            <div className="society-section-header">
              <h2 className="society-section-title">
                <Users size={20} />
                Society Members
              </h2>
              {/* View All removed - all members shown on this page */}
            </div>

            {societyUsers.length === 0 ? (
              <div className="society-empty">
                <Users className="society-empty-icon" />
                <p className="society-empty-title">No users yet</p>
                <p className="society-empty-text">Users assigned to this society will appear here</p>
              </div>
            ) : (
              <div className="society-users-grid">
                {societyUsers.map((u, idx) => (
                  <div key={u.id} className="society-user-card">
                    <div className="society-user-header">
                      <div className={clsx('society-user-avatar', avatarColors[idx % avatarColors.length])}>
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="society-user-info">
                        <div className="society-user-name">{u.name}</div>
                        <div className="society-user-email">{u.email}</div>
                      </div>
                      <span className={clsx('society-user-role', roleColors[u.role])}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </div>
                    {u.phone && (
                      <div className="society-user-meta">
                        <div className="society-user-meta-item">
                          <Phone size={14} />
                          {u.phone}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
