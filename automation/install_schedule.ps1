$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$action = New-ScheduledTaskAction -Execute (Join-Path $PSScriptRoot 'collect_daily.cmd') -WorkingDirectory $project
$triggers = @('00:00','09:00','12:00','18:00') | ForEach-Object { New-ScheduledTaskTrigger -Daily -At $_ }
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName 'Seafarers Portfolio Collection' -Action $action -Trigger $triggers -Settings $settings -Description 'Collect Ships in Port snapshots four times daily'

