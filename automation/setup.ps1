$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$node = Get-Command node.exe -ErrorAction Stop
Get-Command npm.cmd -ErrorAction Stop | Out-Null
Get-Command py.exe -ErrorAction Stop | Out-Null
Push-Location $root
try {
    py -3.13 -m venv .venv
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the Python environment.' }
    & (Join-Path $root '.venv\Scripts\python.exe') -m pip install -r (Join-Path $PSScriptRoot 'requirements.txt')
    if ($LASTEXITCODE -ne 0) { throw 'Could not install the Python packages.' }
    Push-Location $PSScriptRoot
    try {
        npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'Could not install the Node packages.' }
    } finally { Pop-Location }
    $runtime = Join-Path $PSScriptRoot 'runtime'
    New-Item -ItemType Directory -Path $runtime -Force | Out-Null
    Copy-Item -LiteralPath $node.Source -Destination (Join-Path $runtime 'node.exe') -Force
    New-Item -ItemType Directory -Path (Join-Path $root 'data\port_snapshots'),(Join-Path $root 'data\sign_ins\exports'),(Join-Path $root 'reports'),(Join-Path $root 'outputs\seafarer_report') -Force | Out-Null
    Write-Host 'Project dependencies installed. Read README.md for data and login setup.'
} finally { Pop-Location }
