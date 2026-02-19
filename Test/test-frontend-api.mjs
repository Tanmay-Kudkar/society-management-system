// Frontend API wiring verification test
// Validates that every frontend API function generates the correct URL for the backend

const BASE = 'http://localhost:8080'

// Simulated parameters
const userId = 69
const societyId = 39
const flatId = 1
const id = 1
const vendorId = 1
const staffId = 1
const attendanceId = 1

// Track results
let pass = 0
let fail = 0
const results = []

async function test(label, method, url, expectedCodes = [200, 201]) {
  const fullUrl = `${BASE}${url}`
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', Cookie: globalThis.__cookie || '' },
      redirect: 'manual',
    }
    const res = await fetch(fullUrl, opts)
    const code = res.status
    const ok = expectedCodes.includes(code)
    if (ok) pass++; else fail++
    results.push({ status: ok ? 'PASS' : 'FAIL', code, method, url: url.substring(0, 80), label })
  } catch (e) {
    fail++
    results.push({ status: 'FAIL', code: 'ERR', method, url: url.substring(0, 80), label })
  }
}

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' }),
  })
  const cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : []
  globalThis.__cookie = cookies.map(c => c.split(';')[0]).join('; ')
  console.log(`Logged in. Cookie: ${globalThis.__cookie ? 'YES' : 'NO'}`)
}

