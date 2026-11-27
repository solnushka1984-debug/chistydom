# ASCII only: Windows PowerShell 5.1 reads BOM-less files as ANSI.
# All cyrillic strings come from tmp-og-text.json, decoded as UTF-8 explicitly.
Add-Type -AssemblyName System.Drawing

$root   = Split-Path -Parent $PSScriptRoot
$json   = Join-Path $PSScriptRoot 'og-image-text.json'
$out    = Join-Path $root 'artifacts\chistydom\public\og.png'

$bytes  = [System.IO.File]::ReadAllBytes($json)
$text   = ([System.Text.Encoding]::UTF8.GetString($bytes) | ConvertFrom-Json)

function New-RoundedRect($x, $y, $w, $h, $r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90) | Out-Null
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90) | Out-Null
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90) | Out-Null
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90) | Out-Null
  $path.CloseFigure()
  return $path
}

function C($r, $g2, $b) { return [System.Drawing.Color]::FromArgb(255, $r, $g2, $b) }

$W = 1200; $H = 630
$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$cream  = C 242 247 244
$green  = C 83 134 110
$greenS = C 232 241 233
$ink    = C 32 56 73
$soft   = C 83 107 120
$muted  = C 122 141 143
$white  = C 255 255 255
$line   = C 223 233 228

$g.Clear($cream)

# decorative shapes
$bGreenS = New-Object System.Drawing.SolidBrush $greenS
$g.FillEllipse($bGreenS, 900, -170, 470, 470)
$bGreen20 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(46, 83, 134, 110))
$g.FillEllipse($bGreen20, 1035, 120, 150, 150)
$bLine = New-Object System.Drawing.Pen $green, 5
$g.DrawEllipse($bLine, 1075, 160, 70, 70)

# brand mark
$markRect = New-RoundedRect 92 66 78 78 24
$bMark = New-Object System.Drawing.SolidBrush $green
$g.FillPath($bMark, $markRect)
$fMark = New-Object System.Drawing.Font('Segoe UI', 31, [System.Drawing.FontStyle]::Bold)
$sfC = New-Object System.Drawing.StringFormat
$sfC.Alignment = 'Center'; $sfC.LineAlignment = 'Center'
$markBox = New-Object System.Drawing.RectangleF 92, 66, 78, 80
$g.DrawString($text.mark, $fMark, (New-Object System.Drawing.SolidBrush $white), $markBox, $sfC)

# brand wordmark
$fBrand = New-Object System.Drawing.Font('Segoe UI', 46, [System.Drawing.FontStyle]::Bold)
$ptBrand = New-Object System.Drawing.PointF 190, 78
$g.DrawString($text.brand, $fBrand, (New-Object System.Drawing.SolidBrush $ink), $ptBrand)
$w1 = $g.MeasureString($text.brand, $fBrand).Width
$g.DrawString($text.brandAccent, $fBrand, (New-Object System.Drawing.SolidBrush $green), (New-Object System.Drawing.PointF (190 + $w1), 78))

$fTag = New-Object System.Drawing.Font('Segoe UI Semibold', 15, [System.Drawing.FontStyle]::Regular)
$g.DrawString($text.brandTag, $fTag, (New-Object System.Drawing.SolidBrush $muted), (New-Object System.Drawing.PointF 192, 141))

# thin rule
$pen = New-Object System.Drawing.Pen (C 210 224 217), 2
$g.DrawLine($pen, 92, 196, 1010, 196)

# headline
$fH1 = New-Object System.Drawing.Font('Segoe UI', 74, [System.Drawing.FontStyle]::Bold)
$g.DrawString($text.headline1, $fH1, (New-Object System.Drawing.SolidBrush $ink), (New-Object System.Drawing.PointF 90, 214))
$g.DrawString($text.headline2, $fH1, (New-Object System.Drawing.SolidBrush $green), (New-Object System.Drawing.PointF 90, 304))

# subtitle (must stay on one line)
$fSub = New-Object System.Drawing.Font('Segoe UI', 24, [System.Drawing.FontStyle]::Regular)
$wSub = $g.MeasureString($text.sub, $fSub).Width
if ($wSub -gt 1010) { throw "sub too wide: $wSub" }
$g.DrawString($text.sub, $fSub, (New-Object System.Drawing.SolidBrush $soft), (New-Object System.Drawing.PointF 92, 406))

# bottom badge card
$badgeRect = New-RoundedRect 92 466 1016 92 20
$g.FillPath((New-Object System.Drawing.SolidBrush $white), $badgeRect)
$g.DrawPath((New-Object System.Drawing.Pen $line, 2), $badgeRect)
$fBadge = New-Object System.Drawing.Font('Segoe UI Semibold', 24, [System.Drawing.FontStyle]::Regular)
$wBadge = $g.MeasureString($text.badge, $fBadge).Width
if ($wBadge -gt 940) { throw "badge too wide: $wBadge" }
$badgeBox = New-Object System.Drawing.RectangleF 130, 466, 940, 94
$sfLeft = New-Object System.Drawing.StringFormat
$sfLeft.Alignment = 'Center'; $sfLeft.LineAlignment = 'Center'
$g.DrawString($text.badge, $fBadge, (New-Object System.Drawing.SolidBrush $ink), $badgeBox, $sfLeft)

"WIDTHS: sub={0:N0} badge={1:N0} (limits 1010/940)" -f $wSub, $wBadge

if (Test-Path $out) { Remove-Item $out -Force }
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()

"SAVED: $out"
"SIZE:  $((Get-Item $out).Length) bytes"
