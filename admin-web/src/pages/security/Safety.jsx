import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { safetyApi } from '../../../../api'
import { Plus, Search, X, AlertTriangle, Shield, ShieldCheck, LogIn, LogOut, Siren, Bell, ArrowUpCircle, Clock, MapPin, TrendingUp, Building2, CreditCard, Package, UserCheck, Image } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, AsyncButton } from '../../components'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const alertIcons = {
  ACTIVE: Siren,
  ACKNOWLEDGED: Bell,
  RESOLVED: ShieldCheck,
  FALSE_ALARM: X,
}

export default function Safety() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('sos') // 'sos' or 'gatelog'
  const [showSOSModal, setShowSOSModal] = useState(false)
  const [showGateLogModal, setShowGateLogModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterEntryType, setFilterEntryType] = useState('')

  const isMember = user?.role && user.role !== 'VISITOR'
  if (!isMember) {
    return <PermissionDenied message="You don't have permission to access safety management" />
  }

  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const isStaff = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE'].includes(user?.role)
  const isAdmin = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'].includes(user?.role)
  const societyIdFromUrl = searchParams.get('society')
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? societyIdFromUrl : user?.societyId

  // SOS Alerts
  const { data: alerts = [], isLoading: alertsLoading, isError: alertsError } = useQuery({
    queryKey: ['sos-alerts', user?.id, effectiveSocietyId],
    queryFn: () => safetyApi.getAlertsBySociety(effectiveSocietyId, user.id).then(res => res.data),
    enabled: !!user?.id && !!effectiveSocietyId && activeTab === 'sos',
  })

  // Gate Logs
  const { data: gateLogs = [], isLoading: gateLogsLoading, isError: gateLogsError } = useQuery({
    queryKey: ['gate-logs', effectiveSocietyId],
    queryFn: () => safetyApi.getGateLogsBySociety(effectiveSocietyId, user.id).then(res => res.data),
    enabled: !!user?.id && !!effectiveSocietyId && activeTab === 'gatelog',
  })

  const createAlertMutation = useMutation({
    mutationFn: (data) => safetyApi.createAlert(user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['sos-alerts']); setShowSOSModal(false) },
  })

  const acknowledgeMutation = useMutation({
    mutationFn: (id) => safetyApi.acknowledgeAlert(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['sos-alerts']),
  })

  const resolveMutation = useMutation({
    mutationFn: (id) => {
      const notes = prompt('Enter resolution notes:')
      if (!notes) return Promise.reject('Cancelled')
      return safetyApi.resolveAlert(id, user.id, notes)
    },
    onSuccess: () => queryClient.invalidateQueries(['sos-alerts']),
  })

  const falseAlarmMutation = useMutation({
    mutationFn: (id) => safetyApi.markFalseAlarm(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['sos-alerts']),
  })

  const escalateMutation = useMutation({
    mutationFn: (id) => safetyApi.escalateAlert(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['sos-alerts']),
  })

  const handleQuickSOS = (alertType) => {
    if (!confirm(`Raise ${alertType} SOS alert immediately?`)) return
    createAlertMutation.mutate({
      alertType,
      description: `Quick ${alertType} SOS alert raised`,
      priority: 'CRITICAL',
      societyId: user.societyId,
    })
  }

  const formatResponseTime = (seconds) => {
    if (!seconds && seconds !== 0) return null
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const createGateLogMutation = useMutation({
    mutationFn: (data) => safetyApi.createGateLog(user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['gate-logs']); setShowGateLogModal(false) },
  })

  const markExitMutation = useMutation({
    mutationFn: (id) => safetyApi.markExit(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['gate-logs']),
  })

  const filteredAlerts = useMemo(() => alerts.filter(a => {
    const matchesSearch = a.alertType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.raisedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.location?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || a.status === filterStatus
    const matchesPriority = !filterPriority || a.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  }), [alerts, searchTerm, filterStatus, filterPriority])

  const filteredGateLogs = useMemo(() => gateLogs.filter(g => {
    const matchesSearch = g.personName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         g.personPhone?.includes(searchTerm) ||
                         g.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         g.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         g.idNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         g.itemsCarried?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || g.status === filterStatus
    const matchesEntryType = !filterEntryType || g.entryType === filterEntryType
    return matchesSearch && matchesStatus && matchesEntryType
  }), [gateLogs, searchTerm, filterStatus, filterEntryType])

  const handleSOSSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    createAlertMutation.mutate({
      alertType: formData.get('alertType'),
      description: formData.get('description'),
      priority: formData.get('priority'),
      location: formData.get('location'),
      societyId: user.societyId,
    })
  }

  const handleGateLogSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    createGateLogMutation.mutate({
      entryType: formData.get('entryType'),
      personName: formData.get('personName'),
      personPhone: formData.get('personPhone'),
      vehicleNumber: formData.get('vehicleNumber'),
      entryGate: formData.get('entryGate'),
      purpose: formData.get('purpose'),
      notes: formData.get('notes'),
      imageUrl: formData.get('imageUrl') || null,
      idType: formData.get('idType') || null,
      idNumber: formData.get('idNumber') || null,
      companyName: formData.get('companyName') || null,
      itemsCarried: formData.get('itemsCarried') || null,
      societyId: user.societyId,
    })
  }

  const isLoading = activeTab === 'sos' ? alertsLoading : gateLogsLoading
  const isError = activeTab === 'sos' ? alertsError : gateLogsError
  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) {
    return (<div><WakeUpBanner /><HeroSkeleton /><SummaryRowSkeleton count={4} /><FiltersSkeleton filterCount={1} /><ListSkeleton count={4} /></div>)
  }

  return (
    <div>
      <div className="safety-header">
        <div>
          <h1 className="safety-title">Safety & Security</h1>
          <p className="safety-subtitle">SOS alerts and gate entry/exit tracking</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {activeTab === 'sos' && (
            <>
              <button onClick={() => handleQuickSOS('FIRE')} className="safety-action-button safety-action-button--quick" title="Quick Fire SOS">🔥</button>
              <button onClick={() => handleQuickSOS('MEDICAL')} className="safety-action-button safety-action-button--quick" title="Quick Medical SOS">🏥</button>
              <button onClick={() => handleQuickSOS('SECURITY')} className="safety-action-button safety-action-button--quick" title="Quick Security SOS">🚨</button>
              <button onClick={() => setShowSOSModal(true)} className="safety-action-button safety-action-button--sos">
                <Siren size={20} /> Raise SOS Alert
              </button>
            </>
          )}
          {activeTab === 'gatelog' && isStaff && (
            <button onClick={() => setShowGateLogModal(true)} className="safety-action-button">
              <Plus size={20} /> Log Entry
            </button>
          )}
        </div>
      </div>

      <div className="safety-tabs">
        <button className={clsx('safety-tab', activeTab === 'sos' && 'safety-tab--active')} onClick={() => { setActiveTab('sos'); setFilterStatus(''); setFilterPriority(''); setSearchTerm('') }}>
          SOS Alerts
          {alerts.filter(a => a.status === 'ACTIVE').length > 0 && <span className="safety-tab-badge">{alerts.filter(a => a.status === 'ACTIVE').length}</span>}
        </button>
        <button className={clsx('safety-tab', activeTab === 'gatelog' && 'safety-tab--active')} onClick={() => { setActiveTab('gatelog'); setFilterStatus(''); setFilterPriority(''); setFilterEntryType(''); setSearchTerm('') }}>
          Gate Log
          {gateLogs.filter(g => g.status === 'IN').length > 0 && <span className="safety-tab-badge safety-tab-badge--gate">{gateLogs.filter(g => g.status === 'IN').length}</span>}
        </button>
      </div>

      {/* SOS ALERTS TAB */}
      {activeTab === 'sos' && (
        <>
          <div className="safety-summary">
            <div className="safety-summary-card">
              <p className="safety-summary-label">Active</p>
              <p className="safety-summary-value safety-summary-value--active">{alerts.filter(a => a.status === 'ACTIVE').length}</p>
            </div>
            <div className="safety-summary-card">
              <p className="safety-summary-label">Acknowledged</p>
              <p className="safety-summary-value safety-summary-value--acknowledged">{alerts.filter(a => a.status === 'ACKNOWLEDGED').length}</p>
            </div>
            <div className="safety-summary-card">
              <p className="safety-summary-label">Resolved</p>
              <p className="safety-summary-value safety-summary-value--resolved">{alerts.filter(a => a.status === 'RESOLVED').length}</p>
            </div>
            <div className="safety-summary-card">
              <p className="safety-summary-label">Critical</p>
              <p className="safety-summary-value safety-summary-value--critical">{alerts.filter(a => a.priority === 'CRITICAL' && a.status !== 'RESOLVED' && a.status !== 'FALSE_ALARM').length}</p>
            </div>
            <div className="safety-summary-card">
              <p className="safety-summary-label">Escalated</p>
              <p className="safety-summary-value safety-summary-value--escalated">{alerts.filter(a => a.escalationLevel > 0).length}</p>
            </div>
          </div>

          <div className="safety-filters">
            <div className="safety-filters-row">
              <div className="safety-search">
                <Search className="safety-search-icon" />
                <input type="text" placeholder="Search alerts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="safety-input" />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="safety-select">
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESOLVED">Resolved</option>
                <option value="FALSE_ALARM">False Alarm</option>
              </select>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="safety-select">
                <option value="">All Priority</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="safety-list">
            {filteredAlerts.length === 0 && (
              <div className="safety-item" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No SOS alerts found</div>
            )}
            {filteredAlerts.map((alert) => {
              const AlertIcon = alertIcons[alert.status] || AlertTriangle
              return (
                <div key={alert.id} className={clsx('safety-item', alert.priority === 'CRITICAL' && 'safety-item--critical', alert.escalationLevel > 0 && 'safety-item--escalated')}>
                  <div className="safety-item-row">
                    <div className="safety-item-main">
                      <div className={clsx('safety-item-icon', `safety-item-icon--${alert.status?.toLowerCase()}`)}>
                        <AlertIcon className={clsx('safety-item-icon-symbol', `safety-item-icon-symbol--${alert.status?.toLowerCase()}`)} />
                      </div>
                      <div>
                        <div className="safety-item-meta">
                          <span className={clsx('safety-status-badge', `safety-status--${alert.status?.toLowerCase()}`)}>{alert.status?.replace('_', ' ')}</span>
                          <span className={clsx('safety-priority-badge', `safety-priority--${alert.priority?.toLowerCase()}`)}>{alert.priority}</span>
                          <span className="safety-type-badge">{alert.alertType}</span>
                          {alert.escalationLevel > 0 && (
                            <span className="safety-escalation-badge"><TrendingUp size={12} /> L{alert.escalationLevel}</span>
                          )}
                        </div>
                        <h3 className="safety-item-title">{alert.alertType} Alert</h3>
                        {alert.description && <p className="safety-item-description">{alert.description}</p>}
                        {alert.location && (
                          <p className="safety-item-location"><MapPin size={13} /> {alert.location}</p>
                        )}
                        {alert.resolutionNotes && (
                          <div className="safety-resolution">
                            <p className="safety-resolution-text"><span className="safety-resolution-label">Resolution:</span> {alert.resolutionNotes}</p>
                          </div>
                        )}
                        {/* Timeline */}
                        <div className="safety-timeline">
                          <span className="safety-timeline-step safety-timeline-step--done">Created {alert.createdAt && new Date(alert.createdAt).toLocaleString()}</span>
                          {alert.acknowledgedAt && <span className="safety-timeline-step safety-timeline-step--done">Acknowledged {new Date(alert.acknowledgedAt).toLocaleString()}{alert.acknowledgedByName ? ` by ${alert.acknowledgedByName}` : ''}</span>}
                          {alert.resolvedAt && <span className="safety-timeline-step safety-timeline-step--done">{alert.status === 'FALSE_ALARM' ? 'Marked False Alarm' : 'Resolved'} {new Date(alert.resolvedAt).toLocaleString()}</span>}
                        </div>
                        <div className="safety-item-footer">
                          <span className="safety-item-footer-text">By: {alert.raisedByName}</span>
                          {alert.flatNumber && <span className="safety-item-footer-text">Flat: {alert.flatNumber}</span>}
                          {alert.resolvedByName && <span className="safety-item-footer-text">Resolved by: {alert.resolvedByName}</span>}
                          {alert.responseTimeSeconds != null && (
                            <span className="safety-item-footer-text safety-item-footer-text--response"><Clock size={12} /> Response: {formatResponseTime(alert.responseTimeSeconds)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isStaff && alert.status !== 'RESOLVED' && alert.status !== 'FALSE_ALARM' && (
                      <div className="safety-item-actions">
                        {alert.status === 'ACTIVE' && (
                          <button onClick={() => acknowledgeMutation.mutate(alert.id)} className="safety-btn safety-btn--acknowledge">Acknowledge</button>
                        )}
                        <button onClick={() => escalateMutation.mutate(alert.id)} className="safety-btn safety-btn--escalate"><ArrowUpCircle size={14} /> Escalate</button>
                        <button onClick={() => resolveMutation.mutate(alert.id)} className="safety-btn safety-btn--resolve">Resolve</button>
                        {isAdmin && <button onClick={() => falseAlarmMutation.mutate(alert.id)} className="safety-btn safety-btn--false-alarm">False Alarm</button>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* GATE LOG TAB */}
      {activeTab === 'gatelog' && (
        <>
          <div className="safety-summary">
            <div className="safety-summary-card">
              <p className="safety-summary-label">Currently In</p>
              <p className="safety-summary-value safety-summary-value--in">{gateLogs.filter(g => g.status === 'IN').length}</p>
            </div>
            <div className="safety-summary-card">
              <p className="safety-summary-label">Exited</p>
              <p className="safety-summary-value safety-summary-value--out">{gateLogs.filter(g => g.status === 'OUT').length}</p>
            </div>
            <div className="safety-summary-card">
              <p className="safety-summary-label">Total Today</p>
              <p className="safety-summary-value safety-summary-value--total">{gateLogs.length}</p>
            </div>
            <div className="safety-summary-card">
              <p className="safety-summary-label">Vehicles</p>
              <p className="safety-summary-value" style={{ color: 'var(--color-violet)' }}>{gateLogs.filter(g => g.vehicleNumber).length}</p>
            </div>
          </div>

          <div className="safety-filters">
            <div className="safety-filters-row">
              <div className="safety-search">
                <Search className="safety-search-icon" />
                <input type="text" placeholder="Search gate logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="safety-input" />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="safety-select">
                <option value="">All Status</option>
                <option value="IN">Currently In</option>
                <option value="OUT">Exited</option>
              </select>
              <select value={filterEntryType} onChange={(e) => setFilterEntryType(e.target.value)} className="safety-select">
                <option value="">All Types</option>
                <option value="RESIDENT">Resident</option>
                <option value="VISITOR">Visitor</option>
                <option value="STAFF">Staff</option>
                <option value="DELIVERY">Delivery</option>
                <option value="CAB">Cab</option>
                <option value="VEHICLE">Vehicle</option>
              </select>
            </div>
          </div>

          <div className="safety-list">
            {filteredGateLogs.length === 0 && (
              <div className="safety-item" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No gate log entries found</div>
            )}
            {filteredGateLogs.map((log) => (
              <div key={log.id} className="safety-item">
                <div className="safety-item-row">
                  <div className="safety-item-main">
                    <div className={clsx('safety-item-icon', log.status === 'IN' ? 'safety-item-icon--in' : 'safety-item-icon--out')}>
                      {log.status === 'IN' ? <LogIn className={clsx('safety-item-icon-symbol', 'safety-item-icon-symbol--in')} /> : <LogOut className={clsx('safety-item-icon-symbol', 'safety-item-icon-symbol--out')} />}
                    </div>
                    <div>
                      <div className="safety-item-meta">
                        <span className={clsx('safety-status-badge', log.status === 'IN' ? 'safety-status--in' : 'safety-status--out')}>{log.status}</span>
                        <span className="safety-type-badge">{log.entryType}</span>
                      </div>
                      <h3 className="safety-item-title">{log.personName}</h3>
                      {log.companyName && (
                        <p className="safety-item-company"><Building2 size={13} /> {log.companyName}</p>
                      )}
                      {log.purpose && <p className="safety-item-description">{log.purpose}</p>}
                      {log.itemsCarried && (
                        <p className="safety-item-items"><Package size={13} /> Items: {log.itemsCarried}</p>
                      )}
                      <div className="safety-item-footer">
                        {log.personPhone && <span className="safety-item-footer-text">Phone: {log.personPhone}</span>}
                        {log.vehicleNumber && <span className="safety-item-footer-text">Vehicle: {log.vehicleNumber}</span>}
                        {log.flatNumber && <span className="safety-item-footer-text">Flat: {log.flatNumber}</span>}
                        {log.entryGate && <span className="safety-item-footer-text">Gate: {log.entryGate}</span>}
                        {log.idType && log.idNumber && (
                          <span className="safety-item-footer-text"><CreditCard size={12} /> {log.idType}: {log.idNumber}</span>
                        )}
                        {log.approvedByName && (
                          <span className="safety-item-footer-text"><UserCheck size={12} /> Approved: {log.approvedByName}</span>
                        )}
                        <span className="safety-item-footer-text">In: {log.entryTime && new Date(log.entryTime).toLocaleTimeString()}</span>
                        {log.exitTime && <span className="safety-item-footer-text">Out: {new Date(log.exitTime).toLocaleTimeString()}</span>}
                      </div>
                    </div>
                  </div>
                  {isStaff && log.status === 'IN' && (
                    <div className="safety-item-actions">
                      <button onClick={() => markExitMutation.mutate(log.id)} className="safety-btn safety-btn--exit">Mark Exit</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* SOS Alert Modal */}
      {showSOSModal && (
        <div className="safety-modal">
          <div className="safety-modal-card">
            <div className="safety-modal-header">
              <h3 className="safety-modal-title">Raise SOS Alert</h3>
              <button onClick={() => setShowSOSModal(false)} className="safety-modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleSOSSubmit} className="safety-form">
              <SmartSelect label="Alert Type" name="alertType" required options={[
                { value: 'FIRE', label: 'Fire' }, { value: 'MEDICAL', label: 'Medical Emergency' },
                { value: 'SECURITY', label: 'Security Threat' }, { value: 'THEFT', label: 'Theft' },
                { value: 'FLOOD', label: 'Flood/Water' }, { value: 'GAS_LEAK', label: 'Gas Leak' },
                { value: 'OTHER', label: 'Other' },
              ]} placeholder="Select Alert Type" />
              <SmartSelect label="Priority" name="priority" options={[
                { value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' }, { value: 'CRITICAL', label: 'Critical' },
              ]} placeholder="Select Priority" />
              <FormInput label="Location" name="location" placeholder="e.g. Block A, 3rd Floor, Near Lift" />
              <FormTextarea label="Description" name="description" rows={4} required />
              <div className="safety-form-actions">
                <button type="button" onClick={() => setShowSOSModal(false)} className="safety-btn safety-btn--ghost">Cancel</button>
                <AsyncButton type="submit" className="safety-btn safety-btn--primary" isLoading={createAlertMutation.isPending} loadingText="Raising...">Raise Alert</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gate Log Modal */}
      {showGateLogModal && (
        <div className="safety-modal">
          <div className="safety-modal-card">
            <div className="safety-modal-header">
              <h3 className="safety-modal-title">Log Gate Entry</h3>
              <button onClick={() => setShowGateLogModal(false)} className="safety-modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleGateLogSubmit} className="safety-form">
              <FormInput label="Person Name" name="personName" required />
              <FormInput label="Phone Number" name="personPhone" />
              <SmartSelect label="Entry Type" name="entryType" required options={[
                { value: 'RESIDENT', label: 'Resident' }, { value: 'VISITOR', label: 'Visitor' },
                { value: 'STAFF', label: 'Staff' }, { value: 'DELIVERY', label: 'Delivery' },
                { value: 'CAB', label: 'Cab' }, { value: 'VEHICLE', label: 'Vehicle' },
              ]} placeholder="Select Type" />
              <FormInput label="Vehicle Number" name="vehicleNumber" />
              <FormInput label="Gate" name="entryGate" />
              <FormInput label="Company Name" name="companyName" placeholder="e.g. Amazon, Swiggy" />
              <div className="safety-form-row">
                <SmartSelect label="ID Type" name="idType" options={[
                  { value: 'AADHAAR', label: 'Aadhaar' }, { value: 'PAN', label: 'PAN Card' },
                  { value: 'DRIVING_LICENSE', label: 'Driving License' }, { value: 'PASSPORT', label: 'Passport' },
                  { value: 'VOTER_ID', label: 'Voter ID' }, { value: 'EMPLOYEE_ID', label: 'Employee ID' },
                ]} placeholder="Select ID Type" />
                <FormInput label="ID Number" name="idNumber" placeholder="Enter ID Number" />
              </div>
              <FormInput label="Items Carried" name="itemsCarried" placeholder="e.g. 2 parcels, toolbox" />
              <FormInput label="Image URL" name="imageUrl" placeholder="Photo URL (optional)" />
              <FormInput label="Purpose" name="purpose" />
              <FormTextarea label="Notes" name="notes" rows={2} />
              <div className="safety-form-actions">
                <button type="button" onClick={() => setShowGateLogModal(false)} className="safety-btn safety-btn--ghost">Cancel</button>
                <AsyncButton type="submit" className="safety-btn safety-btn--primary" isLoading={createGateLogMutation.isPending} loadingText="Logging...">Log Entry</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
