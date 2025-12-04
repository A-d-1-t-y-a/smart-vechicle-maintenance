# Simple S3 Deployment Script
# This is the EASIEST way to host your React app on AWS

Write-Host "Simple S3 Frontend Deployment" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host ""

# Step 1: Build
Write-Host "Step 1: Building React app..." -ForegroundColor Yellow
Set-Location frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
}

Write-Host "Building..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Step 2: Get bucket name
Write-Host ""
Write-Host "Step 2: Getting S3 bucket name..." -ForegroundColor Yellow
$bucketName = aws cloudformation describe-stacks --stack-name sam-app --region us-west-2 --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text 2>&1

if (-not $bucketName -or $bucketName -match "error") {
    Write-Host "ERROR: Could not get bucket name from CloudFormation" -ForegroundColor Red
    Write-Host "Make sure backend is deployed: sam deploy" -ForegroundColor Yellow
    exit 1
}

Write-Host "Bucket: $bucketName" -ForegroundColor Green

# Step 3: Upload to S3
Write-Host ""
Write-Host "Step 3: Uploading to S3..." -ForegroundColor Yellow
Write-Host "This may take a minute..." -ForegroundColor Cyan

# Upload all files
aws s3 sync frontend\build\ s3://$bucketName --delete --region us-west-2

# Set proper content types and cache headers
Write-Host "Setting cache headers..." -ForegroundColor Cyan

# HTML files - no cache
aws s3 cp frontend\build\index.html s3://$bucketName/index.html --cache-control "no-cache, no-store, must-revalidate" --content-type "text/html" --region us-west-2

# Static assets - long cache
if (Test-Path "frontend\build\static") {
    aws s3 sync frontend\build\static\ s3://$bucketName/static/ --cache-control "public, max-age=31536000, immutable" --region us-west-2 --delete
}

# Enable website hosting
Write-Host "Configuring S3 website hosting..." -ForegroundColor Cyan
aws s3 website s3://$bucketName --index-document index.html --error-document index.html --region us-west-2

# Get website URL
$websiteUrl = aws s3api get-bucket-website --bucket $bucketName --region us-west-2 --query "WebsiteConfiguration.RedirectAllRequestsTo" --output text 2>&1
if ($websiteUrl -match "error") {
    $websiteUrl = "http://$bucketName.s3-website-us-west-2.amazonaws.com"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your frontend is now live at:" -ForegroundColor Cyan
Write-Host "  http://$bucketName.s3-website-us-west-2.amazonaws.com" -ForegroundColor White
Write-Host ""
Write-Host "Or get the URL from CloudFormation:" -ForegroundColor Yellow
Write-Host "  aws cloudformation describe-stacks --stack-name sam-app --region us-west-2 --query \"Stacks[0].Outputs[?OutputKey=='FrontendWebsiteURL'].OutputValue\" --output text" -ForegroundColor White
Write-Host ""
Write-Host "Note: S3 website URLs use HTTP (not HTTPS)." -ForegroundColor Yellow
Write-Host "For HTTPS, you can add CloudFront (optional)." -ForegroundColor Yellow

