# Deploy Ecommerce Frontend to S3 and CloudFront
# Based on the original platform deployment approach

param(
    [string]$BucketName = ""
)

$ErrorActionPreference = "Stop"

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  Deploying Ecommerce Frontend to AWS" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

$region = "us-west-2"
$projectName = "ecommerce-platform"

# Step 1: Build React App
Write-Host "Step 1: Building React application..." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path "frontend-ecommerce")) {
    Write-Host "ERROR: frontend-ecommerce directory not found!" -ForegroundColor Red
    exit 1
}

Push-Location "frontend-ecommerce"

# Create .env file
$envContent = @"

"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -Force
Write-Host "Created .env file" -ForegroundColor Green

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}

# Build
Write-Host "Building production bundle..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0 -or -not (Test-Path "build")) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "Build completed successfully!" -ForegroundColor Green
Pop-Location

# Step 2: Create S3 Bucket
Write-Host ""
Write-Host "Step 2: Setting up S3 bucket..." -ForegroundColor Yellow
Write-Host ""

if ([string]::IsNullOrEmpty($BucketName)) {
    $BucketName = "$projectName-frontend-$(Get-Random -Minimum 1000 -Maximum 9999)"
    Write-Host "Using bucket name: $BucketName" -ForegroundColor White
}

# Check if bucket exists
Write-Host "Checking if bucket exists..." -ForegroundColor Yellow
try {
    $null = & aws s3 ls "s3://$BucketName" 2>&1
    $bucketExists = $LASTEXITCODE -eq 0
} catch {
    $bucketExists = $false
}

if (-not $bucketExists) {
    Write-Host "Creating S3 bucket: $BucketName" -ForegroundColor Yellow
    try {
        $null = & aws s3 mb "s3://$BucketName" --region $region 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Failed to create S3 bucket" -ForegroundColor Red
            Write-Host "Please check AWS credentials and permissions" -ForegroundColor Red
            exit 1
        }
        Write-Host "S3 bucket created: $BucketName" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to create S3 bucket" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "S3 bucket already exists: $BucketName" -ForegroundColor Green
}

# Configure bucket for static website hosting
Write-Host "Configuring bucket for static website hosting..." -ForegroundColor Yellow
try {
    $null = & aws s3 website "s3://$BucketName" --index-document index.html --error-document index.html --region $region 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Static website hosting configured" -ForegroundColor Green
    } else {
        Write-Host "Warning: Website hosting configuration had issues (may already be configured)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Warning: Website hosting configuration had issues (may already be configured)" -ForegroundColor Yellow
}

