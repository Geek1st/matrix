# Matrix - Environment Detection
$ProjectRoot = $PSScriptRoot | Split-Path -Parent

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Matrix Toolchain - Environment Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Node.js
try {
    $v = node -v 2>$null
    Write-Host "  [OK]  Node.js $v" -ForegroundColor Green
} catch {
    Write-Host "  [MISS] Node.js" -ForegroundColor Red
}

# 2. TypeScript (check node_modules)
$tscPath = Join-Path $ProjectRoot "node_modules\.bin\tsc.cmd"
if (Test-Path $tscPath) {
    Write-Host "  [OK]  TypeScript (node_modules)" -ForegroundColor Green
} else {
    Write-Host "  [MISS] TypeScript - run: npm install" -ForegroundColor Yellow
}

# 3. Cocos Dashboard
$dbFound = $false
$dbPaths = @(
    "${env:ProgramFiles(x86)}\CocosDashboard\CocosDashboard.exe",
    "$env:PROGRAMFILES\Cocos Dashboard\CocosDashboard.exe",
    "$env:LOCALAPPDATA\Programs\Cocos Dashboard\CocosDashboard.exe",
    "$env:LOCALAPPDATA\CocosDashboard\CocosDashboard.exe"
)
foreach ($p in $dbPaths) {
    if (Test-Path $p) {
        Write-Host "  [OK]  Cocos Dashboard: $p" -ForegroundColor Green
        $dbFound = $true
        break
    }
}
if (-not $dbFound) {
    Write-Host "  [MISS] Cocos Dashboard" -ForegroundColor Yellow
}

# 4. Cocos Creator Editor
$cocosFound = $false
$cocosSearchPaths = @(
    "C:\ProgramData\cocos\editors\Creator\*\CocosCreator.exe",
    "${env:ProgramFiles(x86)}\CocosDashboard\resources\app.asar.unpacked\*\CocosCreator.exe",
    "${env:ProgramFiles(x86)}\CocosDashboard\resources\*\CocosCreator.exe",
    "$env:LOCALAPPDATA\CocosCreator\editors\*\CocosCreator.exe",
    "$env:LOCALAPPDATA\CocosCreator\*\CocosCreator.exe",
    "C:\CocosCreator\*\CocosCreator.exe"
)
foreach ($p in $cocosSearchPaths) {
    $found = Get-ChildItem -Path $p -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        Write-Host "  [OK]  Cocos Creator: $($found.FullName)" -ForegroundColor Green
        $cocosFound = $true
        break
    }
}
if (-not $cocosFound) {
    Write-Host "  [MISS] Cocos Creator Editor" -ForegroundColor Yellow
    if ($dbFound) {
        Write-Host "         Please open Cocos Dashboard and download Creator 3.8.x" -ForegroundColor Yellow
    } else {
        Write-Host "         Download: https://www.cocos.com/creator" -ForegroundColor Yellow
    }
}

# 5. WeChat DevTools CLI
$wechatPaths = @(
    "$env:LOCALAPPDATA\Programs\Tencent\微信web开发者工具\cli.bat",
    "$env:LOCALAPPDATA\Programs\Tencent\微信开发者工具\cli.bat",
    "$env:PROGRAMFILES\Tencent\微信开发者工具\cli.bat"
)
$weFound = $false
foreach ($p in $wechatPaths) {
    if (Test-Path $p) {
        Write-Host "  [OK]  WeChat DevTools: $p" -ForegroundColor Green
        $weFound = $true
        break
    }
}
if (-not $weFound) {
    Write-Host "  [MISS] WeChat DevTools" -ForegroundColor Yellow
    Write-Host "         Download: https://developers.weixin.qq.com/minigame/dev/devtools/download.html" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Project: $ProjectRoot" -ForegroundColor Gray
Write-Host ""
