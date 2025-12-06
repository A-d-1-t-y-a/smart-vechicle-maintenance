# Setup CloudFront for Retail Supermarket Frontend
# This enables HTTPS access for mobile and public access

$ErrorActionPreference = "Continue"

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  Setting Up CloudFront for HTTPS Access" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if frontend deployment info exists
if (-not (Test-Path "frontend-deployment.json")) {
    Write-Host "ERROR: frontend-deployment.json not found!" -ForegroundColor Red
    Write-Host "Please deploy frontend first: .\deploy-frontend.ps1" -ForegroundColor Yellow
    exit 1
}

# Load deployment info
$deploymentInfo = Get-Content "frontend-deployment.json" | ConvertFrom-Json
$bucketName = $deploymentInfo.BucketName
$region = $deploymentInfo.Region
$websiteEndpoint = "$bucketName.s3-website-$region.amazonaws.com"

Write-Host "S3 Bucket: $bucketName" -ForegroundColor White
Write-Host "Website Endpoint: $websiteEndpoint" -ForegroundColor White
Write-Host ""

Write-Host "Step 1: Ensuring bucket policy is set..." -ForegroundColor Yellow
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
    & aws s3api delete-public-access-block --bucket $bucketName --region $region 2>&1 | Out-Null
    & aws s3api put-bucket-policy --bucket $bucketName --policy file://temp-policy.json --region $region 2>&1 | Out-Null
    Write-Host "✓ Bucket policy configured" -ForegroundColor Green
} catch {
    Write-Host "⚠ Bucket policy step had issues" -ForegroundColor Yellow
}

Remove-Item "temp-policy.json" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Step 2: Creating CloudFront distribution..." -ForegroundColor Yellow
$callerRef = "retail-supermarket-$(Get-Date -Format 'yyyyMMddHHmmss')"

# Build JSON config using string concatenation to avoid parsing issues
$cloudFrontConfig = '{
  "CallerReference": "' + $callerRef + '",
  "Comment": "Retail Supermarket - HTTPS Access",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-retail-supermarket",
        "DomainName": "' + $websiteEndpoint + '",
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
    "TargetOriginId": "S3-retail-supermarket",
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
}'

$cloudFrontConfig | Out-File -FilePath "cloudfront-config.json" -Encoding ascii -NoNewline

Write-Host "Creating CloudFront distribution (this may take a moment)..." -ForegroundColor Yellow
Write-Host ""

try {
    $result = & aws cloudfront create-distribution --distribution-config file://cloudfront-config.json 2>&1 | Out-String
    
    try {
        $jsonResult = $result | ConvertFrom-Json
        $distId = $jsonResult.Distribution.Id
        $domainName = $jsonResult.Distribution.DomainName
        $status = $jsonResult.Distribution.Status
        
        Write-Host "==============================================================" -ForegroundColor Green
        Write-Host "  CLOUDFRONT CREATED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "==============================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Distribution ID: $distId" -ForegroundColor White
        Write-Host "Status: $status" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Your HTTPS URL (works on mobile):" -ForegroundColor Cyan
        Write-Host "  https://$domainName" -ForegroundColor Green -BackgroundColor Black
        Write-Host ""
        Write-Host "IMPORTANT: Distribution is deploying..." -ForegroundColor Yellow
        Write-Host "  - This takes 10-15 minutes" -ForegroundColor Yellow
        Write-Host "  - The URL won't work until status is 'Deployed'" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Check status with:" -ForegroundColor Cyan
        Write-Host "  aws cloudfront get-distribution --id $distId --query 'Distribution.Status'" -ForegroundColor White
        Write-Host ""
        
        # Update deployment info
        $deploymentInfo | Add-Member -NotePropertyName "CloudFrontURL" -NotePropertyValue "https://$domainName" -Force
        $deploymentInfo | Add-Member -NotePropertyName "DistributionId" -NotePropertyValue $distId -Force
        $deploymentInfo | Add-Member -NotePropertyName "Status" -NotePropertyValue $status -Force
        $deploymentInfo | ConvertTo-Json | Set-Content "frontend-deployment.json"
        
        Write-Host "Deployment info updated in: frontend-deployment.json" -ForegroundColor Green
        
    } catch {
        Write-Host "CloudFront created but could not parse details" -ForegroundColor Yellow
        Write-Host "Check AWS Console CloudFront section" -ForegroundColor Yellow
    }
} catch {
    Write-Host "CloudFront creation failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create CloudFront manually in AWS Console" -ForegroundColor Yellow
}

Remove-Item "cloudfront-config.json" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""
