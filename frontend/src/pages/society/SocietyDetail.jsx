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
  MASTER_ADMIN: 'bg-violet-500/20 text-violet-200 border border-violet-400/35',
  SOCIETY_ADMIN: 'bg-blue-500/20 text-blue-200 border border-blue-400/35',
  CHAIRMAN: 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/35',
  SECRETARY: 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/35',
  TREASURER: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/35',
  COMMITTEE: 'bg-amber-500/20 text-amber-200 border border-amber-400/35',
  EMPLOYEE: 'bg-orange-500/20 text-orange-200 border border-orange-400/35',
  MEMBER: 'bg-slate-400/25 text-slate-200 border border-slate-300/35',
  TENANT: 'bg-pink-500/20 text-pink-200 border border-pink-400/35',
  VISITOR: 'bg-red-500/20 text-red-200 border border-red-400/35',
}

const avatarColors = [
  'bg-gradient-to-br from-blue-500 to-indigo-600',
  'bg-gradient-to-br from-emerald-500 to-teal-500',
  'bg-gradient-to-br from-violet-500 to-pink-500',
  'bg-gradient-to-br from-amber-500 to-red-500',
  'bg-gradient-to-br from-cyan-500 to-blue-500',
]

export default function SocietyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

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
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-16 w-16 text-red-400" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Society Not Found</h2>
        <p className="mb-2 text-[var(--text-tertiary)]">The society you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/societies')}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_20px_rgba(37,99,235,0.25)]"
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      {/* Header Section */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-400/30 bg-gradient-to-br from-blue-700 to-indigo-700 p-8 text-white shadow-md">
        <div className="pointer-events-none absolute -right-[20%] -top-1/2 h-[200%] w-[60%] bg-[radial-gradient(ellipse,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)]" />
        <div className="relative z-[1]">
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex cursor-pointer items-center gap-2 rounded-md border-none bg-transparent px-2 py-1 text-sm font-medium text-white/80 transition-all duration-150 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>

          {/* Society Title */}
          <h1 className="mb-3 text-[clamp(2.1rem,3.2vw,2.8rem)] font-bold tracking-[-0.02em]">{society.name}</h1>
          
          {/* Address */}
          <p className="mb-5 text-lg text-white/85">
            <MapPin className="mr-1 inline-block h-4 w-4 align-middle" />
            {society.address}, {society.city}, {society.state} - {society.pincode}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-5">
            <div className="flex items-center gap-2 text-base text-white/90">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/15">
                <Phone size={16} />
              </div>
              <span>{society.telephone || 'No telephone'}</span>
            </div>
            <div className="flex items-center gap-2 text-base text-white/90">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/15">
                <Mail size={16} />
              </div>
              <span>{society.email || 'No email'}</span>
            </div>
            <div className="flex items-center gap-2 text-base text-white/90">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/15">
                <FileText size={16} />
              </div>
              <span>Reg: {society.registrationNumber || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <div className="flex items-center gap-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 transition-all hover:border-blue-300 hover:shadow-md">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <Home size={24} />
          </div>
          <div className="flex-1">
            <div className="mb-1 text-2xl font-bold leading-none text-[var(--text-primary)]">{stats.totalFlats}</div>
            <div className="text-sm text-[var(--text-tertiary)]">Flats ({stats.occupiedFlats} occupied)</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 transition-all hover:border-blue-300 hover:shadow-md">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Store size={24} />
          </div>
          <div className="flex-1">
            <div className="mb-1 text-2xl font-bold leading-none text-[var(--text-primary)]">{stats.totalShops}</div>
            <div className="text-sm text-[var(--text-tertiary)]">Shops ({stats.occupiedShops} occupied)</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 transition-all hover:border-blue-300 hover:shadow-md">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <Briefcase size={24} />
          </div>
          <div className="flex-1">
            <div className="mb-1 text-2xl font-bold leading-none text-[var(--text-primary)]">{stats.totalOffices}</div>
            <div className="text-sm text-[var(--text-tertiary)]">Offices ({stats.occupiedOffices} occupied)</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 transition-all hover:border-blue-300 hover:shadow-md">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <Layers size={24} />
          </div>
          <div className="flex-1">
            <div className="mb-1 text-2xl font-bold leading-none text-[var(--text-primary)]">{stats.totalWings}</div>
            <div className="text-sm text-[var(--text-tertiary)]">Wings</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 transition-all hover:border-blue-300 hover:shadow-md">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
            <Users size={24} />
          </div>
          <div className="flex-1">
            <div className="mb-1 text-2xl font-bold leading-none text-[var(--text-primary)]">{stats.totalUsers}</div>
            <div className="text-sm text-[var(--text-tertiary)]">Total Users</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 transition-all hover:border-blue-300 hover:shadow-md">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
            <User size={24} />
          </div>
          <div className="flex-1">
            <div className="mb-1 text-2xl font-bold leading-none text-[var(--text-primary)]">{stats.totalMembers}</div>
            <div className="text-sm text-[var(--text-tertiary)]">Members</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
            <Building2 size={20} />
            Quick Navigation
          </h2>
        </div>
        <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="group flex items-center gap-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg"
            >
              <div className={clsx('inline-flex h-11 w-11 items-center justify-center rounded-lg text-white transition-transform duration-150 group-hover:scale-110', action.color)}>
                <action.icon size={22} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{action.title}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{action.description}</div>
              </div>
              <ChevronRight size={18} className="-translate-x-1 text-[var(--text-muted)] opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
            <Users size={20} />
            Society Members
          </h2>
          {/* View All removed - all members shown on this page */}
        </div>

        {societyUsers.length === 0 ? (
          <div className="px-4 py-12 text-center text-[var(--text-tertiary)]">
            <Users className="mx-auto mb-5 h-16 w-16 opacity-50" />
            <p className="mb-2 text-lg font-semibold text-[var(--text-secondary)]">No users yet</p>
            <p className="text-sm text-[var(--text-tertiary)]">Users assigned to this society will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {societyUsers.map((u, idx) => (
              <div key={u.id} className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 transition-all hover:border-blue-300 hover:shadow-md">
                <div className="mb-4 flex items-center gap-4">
                  <div className={clsx('flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white', avatarColors[idx % avatarColors.length])}>
                    {u.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 font-semibold text-[var(--text-primary)]">{u.name}</div>
                    <div className="truncate text-sm text-[var(--text-tertiary)]">{u.email}</div>
                  </div>
                  <span className={clsx('inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]', roleColors[u.role] || 'bg-slate-500/20 text-slate-200 border border-slate-400/35')}>
                    {u.role?.replace('_', ' ')}
                  </span>
                </div>
                {u.phone && (
                  <div className="flex gap-4 border-t border-[var(--border-light)] pt-4">
                    <div className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
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
