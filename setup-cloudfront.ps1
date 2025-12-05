# CloudFront Setup Script for HTTPS Mobile Access
# This script creates a CloudFront distribution for your S3 website

$bucketName = "smart-vehicle-maintenance-frontend-495930420806"
$websiteEndpoint = "$bucketName.s3-website-us-west-2.amazonaws.com"

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  CloudFront Setup for Mobile HTTPS Access" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Current S3 Website URL (HTTP only):" -ForegroundColor Yellow
Write-Host "  http://$websiteEndpoint" -ForegroundColor White
Write-Host ""
Write-Host "Creating CloudFront distribution for HTTPS..." -ForegroundColor Yellow
Write-Host ""

# Create CloudFront distribution
$distributionConfig = @{
    CallerReference = "smart-vehicle-frontend-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Comment = "CloudFront distribution for Smart Vehicle Maintenance frontend"
    DefaultRootObject = "index.html"
    Origins = @{
        Quantity = 1
        Items = @(
            @{
                Id = "S3-smart-vehicle-maintenance-frontend"
                DomainName = $websiteEndpoint
                CustomOriginConfig = @{
                    HTTPPort = 80
                    HTTPSPort = 443
                    OriginProtocolPolicy = "http-only"
                    OriginSslProtocols = @{
                        Quantity = 1
                        Items = @("TLSv1.2")
                    }
                }
            }
        )
    }
    DefaultCacheBehavior = @{
        TargetOriginId = "S3-smart-vehicle-maintenance-frontend"
        ViewerProtocolPolicy = "redirect-to-https"
        AllowedMethods = @{
            Quantity = 7
            Items = @("DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT")
            CachedMethods = @{
                Quantity = 2
                Items = @("GET", "HEAD")
            }
        }
        Compress = $true
        ForwardedValues = @{
            QueryString = $false
            Cookies = @{
                Forward = "none"
            }
        }
        MinTTL = 0
        DefaultTTL = 86400
        MaxTTL = 31536000
    }
    CustomErrorResponses = @{
        Quantity = 2
        Items = @(
            @{
                ErrorCode = 404
                ResponsePagePath = "/index.html"
                ResponseCode = "200"
                ErrorCachingMinTTL = 300
            }
            @{
                ErrorCode = 403
                ResponsePagePath = "/index.html"
                ResponseCode = "200"
                ErrorCachingMinTTL = 300
            }
        )
    }
    Enabled = $true
    PriceClass = "PriceClass_100"
}

$configJson = $distributionConfig | ConvertTo-Json -Depth 10
$configJson | Out-File -FilePath "cloudfront-temp-config.json" -Encoding UTF8

Write-Host "Attempting to create CloudFront distribution..." -ForegroundColor Yellow
$result = aws cloudfront create-distribution --distribution-config file://cloudfront-temp-config.json 2>&1

if ($LASTEXITCODE -eq 0) {
    $distribution = $result | ConvertFrom-Json | Select-Object -ExpandProperty Distribution
    
    Write-Host ""
    Write-Host "==============================================================" -ForegroundColor Green
    Write-Host "  CloudFront Distribution Created Successfully!" -ForegroundColor Green
    Write-Host "==============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Distribution ID: $($distribution.Id)" -ForegroundColor White
    Write-Host "Status: $($distribution.Status)" -ForegroundColor White
    Write-Host ""
    Write-Host "Your HTTPS URL (works on mobile):" -ForegroundColor Cyan
    Write-Host "  https://$($distribution.DomainName)" -ForegroundColor Yellow -BackgroundColor DarkBlue
    Write-Host ""
    Write-Host "NOTE: CloudFront takes 10-15 minutes to deploy." -ForegroundColor Yellow
    Write-Host "      The URL will work once Status changes to 'Deployed'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check status with:" -ForegroundColor Gray
    Write-Host "  aws cloudfront get-distribution --id $($distribution.Id) --query 'Distribution.Status'" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "==============================================================" -ForegroundColor Red
    Write-Host "  Error Creating CloudFront Distribution" -ForegroundColor Red
    Write-Host "==============================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error output:" -ForegroundColor Yellow
    Write-Host $result -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Set up CloudFront via AWS Console:" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://console.aws.amazon.com/cloudfront" -ForegroundColor White
    Write-Host "  2. Click 'Create Distribution'" -ForegroundColor White
    Write-Host "  3. Origin Domain: $websiteEndpoint" -ForegroundColor White
    Write-Host "  4. Origin Type: Custom Origin" -ForegroundColor White
    Write-Host "  5. Viewer Protocol Policy: Redirect HTTP to HTTPS" -ForegroundColor White
    Write-Host "  6. Default Root Object: index.html" -ForegroundColor White
    Write-Host "  7. Custom Error Response: 404 -> /index.html (200)" -ForegroundColor White
    Write-Host "  8. Create Distribution" -ForegroundColor White
}

Remove-Item -Path "cloudfront-temp-config.json" -ErrorAction SilentlyContinue