# Set bucket policy for public read access
Write-Host "Setting bucket policy for public access..." -ForegroundColor Yellow
$bucketPolicyJson = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BucketName/*"
    }
  ]
}
"@

$bucketPolicyJson | Out-File -FilePath "bucket-policy-temp.json" -Encoding UTF8 -NoNewline

# Use file-based policy to avoid PowerShell string issues
$policyPath = (Resolve-Path "bucket-policy-temp.json").Path
$policyPath = $policyPath -replace '\\', '/'

try {
    $policyResult = & aws s3api put-bucket-policy --bucket $BucketName --policy "file://$policyPath" --region $region 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Bucket policy set successfully" -ForegroundColor Green
    } else {
        Write-Host "Warning: Bucket policy setting had issues (may already be set)" -ForegroundColor Yellow
        if ($policyResult) {
            Write-Host "  Details: $policyResult" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "Warning: Bucket policy setting had issues (may already be set)" -ForegroundColor Yellow
    Write-Host "  Error: $_" -ForegroundColor Gray
    Write-Host "  You can set bucket policy manually in AWS Console if needed" -ForegroundColor Yellow
}

Remove-Item "bucket-policy-temp.json" -ErrorAction SilentlyContinue

Write-Host "Bucket configuration complete" -ForegroundColor Green

# Step 3: Upload files to S3
Write-Host ""
Write-Host "Step 3: Uploading files to S3..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Uploading files..." -ForegroundColor Yellow
try {
    & aws s3 sync "frontend-ecommerce\build" "s3://$BucketName" --delete --region $region 2>&1 | Out-Host
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to upload files" -ForegroundColor Red
        Write-Host "Please check AWS credentials and permissions" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Files uploaded successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to upload files" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Create CloudFront Distribution
Write-Host ""
Write-Host "Step 4: Creating CloudFront distribution..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

$websiteEndpoint = "$BucketName.s3-website-$region.amazonaws.com"
$callerRef = "ecommerce-frontend-$(Get-Date -Format 'yyyyMMddHHmmss')"

# Create CloudFront config as JSON string directly
$distributionConfigJson = @"
{
  "CallerReference": "$callerRef",
  "Comment": "Ecommerce Platform Frontend Distribution",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$BucketName",
        "DomainName": "$websiteEndpoint",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only",
          "OriginSslProtocols": {
            "Quantity": 1,
            "Items": ["TLSv1.2"]
          }
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$BucketName",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      },
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Enabled": true,
  "PriceClass": "PriceClass_100"
}
"@

$distributionConfigJson | Out-File -FilePath "cloudfront-temp-config.json" -Encoding UTF8 -NoNewline

Write-Host "Creating CloudFront distribution..." -ForegroundColor Yellow
try {
    $result = & aws cloudfront create-distribution --distribution-config file://cloudfront-temp-config.json 2>&1
    $cloudfrontExitCode = $LASTEXITCODE
} catch {
    $result = $_.Exception.Message
    $cloudfrontExitCode = 1
}
Remove-Item "cloudfront-temp-config.json" -ErrorAction SilentlyContinue

$distId = $null
$domainName = $null
$status = $null

if ($cloudfrontExitCode -eq 0 -and $result) {
    try {
        $distribution = $result | ConvertFrom-Json | Select-Object -ExpandProperty Distribution
        if ($distribution) {
            $distId = $distribution.Id
            $domainName = $distribution.DomainName
            $status = $distribution.Status
        }
    } catch {
        Write-Host "Warning: Could not parse CloudFront response" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "S3 Bucket: $BucketName" -ForegroundColor White

if ($distId) {
    Write-Host "CloudFront Distribution ID: $distId" -ForegroundColor White
    if ($status) {
        Write-Host "Distribution Status: $status" -ForegroundColor White
    }
    Write-Host ""
    if ($domainName) {
        Write-Host "Your app will be available at:" -ForegroundColor Cyan
        Write-Host "  https://$domainName" -ForegroundColor Yellow -BackgroundColor Black
        Write-Host ""
    }
    if ($status -eq "InProgress") {
        Write-Host "NOTE: CloudFront is deploying (takes 10-15 minutes)" -ForegroundColor Yellow
        Write-Host "      Check status: aws cloudfront get-distribution --id $distId" -ForegroundColor White
        Write-Host ""
    }
} else {
    Write-Host "CloudFront: Not created" -ForegroundColor Yellow
    Write-Host ""
    if ($result) {
        Write-Host "CloudFront Error:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        Write-Host ""
    }
    Write-Host "You can create CloudFront manually in AWS Console" -ForegroundColor Yellow
    Write-Host "or your app is still accessible via S3 (HTTP only)" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "S3 Website URL (direct access - HTTP only):" -ForegroundColor Cyan
Write-Host "  http://$websiteEndpoint" -ForegroundColor Yellow
Write-Host ""

# Save deployment info
$deploymentInfo = @{
    BucketName = $BucketName
    DistributionId = if ($distId) { $distId } else { $null }
    DomainName = if ($domainName) { $domainName } else { $null }
    S3WebsiteUrl = "http://$websiteEndpoint"
    Region = $region
    DeployedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
} | ConvertTo-Json

$deploymentInfo | Out-File -FilePath "deployment-info.json" -Encoding UTF8
Write-Host "Deployment info saved to deployment-info.json" -ForegroundColor Green

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""
