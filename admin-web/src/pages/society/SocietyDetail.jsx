import { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { societyApi, userApi, flatApi, wingApi } from '../../../../api'
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
import { DetailPageSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

// Role colors matching the main app
const roleColors = {
  PLATFORM_OWNER: 'society-role-color society-role-color--platform-owner',
  SOCIETY_ADMIN: 'society-role-color society-role-color--society-admin',
  CHAIRMAN: 'society-role-color society-role-color--chairman',
  SECRETARY: 'society-role-color society-role-color--secretary',
  TREASURER: 'society-role-color society-role-color--treasurer',
  COMMITTEE: 'society-role-color society-role-color--committee',
  EMPLOYEE: 'society-role-color society-role-color--employee',
  MEMBER: 'society-role-color society-role-color--member',
  TENANT: 'society-role-color society-role-color--tenant',
  VISITOR: 'society-role-color society-role-color--visitor',
}

const avatarColors = [
  'society-user-avatar--blue',
  'society-user-avatar--emerald',
  'society-user-avatar--purple',
  'society-user-avatar--orange',
  'society-user-avatar--cyan',
]

export default function SocietyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const getOrganizationLabel = (item) => (
    item?.organizationName
    || item?.organization?.name
    || item?.organization
    || null
  )

  // Fetch society details
  const { data: society, isLoading: societyLoading, isError: societyError } = useQuery({
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
      totalMembers: societyUsers.filter(u => u.role === 'MEMBER').length,
      totalTenants: societyUsers.filter(u => u.role === 'TENANT').length,
      totalEmployees: societyUsers.filter(u => u.role === 'EMPLOYEE').length,
    }
  }, [societyUsers, societyFlats, societyWings])

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

  const showSkeleton = useMinLoadingTime(societyLoading || societyError)

  if (showSkeleton) {
    return (
      <>
        <WakeUpBanner show={societyLoading} />
        <DetailPageSkeleton />
      </>
    )
  }

  if (societyError || !society) {
    return (
      <div className="society-state society-state--error">
        <AlertCircle className="society-error-icon" />
        <h2 className="society-error-title">Society Not Found</h2>
        <p className="society-error-text">The society you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/societies')}
          className="society-error-button"
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
      </div>
    )
  }

  const organizationLabel = getOrganizationLabel(society)

  return (
    <div className="animate-fadeIn">
      {/* Header Section */}
      <div className="society-header">
        <div className="society-header-content">
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="society-back-btn"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>

          {/* Society Title */}
          <h1 className="society-title">{society.name}</h1>
          
          {/* Address */}
          <p className="society-address">
            <MapPin className="society-address-icon" />
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
            <div className="society-meta-item">
              <div className="society-meta-icon">
                <Building2 size={16} />
              </div>
              <span className={`society-org-badge ${organizationLabel ? 'society-org-badge--linked' : 'society-org-badge--unassigned'}`}>
                {organizationLabel || 'Unassigned'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="society-stats">
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
          <div className="society-stat-icon indigo">
            <Layers size={24} />
          </div>
          <div className="society-stat-content">
            <div className="society-stat-value">{stats.totalWings}</div>
            <div className="society-stat-label">Wings</div>
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
  )
}
