# Matrix - Deploy to WeChat DevTools
$ProjectRoot = $PSScriptRoot | Split-Path -Parent

$wechatCliPaths = @(
    "$env:LOCALAPPDATA\Programs\Tencent\微信web开发者工具\cli.bat",
    "$env:LOCALAPPDATA\Programs\Tencent\微信开发者工具\cli.bat",
    "$env:PROGRAMFILES\Tencent\微信开发者工具\cli.bat"
)
$wechatCli = $null
foreach ($p in $wechatCliPaths) {
    if (Test-Path $p) { $wechatCli = $p; break }
}

if (-not $wechatCli) {
    Write-Host "[FAIL] WeChat DevTools not found!" -ForegroundColor Red
    Write-Host "       Download: https://developers.weixin.qq.com/minigame/dev/devtools/download.html" -ForegroundColor Yellow
    exit 1
}

$buildDir = Join-Path $ProjectRoot "build" "wechatgame"
if (-not (Test-Path $buildDir)) {
    Write-Host "No wechatgame build. Building first..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "build.ps1") -Platform "wechatgame"
    if ($LASTEXITCODE -ne 0) { exit 1 }
}

Write-Host "Launching WeChat DevTools..." -ForegroundColor Cyan
& cmd /c "$wechatCli open --project `"$buildDir`""

Write-Host "[OK] Done" -ForegroundColor Green
