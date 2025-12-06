# Diagnose AWS Setup and Create .env File
# This script will help you find and extract the environment variables

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AWS Diagnosis & .env Creation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check AWS Credentials
Write-Host "Step 1: Checking AWS credentials..." -ForegroundColor Yellow
$identity = aws sts get-caller-identity 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] AWS credentials are configured" -ForegroundColor Green
    Write-Host $identity -ForegroundColor White
} else {
    Write-Host "[ERROR] AWS credentials not configured properly" -ForegroundColor Red
    Write-Host "Run: .\setup-credentials.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 2: Check CloudFormation Stacks
Write-Host "Step 2: Looking for CloudFormation stacks..." -ForegroundColor Yellow
$stacksJson = aws cloudformation describe-stacks --region us-west-2 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to list stacks" -ForegroundColor Red
    Write-Host $stacksJson -ForegroundColor Red
    exit 1
}

try {
    $allStacks = $stacksJson | ConvertFrom-Json
    $stackList = $allStacks.Stacks
    
    if ($stackList.Count -eq 0) {
        Write-Host "[ERROR] No CloudFormation stacks found in us-west-2" -ForegroundColor Red
        Write-Host ""
        Write-Host "You need to deploy the backend first:" -ForegroundColor Yellow
        Write-Host "  sam build --template retail-supermarket-template.yaml" -ForegroundColor White
        Write-Host "  sam deploy --guided" -ForegroundColor White
        exit 1
    }
    
    Write-Host "[OK] Found $($stackList.Count) stack(s)" -ForegroundColor Green
    foreach ($stack in $stackList) {
        Write-Host "  - $($stack.StackName) [$($stack.StackStatus)]" -ForegroundColor White
    }
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Failed to parse stack list" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Find the right stack
Write-Host "Step 3: Finding retail/supermarket stack..." -ForegroundColor Yellow
$targetStack = $null

# Try to find supply-chain first
$targetStack = $stackList | Where-Object { $_.StackName -eq "supply-chain" } | Select-Object -First 1

# If not found, try other names
if (-not $targetStack) {
    $targetStack = $stackList | Where-Object { 
        $_.StackName -like "*retail*" -or 
        $_.StackName -like "*supermarket*" -or 
        $_.StackName -like "*supply*"
    } | Select-Object -First 1
}

if (-not $targetStack) {
    Write-Host "[ERROR] Could not find retail/supermarket stack" -ForegroundColor Red
    Write-Host "Available stacks:" -ForegroundColor Yellow
    foreach ($stack in $stackList) {
        Write-Host "  - $($stack.StackName)" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Please enter the stack name manually:" -ForegroundColor Yellow
    $stackName = Read-Host "Stack Name"
    $targetStack = $stackList | Where-Object { $_.StackName -eq $stackName } | Select-Object -First 1
    
    if (-not $targetStack) {
        Write-Host "[ERROR] Stack not found: $stackName" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[OK] Using stack: $($targetStack.StackName)" -ForegroundColor Green
Write-Host ""

# Step 4: Extract outputs
Write-Host "Step 4: Extracting outputs..." -ForegroundColor Yellow
$outputs = $targetStack.Outputs

if (-not $outputs -or $outputs.Count -eq 0) {
    Write-Host "[ERROR] No outputs found in stack" -ForegroundColor Red
    Write-Host "This might mean the stack deployment is incomplete or failed" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Found $($outputs.Count) output(s)" -ForegroundColor Green
foreach ($output in $outputs) {
    Write-Host "  - $($output.OutputKey): $($output.OutputValue)" -ForegroundColor White
}
Write-Host ""

# Extract specific values
$apiUrl = ($outputs | Where-Object { $_.OutputKey -eq "ApiUrl" }).OutputValue
$userPoolId = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolId" }).OutputValue
$userPoolClientId = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolClientId" }).OutputValue
$region = ($outputs | Where-Object { $_.OutputKey -eq "Region" }).OutputValue

if (-not $region) {
    $region = "us-west-2"
}

# Step 5: Validate outputs
Write-Host "Step 5: Validating outputs..." -ForegroundColor Yellow
$missingOutputs = @()
if (-not $apiUrl) { $missingOutputs += "ApiUrl" }
if (-not $userPoolId) { $missingOutputs += "UserPoolId" }
if (-not $userPoolClientId) { $missingOutputs += "UserPoolClientId" }

if ($missingOutputs.Count -gt 0) {
    Write-Host "[ERROR] Missing required outputs: $($missingOutputs -join ', ')" -ForegroundColor Red
    Write-Host "Available outputs:" -ForegroundColor Yellow
    foreach ($output in $outputs) {
        Write-Host "  - $($output.OutputKey)" -ForegroundColor White
    }
    exit 1
}

Write-Host "[OK] All required outputs found" -ForegroundColor Green
Write-Host ""

# Step 6: Create .env file
Write-Host "Step 6: Creating .env file..." -ForegroundColor Yellow

$envContent = @"
REACT_APP_API_URL=$apiUrl
REACT_APP_COGNITO_USER_POOL_ID=$userPoolId
REACT_APP_COGNITO_CLIENT_ID=$userPoolClientId
REACT_APP_REGION=$region
"@

$envPath = "frontend-supermarket\.env"

if (-not (Test-Path "frontend-supermarket")) {
    Write-Host "[ERROR] frontend-supermarket directory not found" -ForegroundColor Red
    exit 1
}

$envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline -Force
Write-Host "[OK] Created: $envPath" -ForegroundColor Green
Write-Host ""

# Step 7: Save to JSON
Write-Host "Step 7: Saving to backend-outputs.json..." -ForegroundColor Yellow
$jsonContent = @{
    StackName = $targetStack.StackName
    ApiUrl = $apiUrl
    UserPoolId = $userPoolId
    UserPoolClientId = $userPoolClientId
    Region = $region
    RetrievedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
} | ConvertTo-Json

$jsonContent | Out-File -FilePath "backend-outputs.json" -Encoding UTF8 -Force
Write-Host "[OK] Saved: backend-outputs.json" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SUCCESS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment variables:" -ForegroundColor Yellow
Write-Host "  API URL: $apiUrl" -ForegroundColor White
Write-Host "  User Pool ID: $userPoolId" -ForegroundColor White
Write-Host "  Client ID: $userPoolClientId" -ForegroundColor White
Write-Host "  Region: $region" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. cd frontend-supermarket" -ForegroundColor White
Write-Host "  2. npm install" -ForegroundColor White
Write-Host "  3. npm run build" -ForegroundColor White
Write-Host ""