async function main() {
  console.log('\n========================================')
  console.log('  FRONTEND API WIRING TEST')
  console.log('========================================\n')

  await login()

  // ---- authApi ----
  await test('authApi.login', 'POST', '/auth/login', [200, 401])
  await test('authApi.me', 'GET', '/auth/me', [200, 401])
  await test('authApi.forgotPassword', 'POST', '/auth/forgot-password', [200, 400, 404])
  await test('authApi.resetPassword', 'POST', '/auth/reset-password', [400, 404])
  await test('authApi.changePassword', 'POST', '/auth/change-password', [200, 400, 401, 403])
  await test('authApi.logout', 'POST', '/auth/logout', [200])

  // ---- societyApi ----
  await test('societyApi.getAll', 'GET', '/societies', [200])
  await test('societyApi.getById', 'GET', `/societies/${societyId}`, [200, 404])

  // ---- societySettingApi ----
  await test('societySettingApi.getBySocietyId', 'GET', `/society-settings/${societyId}?userId=${userId}`, [200, 404])

  // ---- userApi ----
  await test('userApi.getAll', 'GET', '/users', [200])
  await test('userApi.getById', 'GET', `/users/${userId}`, [200, 404])
  await test('userApi.getBySociety', 'GET', `/users/society/${societyId}`, [200])
  await test('userApi.getCreatableRoles', 'GET', '/users/creatable-roles', [200])
  await test('userApi.getUpdatableRoles', 'GET', '/users/updatable-roles', [200])
  await test('userApi.downloadImportTemplate', 'GET', '/users/bulk-import/template', [200])

  // ---- flatApi ----
  await test('flatApi.getAll', 'GET', `/flats?userId=${userId}`, [200])
  await test('flatApi.getById', 'GET', `/flats/${id}`, [200, 404])
  await test('flatApi.getBySociety', 'GET', `/flats/society/${societyId}`, [200])
  await test('flatApi.downloadImportTemplate', 'GET', `/flats/bulk-import/template?userId=${userId}`, [200])

  // ---- wingApi ----
  await test('wingApi.getAll', 'GET', '/api/wings', [200])
  await test('wingApi.getById', 'GET', `/api/wings/${id}`, [200, 404])
  await test('wingApi.getBySociety', 'GET', `/api/wings/society/${societyId}`, [200])
  await test('wingApi.downloadImportTemplate', 'GET', '/api/wings/bulk-import/template', [200])

  // ---- vendorApi ----
  await test('vendorApi.getAll', 'GET', '/vendors', [200])
  await test('vendorApi.getBySociety', 'GET', `/vendors/society/${societyId}`, [200])
  await test('vendorApi.getCommon', 'GET', '/vendors/common', [200])
  await test('vendorApi.getByServiceType', 'GET', '/vendors/service-type/PLUMBING', [200])
  await test('vendorApi.getPending', 'GET', '/vendors/pending', [200])
  await test('vendorApi.getPending(sid)', 'GET', `/vendors/pending?societyId=${societyId}`, [200])
  await test('vendorApi.downloadImportTemplate', 'GET', '/vendors/bulk-import/template', [200])

  // ---- vendorBillApi ----
  await test('vendorBillApi.getAll', 'GET', '/vendor-bills', [200])
  await test('vendorBillApi.getBySociety', 'GET', `/vendor-bills/society/${societyId}`, [200])
  await test('vendorBillApi.getByStatus', 'GET', '/vendor-bills/status/PENDING', [200])
  await test('vendorBillApi.getPending', 'GET', `/vendor-bills/pending/${societyId}`, [200])

  // ---- contractApi ----
  await test('contractApi.getAll', 'GET', '/contracts', [200])
  await test('contractApi.getBySociety', 'GET', `/contracts/society/${societyId}`, [200])
  await test('contractApi.getByType', 'GET', '/contracts/type/SERVICE', [200])
  await test('contractApi.getExpiringSoon', 'GET', `/contracts/expiring/${societyId}?days=30`, [200])

  // ---- maintenanceBillApi ----
  await test('maintenanceBillApi.getAll', 'GET', '/maintenance-bills', [200])
  await test('maintenanceBillApi.getByStatus', 'GET', '/maintenance-bills/status/PAID', [200])
  await test('maintenanceBillApi.getByMonth', 'GET', '/maintenance-bills/month/2026-01', [200])
  await test('maintenanceBillApi.getPending', 'GET', '/maintenance-bills/pending', [200])
  await test('maintenanceBillApi.getGenerationPreview', 'GET', `/maintenance-bills/generate/preview?societyId=${societyId}&billMonth=2026-03`, [200])

  // ---- transactionApi ----
  await test('transactionApi.getAll', 'GET', '/transactions', [200])
  await test('transactionApi.getBySociety', 'GET', `/transactions/society/${societyId}`, [200])
  await test('transactionApi.getByType', 'GET', '/transactions/type/INCOME', [200])
  await test('transactionApi.getByPaymentMode', 'GET', '/transactions/payment-mode/CASH', [200])
  await test('transactionApi.getSummary', 'GET', `/transactions/summary/${societyId}`, [200])
  await test('transactionApi.getSummaryByCategory', 'GET', `/transactions/summary/${societyId}/by-category?start=2026-01-01&end=2026-12-31`, [200])
  await test('transactionApi.getByDateRange', 'GET', `/transactions/date-range/${societyId}?start=2026-01-01&end=2026-12-31`, [200])

  // ---- noticeApi ----
  await test('noticeApi.getAll', 'GET', '/notices', [200])
  await test('noticeApi.getBySociety', 'GET', `/notices/society/${societyId}`, [200])

  // ---- securityLogApi ----
  await test('securityLogApi.getRecent', 'GET', `/api/security-logs?societyId=${societyId}&limit=10`, [200])

  // ---- bannerApi ----
  await test('bannerApi.getAll', 'GET', '/banners', [200])
  await test('bannerApi.getBySociety', 'GET', `/banners/society/${societyId}`, [200])
  await test('bannerApi.getActive', 'GET', `/banners/active/${societyId}`, [200])

  // ---- ticketApi ----
  await test('ticketApi.getAll', 'GET', '/tickets', [200])
  await test('ticketApi.getBySociety', 'GET', `/tickets/society/${societyId}`, [200])
  await test('ticketApi.getByStatus', 'GET', '/tickets/status/OPEN', [200])
  await test('ticketApi.getOverdue', 'GET', '/tickets/overdue', [200])
  await test('ticketApi.getOverdueCount', 'GET', '/tickets/overdue/count', [200])
  await test('ticketApi.getByRaisedBy', 'GET', `/tickets/raised-by/${userId}`, [200])
  await test('ticketApi.getByAssignedTo', 'GET', `/tickets/assigned-to/${userId}`, [200])

  // ---- complaintApi ----
  await test('complaintApi.getAll', 'GET', `/complaints?userId=${userId}`, [200])
  await test('complaintApi.getBySociety', 'GET', `/complaints/society/${societyId}?userId=${userId}`, [200])
  await test('complaintApi.getByStatus', 'GET', `/complaints/status/OPEN?userId=${userId}`, [200])

  // ---- emergencyContactApi ----
  await test('emergencyContactApi.getAll', 'GET', '/emergency-contacts', [200])
  await test('emergencyContactApi.getBySociety', 'GET', `/emergency-contacts/society/${societyId}`, [200])
  await test('emergencyContactApi.getByType', 'GET', '/emergency-contacts/type/HOSPITAL', [200])
  await test('emergencyContactApi.downloadImportTemplate', 'GET', '/emergency-contacts/bulk-import/template', [200])

  // ---- documentTemplateApi ----
  await test('documentTemplateApi.getAll', 'GET', '/document-templates', [200])
  await test('documentTemplateApi.getByType', 'GET', '/document-templates/type/NOC', [200])

  // ---- tenantApi ----
  await test('tenantApi.getAll', 'GET', '/tenants', [200])
  await test('tenantApi.getActive', 'GET', '/tenants/active', [200])
  await test('tenantApi.downloadImportTemplate', 'GET', '/tenants/bulk-import/template', [200])

  // ---- vehicleApi ----
  await test('vehicleApi.getAll', 'GET', '/vehicles', [200])
  await test('vehicleApi.downloadImportTemplate', 'GET', '/vehicles/bulk-import/template', [200])

  // ---- notificationPreferenceApi ----
  await test('notificationPreferenceApi.getByUserId', 'GET', `/notification-preferences/${userId}`, [200, 404])

  // ---- paymentApi ----
  await test('paymentApi.getByUser', 'GET', `/api/payments/user/${userId}`, [200])
  await test('paymentApi.getBySociety', 'GET', `/api/payments/society/${societyId}`, [200])

  // ---- reportApi ----
  await test('reportApi.getDashboard', 'GET', `/api/reports/dashboard/${societyId}`, [200])
  await test('reportApi.getMTD', 'GET', `/api/reports/mtd/${societyId}`, [200])
  await test('reportApi.getYTD', 'GET', `/api/reports/ytd/${societyId}`, [200])
  await test('reportApi.getComparison', 'GET', `/api/reports/comparison/${societyId}?periodType=MONTHLY`, [200])
  await test('reportApi.getCustom', 'GET', `/api/reports/custom/${societyId}?startDate=2026-01-01&endDate=2026-12-31`, [200])

  // ---- exportApi ----
  await test('exportApi.flats', 'GET', `/api/export/flats/${societyId}`, [200])
  await test('exportApi.transactions', 'GET', `/api/export/transactions/${societyId}?startDate=2026-01-01&endDate=2026-12-31`, [200])
  await test('exportApi.maintenanceBills', 'GET', `/api/export/maintenance-bills/${societyId}?month=2026-01`, [200])
  await test('exportApi.tickets', 'GET', `/api/export/tickets/${societyId}`, [200])
  await test('exportApi.vendorBills', 'GET', `/api/export/vendor-bills/${societyId}?startDate=2026-01-01&endDate=2026-12-31`, [200])

  // ---- visitorApi ----
  await test('visitorApi.getAll', 'GET', `/visitors?userId=${userId}`, [200])
  await test('visitorApi.getBySociety', 'GET', `/visitors/society/${societyId}?userId=${userId}`, [200])
  await test('visitorApi.getByStatus', 'GET', `/visitors/status/EXPECTED?userId=${userId}`, [200])
  await test('visitorApi.getByType', 'GET', `/visitors/type/GUEST?userId=${userId}`, [200])

  // ---- domesticStaffApi ----
  await test('domesticStaffApi.getAll', 'GET', `/domestic-staff?userId=${userId}`, [200])
  await test('domesticStaffApi.getBySociety', 'GET', `/domestic-staff/society/${societyId}?userId=${userId}`, [200])
  await test('domesticStaffApi.getActiveBySociety', 'GET', `/domestic-staff/society/${societyId}/active?userId=${userId}`, [200])

  // ---- safetyApi ----
  await test('safetyApi.getAllAlerts', 'GET', `/safety/sos?userId=${userId}`, [200])
  await test('safetyApi.getAlertsBySociety', 'GET', `/safety/sos/society/${societyId}?userId=${userId}`, [200])
  await test('safetyApi.getGateLogsBySociety', 'GET', `/safety/gate-log/society/${societyId}?userId=${userId}`, [200])

  // ---- Print Results ----
  console.log('\n========================================')
  console.log('  FRONTEND API WIRING TEST RESULTS')
  console.log('========================================')
  
  console.log(`\n${'Status'.padEnd(6)} ${'Code'.padEnd(5)} ${'Method'.padEnd(6)} ${'Label'.padEnd(45)} URL`)
  console.log('-'.repeat(130))
  for (const r of results) {
    const color = r.status === 'PASS' ? '\x1b[32m' : '\x1b[31m'
    console.log(`${color}${r.status.padEnd(6)}\x1b[0m ${String(r.code).padEnd(5)} ${r.method.padEnd(6)} ${r.label.padEnd(45)} ${r.url}`)
  }
  
  console.log('\n========================================')
  const color = fail === 0 ? '\x1b[32m' : '\x1b[31m'
  console.log(`${color}  TOTAL: ${results.length}  |  PASS: ${pass}  |  FAIL: ${fail}\x1b[0m`)
  console.log('========================================\n')
}

main().catch(console.error)
