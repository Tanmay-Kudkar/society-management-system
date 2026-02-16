import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { organizationApi, societyApi } from '../../../../api'
import { Building2, ArrowLeft, MapPin, Users, ChevronRight } from 'lucide-react'
import '../../styles/pages/organizations.css'

export default function OrganizationDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  const { data: organization, isLoading: orgLoading } = useQuery({
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
      (sum, item) => sum + (item.actualFlats || item.totalFlats || 0) + (item.actualShops || item.totalShops || 0) + (item.actualOffices || item.totalOffices || 0),
      0
    )
    return {
      societies: societies.length,
      totalUnits,
      cities: new Set(societies.map(s => s.city).filter(Boolean)).size,
    }
  }, [societies])

  if (orgLoading) {
    return <div className="org-empty">Loading organization...</div>
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

      <div className="org-detail__owner">
        <p><strong>Owner:</strong> {organization.ownerName || '-'}</p>
        <p><strong>Email:</strong> {organization.ownerEmail || '-'}</p>
        <p><strong>Phone:</strong> {organization.ownerPhone || '-'}</p>
      </div>

      <div className="org-detail__section">
        <h2 className="org-detail__title">Societies</h2>
        {societiesLoading ? (
          <div className="org-empty">Loading societies...</div>
        ) : societies.length === 0 ? (
          <div className="org-empty">
            <p>No societies are linked to this organization yet.</p>
          </div>
        ) : (
          <div className="org-card__societies">
            {societies.map((society) => (
              <div
                key={society.id}
                className="org-card__society-item"
                onClick={() => navigate(`/societies/${society.id}`)}
              >
                <div className="org-card__society-info">
                  <Building2 size={14} />
                  <span className="org-card__society-name">{society.name}</span>
                </div>
                <div className="org-card__society-meta">
                  {society.city && <span><MapPin size={11} /> {society.city}</span>}
                  <span><Users size={11} /> {society.actualFlats || society.totalFlats || 0} units</span>
                </div>
                <ChevronRight size={14} className="org-card__society-arrow" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
