import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { organizationApi, societyApi } from '../../../../api'
import { Building2, ArrowLeft, MapPin, ChevronRight, Mail, Phone, User, Home, Store, Building, Layers } from 'lucide-react'
import { DetailPageSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import '../../styles/pages/organizations.css'

export default function OrganizationDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  const getSocietyCount = (society, keys) => {
    for (const key of keys) {
      const value = society?.[key]
      if (value !== null && value !== undefined && value !== '') {
        const parsed = Number(value)
        if (!Number.isNaN(parsed)) return parsed
      }
    }
    return 0
  }

  const getSocietyMetric = (society, currentKeys, totalKeys) => {
    const current = getSocietyCount(society, currentKeys)
    const total = getSocietyCount(society, totalKeys)

    if (total > 0 || current > 0) {
      if (total > 0 && current > 0) {
        return { current, total, display: `${current}/${total}` }
      }
      return { current, total, display: String(current || total) }
    }

    return { current: 0, total: 0, display: '0' }
  }

  const { data: organization, isLoading: orgLoading, isError: orgError } = useQuery({
    queryKey: ['organization', id],
    queryFn: () => organizationApi.getById(id).then(res => res.data),
    enabled: !!id,
  })

  const { data: societies = [], isLoading: societiesLoading } = useQuery({
    queryKey: ['org-societies', id],
    queryFn: () => societyApi.getByOrganizationId(id).then(res => res.data).catch(() => []),
    enabled: !!id,
    placeholderData: [],
  })

  const stats = useMemo(() => {
    const totalUnits = societies.reduce(
      (sum, item) => sum
        + getSocietyCount(item, ['actualFlats', 'currentFlats', 'totalFlats'])
        + getSocietyCount(item, ['actualShops', 'currentShops', 'totalShops'])
        + getSocietyCount(item, ['actualOffices', 'currentOffices', 'totalOffices']),
      0
    )
    return {
      societies: societies.length,
      totalUnits,
      cities: new Set(societies.map(s => s.city).filter(Boolean)).size,
    }
  }, [societies])

  const showSkeleton = useMinLoadingTime(orgLoading || orgError)

  if (showSkeleton) {
    return (
      <>
        <WakeUpBanner show={orgLoading} />
        <DetailPageSkeleton />
      </>
    )
  }

  if (!organization) {
    return (
      <div className="org-empty">
        <Building2 size={48} className="org-empty__icon" />
        <h3>Organization not found</h3>
        <p>The requested organization does not exist or is not accessible.</p>
        <button onClick={() => navigate('/organizations')} className="org-empty__button">
          <ArrowLeft size={16} />
          Back to Organizations
        </button>
      </div>
    )
  }

  return (
    <div className="org-page">
      <header className="org-hero">
        <div className="org-hero__grid">
          <div>
            <button className="org-detail__back" onClick={() => navigate('/organizations')}>
              <ArrowLeft size={16} />
              Back to Organizations
            </button>
            <h1 className="org-hero__title">
              <Building2 size={28} />
              {organization.name}
            </h1>
            <p className="org-hero__subtitle">Dedicated page for this organization and its societies</p>
          </div>
          <div className="org-hero__stats">
            <div className="org-hero__stat">
              <span className="org-hero__stat-value">{stats.societies}</span>
              <span className="org-hero__stat-label">Societies</span>
            </div>
            <div className="org-hero__stat">
              <span className="org-hero__stat-value">{stats.totalUnits}</span>
              <span className="org-hero__stat-label">Units</span>
            </div>
            <div className="org-hero__stat">
              <span className="org-hero__stat-value">{stats.cities}</span>
              <span className="org-hero__stat-label">Cities</span>
            </div>
          </div>
        </div>
      </header>

      <div className="org-detail__owner-grid">
        <div className="org-detail__owner-card">
          <p className="org-detail__owner-label">Owner</p>
          <p className="org-detail__owner-value">
            <User size={14} />
            {organization.ownerName || '-'}
          </p>
        </div>
        <div className="org-detail__owner-card">
          <p className="org-detail__owner-label">Email</p>
          <p className="org-detail__owner-value">
            <Mail size={14} />
            {organization.ownerEmail || '-'}
          </p>
        </div>
        <div className="org-detail__owner-card">
          <p className="org-detail__owner-label">Phone</p>
          <p className="org-detail__owner-value">
            <Phone size={14} />
            {organization.ownerPhone || '-'}
          </p>
        </div>
      </div>

      <div className="org-detail__section">
        <div className="org-detail__section-header">
          <h2 className="org-detail__title">Societies</h2>
          <span className="org-detail__count">{stats.societies}</span>
        </div>
        {societiesLoading ? (
          <div className="org-empty">Loading societies...</div>
        ) : societies.length === 0 ? (
          <div className="org-detail__empty">
            <Building2 size={22} />
            <p>No societies are linked to this organization yet.</p>
          </div>
        ) : (
          <div className="org-detail__society-list">
            {societies.map((society) => {
              const flats = getSocietyMetric(society, ['actualFlats', 'currentFlats'], ['totalFlats'])
              const shops = getSocietyMetric(society, ['actualShops', 'currentShops'], ['totalShops'])
              const offices = getSocietyMetric(society, ['actualOffices', 'currentOffices'], ['totalOffices'])
              const wings = getSocietyMetric(society, ['actualWings', 'currentWings'], ['totalWings'])
              const location = [society.city, society.state].filter(Boolean).join(', ') || society.address || 'N/A'

              return (
              <button
                key={society.id}
                type="button"
                className="org-detail__society-item"
                onClick={() => navigate(`/societies/${society.id}`)}
              >
                <div className="org-detail__society-main">
                  <div className="org-detail__society-icon">
                    <Building2 size={14} />
                  </div>
                  <div className="org-detail__society-name-wrap">
                    <span className="org-detail__society-name">{society.name}</span>
                    <span className="org-detail__society-sub">
                      {society.city || 'Unknown city'}{society.state ? `, ${society.state}` : ''}
                    </span>
                  </div>
                </div>
                <div className="org-detail__society-meta">
                  <div className="org-detail__society-chips">
                    <span className="org-detail__society-chip org-detail__society-chip--location"><MapPin size={11} /> {location}</span>
                    <span className="org-detail__society-chip"><Home size={11} /> Flats: {flats.display}</span>
                    <span className="org-detail__society-chip"><Store size={11} /> Shops: {shops.display}</span>
                    <span className="org-detail__society-chip"><Building size={11} /> Offices: {offices.display}</span>
                    <span className="org-detail__society-chip"><Layers size={11} /> Wings: {wings.display}</span>
                  </div>
                  <ChevronRight size={14} className="org-detail__society-arrow" />
                </div>
              </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
