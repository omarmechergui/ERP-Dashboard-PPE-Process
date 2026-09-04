# Script to enable MongoDB replica set
$cfgPath = "C:\Program Files\MongoDB\Server\8.3\bin\mongod.cfg"
$cfg = Get-Content $cfgPath -Raw
$cfg = $cfg -replace '#replication:', "replication:`n  replSetName: rs0"
Set-Content $cfgPath $cfg -Force
Write-Host "Config updated. Restarting MongoDB..."
Restart-Service MongoDB
Start-Sleep -Seconds 5
Write-Host "MongoDB restarted. Done."
