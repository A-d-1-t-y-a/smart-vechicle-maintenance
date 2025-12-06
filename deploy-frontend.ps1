# Deploy Retail Supermarket Frontend to S3
# Prerequisites: Backend must be deployed first (run deploy-backend.ps1)

$ErrorActionPreference = "Continue"

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  Deploying Retail Supermarket Frontend" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend outputs exist
if (-not (Test-Path "backend-outputs.json")) {
    Write-Host "ERROR: backend-outputs.json not found!" -ForegroundColor Red
    Write-Host "Please deploy backend first: .\deploy-backend.ps1" -ForegroundColor Yellow
    exit 1
}

# Load backend outputs
$backendOutputs = Get-Content "backend-outputs.json" | ConvertFrom-Json
$apiUrl = $backendOutputs.ApiUrl
$userPoolId = $backendOutputs.UserPoolId
$userPoolClientId = $backendOutputs.UserPoolClientId
$region = $backendOutputs.Region

Write-Host "Backend Configuration:" -ForegroundColor White
Write-Host "  API URL: $apiUrl" -ForegroundColor Gray
Write-Host "  User Pool ID: $userPoolId" -ForegroundColor Gray
Write-Host "  Region: $region" -ForegroundColor Gray
Write-Host ""

# Generate bucket name
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$bucketName = "retail-supermarket-frontend-$timestamp"

Write-Host "Step 1: Creating .env file..." -ForegroundColor Yellow
Push-Location "frontend-supermarket"

$envContent = @"
REACT_APP_API_URL=$apiUrl
REACT_APP_COGNITO_USER_POOL_ID=$userPoolId
REACT_APP_COGNITO_CLIENT_ID=$userPoolClientId
REACT_APP_REGION=$region
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -Force
Write-Host "✓ .env file created" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    & npm install 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Building React app..." -ForegroundColor Yellow
& npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✓ Build successful" -ForegroundColor Green

Pop-Location

Write-Host ""
Write-Host "Step 4: Creating S3 bucket..." -ForegroundColor Yellow
try {
    & aws s3 mb "s3://$bucketName" --region $region 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Bucket creation failed"
    }
    Write-Host "✓ Bucket created: $bucketName" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create bucket: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 5: Configuring S3 for static website hosting..." -ForegroundColor Yellow
try {
    & aws s3 website "s3://$bucketName" --index-document index.html --error-document index.html --region $region 2>&1 | Out-Null
    Write-Host "✓ Website hosting configured" -ForegroundColor Green
} catch {
    Write-Host "⚠ Website hosting configuration had issues" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 6: Removing public access block..." -ForegroundColor Yellow
try {
    & aws s3api delete-public-access-block --bucket $bucketName --region $region 2>&1 | Out-Null
    Write-Host "✓ Public access block removed" -ForegroundColor Green
} catch {
    Write-Host "⚠ Public access block removal had issues" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 7: Setting bucket policy..." -ForegroundColor Yellow
$policyJson = '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::' + $bucketName + '/*"
    }
  ]
}'

$policyJson | Out-File -FilePath "temp-policy.json" -Encoding ascii -NoNewline

try {
    & aws s3api put-bucket-policy --bucket $bucketName --policy file://temp-policy.json --region $region 2>&1 | Out-Null
    Write-Host "✓ Bucket policy applied" -ForegroundColor Green
} catch {
    Write-Host "⚠ Bucket policy application had issues" -ForegroundColor Yellow
}

Remove-Item "temp-policy.json" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Step 8: Uploading build files..." -ForegroundColor Yellow
try {
    & aws s3 sync "frontend-supermarket/build/" "s3://$bucketName" --delete --region $region 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Upload failed"
    }
    Write-Host "✓ Files uploaded" -ForegroundColor Green
} catch {
    Write-Host "✗ Upload failed: $_" -ForegroundColor Red
    exit 1
}

$websiteUrl = "http://$bucketName.s3-website-$region.amazonaws.com"

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Green
Write-Host "  FRONTEND DEPLOYED!" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "S3 Bucket: $bucketName" -ForegroundColor White
Write-Host "Website URL: $websiteUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "NOTE: This URL is HTTP-only and may not work on mobile." -ForegroundColor Yellow
Write-Host "Run .\setup-cloudfront.ps1 to enable HTTPS access." -ForegroundColor Yellow
Write-Host ""

# Save deployment info
@{
    BucketName = $bucketName
    WebsiteUrl = $websiteUrl
    Region = $region
    DeployedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
} | ConvertTo-Json | Set-Content "frontend-deployment.json"

Write-Host "Deployment info saved to: frontend-deployment.json" -ForegroundColor Green
Write-Host ""
