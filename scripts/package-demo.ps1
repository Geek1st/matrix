# Matrix Match-3 Demo 打包脚本
# 将 demo.html 及其依赖打包为单文件分发

param(
    [string]$OutputDir = "dist",
    [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Matrix Match-3 Demo 打包工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查源文件
$sourceFiles = @(
    "demo.html",
    "audio-system.js",
    "animation-system.js",
    "responsive-layout.js",
    "session-persistence.js"
)

Write-Host "[1/6] 检查源文件..." -ForegroundColor Yellow
foreach ($file in $sourceFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "错误: 找不到 $file" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ $file" -ForegroundColor Green
}

# 创建输出目录
Write-Host ""
Write-Host "[2/6] 创建输出目录..." -ForegroundColor Yellow
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "  ✓ 创建 $OutputDir/" -ForegroundColor Green
} else {
    Write-Host "  ✓ $OutputDir/ 已存在" -ForegroundColor Green
}

# 读取所有 JS 文件内容
Write-Host ""
Write-Host "[3/6] 读取 JavaScript 文件..." -ForegroundColor Yellow
$jsContents = @{}
foreach ($file in $sourceFiles) {
    if ($file -ne "demo.html") {
        $jsContents[$file] = Get-Content $file -Raw -Encoding UTF8
        $size = (Get-Item $file).Length
        Write-Host "  ✓ $file ($size bytes)" -ForegroundColor Green
    }
}

# 生成单文件 HTML
Write-Host ""
Write-Host "[4/6] 生成单文件 HTML..." -ForegroundColor Yellow

$htmlContent = Get-Content "demo.html" -Raw -Encoding UTF8

# 替换 script src 为内联 script
foreach ($jsFile in $jsContents.Keys) {
    $scriptTag = "<script src=""$jsFile""></script>"
    $inlineScript = "<script>`n$($jsContents[$jsFile])`n</script>"
    $htmlContent = $htmlContent -replace $scriptTag, $inlineScript
}

# 添加版本信息
$versionComment = "<!-- Matrix Match-3 Demo v$Version | Built: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') -->"
$htmlContent = $htmlContent -replace "</head>", "$versionComment`n</head>"

$outputFile = "$OutputDir/matrix-match3-demo-v$Version.html"
$htmlContent | Out-File -FilePath $outputFile -Encoding UTF8

$fileSize = (Get-Item $outputFile).Length
Write-Host "  ✓ 生成 $outputFile ($fileSize bytes)" -ForegroundColor Green

# 生成校验和
Write-Host ""
Write-Host "[5/6] 生成校验和..." -ForegroundColor Yellow
$hash = Get-FileHash $outputFile -Algorithm SHA256
$hashString = $hash.Hash
$hashFile = "$outputFile.sha256"
"$hashString  matrix-match3-demo-v$Version.html" | Out-File -FilePath $hashFile -Encoding ASCII
Write-Host "  ✓ SHA256: $hashString" -ForegroundColor Green
Write-Host "  ✓ 校验和文件: $hashFile" -ForegroundColor Green

# 复制文档
Write-Host ""
Write-Host "[6/6] 复制文档..." -ForegroundColor Yellow
$docs = @("demo-README.md", "BROWSER_TEST.md", "MOBILE_TEST.md", "ARCHITECTURE.md", "LICENSE")
foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Copy-Item $doc -Destination $OutputDir
        Write-Host "  ✓ $doc" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ $doc (未找到，跳过)" -ForegroundColor Yellow
    }
}

# 生成发布信息
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "打包完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "输出文件:" -ForegroundColor Yellow
Write-Host "  • $outputFile" -ForegroundColor White
Write-Host "  • $hashFile" -ForegroundColor White
Write-Host ""
Write-Host "文件大小:" -ForegroundColor Yellow
Write-Host "  • HTML: $fileSize bytes ($( [math]::Round($fileSize / 1KB, 2) ) KB)" -ForegroundColor White
Write-Host ""
Write-Host "分发方式:" -ForegroundColor Yellow
Write-Host "  1. 将 $outputFile 发送到目标设备" -ForegroundColor White
Write-Host "  2. 用浏览器打开即可运行" -ForegroundColor White
Write-Host "  3. 无需服务器，完全离线可用" -ForegroundColor White
Write-Host ""
Write-Host "验证完整性:" -ForegroundColor Yellow
Write-Host "  Windows: Get-FileHash $outputFile -Algorithm SHA256" -ForegroundColor White
Write-Host "  Linux/Mac: sha256sum $outputFile" -ForegroundColor White
Write-Host ""
