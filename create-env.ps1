# Simple script to create .env file from stack outputs
# Usage: .\create-env.ps1

$stackName = "supply-chain"
$region = "us-west-2"

Write-Host "Getting outputs from stack: $stackName" -ForegroundColor Cyan
Write-Host ""

# Get API URL
$apiUrl = aws cloudformation describe-stacks --stack-name $stackName --region $region --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text

# Get User Pool ID
$userPoolId = aws cloudformation describe-stacks --stack-name $stackName --region $region --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text

# Get User Pool Client ID
$userPoolClientId = aws cloudformation describe-stacks --stack-name $stackName --region $region --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text

# Get Region
$outputRegion = aws cloudformation describe-stacks --stack-name $stackName --region $region --query "Stacks[0].Outputs[?OutputKey=='Region'].OutputValue" --output text

if (-not $outputRegion) {
    $outputRegion = $region
}

Write-Host "Retrieved values:" -ForegroundColor Green
Write-Host "  API URL: $apiUrl" -ForegroundColor White
Write-Host "  User Pool ID: $userPoolId" -ForegroundColor White
Write-Host "  User Pool Client ID: $userPoolClientId" -ForegroundColor White
Write-Host "  Region: $outputRegion" -ForegroundColor White
Write-Host ""

# Create .env content
$envContent = @"
REACT_APP_API_URL=$apiUrl
REACT_APP_COGNITO_USER_POOL_ID=$userPoolId
REACT_APP_COGNITO_CLIENT_ID=$userPoolClientId
REACT_APP_REGION=$outputRegion
"@

# Write to file
$envPath = "frontend-supermarket\.env"
$envContent | Out-File -FilePath $envPath -Encoding UTF8 -Force

Write-Host "[OK] .env file created at: $envPath" -ForegroundColor Green
Write-Host ""

# Also save to JSON for reference
$jsonContent = @{
    ApiUrl = $apiUrl
    UserPoolId = $userPoolId
    UserPoolClientId = $userPoolClientId
    Region = $outputRegion
    RetrievedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
} | ConvertTo-Json

$jsonContent | Out-File -FilePath "backend-outputs.json" -Encoding UTF8 -Force

Write-Host "[OK] Saved to backend-outputs.json" -ForegroundColor Green
Write-Host ""
Write-Host "Done! You can now build the frontend." -ForegroundColor Cyan
