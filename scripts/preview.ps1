# Matrix - Preview HTTP Server
$ProjectRoot = $PSScriptRoot | Split-Path -Parent
$previewDir = Join-Path $ProjectRoot "build" "web-mobile"

if (-not (Test-Path $previewDir)) {
    Write-Host "No web-mobile build. Building first..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "build.ps1") -Platform "web-mobile"
    if ($LASTEXITCODE -ne 0) { exit 1 }
}

$port = 7456
Write-Host ""
Write-Host "=== Preview Server ===" -ForegroundColor Cyan
Write-Host "URL: http://localhost:$port" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Try Python first, then npx serve
$pythonFound = Get-Command python -ErrorAction SilentlyContinue
if ($pythonFound) {
    python -m http.server $port --directory $previewDir
} else {
    Write-Host "Python not found. Try: npm i -g serve" -ForegroundColor Yellow
    Write-Host "Then run: npx serve $previewDir -l $port" -ForegroundColor Yellow
}
