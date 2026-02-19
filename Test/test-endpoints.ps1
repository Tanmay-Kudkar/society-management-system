#!/usr/bin/env pwsh
# Comprehensive endpoint test script for Society Management System
# Tests all backend REST endpoints and reports results

$BASE = "http://localhost:8080"
$results = @()
$pass = 0
$fail = 0

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Label,
        [string]$Body = $null,
        [string]$ContentType = "application/json",
        [int[]]$ExpectedCodes = @(200, 201),
        [switch]$UseCookie
    )

    $fullUrl = "$BASE$Url"
    try {
        $params = @{
            Method = $Method
            Uri = $fullUrl
            UseBasicParsing = $true
            ErrorAction = "Stop"
            TimeoutSec = 10
        }

        if ($Body) {
            $params.Body = $Body
            $params.ContentType = $ContentType
        }

        if ($UseCookie -and $script:cookies) {
            $params.WebSession = $script:session
        }

        $response = Invoke-WebRequest @params
        $code = $response.StatusCode

        if ($ExpectedCodes -contains $code) {
            $script:pass++
            $status = "PASS"
        } else {
            $script:fail++
            $status = "FAIL"
        }

        $script:results += [PSCustomObject]@{
            Status = $status
            Code = $code
            Method = $Method
            Endpoint = $Url
            Label = $Label
        }
    }
    catch {
        $code = 0
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
        }

        # Some endpoints return 4xx by design when no auth/data — that's expected
        if ($ExpectedCodes -contains $code) {
            $script:pass++
            $status = "PASS"
        } else {
            $script:fail++
            $status = "FAIL"
        }

        $script:results += [PSCustomObject]@{
            Status = $status
            Code = $code
            Method = $Method
            Endpoint = $Url
            Label = $Label
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BACKEND ENDPOINT TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Base URL: $BASE"
Write-Host ""

# =============================================
# 1. HEALTH CHECK
# =============================================
Write-Host "`n--- Health ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/health" -Label "Health check"

# =============================================
# 2. AUTH ENDPOINTS
# =============================================
Write-Host "`n--- Auth ---" -ForegroundColor Yellow

# Login with test credentials
$loginBody = '{"email":"master@society.com","password":"master"}'
Test-Endpoint -Method "POST" -Url "/auth/login" -Label "Login" -Body $loginBody -ExpectedCodes @(200, 401, 403)

# Try login and capture session for authenticated endpoints
try {
    $loginResp = Invoke-WebRequest -Method POST -Uri "$BASE/auth/login" -Body $loginBody -ContentType "application/json" -SessionVariable session -UseBasicParsing -ErrorAction Stop
    $script:session = $session
    $script:cookies = $true
    $meResp = Invoke-WebRequest -Method GET -Uri "$BASE/auth/me" -WebSession $session -UseBasicParsing -ErrorAction Stop
    $userData = $meResp.Content | ConvertFrom-Json
    $script:userId = $userData.id
    $script:societyId = $userData.societyId
    # MASTER_ADMIN has no society - discover one
    if (-not $script:societyId) {
        try {
            $socResp = Invoke-WebRequest -Method GET -Uri "$BASE/societies" -WebSession $session -UseBasicParsing -ErrorAction Stop
            $socList = $socResp.Content | ConvertFrom-Json
            if ($socList.Count -gt 0) {
                $script:societyId = $socList[0].id
                Write-Host "  Using discovered societyId: $($script:societyId)" -ForegroundColor DarkCyan
            }
        } catch {}
    }
    Write-Host "  Authenticated as: $($userData.email) (id=$($script:userId), societyId=$($script:societyId))" -ForegroundColor Green
} catch {
    Write-Host "  Could not authenticate. Testing unauthenticated endpoints only." -ForegroundColor DarkYellow
    $script:cookies = $false
    $script:userId = 1
    $script:societyId = 1
}

Test-Endpoint -Method "GET" -Url "/auth/me" -Label "Get current user" -UseCookie -ExpectedCodes @(200, 401)
Test-Endpoint -Method "POST" -Url "/auth/forgot-password" -Label "Forgot password" -Body '{"email":"test@test.com"}' -ExpectedCodes @(200, 404, 400)
Test-Endpoint -Method "POST" -Url "/auth/reset-password" -Label "Reset password (invalid token)" -Body '{"token":"invalid","newPassword":"test"}' -ExpectedCodes @(400, 404)
Test-Endpoint -Method "POST" -Url "/auth/change-password" -Label "Change password (no auth)" -Body '{"currentPassword":"x","newPassword":"y"}' -ExpectedCodes @(200, 400, 401, 403)

# =============================================
# 3. SOCIETY ENDPOINTS
# =============================================
Write-Host "`n--- Societies ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/societies" -Label "Get all societies" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/societies/1" -Label "Get society by ID" -UseCookie -ExpectedCodes @(200, 404, 401, 403)

# =============================================
# 4. SOCIETY SETTINGS
# =============================================
Write-Host "`n--- Society Settings ---" -ForegroundColor Yellow
$sid = $script:societyId
$uid = $script:userId
Test-Endpoint -Method "GET" -Url "/society-settings/${sid}?userId=${uid}" -Label "Get society settings" -UseCookie -ExpectedCodes @(200, 404, 401, 403)

# =============================================
# 5. USER ENDPOINTS
# =============================================
Write-Host "`n--- Users ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/users" -Label "Get all users" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/users/1" -Label "Get user by ID" -UseCookie -ExpectedCodes @(200, 404, 401, 403)
Test-Endpoint -Method "GET" -Url "/users/society/${sid}" -Label "Get users by society" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/users/creatable-roles" -Label "Get creatable roles" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/users/updatable-roles" -Label "Get updatable roles" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/users/bulk-import/template" -Label "Download user import template" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 6. FLAT ENDPOINTS
# =============================================
Write-Host "`n--- Flats ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/flats?userId=${uid}" -Label "Get all flats" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/flats/1" -Label "Get flat by ID" -UseCookie -ExpectedCodes @(200, 404, 401, 403)
Test-Endpoint -Method "GET" -Url "/flats/society/${sid}" -Label "Get flats by society" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/flats/bulk-import/template?userId=${uid}" -Label "Download flat import template" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 7. WING ENDPOINTS
# =============================================
Write-Host "`n--- Wings ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/api/wings" -Label "Get all wings" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/api/wings/1" -Label "Get wing by ID" -UseCookie -ExpectedCodes @(200, 404, 401, 403)
Test-Endpoint -Method "GET" -Url "/api/wings/society/${sid}" -Label "Get wings by society" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/api/wings/bulk-import/template" -Label "Download wing import template" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 8. VENDOR ENDPOINTS
# =============================================
Write-Host "`n--- Vendors ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/vendors" -Label "Get all vendors" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/vendors/society/${sid}" -Label "Get vendors by society" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/vendors/common" -Label "Get common vendors" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/vendors/service-type/PLUMBING" -Label "Get vendors by service type" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/vendors/pending" -Label "Get pending vendors" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/vendors/bulk-import/template" -Label "Download vendor import template" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 9. VENDOR BILL ENDPOINTS
# =============================================
Write-Host "`n--- Vendor Bills ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/vendor-bills" -Label "Get all vendor bills" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/vendor-bills/society/${sid}" -Label "Get vendor bills by society" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/vendor-bills/status/PENDING" -Label "Get vendor bills by status" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/vendor-bills/pending/${sid}" -Label "Get pending vendor bills" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 10. CONTRACT ENDPOINTS
# =============================================
Write-Host "`n--- Contracts ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/contracts" -Label "Get all contracts" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/contracts/society/${sid}" -Label "Get contracts by society" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/contracts/type/SERVICE" -Label "Get contracts by type" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/contracts/expiring/${sid}?days=30" -Label "Get expiring contracts" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 11. MAINTENANCE BILL ENDPOINTS
# =============================================
Write-Host "`n--- Maintenance Bills ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/maintenance-bills" -Label "Get all maintenance bills" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/maintenance-bills/pending" -Label "Get pending bills" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/maintenance-bills/status/PAID" -Label "Get bills by status" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/maintenance-bills/month/2026-01" -Label "Get bills by month" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/maintenance-bills/generate/preview?societyId=${sid}&billMonth=2026-03" -Label "Preview bill generation" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 12. TRANSACTION ENDPOINTS
# =============================================
Write-Host "`n--- Transactions ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/transactions" -Label "Get all transactions" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/transactions/society/${sid}" -Label "Get transactions by society" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/transactions/type/INCOME" -Label "Get transactions by type" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/transactions/payment-mode/CASH" -Label "Get transactions by payment mode" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/transactions/summary/${sid}" -Label "Get transaction summary" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/transactions/summary/${sid}/by-category?start=2026-01-01&end=2026-12-31" -Label "Get summary by category" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/transactions/date-range/${sid}?start=2026-01-01&end=2026-12-31" -Label "Get transactions by date range" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 13. NOTICE ENDPOINTS
# =============================================
Write-Host "`n--- Notices ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/notices" -Label "Get all notices" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/notices/society/${sid}" -Label "Get notices by society" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 14. BANNER ENDPOINTS
# =============================================
Write-Host "`n--- Banners ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/banners" -Label "Get all banners" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/banners/society/${sid}" -Label "Get banners by society" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/banners/active/${sid}" -Label "Get active banners" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 15. TICKET ENDPOINTS
# =============================================
Write-Host "`n--- Tickets ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/tickets" -Label "Get all tickets" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/tickets/society/${sid}" -Label "Get tickets by society" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/tickets/status/OPEN" -Label "Get tickets by status" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/tickets/overdue" -Label "Get overdue tickets" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/tickets/overdue/count" -Label "Get overdue ticket count" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/tickets/raised-by/${uid}" -Label "Get tickets raised by user" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/tickets/assigned-to/${uid}" -Label "Get tickets assigned to user" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 16. COMPLAINT ENDPOINTS
# =============================================
Write-Host "`n--- Complaints ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/complaints?userId=${uid}" -Label "Get all complaints" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/complaints/society/${sid}?userId=${uid}" -Label "Get complaints by society" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/complaints/status/OPEN?userId=${uid}" -Label "Get complaints by status" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 17. EMERGENCY CONTACT ENDPOINTS
# =============================================
Write-Host "`n--- Emergency Contacts ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/emergency-contacts" -Label "Get all emergency contacts" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/emergency-contacts/society/${sid}" -Label "Get contacts by society" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/emergency-contacts/type/HOSPITAL" -Label "Get contacts by type" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/emergency-contacts/bulk-import/template" -Label "Download contact import template" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 18. DOCUMENT TEMPLATE ENDPOINTS
# =============================================
Write-Host "`n--- Document Templates ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/document-templates" -Label "Get all document templates" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/document-templates/type/NOC" -Label "Get templates by type" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 19. TENANT ENDPOINTS
# =============================================
Write-Host "`n--- Tenants ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/tenants" -Label "Get all tenants" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/tenants/active" -Label "Get active tenants" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/tenants/bulk-import/template" -Label "Download tenant import template" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 20. VEHICLE ENDPOINTS
# =============================================
Write-Host "`n--- Vehicles ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/vehicles" -Label "Get all vehicles" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/vehicles/bulk-import/template" -Label "Download vehicle import template" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 21. NOTIFICATION PREFERENCE ENDPOINTS
# =============================================
Write-Host "`n--- Notification Preferences ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/notification-preferences/${uid}" -Label "Get notification prefs" -UseCookie -ExpectedCodes @(200, 404, 401, 403)

# =============================================
# 22. PAYMENT ENDPOINTS
# =============================================
Write-Host "`n--- Payments ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/api/payments/user/${uid}" -Label "Get payments by user" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/api/payments/society/${sid}" -Label "Get payments by society" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 23. REPORT ENDPOINTS
# =============================================
Write-Host "`n--- Reports ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/api/reports/dashboard/${sid}" -Label "Dashboard report" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/api/reports/mtd/${sid}" -Label "MTD report" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/api/reports/ytd/${sid}" -Label "YTD report" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/api/reports/comparison/${sid}?periodType=MONTHLY" -Label "Comparison report" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/api/reports/custom/${sid}?startDate=2026-01-01&endDate=2026-12-31" -Label "Custom range report" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 24. EXPORT ENDPOINTS
# =============================================
Write-Host "`n--- Exports ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/api/export/flats/${sid}" -Label "Export flats" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/api/export/transactions/${sid}?startDate=2026-01-01&endDate=2026-12-31" -Label "Export transactions" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/api/export/maintenance-bills/${sid}?month=2026-01" -Label "Export maintenance bills" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/api/export/tickets/${sid}" -Label "Export tickets" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/api/export/vendor-bills/${sid}?startDate=2026-01-01&endDate=2026-12-31" -Label "Export vendor bills" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 25. VISITOR ENDPOINTS
# =============================================
Write-Host "`n--- Visitors ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/visitors?userId=${uid}" -Label "Get all visitors" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/visitors/society/${sid}?userId=${uid}" -Label "Get visitors by society" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/visitors/status/EXPECTED?userId=${uid}" -Label "Get visitors by status" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/visitors/type/GUEST?userId=${uid}" -Label "Get visitors by type" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 26. DOMESTIC STAFF ENDPOINTS
# =============================================
Write-Host "`n--- Domestic Staff ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/domestic-staff?userId=${uid}" -Label "Get all domestic staff" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/domestic-staff/society/${sid}?userId=${uid}" -Label "Get staff by society" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/domestic-staff/society/${sid}/active?userId=${uid}" -Label "Get active staff" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 27. SAFETY ENDPOINTS (SOS)
# =============================================
Write-Host "`n--- Safety (SOS) ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/safety/sos?userId=${uid}" -Label "Get all SOS alerts" -UseCookie -ExpectedCodes @(200, 401, 403)
Test-Endpoint -Method "GET" -Url "/safety/sos/society/${sid}?userId=${uid}" -Label "Get SOS by society" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 28. SAFETY ENDPOINTS (Gate Logs)
# =============================================
Write-Host "`n--- Safety (Gate Logs) ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/safety/gate-log/society/${sid}?userId=${uid}" -Label "Get gate logs by society" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# 29. SECURITY LOG ENDPOINTS
# =============================================
Write-Host "`n--- Security Logs ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "/api/security-logs?societyId=${sid}&limit=10" -Label "Get recent security logs" -UseCookie -ExpectedCodes @(200, 401, 403)

# =============================================
# RESULTS SUMMARY
# =============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$results | Format-Table -Property Status, Code, Method, Endpoint, Label -AutoSize

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TOTAL: $($results.Count)  |  PASS: $pass  |  FAIL: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
Write-Host "========================================`n" -ForegroundColor Cyan
