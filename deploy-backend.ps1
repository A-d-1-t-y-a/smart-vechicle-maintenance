# Deploy Retail Supermarket Backend to AWS
# Prerequisites: AWS credentials must be set (run setup-credentials.ps1 first)

$ErrorActionPreference = "Continue"

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  Deploying Retail Supermarket Backend" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS credentials are set
if (-not $env:AWS_ACCESS_KEY_ID -or -not $env:AWS_SECRET_ACCESS_KEY) {
    Write-Host "ERROR: AWS credentials not set!" -ForegroundColor Red
    Write-Host "Please run: .\setup-credentials.ps1 -AccessKey YOUR_KEY -SecretKey YOUR_SECRET" -ForegroundColor Yellow
    exit 1
}

# Check if SAM CLI is installed
try {
    $samVersion = & sam --version 2>&1
    Write-Host "SAM CLI Version: $samVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: SAM CLI is not installed" -ForegroundColor Red
    Write-Host "Please install SAM CLI from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 1: Building SAM application..." -ForegroundColor Yellow
try {
    & sam build --template-file retail-supermarket-template.yaml 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "✓ Build successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Build failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Deploying to AWS..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray

try {
    # Check if samconfig.toml exists
    $configExists = Test-Path "samconfig.toml"
    
    if (-not $configExists) {
        Write-Host "First deployment - running guided deployment..." -ForegroundColor Yellow
        & sam deploy --template-file retail-supermarket-template.yaml --guided --capabilities CAPABILITY_IAM 2>&1 | Out-Null
    } else {
        Write-Host "Using existing configuration..." -ForegroundColor Yellow
        & sam deploy --template-file retail-supermarket-template.yaml --capabilities CAPABILITY_IAM 2>&1 | Out-Null
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Deployment failed"
    }
    Write-Host "✓ Deployment successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Deployment failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Getting stack outputs..." -ForegroundColor Yellow
try {
    $stackName = "retail-supermarket"
    $outputs = & aws cloudformation describe-stacks --stack-name $stackName --query "Stacks[0].Outputs" --output json 2>&1 | ConvertFrom-Json
    
    $apiUrl = ($outputs | Where-Object { $_.OutputKey -eq "ApiUrl" }).OutputValue
    $userPoolId = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolId" }).OutputValue
    $userPoolClientId = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolClientId" }).OutputValue
    $region = ($outputs | Where-Object { $_.OutputKey -eq "Region" }).OutputValue
    
    Write-Host ""
    Write-Host "==============================================================" -ForegroundColor Green
    Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "==============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "API URL: $apiUrl" -ForegroundColor White
    Write-Host "User Pool ID: $userPoolId" -ForegroundColor White
    Write-Host "User Pool Client ID: $userPoolClientId" -ForegroundColor White
    Write-Host "Region: $region" -ForegroundColor White
    Write-Host ""
    Write-Host "Save these values for frontend deployment!" -ForegroundColor Yellow
    Write-Host ""
    
    # Save to file
    @{
        ApiUrl = $apiUrl
        UserPoolId = $userPoolId
        UserPoolClientId = $userPoolClientId
        Region = $region
        DeployedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    } | ConvertTo-Json | Set-Content "backend-outputs.json"
    
    Write-Host "Outputs saved to: backend-outputs.json" -ForegroundColor Green
} catch {
    Write-Host "⚠ Could not retrieve outputs. Check AWS Console for details." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""
