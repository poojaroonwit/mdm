param (
    [string]$Message = "Update from script"
)

$ErrorActionPreference = "Continue"

# Add Git to Path if likely missing
$GitPath = "C:\Program Files\Git\cmd"
if (Test-Path $GitPath) {
    if ($env:Path -notlike "*$GitPath*") {
        $env:Path = "$GitPath;" + $env:Path
        Write-Host "Added Git to Path temporarily." -ForegroundColor Green
    }
}


Write-Host "--- Git Operations ---" -ForegroundColor Cyan
Write-Host "Adding files..."
git add --all

Write-Host "Committing with message: '$Message'..."
git commit -m "$Message"

# Configure remotes (try to add, ignore if exists)
Write-Host "Configuring remotes..."
git remote add gitlab https://nccgit.qsncc.com/ba/unified-data-platform.git 2>$null
git remote add github https://github.com/24ep/mdm.git 2>$null

Write-Host "Pushing to GitLab..." -ForegroundColor Yellow
git push gitlab main
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Main failed, trying master..."
    git push gitlab master 
}

Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push github main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Main failed, trying master..."
    git push github master 
}

Write-Host "--- Docker Operations ---" -ForegroundColor Cyan
Write-Host "Building Docker Image..." -ForegroundColor Yellow
docker build --provenance=false -t nccgit.qsncc.com:5555/ba/unified-data-platform:1.0.3 -t nccgit.qsncc.com:5555/ba/unified-data-platform:latest .
Write-Host "Building Plugin Hub..." -ForegroundColor Yellow
docker build --provenance=false -t nccgit.qsncc.com:5555/ba/unified-data-platform/plugin-hub:1.0.3 -t nccgit.qsncc.com:5555/ba/unified-data-platform/plugin-hub:latest ./plugin-hub

if ($?) {
    Write-Host "Pushing Docker Images..." -ForegroundColor Yellow
    docker push nccgit.qsncc.com:5555/ba/unified-data-platform:1.0.3
    docker push nccgit.qsncc.com:5555/ba/unified-data-platform:latest
    
    docker push nccgit.qsncc.com:5555/ba/unified-data-platform/plugin-hub:1.0.3
    docker push nccgit.qsncc.com:5555/ba/unified-data-platform/plugin-hub:latest
}
else {
    Write-Error "Docker build failed. Skipping push."
}
