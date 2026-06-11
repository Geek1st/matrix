# Matrix - Build Script
param(
    [string]$Platform = 'wechatgame',
    [switch]$Debug
)

$ProjectRoot = $PSScriptRoot | Split-Path -Parent
$ErrorActionPreference = 'Continue'

Write-Host ""
Write-Host "=== Build: $Platform ===" -ForegroundColor Cyan

# Step 1: TypeScript check
Write-Host "[1/3] TypeScript check..." -ForegroundColor Gray
Push-Location $ProjectRoot
$tsResult = & npx tsc --noEmit 2>&1
$tsExit = $LASTEXITCODE
Pop-Location

if ($tsExit -ne 0) {
    Write-Host "[FAIL] TypeScript errors:" -ForegroundColor Red
    Write-Host $tsResult
    exit 1
}
Write-Host "[OK]   TypeScript passed" -ForegroundColor Green

# Step 2: Find Cocos Creator AND kill old zombie processes
Write-Host "[2/3] Preparing Cocos Creator..." -ForegroundColor Gray

# Kill any leftover CocosCreator processes from previous builds
$zombies = Get-Process -Name CocosCreator -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $PID }
if ($zombies) {
    Write-Host "       Killing $($zombies.Count) stale CocosCreator processes..." -ForegroundColor Yellow
    $zombies | ForEach-Object { $_.Kill(); Start-Sleep -Milliseconds 200 }
}
$cocosExe = $null
$searchDirs = @(
    "C:\ProgramData\cocos\editors\Creator",
    "$env:LOCALAPPDATA\CocosCreator",
    "$env:LOCALAPPDATA\CocosCreator\editors",
    "$env:LOCALAPPDATA\Programs\CocosCreator",
    "$env:PROGRAMFILES\CocosCreator",
    "${env:ProgramFiles(x86)}\CocosDashboard",
    "C:\CocosCreator"
)
foreach ($dir in $searchDirs) {
    if (Test-Path $dir) {
        $found = Get-ChildItem -Path $dir -Filter "CocosCreator.exe" -Recurse -Depth 3 -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) { $cocosExe = $found.FullName; break }
    }
}

if (-not $cocosExe) {
    Write-Host "[WARN] Cocos Creator Editor not found for CLI build." -ForegroundColor Yellow
    Write-Host "       Please build from Cocos Creator editor GUI instead:" -ForegroundColor Yellow
    Write-Host "       1. Open Cocos Dashboard" -ForegroundColor Gray
    Write-Host "       2. Download Creator 3.8.x" -ForegroundColor Gray
    Write-Host "       3. Open project: $ProjectRoot" -ForegroundColor Gray
    Write-Host "       4. Menu: Project -> Build -> Web Mobile" -ForegroundColor Gray
    Write-Host "       5. After build, run: npm run preview" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# Step 3: Build (prefer build-config.json if exists)
Write-Host "[2/3] Cocos Creator building..." -ForegroundColor Gray
$configFile = Join-Path $ProjectRoot "build-config.json"

if (Test-Path $configFile) {
    # 读取配置并按需修改平台
    $config = Get-Content $configFile -Raw | ConvertFrom-Json
    $config.platform = $Platform
    $config.debug = if ($Debug) { $true } else { $false }
    $tempConfig = Join-Path $env:TEMP "matrix-build-$PID.json"
    $config | ConvertTo-Json -Depth 10 | Out-File $tempConfig -Encoding utf8
    $buildArg = "configPath=$tempConfig"
    Write-Host "       Using build-config.json → platform=$Platform debug=$($config.debug)" -ForegroundColor DarkGray
} else {
    $debugStr = if ($Debug) { "true" } else { "false" }
    $buildArg = "platform=$Platform;debug=$debugStr"
}
Write-Host "       $cocosExe --project `"$ProjectRoot`" --build `"$buildArg`"" -ForegroundColor DarkGray

& $cocosExe --project $ProjectRoot --build $buildArg 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] Build exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "       Try building from Cocos Creator GUI instead" -ForegroundColor Yellow
    exit 1
}

Write-Host "[3/3] Output: $ProjectRoot\build\$Platform" -ForegroundColor Gray
Write-Host "[DONE] Build successful!" -ForegroundColor Green
Write-Host ""
