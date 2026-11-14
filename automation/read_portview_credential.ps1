$ErrorActionPreference = 'Stop'
$credential = Import-Clixml -LiteralPath (Join-Path $env:LOCALAPPDATA 'SeafarersPortViewBrowser\portview-login.xml')
@{username=$credential.UserName; password=$credential.GetNetworkCredential().Password} | ConvertTo-Json -Compress
