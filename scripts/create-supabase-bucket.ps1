<#
PowerShell helper to create a Supabase storage bucket via the REST API.

Usage (PowerShell):
  $env:SUPABASE_URL = 'https://your-project.supabase.co'
  $env:SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key'
  .\scripts\create-supabase-bucket.ps1 -BucketName 'artist-applications' -Public

WARNING: This uses the Supabase service_role key which must be kept secret. Do NOT commit keys.
#>
[CmdletBinding()]
param(
  [string]$BucketName = 'artist-applications',
  [switch]$Public
)

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_SERVICE_ROLE_KEY) {
  Write-Error "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables before running this script."
  exit 1
}

$uri = "$($env:SUPABASE_URL.TrimEnd('/'))/storage/v1/buckets"
$body = @{ name = $BucketName; public = $Public.IsPresent }
$headers = @{
  Authorization = "Bearer $($env:SUPABASE_SERVICE_ROLE_KEY)"
  apikey = $env:SUPABASE_SERVICE_ROLE_KEY
}

try {
  $res = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -ContentType 'application/json' -Body ($body | ConvertTo-Json)
  Write-Host "Bucket created:" -ForegroundColor Green
  $res | ConvertTo-Json -Depth 5 | Write-Host
} catch {
  Write-Error "Failed to create bucket: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    try { $_.Exception.Response.GetResponseStream() | Select-Object -First 1 }
    catch { }
  }
  exit 1
}
