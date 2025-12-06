# Setup CloudFront for Mobile Access - Ecommerce Platform
# This script creates a CloudFront distribution so your app works on mobile devices

$ErrorActionPreference = "Continue"

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  Setting Up Mobile Access - CloudFront HTTPS" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

$bucketName = "ecommerce-platform-frontend-1517"
$region = "us-west-2"
$websiteEndpoint = "$bucketName.s3-website-$region.amazonaws.com"

Write-Host "S3 Bucket: $bucketName" -ForegroundColor White
Write-Host "Website Endpoint: $websiteEndpoint" -ForegroundColor White
Write-Host ""

# Step 1: Ensure bucket policy allows public access
Write-Host "Step 1: Setting bucket policy for public access..." -ForegroundColor Yellow

$policyJson = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$bucketName/*"
    }
  ]
}
"@

$policyJson | Out-File -FilePath "temp-policy.json" -Encoding ascii -NoNewline

try {
    Write-Host "Removing public access block..." -ForegroundColor Yellow
    & aws s3api delete-public-access-block --bucket $bucketName --region $region 2>&1 | Out-Null
    
    Write-Host "Applying bucket policy..." -ForegroundColor Yellow
    & aws s3api put-bucket-policy --bucket $bucketName --policy file://temp-policy.json --region $region 2>&1 | Out-Null
    
    Write-Host "Bucket policy applied successfully" -ForegroundColor Green
} catch {
    Write-Host "Warning: Bucket policy step had issues (may already be set)" -ForegroundColor Yellow
}

Remove-Item "temp-policy.json" -ErrorAction SilentlyContinue
Write-Host ""

# Step 2: Create CloudFront distribution
Write-Host "Step 2: Creating CloudFront distribution..." -ForegroundColor Yellow
Write-Host ""

$callerRef = "ecommerce-mobile-$(Get-Date -Format 'yyyyMMddHHmmss')"

$cloudFrontConfig = @"
{
  "CallerReference": "$callerRef",
  "Comment": "Ecommerce Platform - Mobile Access",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-ecommerce",
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
    "TargetOriginId": "S3-ecommerce",
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

$cloudFrontConfig | Out-File -FilePath "cloudfront-config.json" -Encoding ascii -NoNewline

Write-Host "Creating CloudFront distribution (this may take a moment)..." -ForegroundColor Yellow
Write-Host ""

try {
    $result = & aws cloudfront create-distribution --distribution-config file://cloudfront-config.json 2>&1 | Out-String
    
    # Parse JSON properly
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
        
        # Save info
        @{
            CloudFrontURL = "https://$domainName"
            DistributionId = $distId
            Status = $status
            S3URL = "http://$websiteEndpoint"
            CreatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        } | ConvertTo-Json | Set-Content "mobile-access-info.json"
        
        Write-Host "Info saved to: mobile-access-info.json" -ForegroundColor Green
        
    } catch {
        Write-Host "CloudFront created but could not parse details" -ForegroundColor Yellow
        Write-Host "Raw output:" -ForegroundColor Yellow
        Write-Host $result -ForegroundColor Gray
        Write-Host ""
        Write-Host "Check AWS Console CloudFront section for your distribution" -ForegroundColor Yellow
    }
} catch {
    Write-Host "CloudFront creation failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "==============================================================" -ForegroundColor Yellow
    Write-Host "  MANUAL SETUP REQUIRED" -ForegroundColor Yellow
    Write-Host "==============================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please create CloudFront manually:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Go to: https://console.aws.amazon.com/cloudfront" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Click 'Create Distribution'" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Origin Settings:" -ForegroundColor White
    Write-Host "   - Origin Domain: $websiteEndpoint" -ForegroundColor Yellow
    Write-Host "   - Protocol: HTTP only" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "4. Default Cache Behavior:" -ForegroundColor White
    Write-Host "   - Viewer Protocol Policy: Redirect HTTP to HTTPS" -ForegroundColor Yellow
    Write-Host "   - Allowed HTTP Methods: GET, HEAD" -ForegroundColor Yellow
    Write-Host "   - Compress Objects: Yes" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "5. Settings:" -ForegroundColor White
    Write-Host "   - Default Root Object: index.html" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "6. Custom Error Responses (click Add):" -ForegroundColor White
    Write-Host "   - HTTP Error Code: 403" -ForegroundColor Yellow
    Write-Host "     Response Page Path: /index.html" -ForegroundColor Yellow
    Write-Host "     HTTP Response Code: 200" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   - HTTP Error Code: 404" -ForegroundColor Yellow
    Write-Host "     Response Page Path: /index.html" -ForegroundColor Yellow
    Write-Host "     HTTP Response Code: 200" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "7. Click 'Create Distribution'" -ForegroundColor White
    Write-Host ""
    Write-Host "8. Wait 10-15 minutes for deployment" -ForegroundColor White
    Write-Host ""
}

Remove-Item "cloudfront-config.json" -ErrorAction SilentlyContinue

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""
