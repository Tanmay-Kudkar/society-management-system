$ErrorActionPreference = 'Continue'
$base = 'http://localhost:8080'
$results = @()

function Add-Result {
    param(
        [int]$Step,
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [int]$Code,
        [int[]]$Expected
    )
    $ok = $Expected -contains $Code
    $script:results += [PSCustomObject]@{
        Step     = $Step
        Name     = $Name
        Method   = $Method
        Url      = $Url
        Code     = $Code
        Expected = ($Expected -join ',')
        Status   = if ($ok) { 'PASS' } else { 'FAIL' }
    }
}

function Invoke-Check {
    param(
        [int]$Step,
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [int[]]$Expected,
        [string]$Body = $null,
        $Session = $null
    )

    $uri = "$base$Path"
    try {
        $params = @{
            Method      = $Method
            Uri         = $uri
            TimeoutSec  = 10
            UseBasicParsing = $true
            ErrorAction = 'Stop'
        }
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = 'application/json'
        }
        if ($Session) {
            $params.WebSession = $Session
        }

        $resp = Invoke-WebRequest @params
        Add-Result -Step $Step -Name $Name -Method $Method -Url $Path -Code ([int]$resp.StatusCode) -Expected $Expected
    }
    catch {
        $code = 0
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
        }
        Add-Result -Step $Step -Name $Name -Method $Method -Url $Path -Code $code -Expected $Expected
    }
}

# 1) Health
Invoke-Check -Step 1 -Name 'Health' -Method 'GET' -Path '/health' -Expected @(200)

# 2) Auth boundary (no cookie)
Invoke-Check -Step 2 -Name 'Auth Me (no cookie)' -Method 'GET' -Path '/auth/me' -Expected @(401)

# 3) Invalid login blocked
Invoke-Check -Step 3 -Name 'Invalid Login blocked' -Method 'POST' -Path '/auth/login' -Body '{"email":"master@society.com","password":"wrong-pass"}' -Expected @(400,401,403)

# 4) Master login
$session = $null
$uid = 1
$sid = 1
try {
    $login = Invoke-WebRequest -UseBasicParsing -Method POST -Uri "$base/auth/login" -Body '{"email":"master@society.com","password":"master"}' -ContentType 'application/json' -SessionVariable session -ErrorAction Stop -TimeoutSec 10
    Add-Result -Step 4 -Name 'Master Login' -Method 'POST' -Url '/auth/login' -Code ([int]$login.StatusCode) -Expected @(200)

    $me = Invoke-WebRequest -UseBasicParsing -Method GET -Uri "$base/auth/me" -WebSession $session -ErrorAction Stop -TimeoutSec 10
    $mej = $me.Content | ConvertFrom-Json
    if ($mej.id) { $uid = [int]$mej.id }
    if ($mej.societyId) { $sid = [int]$mej.societyId }

    if (-not $sid) {
        try {
            $soc = Invoke-WebRequest -UseBasicParsing -Method GET -Uri "$base/societies" -WebSession $session -ErrorAction Stop -TimeoutSec 10
            $arr = $soc.Content | ConvertFrom-Json
            if ($arr.Count -gt 0) {
                $sid = [int]$arr[0].id
            }
        }
        catch {}
    }
}
catch {
    $code = 0
    if ($_.Exception.Response) {
        $code = [int]$_.Exception.Response.StatusCode
    }
    Add-Result -Step 4 -Name 'Master Login' -Method 'POST' -Url '/auth/login' -Code $code -Expected @(200)
}

# 5) Auth me with cookie
Invoke-Check -Step 5 -Name 'Auth Me (cookie)' -Method 'GET' -Path '/auth/me' -Expected @(200) -Session $session

# 6) User role-gated route with cookie
Invoke-Check -Step 6 -Name 'User creatable roles (admin)' -Method 'GET' -Path '/users/creatable-roles' -Expected @(200) -Session $session

# 7) Same route without cookie
Invoke-Check -Step 7 -Name 'User creatable roles (no cookie)' -Method 'GET' -Path '/users/creatable-roles' -Expected @(401)

# 8) Finance flow with cookie
Invoke-Check -Step 8 -Name 'Maintenance pending (auth)' -Method 'GET' -Path '/maintenance-bills/pending' -Expected @(200,403) -Session $session

# 9) Finance flow without cookie
Invoke-Check -Step 9 -Name 'Maintenance pending (no cookie)' -Method 'GET' -Path '/maintenance-bills/pending' -Expected @(401)

# 10) Ticket flow with cookie
Invoke-Check -Step 10 -Name 'Ticket overdue count (auth)' -Method 'GET' -Path '/tickets/overdue/count' -Expected @(200,403) -Session $session

# 11) Ticket flow without cookie
Invoke-Check -Step 11 -Name 'Ticket overdue count (no cookie)' -Method 'GET' -Path '/tickets/overdue/count' -Expected @(401)

# 12) Vendor flow with cookie
Invoke-Check -Step 12 -Name 'Vendor pending (auth)' -Method 'GET' -Path '/vendors/pending' -Expected @(200,403) -Session $session

# 13) Notification preference read
Invoke-Check -Step 13 -Name 'Notification prefs (auth)' -Method 'GET' -Path "/notification-preferences/$uid" -Expected @(200,404) -Session $session

# 14) Society settings scoped read
Invoke-Check -Step 14 -Name 'Society settings (scoped)' -Method 'GET' -Path ("/society-settings/{0}?userId={1}" -f $sid, $uid) -Expected @(200,403,404) -Session $session

$pass = ($results | Where-Object { $_.Status -eq 'PASS' }).Count
$fail = ($results | Where-Object { $_.Status -eq 'FAIL' }).Count

Write-Output "UserContext: userId=$uid societyId=$sid"
$results | Sort-Object Step | Format-Table -AutoSize
Write-Output "TOTAL=$($results.Count) PASS=$pass FAIL=$fail"
Write-Output 'RESULT_JSON_START'
($results | Sort-Object Step | ConvertTo-Json -Depth 5)
Write-Output 'RESULT_JSON_END'
