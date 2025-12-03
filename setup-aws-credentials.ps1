# Setup AWS Credentials Script
# This script helps configure AWS credentials for the project

Write-Host "AWS Credentials Setup" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host ""

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version 2>&1
    Write-Host "AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Choose setup method:" -ForegroundColor Yellow
Write-Host "1. Use AWS CLI profile (recommended)"
Write-Host "2. Set environment variables for this session"
Write-Host "3. Exit"
Write-Host ""

$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Configuring AWS CLI profile..." -ForegroundColor Yellow
        Write-Host "Note: When entering credentials, make sure to remove any extra spaces." -ForegroundColor Yellow
        Write-Host ""
        aws configure
        Write-Host ""
        Write-Host "Verifying credentials..." -ForegroundColor Yellow
        
        # Check if session token might be needed
        Write-Host "Note: If you're using AWS Academy or temporary credentials, you may need a session token." -ForegroundColor Cyan
        Write-Host "If verification fails, you can add it with: aws configure set aws_session_token <token>" -ForegroundColor Cyan
        Write-Host ""
        
        $identity = aws sts get-caller-identity 2>&1 | Out-String
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Credentials verified successfully!" -ForegroundColor Green
            Write-Host $identity
        } else {
            Write-Host "ERROR: Failed to verify credentials" -ForegroundColor Red
            Write-Host $identity
            Write-Host ""
            
            # Check if it's a signature error
            if ($identity -match "IncompleteSignature" -or $identity -match "Invalid.*key.*value") {
                Write-Host "This error usually means:" -ForegroundColor Yellow
                Write-Host "1. Credentials are invalid or expired" -ForegroundColor Yellow
                Write-Host "2. Missing session token (required for AWS Academy)" -ForegroundColor Yellow
                Write-Host "3. Secret key has special characters causing encoding issues" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "SOLUTION: If using AWS Academy, add session token:" -ForegroundColor Cyan
                Write-Host '  aws configure set aws_session_token "YOUR_SESSION_TOKEN"' -ForegroundColor White
                Write-Host ""
                Write-Host "Or verify credentials are correct and not expired." -ForegroundColor Cyan
            } else {
                Write-Host "Troubleshooting tips:" -ForegroundColor Yellow
                Write-Host "1. Check that your Access Key ID and Secret Access Key are correct"
                Write-Host "2. Make sure there are no extra spaces before or after the credentials"
                Write-Host "3. If using AWS Academy, you may need a session token"
                Write-Host "4. Try running: aws configure list"
            }
        }
    }
    "2" {
        Write-Host ""
        Write-Host "Setting environment variables for this PowerShell session..." -ForegroundColor Yellow
        Write-Host "Note: When pasting credentials, make sure to remove any extra spaces." -ForegroundColor Yellow
        Write-Host ""
        
        $accessKey = (Read-Host "Enter AWS Access Key ID").Trim()
        if ([string]::IsNullOrWhiteSpace($accessKey)) {
            Write-Host "ERROR: Access Key ID cannot be empty" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "Enter AWS Secret Access Key (input will be hidden):" -ForegroundColor Yellow
        $secretKey = Read-Host "Secret Key" -AsSecureString
        $region = (Read-Host "Enter AWS Region (default: us-west-2)").Trim()
        if ([string]::IsNullOrWhiteSpace($region)) {
            $region = "us-west-2"
        }
        
        # Convert secure string to plain text and trim
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey)
        try {
            $plainSecretKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR).Trim()
        } finally {
            [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
        }
        
        if ([string]::IsNullOrWhiteSpace($plainSecretKey)) {
            Write-Host "ERROR: Secret Access Key cannot be empty" -ForegroundColor Red
            exit 1
        }
        
        # Check if session token is needed (AWS Academy)
        $needsSessionToken = Read-Host "Do you need a session token? (AWS Academy/temporary credentials) [y/N]"
        $sessionToken = $null
        if ($needsSessionToken -eq 'y' -or $needsSessionToken -eq 'Y') {
            Write-Host "Enter AWS Session Token (input will be hidden):" -ForegroundColor Yellow
            $sessionTokenSecure = Read-Host "Session Token" -AsSecureString
            $BSTR2 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sessionTokenSecure)
            try {
                $sessionToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR2).Trim()
            } finally {
                [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR2)
            }
        }
        
        # Set environment variables (PowerShell handles special characters correctly)
        [Environment]::SetEnvironmentVariable("AWS_ACCESS_KEY_ID", $accessKey, "Process")
        [Environment]::SetEnvironmentVariable("AWS_SECRET_ACCESS_KEY", $plainSecretKey, "Process")
        [Environment]::SetEnvironmentVariable("AWS_DEFAULT_REGION", $region, "Process")
        
        # Also set for current session
        $env:AWS_ACCESS_KEY_ID = $accessKey
        $env:AWS_SECRET_ACCESS_KEY = $plainSecretKey
        $env:AWS_DEFAULT_REGION = $region
        
        if ($sessionToken) {
            [Environment]::SetEnvironmentVariable("AWS_SESSION_TOKEN", $sessionToken, "Process")
            $env:AWS_SESSION_TOKEN = $sessionToken
            Write-Host "Session token set." -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "Environment variables set for this session." -ForegroundColor Green
        Write-Host "Note: These will be lost when you close this PowerShell window." -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "Verifying credentials..." -ForegroundColor Yellow
        # Clear any cached credentials
        $env:AWS_PROFILE = $null
        $env:AWS_PROFILES_FILE = $null
        
        # Test credentials
        $identity = aws sts get-caller-identity --region $region 2>&1 | Out-String
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Credentials verified successfully!" -ForegroundColor Green
            Write-Host $identity
        } else {
            Write-Host "ERROR: Failed to verify credentials" -ForegroundColor Red
            Write-Host $identity
            Write-Host ""
            Write-Host "Troubleshooting tips:" -ForegroundColor Yellow
            Write-Host "1. Verify your Access Key ID starts with 'AKIA' and is 20 characters"
            Write-Host "2. Check that your Secret Access Key is correct (no extra spaces)"
            Write-Host "3. If using AWS Academy, you may need to set AWS_SESSION_TOKEN"
            Write-Host "4. Try running manually: aws sts get-caller-identity"
            Write-Host ""
            Write-Host "Current region: $region" -ForegroundColor Cyan
            Write-Host "Access Key ID: $($accessKey.Substring(0, [Math]::Min(8, $accessKey.Length)))..." -ForegroundColor Cyan
        }
    }
    "3" {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green

