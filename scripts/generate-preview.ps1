$ErrorActionPreference = 'Stop'
$src = 'https://kz8py.github.io/KryZiestWeddingEver/public/images/hero/save-the-date-thumb.jpg'
$dest = Join-Path $PSScriptRoot '..\public\images\hero\save-the-date-preview-1200x630.jpg'
$dir = Split-Path $dest -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$wc = New-Object System.Net.WebClient
$bytes = $wc.DownloadData($src)
$ms = New-Object System.IO.MemoryStream(, $bytes)
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromStream($ms)
$bmp = New-Object System.Drawing.Bitmap 1200, 630
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::Black)
$srcW = $img.Width; $srcH = $img.Height
$srcRatio = $srcW / $srcH; $tgtRatio = 1200 / 630
if ($srcRatio -gt $tgtRatio) {
    $drawH = 630
    $drawW = [int]($srcW * (630 / $srcH))
    $offsetX = [int]( (1200 - $drawW) / 2 )
    $offsetY = 0
}
else {
    $drawW = 1200
    $drawH = [int]($srcH * (1200 / $srcW))
    $offsetX = 0
    $offsetY = [int]( (630 - $drawH) / 2 )
}
$g.DrawImage($img, $offsetX, $offsetY, $drawW, $drawH)
$bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$g.Dispose(); $bmp.Dispose(); $img.Dispose(); $ms.Dispose(); $wc.Dispose()
Write-Output "WROTE:$dest"
