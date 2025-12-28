$u = "$env:SUPABASE_URL/storage/v1/buckets"
$h = @{ Authorization = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"; apikey = $env:SUPABASE_SERVICE_ROLE_KEY }
try {
  $r = Invoke-RestMethod -Method Get -Uri $u -Headers $h -ErrorAction Stop
  Write-Host 'Buckets list returned:'
  $r | ConvertTo-Json -Depth 5 | Write-Host
} catch {
  Write-Host 'GET buckets failed:' $_.Exception.Message
  if ($_.Exception.Response) {
    try {
      $resp = $_.Exception.Response
      Write-Host "StatusCode: $($resp.StatusCode)"
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $body = $reader.ReadToEnd()
      Write-Host 'Response body:'
      Write-Host $body
    } catch { Write-Host 'Could not read response body' }
  }
  exit 1
}