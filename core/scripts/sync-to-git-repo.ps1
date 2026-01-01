# PowerShell script to sync changes from workspace to git repo
# Usage: .\sync-to-git-repo.ps1 [file-or-directory-path]

param(
    [string]$Path = ""
)

$WorkspaceRoot = "C:\Users\mariu\Documents\ASHERA CATALYST\catalyst"
$GitRepoRoot = "C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst"

# If no path specified, sync everything
if ([string]::IsNullOrEmpty($Path)) {
    Write-Host "🔄 Syncing all changes from workspace to git repo..." -ForegroundColor Cyan
    Write-Host "   From: $WorkspaceRoot" -ForegroundColor Gray
    Write-Host "   To:   $GitRepoRoot" -ForegroundColor Gray
    
    # Use robocopy to sync (mirror mode, but be careful!)
    # This will copy all files, but won't delete files in destination
    robocopy $WorkspaceRoot $GitRepoRoot /E /XD node_modules .next .vercel .git /XF pnpm-lock.yaml /NP /NFL /NDL
    
    Write-Host "✅ Sync complete!" -ForegroundColor Green
} else {
    # Sync specific file or directory
    $SourcePath = Join-Path $WorkspaceRoot $Path
    $DestPath = Join-Path $GitRepoRoot $Path
    
    if (Test-Path $SourcePath) {
        Write-Host "🔄 Syncing: $Path" -ForegroundColor Cyan
        
        $DestDir = Split-Path $DestPath -Parent
        if (-not (Test-Path $DestDir)) {
            New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
        }
        
        Copy-Item -Path $SourcePath -Destination $DestPath -Recurse -Force
        Write-Host "✅ Synced: $Path" -ForegroundColor Green
    } else {
        Write-Host "❌ Source path not found: $SourcePath" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Yellow
Write-Host "   cd `"$GitRepoRoot`"" -ForegroundColor Gray
Write-Host "   git status" -ForegroundColor Gray
Write-Host "   git add -A" -ForegroundColor Gray
Write-Host "   git commit -m `"your message`"" -ForegroundColor Gray
Write-Host "   git push origin testing-rebase" -ForegroundColor Gray
