# Load .env and set SUPABASE env vars for this session, then create bucket
$envFile = Join-Path $PSScriptRoot '..\.env'
if (-not (Test-Path $envFile)) { Write-Error "No .env file found at $envFile"; exit 1 }

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -and $line -notmatch '^#' -and $line -match '=') {
    $parts = $line -split '=',2
    $k = $parts[0].Trim(); $v = $parts[1].Trim()
    switch ($k) {
      'VITE_SUPABASE_URL' { $env:SUPABASE_URL = $v }
      'VITE_SUPABASE_ANON_KEY' { $env:VITE_SUPABASE_ANON_KEY = $v }
      'SUPABASE_SERVICE_ROLE_KEY' { $env:SUPABASE_SERVICE_ROLE_KEY = $v }
      default { }
    }
  }
}

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_SERVICE_ROLE_KEY) { Write-Error 'Required SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env'; exit 1 }
Write-Host 'Creating bucket artist-applications...'
& (Join-Path $PSScriptRoot 'create-supabase-bucket.ps1') -BucketName 'artist-applications' -Public
