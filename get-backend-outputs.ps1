# Get Backend Outputs and Create .env File
# Run this after SAM deployment to get the API URL and Cognito details

$ErrorActionPreference = "Continue"

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  Getting Backend Outputs" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

# First, let's find the correct stack name
Write-Host "Looking for retail supermarket stack..." -ForegroundColor Yellow

try {
    # List all stacks and find ones related to retail/supermarket
    $allStacks = & aws cloudformation list-stacks --query "StackSummaries[?StackStatus != 'DELETE_COMPLETE'].{Name:StackName,Status:StackStatus}" --output json 2>&1 | ConvertFrom-Json
    
    if (-not $allStacks) {
        Write-Host "ERROR: No CloudFormation stacks found" -ForegroundColor Red
        Write-Host "You need to deploy the backend first using:" -ForegroundColor Yellow
        Write-Host "  sam build --template retail-supermarket-template.yaml" -ForegroundColor White
        Write-Host "  sam deploy --guided" -ForegroundColor White
        exit 1
    }
    
    Write-Host "Available stacks:" -ForegroundColor Green
    $allStacks | ForEach-Object { Write-Host "  - $($_.Name) ($($_.Status))" -ForegroundColor White }
    Write-Host ""
    
    # Try to find a stack with retail or supermarket in the name
    $retailStacks = $allStacks | Where-Object { $_.Name -like "*retail*" -or $_.Name -like "*supermarket*" -or $_.Name -like "*sam-app*" }
    
    if ($retailStacks.Count -eq 0) {
        Write-Host "ERROR: No retail/supermarket stack found" -ForegroundColor Red
        Write-Host "Please specify the correct stack name or deploy the backend first" -ForegroundColor Yellow
        exit 1
    }
    
    if ($retailStacks.Count -gt 1) {
        Write-Host "Multiple retail/supermarket stacks found:" -ForegroundColor Yellow
        $retailStacks | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor White }
        $stackName = $retailStacks[0].Name
        Write-Host "Using the first one: $stackName" -ForegroundColor Green
    } else {
        $stackName = $retailStacks[0].Name
        Write-Host "Found stack: $stackName" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Getting outputs from stack: $stackName" -ForegroundColor Yellow
    Write-Host ""
    
    # Get stack outputs
    $outputs = & aws cloudformation describe-stacks --stack-name $stackName --query "Stacks[0].Outputs" --output json 2>&1 | ConvertFrom-Json
    
    if (-not $outputs) {
        Write-Host "ERROR: Could not find stack outputs" -ForegroundColor Red
        Write-Host "Make sure the stack name is correct: $stackName" -ForegroundColor Yellow
        exit 1
    }
    
    # Extract values
    $apiUrl = ($outputs | Where-Object { $_.OutputKey -eq "ApiUrl" }).OutputValue
    $userPoolId = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolId" }).OutputValue
    $userPoolClientId = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolClientId" }).OutputValue
    $region = ($outputs | Where-Object { $_.OutputKey -eq "Region" }).OutputValue
    
    if (-not $apiUrl -or -not $userPoolId -or -not $userPoolClientId) {
        Write-Host "ERROR: Missing required outputs" -ForegroundColor Red
        Write-Host "Available outputs:" -ForegroundColor Yellow
        $outputs | ForEach-Object { Write-Host "  $($_.OutputKey): $($_.OutputValue)" }
        exit 1
    }
    
    Write-Host "Backend Configuration:" -ForegroundColor Green
    Write-Host "  API URL: $apiUrl" -ForegroundColor White
    Write-Host "  User Pool ID: $userPoolId" -ForegroundColor White
    Write-Host "  User Pool Client ID: $userPoolClientId" -ForegroundColor White
    Write-Host "  Region: $region" -ForegroundColor White
    Write-Host ""
    
    # Save to backend-outputs.json
    @{
        ApiUrl = $apiUrl
        UserPoolId = $userPoolId
        UserPoolClientId = $userPoolClientId
        Region = $region
        RetrievedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    } | ConvertTo-Json | Set-Content "backend-outputs.json"
    
    Write-Host "Saved to: backend-outputs.json" -ForegroundColor Green
    Write-Host ""
    
    # Create .env file in frontend-supermarket directory
    Write-Host "Creating .env file in frontend-supermarket..." -ForegroundColor Yellow
    
    if (-not (Test-Path "frontend-supermarket")) {
        Write-Host "ERROR: frontend-supermarket directory not found" -ForegroundColor Red
        exit 1
    }
    
    $envContent = @"
REACT_APP_API_URL=$apiUrl
REACT_APP_COGNITO_USER_POOL_ID=$userPoolId
REACT_APP_COGNITO_CLIENT_ID=$userPoolClientId
REACT_APP_REGION=$region
"@
    
    $envContent | Out-File -FilePath "frontend-supermarket\.env" -Encoding UTF8 -Force
    
    Write-Host "[OK] .env file created at: frontend-supermarket\.env" -ForegroundColor Green
    Write-Host ""
    Write-Host "==============================================================" -ForegroundColor Cyan
    Write-Host "  Done!" -ForegroundColor Green
    Write-Host "==============================================================" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "ERROR: Failed to get stack outputs" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Make sure you have deployed the backend:" -ForegroundColor White
    Write-Host "   sam build --template retail-supermarket-template.yaml" -ForegroundColor White
    Write-Host "   sam deploy --guided" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Check available stacks manually:" -ForegroundColor White
    Write-Host "   aws cloudformation list-stacks" -ForegroundColor White
    Write-Host ""
    Write-Host "3. If you know the stack name, run manually:" -ForegroundColor White
    Write-Host "   aws cloudformation describe-stacks --stack-name YOUR_STACK_NAME" -ForegroundColor White
    exit 1
}
