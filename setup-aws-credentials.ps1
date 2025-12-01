# Setup AWS Credentials Script for PowerShell (Windows)
# This script configures AWS credentials for the project using environment variables

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "    Smart Vehicle Maintenance - AWS Credentials Setup" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if credentials are already set in environment
$existingAccessKey = $env:AWS_ACCESS_KEY_ID
$existingSecretKey = $env:AWS_SECRET_ACCESS_KEY
$existingRegion = $env:AWS_DEFAULT_REGION

if ($existingAccessKey -and $existingSecretKey) {
    Write-Host "WARNING: AWS credentials already set in environment" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Do you want to use existing credentials? (Y/N)"
    
    if ($response -eq "Y" -or $response -eq "y" -or $response -eq "") {
        Write-Host ""
        Write-Host "Using existing credentials..." -ForegroundColor Green
    } else {
        # Clear existing credentials
        $env:AWS_ACCESS_KEY_ID = ""
        $env:AWS_SECRET_ACCESS_KEY = ""
        $env:AWS_SESSION_TOKEN = ""
        Write-Host "Cleared existing credentials" -ForegroundColor Yellow
        $existingAccessKey = ""
        $existingSecretKey = ""
    }
}

# If no credentials set, prompt for them
if (-not $existingAccessKey -or -not $existingSecretKey) {
    Write-Host ""
    Write-Host "Please enter your AWS credentials" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "IMPORTANT: You need AWS ACCESS KEYS, not Account ID!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "What you need:" -ForegroundColor Cyan
    Write-Host "  - Access Key ID: 20 characters, starts with AKIA" -ForegroundColor White
    Write-Host "    Example: AKIAIOSFODNN7EXAMPLE" -ForegroundColor Gray
    Write-Host "  - Secret Access Key: 40 characters" -ForegroundColor White
    Write-Host "    Example: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Don't have Access Keys? See: HOW_TO_GET_AWS_KEYS.md" -ForegroundColor Yellow
    Write-Host ""
    
    # Prompt for Access Key ID
    $accessKey = Read-Host "AWS Access Key ID (starts with AKIA)"
    if (-not $accessKey) {
        Write-Host "ERROR: Access Key ID is required" -ForegroundColor Red
        exit 1
    }
    
    # Validate Access Key ID format
    if ($accessKey.Length -ne 20 -or -not $accessKey.StartsWith("AKIA")) {
        Write-Host ""
        Write-Host "WARNING: This doesn't look like a valid Access Key ID" -ForegroundColor Yellow
        Write-Host "Access Key IDs are 20 characters and start with AKIA" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "You entered: $accessKey" -ForegroundColor White
        Write-Host ""
        if ($accessKey.Length -eq 12 -and $accessKey -match '^\d+$') {
            Write-Host "This looks like an AWS Account ID (12 digits)" -ForegroundColor Red
            Write-Host "You need Access Keys, not Account ID!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Please read: HOW_TO_GET_AWS_KEYS.md for instructions" -ForegroundColor Yellow
            exit 1
        }
        $response = Read-Host "Continue anyway? (Y/N)"
        if ($response -ne "Y" -and $response -ne "y") {
            Write-Host "Setup cancelled. Please get your Access Keys and try again." -ForegroundColor Yellow
            exit 1
        }
    }
    
    $env:AWS_ACCESS_KEY_ID = $accessKey
    
    # Prompt for Secret Access Key
    Write-Host ""
    $secretKey = Read-Host "AWS Secret Access Key (input will be hidden)" -AsSecureString
    $secretKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey)
    )
    if (-not $secretKeyPlain) {
        Write-Host "ERROR: Secret Access Key is required" -ForegroundColor Red
        exit 1
    }
    
    # Validate Secret Access Key format (typically 40 characters)
    if ($secretKeyPlain.Length -lt 30) {
        Write-Host ""
        Write-Host "WARNING: Secret Access Key seems too short (usually 40 characters)" -ForegroundColor Yellow
        $response = Read-Host "Continue anyway? (Y/N)"
        if ($response -ne "Y" -and $response -ne "y") {
            Write-Host "Setup cancelled." -ForegroundColor Yellow
            exit 1
        }
    }
    
    $env:AWS_SECRET_ACCESS_KEY = $secretKeyPlain
    
    # Prompt for Session Token (optional - for temporary credentials)
    Write-Host ""
    Write-Host "AWS Session Token" -ForegroundColor Gray
    Write-Host "(Only needed for AWS Academy/temporary credentials - Press Enter to skip)" -ForegroundColor Gray
    $sessionToken = Read-Host "AWS Session Token (or press Enter to skip)"
    if ($sessionToken) {
        $env:AWS_SESSION_TOKEN = $sessionToken
        Write-Host "Session token set (temporary credentials)" -ForegroundColor Green
    } else {
        Write-Host "Skipped (using permanent credentials)" -ForegroundColor Green
    }
    
    # Set region
    Write-Host ""
    $region = Read-Host "AWS Region (default: us-west-2, press Enter to use default)"
    if (-not $region) {
        $region = "us-west-2"
    }
    $env:AWS_DEFAULT_REGION = $region
} else {
    # Use existing credentials
    if (-not $existingRegion) {
        $env:AWS_DEFAULT_REGION = "us-west-2"
    }
}

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "AWS credentials configured!" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Region: $env:AWS_DEFAULT_REGION" -ForegroundColor White
Write-Host ""

# Verify credentials
Write-Host "Verifying credentials..." -ForegroundColor Yellow
Write-Host ""

aws sts get-caller-identity 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    # Get account info
    $accountInfo = aws sts get-caller-identity --output json | ConvertFrom-Json
    
    Write-Host "==============================================================" -ForegroundColor Green
    Write-Host "SUCCESS: AWS credentials are VALID!" -ForegroundColor Green
    Write-Host "==============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Account ID: $($accountInfo.Account)" -ForegroundColor White
    Write-Host "User ARN:   $($accountInfo.Arn)" -ForegroundColor White
    Write-Host ""
    Write-Host "==============================================================" -ForegroundColor Cyan
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "==============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Build your application:" -ForegroundColor Yellow
    Write-Host "   sam build" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Deploy to AWS:" -ForegroundColor Yellow
    Write-Host "   sam deploy --guided" -ForegroundColor White
    Write-Host ""
    Write-Host "NOTE: These credentials are only set for this PowerShell session." -ForegroundColor Gray
    Write-Host "      To persist them, run: aws configure" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "==============================================================" -ForegroundColor Red
    Write-Host "ERROR: AWS credentials are INVALID or EXPIRED" -ForegroundColor Red
    Write-Host "==============================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "  - Incorrect Access Key ID or Secret Access Key" -ForegroundColor White
    Write-Host "  - Expired session token (if using temporary credentials)" -ForegroundColor White
    Write-Host "  - AWS CLI not installed or not in PATH" -ForegroundColor White
    Write-Host ""
    Write-Host "Please check your credentials and try again." -ForegroundColor Yellow
    Write-Host "Run this script again: .\setup-aws-credentials.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}


