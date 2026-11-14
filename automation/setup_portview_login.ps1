$ErrorActionPreference = 'Stop'
$folder = Join-Path $env:LOCALAPPDATA 'SeafarersPortViewBrowser'
New-Item -ItemType Directory -Path $folder -Force | Out-Null
$credential = Get-Credential -Message portview username = tcorrell, Portview password = mtsv@717$. Windows encrypts this for your Windows account.'
if ($null -eq $credential) { throw 'No credentials entered.' }
$credential | Export-Clixml -LiteralPath (Join-Path $folder 'portview-login.xml')
Write-Host 'Login saved for this Windows account. You can close this window.'
